#!/bin/bash

# Docker Desktop Development Setup Script
# Run this after first-time docker-compose up

set -e

echo "🚀 Setting up Jewelry Stock Performance in Docker..."

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
if ! docker-compose ps | grep -q "Up"; then
  echo "❌ Services are not running. Please run 'docker-compose up' first."
  exit 1
fi

# Create database
echo "📊 Creating database..."
docker-compose exec -T backend rails db:create || echo "Database already exists"

# Run migrations
echo "🔄 Running migrations..."
docker-compose exec -T backend rails db:migrate

# Setup Elasticsearch
echo "🔍 Setting up Elasticsearch indices..."
docker-compose exec -T backend rails runner "
  require 'elasticsearch/model'
  
  # Create Jewelry index
  Jewelry.__elasticsearch__.create_index! force: true
  puts 'Created Jewelry index'
  
  # Import existing data
  Jewelry.import force: true
  puts 'Imported Jewelry data'
"

# Seed data (optional)
echo "🌱 Seeding sample data..."
docker-compose exec -T backend rails db:seed || echo "Skipping seed"

# Create test user
echo "👤 Creating test user..."
docker-compose exec -T backend rails runner "
  user = User.find_or_create_by!(email: 'test@example.com') do |u|
    u.password = 'password123'
    u.name = 'Test User'
  end
  
  account = Account.find_or_create_by!(name: 'Test Account') do |a|
    a.owner = user
  end
  
  user.update!(account: account)
  
  puts 'Created test user: test@example.com / password123'
"

echo "✅ Setup complete!"
echo ""
echo "📍 Services are available at:"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:3001/api/v1"
echo "   Elasticsearch: http://localhost:9200"
echo ""
echo "🔐 Test Login:"
echo "   Email:    test@example.com"
echo "   Password: password123"
echo ""
echo "💡 Useful commands:"
echo "   View logs:        docker-compose logs -f"
echo "   Rails console:    docker-compose exec backend rails console"
echo "   Stop services:    docker-compose down"
echo "   Reset everything: docker-compose down -v && docker-compose up -d"
