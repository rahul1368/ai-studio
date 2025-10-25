output "cloud_run_url" {
  description = "The URL of the deployed Cloud Run service"
  value       = google_cloud_run_v2_service.ai_studio_web.uri
}

output "database_connection_name" {
  description = "The connection name of the Cloud SQL instance"
  value       = google_sql_database_instance.ai_studio_postgres.connection_name
}

output "storage_bucket_name" {
  description = "The name of the Cloud Storage bucket for uploads"
  value       = google_storage_bucket.ai_studio_uploads.name
}

output "database_password" {
  description = "The generated database password (sensitive)"
  value       = random_password.db_password.result
  sensitive   = true
}

output "jwt_secret" {
  description = "The generated JWT secret (sensitive)"
  value       = random_password.jwt_secret.result
  sensitive   = true
}

