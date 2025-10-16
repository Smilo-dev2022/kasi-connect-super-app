resource "random_string" "jwt_secret" {
  length  = 32
  special = false
}

resource "random_string" "otp_pepper" {
  length  = 16
  special = false
}

resource "random_string" "typesense_api_key" {
  length  = 32
  special = false
}

resource "random_string" "events_secret_key" {
  length  = 32
  special = false
}

resource "aws_secretsmanager_secret" "backend" {
  name = "${var.project}-backend"
}

resource "aws_secretsmanager_secret_version" "backend" {
  secret_id     = aws_secretsmanager_secret.backend.id
  secret_string = jsonencode({
    JWT_SECRET   = random_string.jwt_secret.result
    OTP_PEPPER   = random_string.otp_pepper.result
    REDIS_URL    = "redis://${module.redis.primary_endpoint_address}:6379"
  })
}

resource "aws_secretsmanager_secret" "agent7_messaging" {
  name = "${var.project}-agent7-messaging"
}

resource "aws_secretsmanager_secret_version" "agent7_messaging" {
  secret_id     = aws_secretsmanager_secret.agent7_messaging.id
  secret_string = jsonencode({
    JWT_SECRET = random_string.jwt_secret.result
  })
}

resource "aws_secretsmanager_secret" "services_media" {
  name = "${var.project}-services-media"
}

resource "aws_secretsmanager_secret_version" "services_media" {
  secret_id     = aws_secretsmanager_secret.services_media.id
  secret_string = jsonencode({
    S3_ENDPOINT = "s3.${var.aws_region}.amazonaws.com"
    S3_REGION   = var.aws_region
    S3_BUCKET   = module.media_bucket.s3_bucket_id
    CORS_ORIGIN = "https://${var.domain_name}"
  })
}

resource "aws_secretsmanager_secret" "agent9_search" {
  name = "${var.project}-agent9-search"
}

resource "aws_secretsmanager_secret_version" "agent9_search" {
  secret_id     = aws_secretsmanager_secret.agent9_search.id
  secret_string = jsonencode({
    TYPESENSE_API_KEY = random_string.typesense_api_key.result
    TYPESENSE_PROTOCOL = "https"
  })
}

resource "aws_secretsmanager_secret" "events_service" {
  name = "${var.project}-events-service"
}

resource "aws_secretsmanager_secret_version" "events_service" {
  secret_id     = aws_secretsmanager_secret.events_service.id
  secret_string = jsonencode({
    EVENTS_SECRET_KEY = random_string.events_secret_key.result
    EVENTS_DATABASE_URL = "postgresql://${var.db_username}:${module.rds.db_instance_password}@${module.rds.db_instance_address}:${module.rds.db_instance_port}/${var.project}"
    EVENTS_BASE_URL = "https://${var.domain_name}"
  })
}

# Wallet service secret (Postgres URL)
resource "aws_secretsmanager_secret" "wallet_service" {
  name = "${var.project}-wallet-service"
}

resource "aws_secretsmanager_secret_version" "wallet_service" {
  secret_id     = aws_secretsmanager_secret.wallet_service.id
  secret_string = jsonencode({
    DATABASE_URL = "postgresql://${var.db_username}:${module.rds.db_instance_password}@${module.rds.db_instance_address}:${module.rds.db_instance_port}/${var.project}"
  })
}

resource "random_string" "grafana_admin_password" {
  length  = 16
  special = true
}

resource "aws_secretsmanager_secret" "grafana" {
  name = "${var.project}-grafana"
}

resource "aws_secretsmanager_secret_version" "grafana" {
  secret_id     = aws_secretsmanager_secret.grafana.id
  secret_string = jsonencode({
    adminPassword = random_string.grafana_admin_password.result
  })
}
