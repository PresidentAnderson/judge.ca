# PVT Ecosystem Deployment and DevOps Guide

## Table of Contents
1. [Infrastructure Overview](#infrastructure-overview)
2. [Development Environment Setup](#development-environment-setup)
3. [CI/CD Pipeline](#cicd-pipeline)
4. [Container Management](#container-management)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [Database Operations](#database-operations)
7. [Security Configuration](#security-configuration)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup & Recovery](#backup--recovery)
10. [Troubleshooting](#troubleshooting)

## Infrastructure Overview

### Cloud Architecture

```yaml
Production Environment:
  Cloud Provider: AWS (Primary), Azure (Backup)
  Regions: 
    - Primary: us-east-1
    - Secondary: eu-west-1
    - Tertiary: ap-southeast-1
  
  Infrastructure Components:
    - EKS Clusters: 3 (one per region)
    - RDS Instances: PostgreSQL 14
    - ElastiCache: Redis 7.x
    - S3 Buckets: Static assets and backups
    - CloudFront: CDN distribution
    - Route 53: DNS management
    - ALB: Application load balancers
```

### Environment Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    Production Environment                    │
├─────────────────────────────────────────────────────────────┤
│  Load Balancer → API Gateway → Microservices → Database    │
│       │              │              │              │       │
│   CloudFront    Kong Gateway   Kubernetes      RDS/Redis   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                     Staging Environment                     │
├─────────────────────────────────────────────────────────────┤
│        Scaled-down replica of production stack             │
│          Used for pre-production testing                   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   Development Environment                   │
├─────────────────────────────────────────────────────────────┤
│         Docker Compose for local development               │
│            Minikube for Kubernetes testing                 │
└─────────────────────────────────────────────────────────────┘
```

## Development Environment Setup

### Prerequisites

```bash
# Required software
- Docker Desktop 4.20+
- kubectl 1.27+
- Helm 3.12+
- Node.js 18+
- Python 3.11+
- Go 1.21+
- Git 2.40+

# Development tools
- VS Code with extensions
- Postman for API testing
- pgAdmin for database management
- Redis Commander for cache management
```

### Local Development Setup

#### 1. Repository Clone
```bash
git clone https://github.com/pvtecosystem/platform.git
cd platform
git checkout develop
```

#### 2. Environment Configuration
```bash
# Copy environment templates
cp .env.example .env.local
cp docker-compose.override.yml.example docker-compose.override.yml

# Edit configuration files
nano .env.local
```

#### 3. Docker Compose Setup
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: pvt_ecosystem
      POSTGRES_USER: developer
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"
      - "15672:15672"
    environment:
      RABBITMQ_DEFAULT_USER: admin
      RABBITMQ_DEFAULT_PASS: admin

volumes:
  postgres_data:
  redis_data:
  elasticsearch_data:
```

#### 4. Application Startup
```bash
# Start infrastructure services
docker-compose up -d postgres redis elasticsearch rabbitmq

# Install dependencies
npm install
pip install -r requirements.txt
go mod tidy

# Run database migrations
npm run db:migrate

# Start development servers
npm run dev:academy      # Academy service on port 3001
npm run dev:automation   # Automation service on port 3002
npm run dev:united       # United service on port 3003
npm run dev:gateway      # API Gateway on port 3000
```

### Development Workflow

#### Git Workflow
```bash
# Feature development
git checkout develop
git pull origin develop
git checkout -b feature/new-academy-course
# Make changes
git add .
git commit -m "feat: add new mental health course module"
git push origin feature/new-academy-course
# Create pull request
```

#### Code Quality Checks
```bash
# Frontend linting
npm run lint
npm run type-check

# Backend testing
npm run test:unit
npm run test:integration
npm run test:e2e

# Security scanning
npm audit
pip check
go mod verify
```

## CI/CD Pipeline

### GitLab CI Pipeline

```yaml
# .gitlab-ci.yml
stages:
  - build
  - test
  - security
  - deploy-staging
  - deploy-production

variables:
  DOCKER_REGISTRY: registry.pvtecosystem.com
  KUBERNETES_NAMESPACE: pvt-ecosystem

build:
  stage: build
  script:
    - docker build -t $DOCKER_REGISTRY/academy:$CI_COMMIT_SHA ./services/academy
    - docker build -t $DOCKER_REGISTRY/automation:$CI_COMMIT_SHA ./services/automation
    - docker build -t $DOCKER_REGISTRY/united:$CI_COMMIT_SHA ./services/united
    - docker push $DOCKER_REGISTRY/academy:$CI_COMMIT_SHA
    - docker push $DOCKER_REGISTRY/automation:$CI_COMMIT_SHA
    - docker push $DOCKER_REGISTRY/united:$CI_COMMIT_SHA
  only:
    - develop
    - main

test:
  stage: test
  script:
    - npm ci
    - npm run test:coverage
    - npm run test:integration
  coverage: '/Coverage: \d+\.\d+%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

security:
  stage: security
  script:
    - npm audit --audit-level=high
    - docker run --rm -v $(pwd):/app clair-scanner
    - snyk test --severity-threshold=high
  allow_failure: false

deploy-staging:
  stage: deploy-staging
  script:
    - kubectl set image deployment/academy academy=$DOCKER_REGISTRY/academy:$CI_COMMIT_SHA -n staging
    - kubectl set image deployment/automation automation=$DOCKER_REGISTRY/automation:$CI_COMMIT_SHA -n staging
    - kubectl set image deployment/united united=$DOCKER_REGISTRY/united:$CI_COMMIT_SHA -n staging
    - kubectl rollout status deployment/academy -n staging
  environment:
    name: staging
    url: https://staging.pvtecosystem.com
  only:
    - develop

deploy-production:
  stage: deploy-production
  script:
    - helm upgrade --install pvt-ecosystem ./helm/pvt-ecosystem 
      --set image.tag=$CI_COMMIT_SHA
      --namespace production
      --wait
  environment:
    name: production
    url: https://pvtecosystem.com
  only:
    - main
  when: manual
```

### Build Scripts

#### Docker Build Optimization
```dockerfile
# services/academy/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

WORKDIR /app

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

#### Multi-Stage Build Process
```bash
#!/bin/bash
# build.sh

set -e

echo "Building PVT Ecosystem services..."

# Build frontend
echo "Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# Build services
services=("academy" "automation" "united" "gateway")

for service in "${services[@]}"; do
    echo "Building $service service..."
    cd "services/$service"
    docker build -t "pvtecosystem/$service:latest" .
    cd ../..
done

echo "All services built successfully!"
```

## Container Management

### Docker Configuration

#### Base Images
```dockerfile
# Base Node.js image
FROM node:18-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Base Python image
FROM python:3.11-slim AS python-base
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Base Go image
FROM golang:1.21-alpine AS go-base
RUN apk add --no-cache git
WORKDIR /app
```

#### Service Containers
```yaml
# Academy Service
academy:
  image: pvtecosystem/academy:latest
  environment:
    - NODE_ENV=production
    - DATABASE_URL=postgresql://user:pass@postgres:5432/academy
    - REDIS_URL=redis://redis:6379
  depends_on:
    - postgres
    - redis
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
    interval: 30s
    timeout: 10s
    retries: 3

# Automation Service
automation:
  image: pvtecosystem/automation:latest
  environment:
    - PYTHON_ENV=production
    - DATABASE_URL=postgresql://user:pass@postgres:5432/automation
    - RABBITMQ_URL=amqp://admin:admin@rabbitmq:5672
  depends_on:
    - postgres
    - rabbitmq
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
    interval: 30s
    timeout: 10s
    retries: 3
```

### Container Orchestration

#### Docker Swarm Configuration
```yaml
# docker-stack.yml
version: '3.8'

services:
  academy:
    image: pvtecosystem/academy:latest
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
    networks:
      - pvt-network

  automation:
    image: pvtecosystem/automation:latest
    deploy:
      replicas: 2
      placement:
        constraints: [node.role == worker]
    networks:
      - pvt-network

networks:
  pvt-network:
    driver: overlay
    attachable: true
```

## Kubernetes Deployment

### Cluster Setup

#### EKS Cluster Creation
```bash
# eksctl cluster creation
eksctl create cluster \
  --name pvt-ecosystem \
  --version 1.27 \
  --region us-east-1 \
  --nodegroup-name worker-nodes \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 1 \
  --nodes-max 10 \
  --managed
```

#### Namespace Configuration
```yaml
# namespaces.yml
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    environment: production
---
apiVersion: v1
kind: Namespace
metadata:
  name: staging
  labels:
    environment: staging
---
apiVersion: v1
kind: Namespace
metadata:
  name: development
  labels:
    environment: development
```

### Application Deployment

#### Helm Chart Structure
```
helm/pvt-ecosystem/
├── Chart.yaml
├── values.yaml
├── templates/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   └── secret.yaml
└── charts/
    ├── academy/
    ├── automation/
    └── united/
```

#### Helm Values Configuration
```yaml
# values.yaml
global:
  imageRegistry: registry.pvtecosystem.com
  imagePullPolicy: IfNotPresent
  storageClass: gp2

academy:
  image:
    repository: academy
    tag: latest
  replicas: 3
  resources:
    limits:
      cpu: 1000m
      memory: 1Gi
    requests:
      cpu: 500m
      memory: 512Mi
  service:
    type: ClusterIP
    port: 3000

automation:
  image:
    repository: automation
    tag: latest
  replicas: 2
  resources:
    limits:
      cpu: 2000m
      memory: 2Gi
    requests:
      cpu: 1000m
      memory: 1Gi
  service:
    type: ClusterIP
    port: 8000

united:
  image:
    repository: united
    tag: latest
  replicas: 2
  resources:
    limits:
      cpu: 1000m
      memory: 1Gi
    requests:
      cpu: 500m
      memory: 512Mi
  service:
    type: ClusterIP
    port: 8080

ingress:
  enabled: true
  className: nginx
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt-prod
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
  hosts:
    - host: api.pvtecosystem.com
      paths:
        - path: /academy
          pathType: Prefix
          backend:
            service:
              name: academy
              port:
                number: 3000
        - path: /automation
          pathType: Prefix
          backend:
            service:
              name: automation
              port:
                number: 8000
        - path: /united
          pathType: Prefix
          backend:
            service:
              name: united
              port:
                number: 8080
  tls:
    - secretName: pvtecosystem-tls
      hosts:
        - api.pvtecosystem.com
```

#### Deployment Commands
```bash
# Install/Upgrade application
helm upgrade --install pvt-ecosystem ./helm/pvt-ecosystem \
  --namespace production \
  --create-namespace \
  --wait \
  --timeout 600s

# Rollback deployment
helm rollback pvt-ecosystem 1 --namespace production

# Check deployment status
kubectl get pods -n production
kubectl get services -n production
kubectl get ingress -n production
```

### Kubernetes Resources

#### Deployment Configuration
```yaml
# academy-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: academy
  namespace: production
spec:
  replicas: 3
  selector:
    matchLabels:
      app: academy
  template:
    metadata:
      labels:
        app: academy
    spec:
      containers:
      - name: academy
        image: pvtecosystem/academy:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        resources:
          limits:
            cpu: 1000m
            memory: 1Gi
          requests:
            cpu: 500m
            memory: 512Mi
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Database Operations

### Database Setup

#### PostgreSQL Configuration
```yaml
# postgres-deployment.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: production
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:14
        env:
        - name: POSTGRES_DB
          value: pvt_ecosystem
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: username
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 100Gi
```

#### Migration Management
```bash
# Database migration script
#!/bin/bash
# migrate.sh

set -e

DATABASE_URL=${DATABASE_URL:-"postgresql://user:pass@localhost:5432/pvt_ecosystem"}

echo "Running database migrations..."

# Academy service migrations
echo "Migrating academy database..."
cd services/academy
npm run db:migrate

# Automation service migrations
echo "Migrating automation database..."
cd ../automation
alembic upgrade head

# United service migrations
echo "Migrating united database..."
cd ../united
go run migrations/migrate.go

echo "All migrations completed successfully!"
```

### Database Backup

#### Automated Backup Script
```bash
#!/bin/bash
# backup.sh

set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
S3_BUCKET="pvt-ecosystem-backups"

echo "Starting database backup at $TIMESTAMP"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# PostgreSQL backup
pg_dump $DATABASE_URL > "$BACKUP_DIR/postgres_$TIMESTAMP.sql"

# Compress backup
gzip "$BACKUP_DIR/postgres_$TIMESTAMP.sql"

# Upload to S3
aws s3 cp "$BACKUP_DIR/postgres_$TIMESTAMP.sql.gz" "s3://$S3_BUCKET/postgres/"

# Clean up old backups (keep 30 days)
find "$BACKUP_DIR" -name "postgres_*.sql.gz" -mtime +30 -delete

echo "Backup completed successfully!"
```

## Security Configuration

### SSL/TLS Configuration

#### Certificate Management
```yaml
# cert-manager-issuer.yaml
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: ssl@pvtecosystem.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
```

#### Security Headers
```yaml
# security-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: security-headers
  namespace: production
data:
  nginx.conf: |
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'; frame-ancestors 'self';" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

### Network Security

#### Network Policies
```yaml
# network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: academy-network-policy
  namespace: production
spec:
  podSelector:
    matchLabels:
      app: academy
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: postgres
    ports:
    - protocol: TCP
      port: 5432
  - to:
    - podSelector:
        matchLabels:
          app: redis
    ports:
    - protocol: TCP
      port: 6379
```

## Monitoring & Logging

### Monitoring Setup

#### Prometheus Configuration
```yaml
# prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    rule_files:
      - "/etc/prometheus/rules/*.yml"
    
    scrape_configs:
      - job_name: 'kubernetes-pods'
        kubernetes_sd_configs:
        - role: pod
        relabel_configs:
        - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
          action: keep
          regex: true
        - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
          action: replace
          target_label: __metrics_path__
          regex: (.+)
        - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
          action: replace
          regex: ([^:]+)(?::\d+)?;(\d+)
          replacement: $1:$2
          target_label: __address__
```

#### Grafana Dashboard
```json
{
  "dashboard": {
    "title": "PVT Ecosystem Dashboard",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{service}}"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds_bucket)",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          }
        ]
      }
    ]
  }
}
```

### Logging Configuration

#### ELK Stack Setup
```yaml
# elasticsearch-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: elasticsearch
  namespace: logging
spec:
  replicas: 1
  selector:
    matchLabels:
      app: elasticsearch
  template:
    metadata:
      labels:
        app: elasticsearch
    spec:
      containers:
      - name: elasticsearch
        image: docker.elastic.co/elasticsearch/elasticsearch:8.8.0
        env:
        - name: discovery.type
          value: single-node
        - name: xpack.security.enabled
          value: "false"
        ports:
        - containerPort: 9200
        resources:
          limits:
            memory: 2Gi
          requests:
            memory: 1Gi
```

#### Fluentd Configuration
```yaml
# fluentd-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
  namespace: logging
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/containers/*.log
      pos_file /var/log/fluentd-containers.log.pos
      time_format %Y-%m-%dT%H:%M:%S.%NZ
      tag kubernetes.*
      format json
      read_from_head true
    </source>
    
    <filter kubernetes.**>
      @type kubernetes_metadata
    </filter>
    
    <match **>
      @type elasticsearch
      host elasticsearch
      port 9200
      logstash_format true
      logstash_prefix pvt-ecosystem
    </match>
```

## Backup & Recovery

### Backup Strategy

#### Full Backup Script
```bash
#!/bin/bash
# full-backup.sh

set -e

BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/$BACKUP_DATE"
S3_BUCKET="pvt-ecosystem-backups"

echo "Starting full backup at $BACKUP_DATE"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Database backup
echo "Backing up database..."
pg_dump $DATABASE_URL > "$BACKUP_DIR/database.sql"

# Redis backup
echo "Backing up Redis..."
redis-cli --rdb "$BACKUP_DIR/redis.rdb"

# File system backup
echo "Backing up file uploads..."
tar -czf "$BACKUP_DIR/uploads.tar.gz" /app/uploads/

# Kubernetes resources
echo "Backing up Kubernetes resources..."
kubectl get all --all-namespaces -o yaml > "$BACKUP_DIR/kubernetes-resources.yaml"

# Compress entire backup
tar -czf "$BACKUP_DIR.tar.gz" -C /backups "$BACKUP_DATE"

# Upload to S3
aws s3 cp "$BACKUP_DIR.tar.gz" "s3://$S3_BUCKET/full-backups/"

# Clean up
rm -rf "$BACKUP_DIR"
rm "$BACKUP_DIR.tar.gz"

echo "Full backup completed successfully!"
```

### Recovery Procedures

#### Database Recovery
```bash
#!/bin/bash
# restore-database.sh

set -e

BACKUP_FILE=$1
DATABASE_URL=${DATABASE_URL:-"postgresql://user:pass@localhost:5432/pvt_ecosystem"}

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file>"
    exit 1
fi

echo "Restoring database from $BACKUP_FILE"

# Stop application services
kubectl scale deployment academy --replicas=0 -n production
kubectl scale deployment automation --replicas=0 -n production
kubectl scale deployment united --replicas=0 -n production

# Drop and recreate database
dropdb pvt_ecosystem
createdb pvt_ecosystem

# Restore from backup
psql $DATABASE_URL < "$BACKUP_FILE"

# Restart application services
kubectl scale deployment academy --replicas=3 -n production
kubectl scale deployment automation --replicas=2 -n production
kubectl scale deployment united --replicas=2 -n production

echo "Database restoration completed successfully!"
```

## Troubleshooting

### Common Issues

#### Service Not Starting
```bash
# Check deployment status
kubectl get pods -n production
kubectl describe pod academy-xxx -n production

# Check logs
kubectl logs academy-xxx -n production
kubectl logs -f academy-xxx -n production

# Check service configuration
kubectl get service academy -n production -o yaml
kubectl get endpoints academy -n production
```

#### Database Connection Issues
```bash
# Test database connectivity
kubectl exec -it academy-xxx -n production -- psql $DATABASE_URL -c "SELECT 1"

# Check database pod
kubectl get pods -n production | grep postgres
kubectl logs postgres-0 -n production

# Check network connectivity
kubectl exec -it academy-xxx -n production -- nslookup postgres
```

#### Performance Issues
```bash
# Check resource usage
kubectl top pods -n production
kubectl top nodes

# Check metrics
curl -s http://prometheus:9090/api/v1/query?query=rate(http_requests_total[5m])

# Check application logs for errors
kubectl logs -f academy-xxx -n production | grep ERROR
```

### Debugging Commands

#### Kubernetes Debugging
```bash
# Get cluster info
kubectl cluster-info

# Check node status
kubectl get nodes -o wide

# Check resource quotas
kubectl get resourcequota -A

# Check persistent volumes
kubectl get pv
kubectl get pvc -A

# Check ingress
kubectl get ingress -A
kubectl describe ingress pvt-ecosystem -n production
```

#### Application Debugging
```bash
# Enter container for debugging
kubectl exec -it academy-xxx -n production -- /bin/sh

# Check application health
curl -f http://academy:3000/health

# Check database connection
kubectl exec -it postgres-0 -n production -- psql -U postgres -c "\l"

# Check Redis connection
kubectl exec -it redis-0 -n production -- redis-cli ping
```

### Emergency Procedures

#### System Outage Response
```bash
#!/bin/bash
# emergency-response.sh

echo "Starting emergency response procedures..."

# Check system status
kubectl get nodes
kubectl get pods -A | grep -v Running

# Scale up critical services
kubectl scale deployment academy --replicas=5 -n production
kubectl scale deployment automation --replicas=3 -n production
kubectl scale deployment united --replicas=3 -n production

# Check database status
kubectl exec -it postgres-0 -n production -- pg_isready

# Restart failed services
kubectl rollout restart deployment/academy -n production
kubectl rollout restart deployment/automation -n production
kubectl rollout restart deployment/united -n production

echo "Emergency response completed!"
```

---

**Emergency Contacts:**
- **DevOps Team**: devops@pvtecosystem.com
- **On-call Engineer**: +1-800-PVT-HELP (Press 2)
- **AWS Support**: Enterprise support case
- **Emergency Escalation**: emergency@pvtecosystem.com

**Remember**: Always test deployment procedures in staging before applying to production. Keep this guide updated with any infrastructure changes.

---

*Last Updated: July 2024*
*Version: 1.0.0*