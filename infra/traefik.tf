resource "helm_release" "traefik" {
  name       = "traefik"
  repository = "https://helm.traefik.io/traefik"
  chart      = "traefik"
  namespace  = "kube-system"

  set {
    name  = "ports.web.redirectTo"
    value = "websecure"
  }

  set {
    name  = "ports.websecure.tls.enabled"
    value = "true"
  }

  set {
    name  = "service.spec.loadBalancerSourceRanges"
    value = "0.0.0.0/0"
  }

  set {
    name = "additionalArguments"
    value = tostring([
      "--certificatesresolvers.default.acme.storage=/data/acme.json",
      "--certificatesresolvers.default.acme.tlschallenge=true",
      "--certificatesresolvers.default.acme.email=admin@${var.domain_name}",
      "--entrypoints.websecure.http.tls.certresolver=default"
    ])
  }
}
