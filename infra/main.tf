terraform {
  required_version = ">= 1.6.0"
  backend "s3" {}
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
