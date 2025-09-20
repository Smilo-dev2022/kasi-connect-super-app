variable "name" { type = string }
variable "env" { type = string }
variable "subnet_ids" { type = list(string) }
variable "vpc_id" { type = string }

resource "aws_security_group" "redis" {
  name   = "${var.name}-${var.env}-redis"
  vpc_id = var.vpc_id
}

resource "aws_elasticache_subnet_group" "this" {
  name       = "${var.name}-${var.env}-redis"
  subnet_ids = var.subnet_ids
}

resource "aws_elasticache_cluster" "this" {
  cluster_id           = "${var.name}-${var.env}"
  engine               = "redis"
  node_type            = "cache.t4g.micro"
  num_cache_nodes      = 1
  subnet_group_name    = aws_elasticache_subnet_group.this.name
  security_group_ids   = [aws_security_group.redis.id]
  port                 = 6379
  parameter_group_name = "default.redis7"
}

output "endpoint" { value = aws_elasticache_cluster.this.cache_nodes[0].address }
output "port" { value = aws_elasticache_cluster.this.port }
