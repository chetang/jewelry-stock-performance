# Jewelry Stock Performance Dashboard - Backend API

Ruby on Rails API backend for the Jewelry Stock Performance Dashboard with Elasticsearch integration.

## Tech Stack

- **Ruby on Rails 7.1** (API mode)
- **Elasticsearch 7.x** (primary data store + aggregations)
- **PostgreSQL** (user accounts, metadata)
- **Sidekiq** (background jobs)
- **Devise + JWT** (authentication)
- **RSpec** (testing)

## Features

- Multi-tenant architecture with account isolation
- Hourly FTP sync for inventory updates
- Automatic sales detection (items disappearing from FTP)
- Multi-level aggregations (L1: Type×Carat, L2: Code×Quality, L3: Item details)
- CSR role with multi-account access
- Comprehensive test coverage

## Setup

### Prerequisites

- Ruby 3.2.0
- PostgreSQL 14+
- Elasticsearch 7.x
- Redis 6+

### Installation

\`\`\`bash
# Install dependencies
bundle install

# Setup database
rails db:create db:migrate

# Setup Elasticsearch indices
rails runner 'Jewelry.__elasticsearch__.create_index! force: true'

# Start services
redis-server
elasticsearch
sidekiq

# Start Rails server
rails server
\`\`\`

### Environment Variables

\`\`\`bash
# Database
DATABASE_URL=postgresql://localhost/jewelry_stock_development

# Elasticsearch
ELASTICSEARCH_URL=http://localhost:9200

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT Secret
DEVISE_JWT_SECRET_KEY=your_secret_key_here

# Encryption Key (for FTP passwords)
ENCRYPTION_KEY=your_encryption_key_here
\`\`\`

## API Endpoints

### Authentication

\`\`\`
POST   /api/v1/auth/login      # Login
POST   /api/v1/auth/signup     # Signup
DELETE /api/v1/auth/logout     # Logout
GET    /api/v1/auth/me         # Current user
\`\`\`

### Jewelry Data

\`\`\`
GET /api/v1/jewelry/level1      # Level 1 grid (Type × Carat Range)
GET /api/v1/jewelry/level2      # Level 2 grid (Code × Quality)
GET /api/v1/jewelry/level3      # Level 3 details (Stock & Sales lists)
GET /api/v1/jewelry/table       # Table view (all data grouped)
\`\`\`

### Query Parameters

- `from_date` - Start date for sales period (default: 1 year ago)
- `to_date` - End date for sales period (default: today)
- `ideal_turn` - Ideal turn rate for calculations (default: 3.0)
- `type` - Filter by jewelry type (L2, L3)
- `carat_range` - Filter by carat range (L2, L3)
- `code` - Filter by sub-category code (L3)
- `quality` - Filter by quality (L3)
- `account_id` - Account ID (CSR only)

## Data Models

### Account
- Multi-tenant container
- FTP credentials
- Isolated Elasticsearch indices

### User
- Belongs to Account (except CSR)
- Roles: user, admin, csr
- JWT authentication

### Jewelry (Elasticsearch)
- Serial number (unique identifier)
- Type, Code, Carat Range, Quality
- State machine: pending → for_sale → sold
- Timestamps: first_seen_at, last_seen_at, sold_at

### FtpImport
- Import history
- Status tracking
- Statistics (new, updated, sold items)

## Background Jobs

### FtpSyncJob
- Runs hourly (configurable in sidekiq.yml)
- Downloads CSV from FTP
- Parses and updates Elasticsearch
- Triggers sales detection

### Sales Detection
- Compares current inventory with previous sync
- Items not seen in 2+ hours → marked as sold
- Uses last_seen_at as sale date

## Testing

\`\`\`bash
# Run all tests
rspec

# Run specific test file
rspec spec/models/user_spec.rb

# Run with coverage
COVERAGE=true rspec
\`\`\`

## Deployment

### Production Checklist

1. Set environment variables
2. Configure CORS origins
3. Setup Elasticsearch cluster
4. Configure Sidekiq with Redis
5. Setup FTP credentials per account
6. Run migrations
7. Create Elasticsearch indices
8. Schedule hourly FTP sync

### Docker

\`\`\`bash
# Build image
docker build -t jewelry-stock-api .

# Run container
docker run -p 3000:3000 jewelry-stock-api
\`\`\`

## License

Proprietary - All rights reserved
