# Deployment Guide

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ installed
- PostgreSQL database
- Redis instance
- AWS account (for production deployment)

## Local Development

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/learn-quest.git
cd learn-quest
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/learnquest

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-here

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Judge0
JUDGE0_URL=http://localhost:2358
```

### 4. Start services with Docker Compose
```bash
docker-compose up -d
```

### 5. Run migrations
```bash
npm run migrate
```

### 6. Seed database (optional)
```bash
npm run seed
```

### 7. Access the application
- Web Frontend: http://localhost:3000
- Admin Frontend: http://localhost:3001
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Production Deployment

### AWS Deployment with Terraform

#### 1. Configure AWS credentials
```bash
aws configure
```

#### 2. Initialize Terraform
```bash
cd infra/terraform
terraform init
```

#### 3. Plan deployment
```bash
terraform plan
```

#### 4. Apply changes
```bash
terraform apply
```

### Kubernetes Deployment

#### 1. Build Docker images
```bash
docker-compose build
```

#### 2. Push images to registry
```bash
docker push your-registry/web-frontend:latest
docker push your-registry/admin-frontend:latest
docker push your-registry/api:latest
```

#### 3. Apply Kubernetes manifests
```bash
kubectl apply -f infra/k8s/
```

#### 4. Check deployment status
```bash
kubectl get pods
kubectl get services
```

## CI/CD Pipeline

### GitHub Actions (recommended)

Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build and test
        run: |
          npm install
          npm test
      - name: Deploy
        run: |
          # Add deployment steps
```

## Monitoring

### Health Checks
- API: `GET /health`
- Database: Check connection
- Redis: Check connection

### Logging
- Application logs: `/var/log/app/`
- Nginx logs: `/var/log/nginx/`

### Metrics
- Prometheus metrics endpoint: `/metrics`
- Grafana dashboard: http://monitoring.example.com

## Backup and Recovery

### Database Backup
```bash
pg_dump -h localhost -U postgres learnquest > backup.sql
```

### Database Restore
```bash
psql -h localhost -U postgres learnquest < backup.sql
```

## Scaling

### Horizontal Scaling
- Add more API replicas in Kubernetes
- Use load balancer for distribution

### Vertical Scaling
- Increase container resources
- Optimize database queries

## Security

### SSL/TLS
- Use Let's Encrypt for SSL certificates
- Configure nginx for HTTPS

### Environment Variables
- Never commit secrets to git
- Use secret management tools (AWS Secrets Manager, Vault)

### Database Security
- Use strong passwords
- Enable SSL connections
- Regular security updates

## Troubleshooting

### Common Issues

1. **Database connection failed**
   - Check DATABASE_URL
   - Verify database is running
   - Check network connectivity

2. **Redis connection failed**
   - Check REDIS_URL
   - Verify Redis is running

3. **Docker container won't start**
   - Check logs: `docker logs <container-id>`
   - Verify port availability
   - Check resource limits

## Support

For issues and questions:
- GitHub Issues: https://github.com/yourusername/learn-quest/issues
- Email: support@learnquest.com
