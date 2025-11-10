# Jewelry model stored in Elasticsearch
class Jewelry
  include Elasticsearch::Model
  include AASM

  index_name "jewelry_#{Rails.env}"

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
      indexes :metal_type, type: 'keyword'
      indexes :metal_code, type: 'keyword'
      indexes :gold_color, type: 'keyword'
      indexes :quality, type: 'keyword'
      indexes :total_carat_weight, type: 'float'
      indexes :unit_price, type: 'float'
      indexes :description, type: 'text', analyzer: 'jewelry_analyzer'
      indexes :date_created, type: 'date'
      indexes :shipment_date, type: 'date'
      indexes :location_code, type: 'keyword'
      indexes :salesperson_code, type: 'keyword'
      indexes :state, type: 'keyword'
      indexes :first_seen_at, type: 'date'
      indexes :last_seen_at, type: 'date'
      indexes :sold_at, type: 'date'
      indexes :created_at, type: 'date'
      indexes :updated_at, type: 'date'
    end
  end

  attr_accessor :id, :account_id, :serial_number, :item_number, :type, :code,
                :carat_code, :carat_range, :metal_type, :metal_code, :gold_color, :quality,
                :total_carat_weight, :unit_price, :description, :date_created,
                :shipment_date, :location_code, :salesperson_code,
                :state, :first_seen_at, :last_seen_at, :sold_at,
                :created_at, :updated_at, :account

  # State machine
  aasm column: :state do
    state :pending, initial: true
    state :onjobs
    state :instock
    state :sales
    state :deleted

    event :activate_job do
      transitions from: :pending, to: :onjobs
    end

    event :move_to_stock do
      transitions from: [:pending, :onjobs], to: :instock
    end

    event :mark_as_sold do
      transitions from: [:onjobs, :instock], to: :sales, after: :set_sold_date
    end

    event :mark_as_deleted do
      transitions from: [:pending, :onjobs, :instock], to: :deleted
    end

    event :reactivate do
      transitions from: [:sales, :deleted], to: :instock
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

  def on_memo?
    location_code == 'on_memo' || location_code == 'memo'
  end

  def in_house?
    location_code == 'house' || location_code == 'in_house' || location_code.blank?
  end

  def days_on_memo
    return 0 unless on_memo? && shipment_date
    ((Time.current.to_date - shipment_date.to_date).to_i).abs
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
      metal_type: metal_type,
      metal_code: metal_code,
      gold_color: gold_color,
      quality: quality,
      total_carat_weight: total_carat_weight,
      unit_price: unit_price,
      description: description,
      date_created: date_created,
      shipment_date: shipment_date,
      location_code: location_code,
      salesperson_code: salesperson_code,
      state: state,
      first_seen_at: first_seen_at,
      last_seen_at: last_seen_at,
      sold_at: sold_at,
      created_at: created_at,
      updated_at: updated_at
    }
  end

  def self.find(id, account = nil)
    response = client.get(index: index_name, id: id)
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
