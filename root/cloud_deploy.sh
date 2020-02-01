#!/bin/bash
# Push app
if ! cf app "$CF_APP"; then
  cf push "$CF_APP" --no-start
  cf set-env "$CF_APP" APP_SECRET "$APP_SECRET"
  cf set-env "$CF_APP" MONGO_USER "$MONGO_USER"
  cf set-env "$CF_APP" MONGO_PASSWORD "$MONGO_PASSWORD"
  cf set-env "$CF_APP" MONGO_URL "$MONGO_URL"
  cf set-env "$CF_APP" MONGO_DB "$MONGO_DB"
  cf set-env "$CF_APP" LOGS_QUEUE_TOPIC "$LOGS_QUEUE_TOPIC"
  cf set-env "$CF_APP" RECEIPTS_QUEUE_TOPIC "$RECEIPTS_QUEUE_TOPIC"
  cf start "$CF_APP"
else
  OLD_CF_APP="${CF_APP}-OLD-$(date +"%s")"
  rollback() {
    set +e
    if cf app "$OLD_CF_APP"; then
      cf logs "$CF_APP" --recent
      cf delete "$CF_APP" -f
      cf rename "$OLD_CF_APP" "$CF_APP"
    fi
    exit 1
  }
  set -e
  trap rollback ERR
  cf rename "$CF_APP" "$OLD_CF_APP"
  cf push "$CF_APP" --no-start
  cf set-env "$CF_APP" APP_SECRET "$APP_SECRET"
  cf set-env "$CF_APP" MONGO_USER "$MONGO_USER"
  cf set-env "$CF_APP" MONGO_PASSWORD "$MONGO_PASSWORD"
  cf set-env "$CF_APP" MONGO_URL "$MONGO_URL"
  cf set-env "$CF_APP" MONGO_DB "$MONGO_DB"
  cf set-env "$CF_APP" LOGS_QUEUE_TOPIC "$LOGS_QUEUE_TOPIC"
  cf set-env "$CF_APP" RECEIPTS_QUEUE_TOPIC "$RECEIPTS_QUEUE_TOPIC"
  cf start "$CF_APP"
  cf delete "$OLD_CF_APP" -f
fi
# Export app name and URL for use in later Pipeline jobs
export CF_APP_NAME="$CF_APP"
export APP_URL=http://$(cf app $CF_APP_NAME | grep -e urls: -e routes: | awk '{print $2}')
# View logs
#cf logs "${CF_APP}" --recent
