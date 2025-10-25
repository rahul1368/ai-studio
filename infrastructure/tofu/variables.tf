variable "project_id" {
  description = "The GCP project ID"
  type        = string
}

variable "region" {
  description = "The GCP region to deploy resources"
  type        = string
  default     = "us-central1"
}

variable "container_image" {
  description = "The container image to deploy (e.g., gcr.io/project-id/ai-studio:latest)"
  type        = string
}

