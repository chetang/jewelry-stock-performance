# Service to sync inventory from FTP
class FtpSyncService
  attr_reader :account, :ftp_import

  def initialize(account)
    @account = account
    @ftp_import = FtpImport.create!(account: account, status: 'pending')
  end

  def call
    ftp_import.mark_as_processing!

    # Download CSV from FTP
    csv_content = download_from_ftp
    return false unless csv_content

    # Parse and process CSV
    stats = process_csv(csv_content)

    # Detect sold items
    sold_count = SalesDetectionService.new(account).call

    # Update stats
    stats[:sold_items] = sold_count
    ftp_import.mark_as_completed!(stats)

    true
  rescue => e
    Rails.logger.error "FTP Sync failed: #{e.message}\n#{e.backtrace.join("\n")}"
    ftp_import.mark_as_failed!(e)
    false
  end

  private

  def download_from_ftp
    require 'net/sftp'

    csv_content = nil

    Net::SFTP.start(
      account.ftp_host,
      account.ftp_username,
      password: account.ftp_password
    ) do |sftp|
      # Find the latest CSV file
      files = sftp.dir.entries(account.ftp_path).select { |f| f.name.end_with?('.csv') }
      latest_file = files.max_by(&:mtime)

      if latest_file
        ftp_import.update!(filename: latest_file.name)
        csv_content = sftp.download!("#{account.ftp_path}/#{latest_file.name}")
      else
        raise "No CSV files found in FTP directory"
      end
    end

    csv_content
  rescue => e
    Rails.logger.error "FTP download failed: #{e.message}"
    raise
  end

  def process_csv(csv_content)
    require 'csv'

    new_items = 0
    updated_items = 0
    processed_records = 0

    CSV.parse(csv_content, headers: true) do |row|
      processed_records += 1

      jewelry_data = parse_row(row)
      next unless jewelry_data

      # Find existing jewelry by serial number
      existing = find_jewelry_by_serial(jewelry_data[:serial_number])

      if existing
        # Update existing item
        existing.update(jewelry_data.merge(last_seen_at: Time.current))
        existing.activate! if existing.may_activate?
        updated_items += 1
      else
        # Create new item
        jewelry = Jewelry.new(jewelry_data.merge(
          account_id: account.id,
          account: account,
          first_seen_at: Time.current,
          last_seen_at: Time.current,
          state: 'for_sale'
        ))
        jewelry.save
        new_items += 1
      end
    end

    {
      new_items: new_items,
      updated_items: updated_items,
      processed_records: processed_records
    }
  end

  def parse_row(row)
    {
      serial_number: row['Serial No.']&.to_i&.to_s,
      item_number: row['Item No.'],
      type: row['Type'],
      code: row['Code'],
      carat_code: row['Carat Code']&.to_i,
      carat_range: row['Carat Range'],
      gold_color: row['Gold Color'],
      quality: row['Quality'],
      total_carat_weight: row['Total Carat Weight']&.to_f,
      unit_price: parse_price(row['Unit Price($)']),
      description: row['Description'],
      date_created: parse_date(row['Date Created'])
    }
  rescue => e
    Rails.logger.error "Failed to parse row: #{e.message}"
    nil
  end

  def parse_price(price_string)
    return 0.0 unless price_string
    price_string.gsub(/[$,]/, '').to_f
  end

  def parse_date(date_string)
    return nil unless date_string
    Date.strptime(date_string, '%m/%d/%Y')
  rescue
    nil
  end

  def find_jewelry_by_serial(serial_number)
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
        }
      }
    )

    return nil if response['hits']['total']['value'].zero?

    Jewelry.from_elasticsearch(response['hits']['hits'].first['_source'], account)
  rescue => e
    Rails.logger.error "Failed to find jewelry: #{e.message}"
    nil
  end
end
