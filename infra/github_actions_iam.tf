data "tls_certificate" "github" {
  url = "https://token.actions.githubusercontent.com"
}

resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = [
    "sts.amazonaws.com",
  ]

  thumbprint_list = [
    data.tls_certificate.github.certificates[0].sha1_fingerprint,
  ]
}

locals {
  gha_sub_prod    = "repo:${var.github_org}/${var.github_repo}:ref:${var.github_ref_prod}"
  gha_sub_staging = "repo:${var.github_org}/${var.github_repo}:ref:${var.github_ref_staging}"
}

data "aws_caller_identity" "current" {}

resource "aws_iam_role" "gha_terraform_prod" {
  name = "${var.project}-terraform-deployer-prod"

  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowGitHubOIDC"
        Effect = "Allow"
        Action = "sts:AssumeRoleWithWebIdentity"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = local.gha_sub_prod
          }
        }
      }
    ]
  })
}

resource "aws_iam_role" "gha_terraform_staging" {
  name = "${var.project}-terraform-deployer-staging"

  assume_role_policy = jsonencode({
    Version   = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowGitHubOIDC"
        Effect = "Allow"
        Action = "sts:AssumeRoleWithWebIdentity"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = local.gha_sub_staging
          }
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "gha_prod_admin" {
  count      = var.attach_admin_policy ? 1 : 0
  role       = aws_iam_role.gha_terraform_prod.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

resource "aws_iam_role_policy_attachment" "gha_staging_admin" {
  count      = var.attach_admin_policy ? 1 : 0
  role       = aws_iam_role.gha_terraform_staging.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

output "gha_terraform_prod_role_arn" {
  value       = aws_iam_role.gha_terraform_prod.arn
  description = "IAM role ARN for GitHub Actions to assume (prod)"
}

output "gha_terraform_staging_role_arn" {
  value       = aws_iam_role.gha_terraform_staging.arn
  description = "IAM role ARN for GitHub Actions to assume (staging)"
}
