# Service to detect sold items (items that disappeared from FTP)
class SalesDetectionService
  attr_reader :account

  def initialize(account)
    @account = account
  end

  def call
    # Find all items that haven't been seen in the last sync
    # (last_seen_at is older than 2 hours, assuming hourly sync)
    cutoff_time = 2.hours.ago

    response = Jewelry.client.search(
      index: account.jewelry_index_name,
      body: {
        query: {
          bool: {
            must: [
              { term: { account_id: account.id } },
              { term: { state: 'for_sale' } },
              { range: { last_seen_at: { lt: cutoff_time } } }
            ]
          }
        },
        size: 10000 # Adjust based on expected volume
      }
    )

    sold_count = 0

    response['hits']['hits'].each do |hit|
      jewelry = Jewelry.from_elasticsearch(hit['_source'], account)
      if jewelry.may_mark_as_sold?
        jewelry.mark_as_sold!
        jewelry.save
        sold_count += 1
      end
    end

    Rails.logger.info "Marked #{sold_count} items as sold for account #{account.name}"
    sold_count
  rescue => e
    Rails.logger.error "Sales detection failed: #{e.message}"
    0
  end
end
