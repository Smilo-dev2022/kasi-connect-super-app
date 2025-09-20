#!/usr/bin/env bash
set -euo pipefail

REGISTRY="${REGISTRY:-ghcr.io}"
REPO="${REPO:-${GITHUB_REPOSITORY:-your-org/kasi-connect}}"
TAG="${TAG:-${GITHUB_REF_NAME:-dev}}"

declare -A services=(
  [backend]=backend
  [events-service]=events-service
  [events_service]=events_service
  [moderation_service]=moderation_service
  [services-auth]=services/auth
  [services-media]=services/media
  [agent9-search]=agent9-search
  [wallet-service]=wallet-service
  [agent7-messaging]=agent7-messaging
  [web-admin]=web-admin
)

for name in "${!services[@]}"; do
  context="${services[$name]}"
  image="$REGISTRY/$REPO-$name:$TAG"
  echo "Building $image from $context"
  docker build -t "$image" -f "$context/Dockerfile" "$context"
done
