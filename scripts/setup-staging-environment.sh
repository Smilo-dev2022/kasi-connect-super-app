#!/bin/bash

# Setup staging environment for iKasiLink beta testing
set -e

echo "🚀 Setting up staging environment for iKasiLink..."

# Copy staging environment file
echo "📝 Configuring staging environment variables..."
cp env.staging .env

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build staging version
echo "🔨 Building staging version..."
npm run build:staging

# Create staging directories
echo "📁 Creating staging directories..."
mkdir -p staging/{logs,uploads,backups}

# Setup staging database (if needed)
echo "🗄️ Setting up staging database..."
# Add database setup commands here

# Configure staging services
echo "⚙️ Configuring staging services..."

# Auth service staging config
cat > services/auth/.env.staging << EOF
NODE_ENV=staging
PORT=3001
REDIS_URL=redis://staging.redis.ikasilink.co.za:6379
JWT_SECRET=staging_jwt_secret_key
JWT_EXPIRES_IN=7d
OTP_EXPIRES_IN=300
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100
LOG_LEVEL=debug
EOF

# Media service staging config
cat > services/media/.env.staging << EOF
NODE_ENV=staging
PORT=3002
AWS_ACCESS_KEY_ID=staging_aws_access_key
AWS_SECRET_ACCESS_KEY=staging_aws_secret_key
AWS_REGION=af-south-1
S3_BUCKET=ikasilink-staging-media
CDN_URL=https://staging.cdn.ikasilink.co.za
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,video/mp4,audio/mpeg
LOG_LEVEL=debug
EOF

# Messaging service staging config
cat > agent7-messaging/.env.staging << EOF
NODE_ENV=staging
PORT=3003
WS_PORT=3004
REDIS_URL=redis://staging.redis.ikasilink.co.za:6379
SIGNAL_SERVER_URL=https://staging.signal.ikasilink.co.za
MESSAGE_RETENTION_DAYS=30
GROUP_SIZE_LIMIT=1000
RATE_LIMIT_MESSAGES_PER_MINUTE=60
LOG_LEVEL=debug
EOF

# Events service staging config
cat > moderation_service/.env.staging << EOF
NODE_ENV=staging
PORT=3005
DATABASE_URL=sqlite:///staging/events.db
REDIS_URL=redis://staging.redis.ikasilink.co.za:6379
EVENT_RETENTION_DAYS=365
RSVP_REMINDER_HOURS=24
QR_CODE_EXPIRY_HOURS=2
LOG_LEVEL=debug
EOF

# Moderation service staging config
cat > moderation_service/.env.staging << EOF
NODE_ENV=staging
PORT=3006
REDIS_URL=redis://staging.redis.ikasilink.co.za:6379
QUEUE_PROCESSING_INTERVAL=5000
MODERATION_SLA_HOURS=24
ESCALATION_THRESHOLD=3
LOG_LEVEL=debug
EOF

# Search service staging config
cat > agent9-search/.env.staging << EOF
NODE_ENV=staging
PORT=3007
TYPESENSE_URL=https://staging.search.ikasilink.co.za
TYPESENSE_API_KEY=staging_typesense_key
INDEX_REFRESH_INTERVAL=300
SEARCH_RESULT_LIMIT=50
LOG_LEVEL=debug
EOF

echo "🔧 Setting up staging infrastructure..."

