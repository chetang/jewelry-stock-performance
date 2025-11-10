# Elasticsearch configuration
Elasticsearch::Model.client = Elasticsearch::Client.new(
  url: ENV.fetch('ELASTICSEARCH_URL', 'http://localhost:9200'),
  log: Rails.env.development?,
  retry_on_failure: 5,
  request_timeout: 30
)

if Rails.env.development?
  Rails.application.config.after_initialize do
    begin
      Jewelry.__elasticsearch__.create_index! force: true
    rescue Elasticsearch::Transport::Transport::Errors::BadRequest => e
      Rails.logger.warn "Index already exists: #{e.message}"
    end
  end
end
