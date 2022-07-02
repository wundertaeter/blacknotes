#/usr/bin/bash
source .env
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"secret":"'"$DJANGO_SECRET"'"}' \
  http://localhost:7777/notify/

