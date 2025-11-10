source 'https://rubygems.org'
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby '3.2.0'

# Core Rails
gem 'rails', '~> 7.1.0'
gem 'puma', '~> 6.0'

# Database & Search
gem 'elasticsearch-model', '~> 7.2'
gem 'elasticsearch-rails', '~> 7.2'
gem 'redis', '~> 5.0'
gem 'pg', '~> 1.4'
gem 'activerecord-import', '~> 1.1'
# Authentication & Authorization
gem 'devise', '~> 4.9'
gem 'devise-jwt', '~> 0.11'
gem 'pundit', '~> 2.3'

# Background Jobs
gem 'sidekiq', '~> 7.1'
gem 'sidekiq-scheduler', '~> 5.0'

# State Machine
gem 'aasm', '~> 5.5'

# FTP & File Processing
gem 'net-sftp', '~> 4.0'
gem 'csv', '~> 3.2'

# API
gem 'rack-cors', '~> 2.0'
gem 'jbuilder', '~> 2.11'

# Utilities
gem 'bootsnap', require: false
gem 'tzinfo-data', platforms: %i[mingw mswin x64_mingw jruby]

group :development, :test do
  gem 'debug', platforms: %i[mri mingw x64_mingw]
  gem 'rspec-rails', '~> 6.0'
  gem 'factory_bot_rails', '~> 6.2'
  gem 'faker', '~> 3.2'
  gem 'pry-rails', '~> 0.3'
end

group :test do
  gem 'shoulda-matchers', '~> 5.3'
  gem 'simplecov', require: false
  gem 'webmock', '~> 3.18'
  gem 'vcr', '~> 6.1'
end

group :development do
  gem 'rubocop', '~> 1.56', require: false
  gem 'rubocop-rails', '~> 2.21', require: false
  gem 'rubocop-rspec', '~> 2.24', require: false
end
