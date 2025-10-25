terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Cloud Run Service for Next.js Application
resource "google_cloud_run_v2_service" "ai_studio_web" {
  name     = "ai-studio-web"
  location = var.region

  template {
    containers {
      image = var.container_image

      env {
        name  = "DATABASE_URL"
        value = "postgresql://${google_sql_user.ai_studio_user.name}:${random_password.db_password.result}@/${google_sql_database.ai_studio_db.name}?host=/cloudsql/${google_sql_database_instance.ai_studio_postgres.connection_name}"
      }

      env {
        name  = "JWT_SECRET"
        value = random_password.jwt_secret.result
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      resources {
        limits = {
          memory = "1Gi"
          cpu    = "1"
        }
      }

      ports {
        container_port = 3000
      }
    }

    scaling {
      min_instance_count = 1
      max_instance_count = 10
    }
  }

  traffic {
    type    = "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST"
    percent = 100
  }
}

# Cloud SQL Instance (PostgreSQL)
resource "google_sql_database_instance" "ai_studio_postgres" {
  name             = "ai-studio-postgres-${random_id.db_name_suffix.hex}"
  database_version = "POSTGRES_16"
  region           = var.region

  settings {
    tier              = "db-f1-micro"
    availability_type = "ZONAL"

    backup_configuration {
      enabled            = true
      start_time         = "03:00"
      point_in_time_recovery_enabled = true
    }

    ip_configuration {
      ipv4_enabled = true
      authorized_networks {
        name  = "cloud-run"
        value = "0.0.0.0/0"
      }
    }
  }

  deletion_protection = false
}

# Database
resource "google_sql_database" "ai_studio_db" {
  name     = "ai_studio"
  instance = google_sql_database_instance.ai_studio_postgres.name
}

# Database User
resource "google_sql_user" "ai_studio_user" {
  name     = "aistudio"
  instance = google_sql_database_instance.ai_studio_postgres.name
  password = random_password.db_password.result
}

# Cloud Storage Bucket for Image Uploads
resource "google_storage_bucket" "ai_studio_uploads" {
  name          = "${var.project_id}-ai-studio-uploads"
  location      = var.region
  force_destroy = false

  uniform_bucket_level_access = true

  cors {
    origin          = ["*"]
    method          = ["GET", "HEAD", "PUT", "POST", "DELETE"]
    response_header = ["*"]
    max_age_seconds = 3600
  }
}

# IAM Policy for Cloud Run Service
resource "google_cloud_run_service_iam_member" "ai_studio_web_public" {
  service  = google_cloud_run_v2_service.ai_studio_web.name
  location = google_cloud_run_v2_service.ai_studio_web.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Random Resources for Secrets
resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "random_password" "jwt_secret" {
  length  = 64
  special = true
}

resource "random_id" "db_name_suffix" {
  byte_length = 4
}

