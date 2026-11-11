terraform {
  required_version = ">= 1.5.0"

  required_providers {
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
  }
}

provider "kubernetes" {
  config_path = "/root/.kube/config"
}

resource "kubernetes_namespace_v1" "staging" {
  metadata {
    name = "kijani-staging"

    labels = {
      app                         = "kijanikiosk"
      "app.kubernetes.io/part-of" = "kijanikiosk"
      environment                 = "staging"
      managed-by                  = "terraform"
    }
  }
}

resource "kubernetes_config_map_v1" "payments" {
  metadata {
    name      = "kk-payments-config"
    namespace = kubernetes_namespace_v1.staging.metadata[0].name
  }

  data = {
    APP_ENV     = "staging"
    APP_VERSION = "1.0.0"
    DB_HOST     = "staging-db.internal"
  }
}
