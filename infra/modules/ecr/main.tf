variable "name" { type = string }

resource "aws_ecr_repository" "repos" {
  for_each = toset([
    "app",
    "events-service",
    "events_service",
    "moderation_service",
    "backend",
    "agent7-messaging",
    "web-admin",
    "agent14-qa-release",
    "wallet-service",
    "services-auth",
    "services-media",
    "agent9-search",
  ])
  name                 = "${var.name}/${each.value}"
  image_tag_mutability = "MUTABLE"
  image_scanning_configuration { scan_on_push = true }
}
