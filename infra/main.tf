terraform {
  required_version = ">= 1.6.0"
  backend "s3" {
    bucket = "CHANGE_ME-tfstate"
    key    = "global/terraform.tfstate"
    region = "us-east-1"
    dynamodb_table = "CHANGE_ME-tf-locks"
    encrypt = true
  }
}

provider "aws" {
  region = var.aws_region
}

locals {
  name = var.project_name
  env  = terraform.workspace
}

module "network" {
  source = "./modules/network"
  name   = local.name
  env    = local.env
}

module "ecr" {
  source = "./modules/ecr"
  name   = local.name
}

# Optional modules to be added: eks, rds, redis, s3, route53, acm, cloudfront

