# Infra overview

This folder will hold Terraform for AWS: VPC, EKS, ECR, RDS Postgres, ElastiCache Redis, S3 (static + media), Route53, ACM, CloudFront, IAM roles, Secrets Manager/SSM, and optional Typesense. Remote state via S3+DynamoDB, workspaces per env.

Modules structure:
- modules/network
- modules/ecr
- modules/eks
- modules/rds
- modules/redis
- modules/s3
- modules/iam
- modules/route53
- modules/acm
- modules/cloudfront
- modules/typesense (optional)

Environments:
- envs/dev
- envs/staging
- envs/prod

Runbooks for provisioning are in `runbooks/`.
# Infra

Terraform stubs for Postgres, Redis, Scylla, and S3. Providers and modules to be added during implementation.