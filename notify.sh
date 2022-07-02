#/usr/bin/bash
source .env
curl --header "Content-Type: application/json" \
  --request POST \
  --data '{"secret":"'"$DJANGO_SECRET"'"}' \
  https://auth.blacknotes.de/notify/

