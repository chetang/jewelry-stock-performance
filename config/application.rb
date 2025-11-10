require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie" # Added active_record/railtie since we configure it below
require "action_controller/railtie"
require "action_mailer/railtie"
require "action_view/railtie"
require "rails/test_unit/railtie"

Bundler.require(*Rails.groups)

module JewelryStockBackend
  class Application < Rails::Application
    config.load_defaults 7.1
    config.api_only = true

    # Middleware for CORS
    config.middleware.insert_before 0, Rack::Cors do
      allow do
        origins '*' # Configure this properly in production
        resource '*',
          headers: :any,
          methods: [:get, :post, :put, :patch, :delete, :options, :head]
      end
    end

    # Timezone
    config.time_zone = 'UTC'
    config.active_record.default_timezone = :utc

    # Autoload paths
    config.autoload_paths += %W[#{config.root}/app/services]
    config.eager_load_paths += %W[#{config.root}/app/services]
  end
end
