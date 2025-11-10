# Terraform configuration for GCP infrastructure

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }

  backend "gcs" {
    bucket = "jewelry-terraform-state"
    prefix = "terraform/state"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Cloud SQL PostgreSQL instance
resource "google_sql_database_instance" "postgres" {
  name             = "jewelry-postgres-${var.environment}"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier = "db-f1-micro"  # Adjust based on needs

    backup_configuration {
      enabled                        = true
      point_in_time_recovery_enabled = true
      start_time                     = "03:00"
    }

    ip_configuration {
      ipv4_enabled = true
      require_ssl  = true
    }

    database_flags {
      name  = "max_connections"
      value = "100"
    }
  }

  deletion_protection = true
}

resource "google_sql_database" "jewelry_db" {
  name     = "jewelry_production"
  instance = google_sql_database_instance.postgres.name
}

resource "google_sql_user" "jewelry_user" {
  name     = "jewelry_app"
  instance = google_sql_database_instance.postgres.name
  password = var.db_password
}

# Elasticsearch on Compute Engine
resource "google_compute_instance" "elasticsearch" {
  name         = "elasticsearch-${var.environment}"
  machine_type = "n1-standard-2"
  zone         = "${var.region}-a"

  boot_disk {
    initialize_params {
      image = "ubuntu-os-cloud/ubuntu-2204-lts"
      size  = 50
    }
  }

  network_interface {
    network = "default"
    access_config {
      // Ephemeral IP
    }
  }

  metadata_startup_script = file("${path.module}/elasticsearch-startup.sh")

  service_account {
    scopes = ["cloud-platform"]
  }

  tags = ["elasticsearch", "http-server", "https-server"]
}

# Cloud Run service
resource "google_cloud_run_service" "jewelry_app" {
  name     = "jewelry-app-${var.environment}"
  location = var.region

  template {
    spec {
      containers {
        image = "gcr.io/${var.project_id}/jewelry-app:latest"

        env {
          name  = "RAILS_ENV"
          value = "production"
        }

        env {
          name  = "DATABASE_URL"
          value = "postgresql://${google_sql_user.jewelry_user.name}:${var.db_password}@/${google_sql_database.jewelry_db.name}?host=/cloudsql/${google_sql_database_instance.postgres.connection_name}"
        }

        env {
          name  = "ELASTICSEARCH_URL"
          value = "http://${google_compute_instance.elasticsearch.network_interface[0].access_config[0].nat_ip}:9200"
        }

        resources {
          limits = {
            cpu    = "2"
            memory = "2Gi"
          }
        }
      }

      container_concurrency = 80
    }

    metadata {
      annotations = {
        "autoscaling.knative.dev/maxScale"      = "10"
        "autoscaling.knative.dev/minScale"      = "1"
        "run.googleapis.com/cloudsql-instances" = google_sql_database_instance.postgres.connection_name
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }
}

# Cloud Run IAM
resource "google_cloud_run_service_iam_member" "public_access" {
  service  = google_cloud_run_service.jewelry_app.name
  location = google_cloud_run_service.jewelry_app.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Outputs
output "cloud_run_url" {
  value = google_cloud_run_service.jewelry_app.status[0].url
}

output "database_connection" {
  value     = google_sql_database_instance.postgres.connection_name
  sensitive = true
}

output "elasticsearch_ip" {
  value = google_compute_instance.elasticsearch.network_interface[0].access_config[0].nat_ip
}
