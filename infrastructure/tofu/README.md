# OpenTofu Infrastructure for GCP Deployment

This directory contains OpenTofu (Terraform-compatible) configuration for deploying the AI Studio application to Google Cloud Platform.

## Prerequisites

1. **OpenTofu** installed ([installation guide](https://opentofu.org/docs/intro/install/))
2. **GCP Account** with billing enabled
3. **gcloud CLI** installed and configured
4. **Docker image** built and pushed to Google Container Registry

## Resources Created

- **Cloud Run Service** - Hosts the Next.js application
- **Cloud SQL (PostgreSQL 16)** - Database instance
- **Cloud Storage Bucket** - For image uploads
- **IAM Policies** - Service permissions

## Setup Instructions

### 1. Authenticate with GCP

```bash
gcloud auth login
gcloud auth application-default login
```

### 2. Set your Project ID

```bash
export PROJECT_ID="your-gcp-project-id"
gcloud config set project $PROJECT_ID
```

### 3. Enable Required APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable storage-api.googleapis.com
```

### 4. Build and Push Docker Image

```bash
# Build the image
docker build -f ../docker/Dockerfile -t gcr.io/$PROJECT_ID/ai-studio:latest ../../

# Push to GCR
docker push gcr.io/$PROJECT_ID/ai-studio:latest
```

### 5. Initialize OpenTofu

```bash
cd infrastructure/tofu
tofu init
```

### 6. Create terraform.tfvars

```hcl
project_id      = "your-gcp-project-id"
region          = "us-central1"
container_image = "gcr.io/your-gcp-project-id/ai-studio:latest"
```

### 7. Plan the Deployment

```bash
tofu plan
```

### 8. Apply the Configuration

```bash
tofu apply
```

### 9. Get the Outputs

```bash
# Get the Cloud Run URL
tofu output cloud_run_url

# Get sensitive outputs (database password, JWT secret)
tofu output -json
```

## Post-Deployment

### Run Database Migrations

```bash
# Set the DATABASE_URL with the Cloud SQL connection
export DATABASE_URL="postgresql://aistudio:PASSWORD@/ai_studio?host=/cloudsql/CONNECTION_NAME"

# Run migrations
pnpm --filter @repo/database db:push
```

### Update Environment Variables

If you need to update environment variables after deployment:

```bash
gcloud run services update ai-studio-web \
  --region us-central1 \
  --set-env-vars "NEW_VAR=value"
```

## Cost Estimation

**Monthly Cost (Approximate)**:
- Cloud Run (with 1-10 instances): $10-50
- Cloud SQL (db-f1-micro): $7-15
- Cloud Storage: $0.02/GB
- **Total**: ~$20-70/month (varies with usage)

## Cleanup

To destroy all resources:

```bash
tofu destroy
```

⚠️ **Warning**: This will permanently delete all resources, including the database!

## Security Considerations

1. **Secrets Management**: For production, use Google Secret Manager instead of environment variables
2. **Database Access**: Currently allows all IPs for simplicity. Restrict to Cloud Run IP range in production
3. **IAM**: The service is publicly accessible. Add authentication at the infrastructure level for sensitive deployments
4. **Backup**: Enable automated backups (configured in this setup)

## Troubleshooting

### Cloud Run Deployment Fails

```bash
# Check logs
gcloud run services logs read ai-studio-web --region us-central1
```

### Database Connection Issues

```bash
# Verify Cloud SQL instance is running
gcloud sql instances list

# Test connection
gcloud sql connect ai-studio-postgres-XXXX --user=aistudio
```

### Container Image Not Found

```bash
# List images in GCR
gcloud container images list

# Verify the image exists
gcloud container images describe gcr.io/$PROJECT_ID/ai-studio:latest
```

## Additional Configuration

### Custom Domain

To add a custom domain to Cloud Run:

```bash
gcloud run domain-mappings create \
  --service ai-studio-web \
  --domain your-domain.com \
  --region us-central1
```

### Scaling Configuration

Update the `main.tf` file to adjust:
- `min_instance_count`: Minimum number of instances (default: 1)
- `max_instance_count`: Maximum number of instances (default: 10)
- CPU and memory limits

## Support

For issues specific to GCP deployment, refer to:
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [OpenTofu Documentation](https://opentofu.org/docs/)

