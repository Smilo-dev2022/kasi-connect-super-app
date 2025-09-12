# TLS setup

This repo uses reverse-proxy TLS termination with optional in-app HTTPS enforcement.

What you get out of the box
- Express services: Helmet headers, `trust proxy`, optional HTTPS redirect via `ENFORCE_HTTPS=true`.
- Fastify services: `@fastify/helmet` headers, optional HTTPS redirect via `ENFORCE_HTTPS=true`.
- FastAPI services: `HTTPSRedirectMiddleware`, optional `TrustedHostMiddleware`; HSTS header when HTTPS is enforced.

Recommended production setup
1) Terminate TLS at your edge (ALB/NLB + ACM, Nginx, Traefik, or Caddy).
2) Forward requests to services over HTTP with `X-Forwarded-Proto` and `X-Forwarded-Host` headers.
3) Set `ENFORCE_HTTPS=true` in each service to ensure redirects if traffic arrives over HTTP.
4) Set `ALLOWED_HOSTS` (FastAPI apps) to your public hostnames (comma-separated) to prevent host header attacks.

Example Nginx config (with Certbot/Let’s Encrypt)
```
server {
    listen 80;
    server_name api.example.com;
    location /.well-known/acme-challenge/ { root /var/www/certbot; }
    location / { return 301 https://$host$request_uri; }
}

server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate     /etc/letsencrypt/live/api.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.example.com/privkey.pem;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Forward to service (example: agent7-messaging)
    location / {
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_pass http://agent7-messaging:8080;
    }
}
```

Kubernetes ingress (sketch)
- Use a managed ingress (e.g., Nginx Ingress) with TLS secret and annotations to enable HSTS.
- Ensure `nginx.ingress.kubernetes.io/force-ssl-redirect: "true"` and forward headers are set.

Env summary per service
- Common: `ENFORCE_HTTPS=true`
- FastAPI: `ALLOWED_HOSTS=api.example.com,www.example.com`

Operational checks
- Hit `http://` and confirm 308 redirect to `https://`.
- Confirm HSTS header is present over HTTPS.
- Verify no mixed content errors in clients.