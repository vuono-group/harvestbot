resource "google_kms_key_ring" "harvestbot-keyring" {
  name     = "${var.gcloud_project_id}-keyring"
  location = "${var.gcloud_project_region}"
  project = "${var.gcloud_project_id}"
}

resource "google_kms_crypto_key" "harvestbot-encryption-key" {
  name            = "${var.gcloud_project_id}-encryption-key"
  key_ring        = "${google_kms_key_ring.harvestbot-keyring.id}"
  rotation_period = "2592000s"
}

resource "google_storage_bucket" "harvestbot-secret-storage" {
  name     = "${var.gcloud_project_id}-secret-storage"
  location = "${var.gcloud_project_region}"
  project = "${var.gcloud_project_id}"
}

resource "google_project_iam_member" "harvestbot-kms-member" {
  project = "${var.gcloud_project_id}"
  role    = "roles/cloudkms.cryptoKeyEncrypterDecrypter"
  member  = "serviceAccount:${var.gcloud_service_account_email}"
}
