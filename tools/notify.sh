#!/bin/sh

NOTIFY_TIMESTAMP=$(date -u +%s)
NOTIFY_PAYLOAD="v0:$NOTIFY_TIMESTAMP:type=cron"
NOTIFY_HMAC=$(echo -n $NOTIFY_PAYLOAD | openssl dgst -sha256 -hex -hmac "$SLACK_SIGNING_SECRET")

curl -X POST \
  -d $NOTIFY_PAYLOAD \
  -H "X-Slack-Request-Timestamp: $NOTIFY_TIMESTAMP" \
  -H "X-Slack-Signature: $NOTIFY_TIMESTAMP" \
  ${GCLOUD_NOTIFY_FUNCTION_URL}
