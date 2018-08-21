provider "google" {
  credentials = "${file("${var.gcloud_credentials_path}")}"
  region      = "${var.gcloud_project_region}"
}

resource "google_project" "harvestbot" {
  name = "harvestbot"
  project_id = "${var.gcloud_project_id}"
  org_id = "${var.gcloud_organisation_id}"
}
