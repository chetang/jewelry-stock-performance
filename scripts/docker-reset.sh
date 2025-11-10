#!/bin/bash

# Reset Docker environment completely
# Use this if you need a fresh start

set -e

echo "⚠️  This will delete all Docker volumes and data!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Aborted."
  exit 0
fi

echo "🛑 Stopping all services..."
docker-compose down -v

echo "🗑️  Removing all containers and volumes..."
docker-compose rm -f

echo "🧹 Pruning Docker system..."
docker system prune -f

echo "🔨 Rebuilding images..."
docker-compose build --no-cache

echo "🚀 Starting services..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 15

echo "📊 Running setup script..."
bash scripts/docker-dev-setup.sh

echo "✅ Reset complete!"
