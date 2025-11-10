#!/bin/bash
set -e

# Run database migrations
bundle exec rake db:migrate

# Start Nginx and Rails
if [ "$1" = "start" ]; then
  nginx
  bundle exec rails server -b 0.0.0.0 -p 3000
else
  exec "$@"
fi
