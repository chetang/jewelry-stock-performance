# GCP Deployment Guide

This guide covers deploying the Jewelry Stock Performance application to Google Cloud Platform (GCP).

## Architecture Overview

- **Frontend**: Next.js app served via Nginx
- **Backend**: Ruby on Rails API
- **Database**: Cloud SQL (PostgreSQL)
- **Search**: Elasticsearch on Compute Engine
- **Hosting**: Cloud Run (serverless containers)
- **Build**: Cloud Build for CI/CD
- **Storage**: Cloud Storage for backups

## Prerequisites

1. GCP account with billing enabled
2. `gcloud` CLI installed
3. Docker installed locally
4. Terraform installed (optional, for infrastructure as code)

## Initial Setup

### 1. Create GCP Project

\`\`\`bash
gcloud projects create jewelry-stock-app --name="Jewelry Stock Performance"
gcloud config set project jewelry-stock-app
\`\`\`

### 2. Enable Required APIs

\`\`\`bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  compute.googleapis.com \
  containerregistry.googleapis.com \
  secretmanager.googleapis.com
\`\`\`

### 3. Set Up Cloud SQL (PostgreSQL)

\`\`\`bash
# Create instance
gcloud sql instances create jewelry-postgres \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=us-central1

# Create database
gcloud sql databases create jewelry_production \
  --instance=jewelry-postgres

# Create user
gcloud sql users create jewelry_app \
  --instance=jewelry-postgres \
  --password=YOUR_SECURE_PASSWORD
\`\`\`

### 4. Set Up Elasticsearch

\`\`\`bash
# Create Compute Engine instance with Elasticsearch
gcloud compute instances create elasticsearch \
  --machine-type=n1-standard-2 \
  --zone=us-central1-a \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=50GB \
  --metadata-from-file startup-script=terraform/elasticsearch-startup.sh \
  --tags=elasticsearch,http-server

# Create firewall rule
gcloud compute firewall-rules create allow-elasticsearch \
  --allow=tcp:9200 \
  --target-tags=elasticsearch
\`\`\`

### 5. Configure Secrets

\`\`\`bash
# Create secrets
echo -n "your-secret-key-base" | gcloud secrets create rails-secret-key --data-file=-
echo -n "your-encryption-key" | gcloud secrets create encryption-key --data-file=-

# Grant access to Cloud Run
gcloud secrets add-iam-policy-binding rails-secret-key \
  --member=serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com \
  --role=roles/secretmanager.secretAccessor
\`\`\`

## Deployment Options

### Option 1: Using Cloud Build (Recommended)

\`\`\`bash
# Submit build
gcloud builds submit --config cloudbuild.yaml

# The build will:
# 1. Build Docker image
# 2. Push to Container Registry
# 3. Deploy to Cloud Run
\`\`\`

### Option 2: Using Terraform

\`\`\`bash
cd terraform

# Initialize Terraform
terraform init

# Create terraform.tfvars
cat > terraform.tfvars <<EOF
project_id = "jewelry-stock-app"
region = "us-central1"
environment = "production"
db_password = "YOUR_SECURE_PASSWORD"
EOF

# Plan deployment
terraform plan

# Apply infrastructure
terraform apply
\`\`\`

### Option 3: Manual Deployment

\`\`\`bash
# Build Docker image
docker build -t gcr.io/jewelry-stock-app/jewelry-app:latest .

# Push to Container Registry
docker push gcr.io/jewelry-stock-app/jewelry-app:latest

# Deploy to Cloud Run
gcloud run deploy jewelry-app \
  --image gcr.io/jewelry-stock-app/jewelry-app:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars RAILS_ENV=production \
  --set-cloudsql-instances jewelry-stock-app:us-central1:jewelry-postgres \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 10
\`\`\`

## Environment Variables

Set these in Cloud Run:

\`\`\`bash
gcloud run services update jewelry-app \
  --set-env-vars \
    RAILS_ENV=production,\
    DATABASE_URL=postgresql://jewelry_app:PASSWORD@/jewelry_production?host=/cloudsql/PROJECT:REGION:jewelry-postgres,\
    ELASTICSEARCH_URL=http://ELASTICSEARCH_IP:9200,\
    SECRET_KEY_BASE=$(cat /dev/urandom | base64 | head -c 64),\
    ENCRYPTION_KEY=$(cat /dev/urandom | base64 | head -c 32)
\`\`\`

## Database Migrations

\`\`\`bash
# Run migrations via Cloud Run job
gcloud run jobs create migrate-db \
  --image gcr.io/jewelry-stock-app/jewelry-app:latest \
  --set-cloudsql-instances jewelry-stock-app:us-central1:jewelry-postgres \
  --set-env-vars RAILS_ENV=production \
  --command "bundle" \
  --args "exec,rake,db:migrate"

# Execute migration
gcloud run jobs execute migrate-db
\`\`\`

## Continuous Deployment

Set up Cloud Build triggers:

\`\`\`bash
# Create trigger for main branch
gcloud builds triggers create github \
  --repo-name=jewelry-stock-app \
  --repo-owner=YOUR_GITHUB_USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml
\`\`\`

## Monitoring & Logging

\`\`\`bash
# View logs
gcloud run services logs read jewelry-app --region us-central1

# Set up monitoring alerts
gcloud alpha monitoring policies create \
  --notification-channels=CHANNEL_ID \
  --display-name="High CPU Usage" \
  --condition-display-name="CPU > 80%" \
  --condition-threshold-value=0.8
\`\`\`

## Backup Strategy

### Database Backups

\`\`\`bash
# Enable automated backups
gcloud sql instances patch jewelry-postgres \
  --backup-start-time=03:00 \
  --enable-bin-log

# Manual backup
gcloud sql backups create --instance=jewelry-postgres
\`\`\`

### Elasticsearch Snapshots

Create a Cloud Storage bucket and configure Elasticsearch snapshots:

\`\`\`bash
# Create bucket
gsutil mb gs://jewelry-elasticsearch-backups

# Configure snapshot repository (run in Elasticsearch)
curl -X PUT "http://ELASTICSEARCH_IP:9200/_snapshot/gcs_backups" -H 'Content-Type: application/json' -d'
{
  "type": "gcs",
  "settings": {
    "bucket": "jewelry-elasticsearch-backups",
    "base_path": "snapshots"
  }
}
'
\`\`\`

## Cost Optimization

- Use Cloud Run's automatic scaling (pay per request)
- Enable Cloud SQL automatic storage increase
- Use preemptible VMs for Elasticsearch in non-production
- Set up budget alerts

## Security Best Practices

1. Enable Cloud Armor for DDoS protection
2. Use Cloud IAM for access control
3. Enable VPC Service Controls
4. Rotate secrets regularly
5. Enable audit logging

## Troubleshooting

### Common Issues

**Cloud Run cold starts:**
\`\`\`bash
# Set minimum instances
gcloud run services update jewelry-app --min-instances=1
\`\`\`

**Database connection errors:**
\`\`\`bash
# Verify Cloud SQL proxy
gcloud sql instances describe jewelry-postgres
\`\`\`

**Elasticsearch not accessible:**
\`\`\`bash
# Check firewall rules
gcloud compute firewall-rules list --filter="name=allow-elasticsearch"
\`\`\`

## Production Checklist

- [ ] Database backups enabled
- [ ] SSL certificates configured
- [ ] Environment variables set
- [ ] Monitoring and alerts configured
- [ ] CI/CD pipeline working
- [ ] Load testing completed
- [ ] Disaster recovery plan documented
- [ ] Security audit completed

## Support

For issues or questions, contact your infrastructure team or refer to GCP documentation at https://cloud.google.com/docs
