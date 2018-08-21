# TODO: support for new reqgions
# TODO: deployment through cloud repository

# resource "google_cloudfunctions_function" "calcFlextime" {
#   entry_point = "calcFlextime"
#   name = "calcFlextime"
#   project = "${var.gcloud_project_id}"
#   region = "${var.gcloud_project_region}"
#   trigger_topic = "flextime"
# }

# resource "google_cloudfunctions_function" "calcStats" {
#   entry_point = "calcStats"
#   name = "calcStats"
#   project = "${var.gcloud_project_id}"
#   region = "${var.gcloud_project_region}"
#   trigger_topic = "stats"
# }

# resource "google_cloudfunctions_function" "initFlextime" {
#   entry_point = "initFlextime"
#   name = "initFlextime"
#   project = "${var.gcloud_project_id}"
#   region = "${var.gcloud_project_region}"
#   trigger_http = "true"
# }

# resource "google_cloudfunctions_function" "notify" {
#   entry_point = "notifyUsers"
#   name = "notify"
#   project = "${var.gcloud_project_id}"
#   region = "${var.gcloud_project_region}"
#   trigger_http = "true"
# }
