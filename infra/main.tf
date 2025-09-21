terraform {
  required_version = ">= 1.6.0"
}

provider "aws" {
  region = var.aws_region
}

module "network" {
  source = "terraform-aws-modules/vpc/aws"
  name   = var.project
  cidr   = "10.0.0.0/16"

  azs             = ["${var.aws_region}a", "${var.aws_region}b"]
  public_subnets  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnets = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = true
}

module "ecr" {
  source = "terraform-aws-modules/ecr/aws"

  repositories = [
    "kasi-connect-backend",
    "kasi-connect-events-service",
    "kasi-connect-events_service",
    "kasi-connect-moderation_service",
    "kasi-connect-services-auth",
    "kasi-connect-services-media",
    "kasi-connect-agent9-search",
    "kasi-connect-wallet-service",
  ]
}

# Skeleton for EKS (details to be filled in)
module "eks" {
  source          = "terraform-aws-modules/eks/aws"
  cluster_name    = "${var.project}-eks"
  cluster_version = "1.30"
  vpc_id          = module.network.vpc_id
  subnet_ids      = module.network.private_subnets

  eks_managed_node_groups = {
    default = {
      desired_size = 2
      max_size     = 4
      min_size     = 2
      instance_types = ["t3.medium"]
    }
  }
}

resource "aws_eks_addon" "secrets_manager_csi_driver" {
  cluster_name = module.eks.cluster_name
  addon_name   = "aws-secrets-manager-csi-driver"
}

module "secrets_reader_iam_role" {
  source = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"

  role_name = "${var.project}-secrets-reader"

  policy_statements = [
    {
      sid = "AllowSecretsManagerRead",
      actions = [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      resources = ["arn:aws:secretsmanager:${var.aws_region}:${data.aws_caller_identity.current.account_id}:secret:${var.project}-*"]
    }
  ]

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["default:*"]
    }
  }
}

data "aws_caller_identity" "current" {}

module "zones" {
  source  = "terraform-aws-modules/route53/aws//modules/zones"
  version = "~> 2.0"

  zones = {
    "${var.domain_name}" = {
      comment = "Primary domain for ${var.project}"
    }
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.default.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = module.zones.route53_zone_zone_id["${var.domain_name}"]
}

resource "aws_route53_record" "ingress" {
  zone_id = module.zones.route53_zone_zone_id["${var.domain_name}"]
  name    = "media"
  type    = "A"
  alias {
    name                   = module.cdn.cloudfront_distribution_domain_name
    zone_id                = module.cdn.cloudfront_distribution_hosted_zone_id
    evaluate_target_health = false
  }
}

data "kubernetes_service" "traefik" {
  metadata {
    name      = "traefik"
    namespace = "kube-system"
  }
}

module "fluentbit_iam_role" {
  source = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"

  role_name = "${var.project}-fluentbit"

  policy_statements = [
    {
      sid = "AllowCloudWatchLogs",
      actions = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:DescribeLogStreams",
        "logs:PutLogEvents",
        "logs:PutRetentionPolicy"
      ],
      resources = ["arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/eks/${var.project}/*"]
    }
  ]

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["kube-system:fluent-bit"]
    }
  }
}

module "rds" {
  source = "terraform-aws-modules/rds/aws"
  identifier = "${var.project}-pg"
  engine            = "postgres"
  engine_version    = "16"
  family            = "postgres16"
  instance_class    = "db.t3.micro"
  allocated_storage = 20
  db_subnet_group_name   = module.network.database_subnet_group
  vpc_security_group_ids = [module.network.default_security_group_id]
  publicly_accessible    = false
  username               = var.db_username
  port                   = 5432
  manage_master_user_password = true
}

module "redis" {
  source = "terraform-aws-modules/elasticache/aws//modules/redis"

  name_prefix = var.project

  vpc_id             = module.network.vpc_id
  subnets            = module.network.private_subnets
  security_group_ids = [module.eks.node_security_group_id]

  instance_type  = var.redis_instance_class
  engine_version = "7.0"
  parameter_group_name = aws_elasticache_parameter_group.redis.name

  apply_immediately = true
}

resource "aws_elasticache_parameter_group" "redis" {
  name   = "${var.project}-redis7"
  family = "redis7"
}

module "media_bucket" {
  source = "terraform-aws-modules/s3-bucket/aws"

  bucket = var.media_bucket_name
  acl    = "private"

  control_object_ownership = true
  object_ownership         = "ObjectWriter"

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_acm_certificate" "default" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

module "cdn" {
  source  = "terraform-aws-modules/cloudfront/aws"
  version = "~> 3.0"

  aliases = ["media.${var.domain_name}"]

  comment             = "CDN for ${var.project}"
  enabled             = true
  is_ipv6_enabled     = true
  price_class         = "PriceClass_100"
  wait_for_deployment = false

  create_origin_access_identity = true
  origin_access_identities = {
    s3_bucket_one = "My S3 bucket"
  }

  origin_s3_bucket = module.media_bucket.s3_bucket_id

  viewer_certificate = {
    acm_certificate_arn = aws_acm_certificate.default.arn
    ssl_support_method  = "sni-only"
  }
}

# CloudFront-scoped WAF and association
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}

resource "aws_wafv2_web_acl" "cdn" {
  provider = aws.us_east_1
  name     = "${var.project}-cdn-waf"
  scope    = "CLOUDFRONT"

  default_action { allow {} }
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project}-cdn-waf"
    sampled_requests_enabled   = true
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1
    override_action { none {} }
    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesCommonRuleSet"
      }
    }
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "common"
      sampled_requests_enabled   = true
    }
  }
}

resource "aws_wafv2_web_acl_association" "cdn" {
  provider    = aws.us_east_1
  resource_arn = module.cdn.cloudfront_distribution_arn
  web_acl_arn  = aws_wafv2_web_acl.cdn.arn
}

module "media_service_iam_role" {
  source = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"

  role_name = "${var.project}-media-service"

  attach_s3_policy = true
  s3_bucket_arn = [module.media_bucket.s3_bucket_arn]

  oidc_providers = {
    main = {
      provider_arn               = module.eks.oidc_provider_arn
      namespace_service_accounts = ["default:media-service"]
    }
  }
}
