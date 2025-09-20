terraform {
  backend "s3" {
    bucket         = "CHANGE_ME-tf-state"
    key            = "kasi-connect/infra.tfstate"
    region         = "us-east-1"
    dynamodb_table = "CHANGE_ME-tf-locks"
    encrypt        = true
  }
}
