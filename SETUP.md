# Jewelry Stock Performance - Setup Guide

## Prerequisites

- Ruby 3.2.0
- Node.js 20+
- PostgreSQL 14+
- Elasticsearch 8.x
- Redis (for Sidekiq)
- pnpm (for frontend dependencies)

## Local Development Setup

### 1. Install Dependencies

\`\`\`bash
# Install Ruby gems
bundle install

# Install Node packages
pnpm install
\`\`\`

### 2. Database Setup

\`\`\`bash
# Create and migrate database
rails db:create
rails db:migrate

# Create Elasticsearch indices
rails elasticsearch:create_indices
\`\`\`

### 3. Environment Variables

Copy `.env.example` to `.env` and update with your local configuration:

\`\`\`bash
cp .env.example .env
\`\`\`

Key variables for local development:
- `DATABASE_URL`: Your local PostgreSQL connection
- `ELASTICSEARCH_URL`: Local Elasticsearch (default: http://localhost:9200)
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:3000/api/v1)
- `NEXT_PUBLIC_USE_MOCK_DATA`: Set to `true` to use mock data, `false` to use real API

### 4. Start Services

**Terminal 1 - Rails Backend:**
\`\`\`bash
rails server -p 3000
\`\`\`

**Terminal 2 - Next.js Frontend:**
\`\`\`bash
pnpm dev
\`\`\`

**Terminal 3 - Sidekiq (for background jobs):**
\`\`\`bash
bundle exec sidekiq
\`\`\`

**Terminal 4 - Elasticsearch (if not running as service):**
\`\`\`bash
elasticsearch
\`\`\`

### 5. Access the Application

- Frontend: http://localhost:3001
- Backend API: http://localhost:3000/api/v1
- Sidekiq Dashboard: http://localhost:3000/sidekiq (add route in routes.rb)

## Testing the API

### Import Inventory CSV

\`\`\`bash
curl -X POST http://localhost:3000/api/v1/imports \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@/path/to/inventory.csv"
\`\`\`

### Get L1 Grid Data

\`\`\`bash
curl -X GET "http://localhost:3000/api/v1/jewelry/l1_grid?from_date=2024-01-01&to_date=2024-12-31&ideal_turn=1.4" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
\`\`\`

### Save a Report

\`\`\`bash
curl -X POST http://localhost:3000/api/v1/saved_reports \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Monthly Review",
    "filters": {...},
    "email_enabled": true,
    "email_recipients": ["manager@company.com"]
  }'
\`\`\`

## Database Schema

The system uses the following main tables:

- `jewelries`: Main inventory table with Elasticsearch sync
- `accounts`: Multi-tenant account management
- `users`: User authentication and authorization
- `saved_reports`: Saved filter configurations with email settings
- `user_preferences`: Per-user ideal turn and date preferences
- `ftp_imports`: Track FTP sync history

## State Machine

Jewelry items follow this lifecycle:

\`\`\`
pending → onjobs → instock → sales
                     ↓
                  deleted
\`\`\`

- **pending**: Newly imported, needs review
- **onjobs**: In production (jobs)
- **instock**: Available inventory (in-house or on-memo)
- **sales**: Sold items
- **deleted**: Removed from all calculations

## Background Jobs

### FtpSyncJob

Runs hourly to:
1. Connect to FTP server
2. Download latest inventory CSV
3. Import and update jewelry records
4. Detect sales (items removed from inventory)
5. Send email notifications if configured

## Deployment

See `DEPLOYMENT.md` for detailed GCP deployment instructions.

## Troubleshooting

### Elasticsearch Connection Issues

\`\`\`bash
# Check Elasticsearch status
curl http://localhost:9200/_cluster/health

# Recreate indices
rails elasticsearch:drop_indices
rails elasticsearch:create_indices
\`\`\`

### Database Migration Issues

\`\`\`bash
# Reset database (WARNING: destroys all data)
rails db:drop db:create db:migrate

# Check migration status
rails db:migrate:status
\`\`\`

### Mock Data vs Real API

Toggle between mock data and real API by setting:
\`\`\`
NEXT_PUBLIC_USE_MOCK_DATA=true  # Use frontend mock data
NEXT_PUBLIC_USE_MOCK_DATA=false # Use backend API
\`\`\`

## Support

For issues or questions, refer to the main README.md or contact the development team.
