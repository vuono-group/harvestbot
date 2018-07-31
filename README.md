# Harvestbot

[![Greenkeeper badge](https://badges.greenkeeper.io/lauravuo/harvestbot.svg)](https://greenkeeper.io/)

Slackbot for calculating Harvest balance.


## Deployment

### GCloud tools via docker

```
# Pull tools
docker pull google/cloud-sdk:206.0.0

# Authenticate
docker run -ti --name gcloud-config google/cloud-sdk gcloud auth login

# Set project id
docker run --rm -ti --volumes-from gcloud-config google/cloud-sdk gcloud config set project $GCLOUD_PROJECT
```

### Setup cloud environment

```
# Create config
gcloud beta runtime-config configs create harvestbot-config

# Set needed variables to config e.g.
gcloud beta runtime-config configs variables set ALLOWED_EMAIL_DOMAINS email.com --is-text --config-name harvestbot-config
```

### Update gCloud function

```
# Deploy
gcloud functions deploy $GCLOUD_FUNCTION_NAME --source $GCLOUD_REPOSITORY_URL

```
