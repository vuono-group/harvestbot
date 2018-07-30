# Harvestbot

[![Greenkeeper badge](https://badges.greenkeeper.io/lauravuo/harvestbot.svg)](https://greenkeeper.io/)

Slackbot for calculating Harvest balance.


## Development

### Update gCloud function

```
# Pull tools
docker pull google/cloud-sdk:206.0.0

# Authenticate
docker run -ti --name gcloud-config google/cloud-sdk gcloud auth login

# Set project id
docker run --rm -ti --volumes-from gcloud-config google/cloud-sdk gcloud config set project $GCLOUD_PROJECT_ID

# Deploy
docker run --rm -ti --volumes-from gcloud-config google/cloud-sdk gcloud functions deploy $GCLOUD_FUNCTION_NAME --source $GCLOUD_REPOSITORY_URL

```