# Create staging Docker Compose
cat > docker-compose.staging.yml << EOF
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: ikasilink-staging-redis
    ports:
      - "6379:6379"
    volumes:
      - staging_redis_data:/data
    command: redis-server --appendonly yes

  postgres:
    image: postgres:15-alpine
    container_name: ikasilink-staging-postgres
    environment:
      POSTGRES_DB: ikasilink_staging
      POSTGRES_USER: staging_user
      POSTGRES_PASSWORD: staging_password
    ports:
      - "5432:5432"
    volumes:
      - staging_postgres_data:/var/lib/postgresql/data

  auth:
    build:
      context: ./services/auth
      dockerfile: Dockerfile
    container_name: ikasilink-staging-auth
    environment:
      - NODE_ENV=staging
      - PORT=3001
    ports:
      - "3001:3001"
    depends_on:
      - redis
    volumes:
      - ./staging/logs:/app/logs

  media:
    build:
      context: ./services/media
      dockerfile: Dockerfile
    container_name: ikasilink-staging-media
    environment:
      - NODE_ENV=staging
      - PORT=3002
    ports:
      - "3002:3002"
    volumes:
      - ./staging/uploads:/app/uploads
      - ./staging/logs:/app/logs

  messaging:
    build:
      context: ./agent7-messaging
      dockerfile: Dockerfile
    container_name: ikasilink-staging-messaging
    environment:
      - NODE_ENV=staging
      - PORT=3003
      - WS_PORT=3004
    ports:
      - "3003:3003"
      - "3004:3004"
    depends_on:
      - redis

  events:
    build:
      context: ./events_service
      dockerfile: Dockerfile
    container_name: ikasilink-staging-events
    environment:
      - NODE_ENV=staging
      - PORT=3005
    ports:
      - "3005:3005"
    depends_on:
      - postgres
      - redis

  moderation:
    build:
      context: ./moderation_service
      dockerfile: Dockerfile
    container_name: ikasilink-staging-moderation
    environment:
      - NODE_ENV=staging
      - PORT=3006
    ports:
      - "3006:3006"
    depends_on:
      - redis

  search:
    build:
      context: ./agent9-search
      dockerfile: Dockerfile
    container_name: ikasilink-staging-search
    environment:
      - NODE_ENV=staging
      - PORT=3007
    ports:
      - "3007:3007"

  nginx:
    image: nginx:alpine
    container_name: ikasilink-staging-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ops/nginx-staging.conf:/etc/nginx/nginx.conf
      - ./staging/ssl:/etc/nginx/ssl
    depends_on:
      - auth
      - media
      - messaging
      - events
      - moderation
      - search

volumes:
  staging_redis_data:
  staging_postgres_data:
EOF

# Create staging Nginx configuration
cat > ops/nginx-staging.conf << EOF
events {
    worker_connections 1024;
}

http {
    upstream auth {
        server auth:3001;
    }
    
    upstream media {
        server media:3002;
    }
    
    upstream messaging {
        server messaging:3003;
    }
    
    upstream events {
        server events:3005;
    }
    
    upstream moderation {
        server moderation:3006;
    }
    
    upstream search {
        server search:3007;
    }

    server {
        listen 80;
        server_name staging.api.ikasilink.co.za;
        
        # Redirect HTTP to HTTPS
        return 301 https://\$server_name\$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name staging.api.ikasilink.co.za;
        
        ssl_certificate /etc/nginx/ssl/staging.crt;
        ssl_certificate_key /etc/nginx/ssl/staging.key;
        
        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
        
        # CORS for staging
        add_header Access-Control-Allow-Origin "https://staging.ikasilink.co.za";
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Authorization, Content-Type";
        
        location /auth/ {
            proxy_pass http://auth/;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
        
        location /media/ {
            proxy_pass http://media/;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
        
        location /messaging/ {
            proxy_pass http://messaging/;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
        
        location /events/ {
            proxy_pass http://events/;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
        
        location /moderation/ {
            proxy_pass http://moderation/;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
        
        location /search/ {
            proxy_pass http://search/;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
        }
        
        location /ws {
            proxy_pass http://messaging:3004;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host \$host;
        }
    }
}
EOF

echo "📊 Setting up staging monitoring..."

# Create staging monitoring configuration
cat > ops/staging-monitoring.yml << EOF
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: ikasilink-staging-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./ops/prometheus-staging.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  grafana:
    image: grafana/grafana:latest
    container_name: ikasilink-staging-grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=staging_admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./ops/grafana-dashboards:/etc/grafana/provisioning/dashboards

volumes:
  prometheus_data:
  grafana_data:
EOF

echo "✅ Staging environment setup complete!"
echo ""
echo "🚀 Next steps:"
echo "1. Deploy staging infrastructure: docker-compose -f docker-compose.staging.yml up -d"
echo "2. Build and upload staging AAB: ./scripts/build-android-staging.sh"
echo "3. Create closed testing track in Play Console"
echo "4. Invite beta testers using the onboarding email template"
echo "5. Monitor staging metrics and logs"
echo ""
echo "📱 Staging URLs:"
echo "- API: https://staging.api.ikasilink.co.za"
echo "- Web: https://staging.ikasilink.co.za"
echo "- Monitoring: https://staging.monitoring.ikasilink.co.za"
echo ""
echo "🔧 Management commands:"
echo "- View logs: docker-compose -f docker-compose.staging.yml logs -f"
echo "- Restart services: docker-compose -f docker-compose.staging.yml restart"
echo "- Scale services: docker-compose -f docker-compose.staging.yml up -d --scale auth=2"
