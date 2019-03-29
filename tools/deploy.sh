set -e

GCLOUD_PROJECT=$1
GCLOUD_FUNCTION_REGION=$2

echo "Activate service account"
gcloud auth activate-service-account --key-file=$HOME/gcloud-service-key.json

echo "Set project"
gcloud --quiet config set project $GCLOUD_PROJECT

echo "Deploy functions"
gcloud functions deploy initFlextime --region $GCLOUD_FUNCTION_REGION --format=none --runtime=nodejs8 --trigger-http
gcloud functions deploy calcFlextime --region $GCLOUD_FUNCTION_REGION --format=none --runtime=nodejs8 --trigger-topic flextime
gcloud functions deploy calcStats --region $GCLOUD_FUNCTION_REGION --format=none --runtime=nodejs8 --trigger-topic stats
gcloud functions deploy notifyUsers --region $GCLOUD_FUNCTION_REGION --format=none --runtime=nodejs8 --trigger-http
