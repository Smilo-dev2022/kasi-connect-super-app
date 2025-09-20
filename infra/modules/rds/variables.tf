variable "name" { type = string }
variable "env" { type = string }
variable "vpc_id" { type = string }
variable "subnet_ids" { type = list(string) }
variable "engine_version" { type = string default = "16" }
variable "instance_class" { type = string default = "db.t4g.micro" }
variable "allocated_storage" { type = number default = 20 }
variable "backup_retention_days" { type = number default = 7 }
variable "multi_az" { type = bool default = false }
variable "username" { type = string default = "app" }
variable "password" { type = string default = "change-me" }
