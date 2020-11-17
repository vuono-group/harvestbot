set -e

GCLOUD_PROJECT=$1
GCLOUD_FUNCTION_REGION=$2

echo "Activate service account"
gcloud auth activate-service-account --key-file=$HOME/gcloud-service-key.json

echo "Set project"
gcloud --quiet config set project $GCLOUD_PROJECT

echo "Deploy functions"
gcloud functions deploy initFlextime --set-env-vars GCLOUD_PROJECT=$GCLOUD_PROJECT,FUNCTION_REGION=$GCLOUD_FUNCTION_REGION --region $GCLOUD_FUNCTION_REGION --format=none --runtime=nodejs10 --trigger-http
gcloud functions deploy calcFlextime --set-env-vars GCLOUD_PROJECT=$GCLOUD_PROJECT,FUNCTION_REGION=$GCLOUD_FUNCTION_REGION --region $GCLOUD_FUNCTION_REGION --format=none --runtime=nodejs10 --trigger-topic flextime
gcloud functions deploy calcStats --set-env-vars GCLOUD_PROJECT=$GCLOUD_PROJECT,FUNCTION_REGION=$GCLOUD_FUNCTION_REGION --region $GCLOUD_FUNCTION_REGION --format=none --runtime=nodejs10 --trigger-topic stats
gcloud functions deploy notifyUsers --set-env-vars GCLOUD_PROJECT=$GCLOUD_PROJECT,FUNCTION_REGION=$GCLOUD_FUNCTION_REGION --region $GCLOUD_FUNCTION_REGION --format=none --runtime=nodejs10 --trigger-http
