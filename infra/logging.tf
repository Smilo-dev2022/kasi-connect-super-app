resource "helm_release" "fluentbit" {
  name       = "fluent-bit"
  repository = "https://fluent.github.io/helm-charts"
  chart      = "fluent-bit"
  namespace  = "kube-system"

  set {
    name  = "serviceAccount.create"
    value = "true"
  }

  set {
    name  = "serviceAccount.name"
    value = "fluent-bit"
  }

  set {
    name  = "serviceAccount.annotations.eks\\.amazonaws\\.com/role-arn"
    value = module.fluentbit_iam_role.iam_role_arn
  }

  set {
    name  = "config.outputs"
    value = <<-EOT
      [OUTPUT]
          Name                cloudwatch_logs
          Match               *
          region              ${var.aws_region}
          log_group_name      /aws/eks/${var.project}/containers
          log_stream_prefix   ${var.project}-
          auto_create_group   true
          log_retention_days  90
    EOT
  }
}
