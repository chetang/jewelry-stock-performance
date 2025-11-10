require 'csv'

class CsvImportService
  attr_reader :account, :file, :errors

  def initialize(account, file)
    @account = account
    @file = file
    @errors = []
  end

  def call
    return false unless valid_file?

    imported_count = 0
    updated_count = 0
    current_time = Time.current

    CSV.foreach(file.path, headers: true, header_converters: :symbol) do |row|
      begin
        jewelry_data = parse_row(row)
        next unless jewelry_data

        # Find existing by serial_number or create new
        existing = find_existing_jewelry(jewelry_data[:serial_number])

        if existing
          existing.update(jewelry_data.merge(last_seen_at: current_time))
          updated_count += 1
        else
          jewelry = Jewelry.new(jewelry_data.merge(
            account_id: account.id,
            account: account,
            first_seen_at: current_time,
            last_seen_at: current_time,
            state: determine_initial_state(jewelry_data)
          ))
          jewelry.save
          imported_count += 1
        end
      rescue => e
        @errors << "Row #{row.to_h}: #{e.message}"
      end
    end

    {
      success: true,
      imported: imported_count,
      updated: updated_count,
      errors: @errors
    }
  rescue => e
    @errors << e.message
    { success: false, errors: @errors }
  end

  private

  def valid_file?
    unless file.present?
      @errors << "No file provided"
      return false
    end

    unless ['.csv', '.CSV'].include?(File.extname(file.original_filename))
      @errors << "File must be a CSV"
      return false
    end

    true
  end

  def parse_row(row)
    # Map CSV columns to jewelry attributes
    {
      serial_number: row[:serial_no] || row[:stock_no] || row[:job_no],
      item_number: row[:item_no],
      type: row[:type],
      code: row[:code] || row[:style_no],
      carat_range: row[:carat_range],
      quality: row[:quality],
      metal_type: row[:metal_type],
      metal_code: row[:metal_code],
      total_carat_weight: parse_float(row[:total_carat_weight]),
      unit_price: parse_float(row[:unit_price] || row[:price]),
      date_created: parse_date(row[:date_created]),
      shipment_date: parse_date(row[:shipment_date]),
      location_code: normalize_location(row[:location_code]),
      salesperson_code: row[:salesperson_code],
      description: row[:description]
    }
  end

  def determine_initial_state(data)
    # Status column determines if item is on job or in stock
    # If not specified, default to instock
    status = data[:status]&.to_s&.downcase
    
    if status&.include?('job')
      'onjobs'
    else
      'instock'
    end
  end

  def normalize_location(location)
    return nil unless location
    
    loc = location.to_s.downcase.strip
    
    if loc.include?('memo')
      'on_memo'
    elsif loc.include?('house')
      'house'
    else
      loc
    end
  end

  def parse_float(value)
    return nil unless value
    value.to_s.gsub(/[^\d.]/, '').to_f
  end

  def parse_date(value)
    return nil unless value
    Date.parse(value.to_s)
  rescue ArgumentError
    nil
  end

  def find_existing_jewelry(serial_number)
    return nil unless serial_number

    response = Jewelry.client.search(
      index: account.jewelry_index_name,
      body: {
        query: {
          bool: {
            must: [
              { term: { account_id: account.id } },
              { term: { serial_number: serial_number } }
            ]
          }
        },
        size: 1
      }
    )

    if response['hits']['hits'].any?
      Jewelry.from_elasticsearch(response['hits']['hits'].first['_source'], account)
    else
      nil
    end
  rescue => e
    Rails.logger.error "Error finding jewelry: #{e.message}"
    nil
  end
end
