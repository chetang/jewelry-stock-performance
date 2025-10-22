# Jewelry model stored in Elasticsearch
class Jewelry
  include Elasticsearch::Model
  include AASM

  # Elasticsearch index configuration
  index_name { account.jewelry_index_name }

  settings index: {
    number_of_shards: 1,
    number_of_replicas: 0,
    analysis: {
      analyzer: {
        jewelry_analyzer: {
          type: 'custom',
          tokenizer: 'standard',
          filter: ['lowercase', 'asciifolding']
        }
      }
    }
  } do
    mappings dynamic: false do
      indexes :id, type: 'keyword'
      indexes :account_id, type: 'keyword'
      indexes :serial_number, type: 'keyword'
      indexes :item_number, type: 'keyword'
      indexes :type, type: 'keyword'
      indexes :code, type: 'keyword'
      indexes :carat_code, type: 'integer'
      indexes :carat_range, type: 'keyword'
      indexes :gold_color, type: 'keyword'
      indexes :quality, type: 'keyword'
      indexes :total_carat_weight, type: 'float'
      indexes :unit_price, type: 'float'
      indexes :description, type: 'text', analyzer: 'jewelry_analyzer'
      indexes :date_created, type: 'date'
      indexes :state, type: 'keyword'
      indexes :first_seen_at, type: 'date'
      indexes :last_seen_at, type: 'date'
      indexes :sold_at, type: 'date'
      indexes :created_at, type: 'date'
      indexes :updated_at, type: 'date'
    end
  end

  attr_accessor :id, :account_id, :serial_number, :item_number, :type, :code,
                :carat_code, :carat_range, :gold_color, :quality,
                :total_carat_weight, :unit_price, :description, :date_created,
                :state, :first_seen_at, :last_seen_at, :sold_at,
                :created_at, :updated_at, :account

  # State machine
  aasm column: :state do
    state :pending, initial: true
    state :for_sale
    state :sold
    state :deleted

    event :activate do
      transitions from: :pending, to: :for_sale
    end

    event :mark_as_sold do
      transitions from: [:pending, :for_sale], to: :sold, after: :set_sold_date
    end

    event :mark_as_deleted do
      transitions from: [:pending, :for_sale], to: :deleted
    end

    event :reactivate do
      transitions from: [:sold, :deleted], to: :for_sale
    end
  end

  def initialize(attributes = {})
    attributes.each do |key, value|
      send("#{key}=", value) if respond_to?("#{key}=")
    end
    @id ||= SecureRandom.uuid
    @state ||= 'pending'
    @created_at ||= Time.current
    @updated_at ||= Time.current
  end

  def save
    @updated_at = Time.current
    client.index(
      index: self.class.index_name,
      id: id,
      body: as_indexed_json
    )
    true
  rescue => e
    Rails.logger.error "Failed to save jewelry: #{e.message}"
    false
  end

  def update(attributes = {})
    attributes.each do |key, value|
      send("#{key}=", value) if respond_to?("#{key}=")
    end
    save
  end

  def destroy
    client.delete(index: self.class.index_name, id: id)
    true
  rescue => e
    Rails.logger.error "Failed to delete jewelry: #{e.message}"
    false
  end

  def as_indexed_json(options = {})
    {
      id: id,
      account_id: account_id,
      serial_number: serial_number,
      item_number: item_number,
      type: type,
      code: code,
      carat_code: carat_code,
      carat_range: carat_range,
      gold_color: gold_color,
      quality: quality,
      total_carat_weight: total_carat_weight,
      unit_price: unit_price,
      description: description,
      date_created: date_created,
      state: state,
      first_seen_at: first_seen_at,
      last_seen_at: last_seen_at,
      sold_at: sold_at,
      created_at: created_at,
      updated_at: updated_at
    }
  end

  def self.find(id, account)
    response = client.get(index: account.jewelry_index_name, id: id)
    from_elasticsearch(response['_source'], account)
  rescue Elasticsearch::Transport::Transport::Errors::NotFound
    nil
  end

  def self.from_elasticsearch(source, account)
    jewelry = new(source)
    jewelry.account = account
    jewelry
  end

  private

  def set_sold_date
    self.sold_at = Time.current
  end

  def client
    Elasticsearch::Model.client
  end

  def self.client
    Elasticsearch::Model.client
  end
end
