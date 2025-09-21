terraform {
  backend "s3" {
    bucket         = "kasi-connect-terraform-state"
    key            = "kasi-connect/infra.tfstate"
    region         = "us-east-1"
    dynamodb_table = "kasi-connect-terraform-locks"
    encrypt        = true
  }
}
