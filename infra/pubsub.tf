resource "google_pubsub_topic" "flextime" {
  name = "flextime"
  project = "${var.gcloud_project_id}"
}

resource "google_pubsub_topic" "stats" {
  name = "stats"
  project = "${var.gcloud_project_id}"
}
