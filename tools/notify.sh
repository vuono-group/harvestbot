#!/bin/bash

NOTIFY_TIMESTAMP=$(date -u +%s)
NOTIFY_PAYLOAD="type=cron"
NOTIFY_HMAC=$(echo -n v0:$NOTIFY_TIMESTAMP:$NOTIFY_PAYLOAD | openssl dgst -sha256 -hex -hmac "$SLACK_SIGNING_SECRET" | sed 's/^.* //')

curl -X POST \
  -d $NOTIFY_PAYLOAD \
  -H "X-Slack-Request-Timestamp: $NOTIFY_TIMESTAMP" \
  -H "X-Slack-Signature: v0=$NOTIFY_HMAC" \
  ${GCLOUD_NOTIFY_FUNCTION_URL}
