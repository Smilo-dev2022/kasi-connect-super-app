resource "helm_release" "prometheus" {
  name       = "prometheus"
  repository = "https://prometheus-community.github.io/helm-charts"
  chart      = "kube-prometheus-stack"
  namespace  = "monitoring"
  create_namespace = true

  set {
    name  = "grafana.adminPassword"
    value = jsondecode(aws_secretsmanager_secret_version.grafana.secret_string).adminPassword
  }

  set {
    name  = "grafana.ingress.enabled"
    value = "true"
  }

  set {
    name  = "grafana.ingress.hosts[0]"
    value = "grafana.${var.domain_name}"
  }

  set {
    name = "grafana.ingress.tls[0].hosts[0]"
    value = "grafana.${var.domain_name}"
  }

  set {
    name = "grafana.ingress.tls[0].secretName"
    value = "grafana-tls"
  }

  set {
    name = "prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues"
    value = "false"
  }
}

# ServiceMonitor for wallet and moderation can be rendered by ops/helm chart; ensure namespace label matches
