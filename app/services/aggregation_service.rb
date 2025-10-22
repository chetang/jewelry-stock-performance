# Service for multi-level aggregations using Elasticsearch
class AggregationService
  attr_reader :account, :from_date, :to_date, :ideal_turn

  def initialize(account, from_date: nil, to_date: nil, ideal_turn: 3.0)
    @account = account
    @from_date = from_date || 1.year.ago
    @to_date = to_date || Time.current
    @ideal_turn = ideal_turn.to_f
  end

  # Level 1: Category (Type) × Carat Range
  def level1_grid
    response = Jewelry.client.search(
      index: account.jewelry_index_name,
      body: {
        size: 0,
        query: base_query,
        aggs: {
          by_type: {
            terms: { field: 'type', size: 100 },
            aggs: {
              by_carat_range: {
                terms: { field: 'carat_range', size: 100 },
                aggs: metrics_aggregations
              }
            }
          }
        }
      }
    )

    format_level1_response(response)
  end

  # Level 2: Sub-Category (Code) × Quality for specific Type and Carat Range
  def level2_grid(type:, carat_range:)
    response = Jewelry.client.search(
      index: account.jewelry_index_name,
      body: {
        size: 0,
        query: filtered_query(type: type, carat_range: carat_range),
        aggs: {
          by_code: {
            terms: { field: 'code', size: 100 },
            aggs: {
              by_quality: {
                terms: { field: 'quality', size: 100 },
                aggs: metrics_aggregations
              }
            }
          }
        }
      }
    )

    format_level2_response(response)
  end

  # Level 3: Stock and Sales lists for specific filters
  def level3_details(type:, carat_range:, code: nil, quality: nil)
    # Stock (for_sale items)
    stock_query = filtered_query(
      type: type,
      carat_range: carat_range,
      code: code,
      quality: quality,
      state: 'for_sale'
    )

    stock_response = Jewelry.client.search(
      index: account.jewelry_index_name,
      body: {
        query: stock_query,
        size: 10000,
        sort: [{ date_created: { order: 'desc' } }]
      }
    )

    # Sales (sold items within date range)
    sales_query = filtered_query(
      type: type,
      carat_range: carat_range,
      code: code,
      quality: quality,
      state: 'sold'
    )

    sales_response = Jewelry.client.search(
      index: account.jewelry_index_name,
      body: {
        query: sales_query,
        size: 10000,
        sort: [{ sold_at: { order: 'desc' } }]
      }
    )

    {
      stock: format_jewelry_list(stock_response),
      sales: format_jewelry_list(sales_response),
      summary: calculate_summary(stock_response, sales_response)
    }
  end

  # Table view: All data grouped by Type, Carat Range, Code, Quality
  def table_view
    response = Jewelry.client.search(
      index: account.jewelry_index_name,
      body: {
        size: 0,
        query: base_query,
        aggs: {
          by_type: {
            terms: { field: 'type', size: 100 },
            aggs: {
              by_carat_range: {
                terms: { field: 'carat_range', size: 100 },
                aggs: {
                  by_code: {
                    terms: { field: 'code', size: 100 },
                    aggs: {
                      by_quality: {
                        terms: { field: 'quality', size: 100 },
                        aggs: metrics_aggregations
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    )

    format_table_response(response)
  end

  private

  def base_query
    {
      bool: {
        must: [
          { term: { account_id: account.id } }
        ]
      }
    }
  end

  def filtered_query(filters = {})
    must_clauses = [{ term: { account_id: account.id } }]

    must_clauses << { term: { type: filters[:type] } } if filters[:type]
    must_clauses << { term: { carat_range: filters[:carat_range] } } if filters[:carat_range]
    must_clauses << { term: { code: filters[:code] } } if filters[:code]
    must_clauses << { term: { quality: filters[:quality] } } if filters[:quality]
    must_clauses << { term: { state: filters[:state] } } if filters[:state]

    # Date range for sold items
    if filters[:state] == 'sold'
      must_clauses << {
        range: {
          sold_at: {
            gte: from_date,
            lte: to_date
          }
        }
      }
    end

    { bool: { must: must_clauses } }
  end

  def metrics_aggregations
    {
      inventory_count: {
        filter: { term: { state: 'for_sale' } },
        aggs: {
          count: { value_count: { field: 'id' } },
          total_value: { sum: { field: 'unit_price' } },
          avg_aging: {
            avg: {
              script: {
                source: "(new Date().getTime() - doc['date_created'].value.toInstant().toEpochMilli()) / (1000 * 60 * 60 * 24)"
              }
            }
          }
        }
      },
      sales_count: {
        filter: {
          bool: {
            must: [
              { term: { state: 'sold' } },
              { range: { sold_at: { gte: from_date, lte: to_date } } }
            ]
          }
        },
        aggs: {
          count: { value_count: { field: 'id' } },
          total_value: { sum: { field: 'unit_price' } }
        }
      }
    }
  end

  def format_level1_response(response)
    data = []

    response['aggregations']['by_type']['buckets'].each do |type_bucket|
      type_bucket['by_carat_range']['buckets'].each do |carat_bucket|
        metrics = extract_metrics(carat_bucket)
        data << {
          type: type_bucket['key'],
          carat_range: carat_bucket['key'],
          **metrics
        }
      end
    end

    data
  end

  def format_level2_response(response)
    data = []

    response['aggregations']['by_code']['buckets'].each do |code_bucket|
      code_bucket['by_quality']['buckets'].each do |quality_bucket|
        metrics = extract_metrics(quality_bucket)
        data << {
          code: code_bucket['key'],
          quality: quality_bucket['key'],
          **metrics
        }
      end
    end

    data
  end

  def format_table_response(response)
    data = []

    response['aggregations']['by_type']['buckets'].each do |type_bucket|
      type_bucket['by_carat_range']['buckets'].each do |carat_bucket|
        carat_bucket['by_code']['buckets'].each do |code_bucket|
          code_bucket['by_quality']['buckets'].each do |quality_bucket|
            metrics = extract_metrics(quality_bucket)
            data << {
              type: type_bucket['key'],
              carat_range: carat_bucket['key'],
              code: code_bucket['key'],
              quality: quality_bucket['key'],
              **metrics
            }
          end
        end
      end
    end

    data
  end

  def extract_metrics(bucket)
    inv = bucket['inventory_count']
    sales = bucket['sales_count']

    inventory_count = inv['count']['value'].to_i
    inventory_value = inv['total_value']['value'].to_f
    avg_aging = inv['avg_aging']['value'].to_f

    sales_count = sales['count']['value'].to_i
    sales_value = sales['total_value']['value'].to_f

    # Calculate turn
    turn = if inventory_value > 0
             (sales_value / inventory_value) * (365.0 / days_in_period)
           else
             0.0
           end

    # Calculate overhang (days of inventory)
    overhang = turn > 0 ? (365.0 / turn) : 0.0

    # Calculate needs/surplus
    needs_surplus = (ideal_turn * inventory_value) - sales_value

    {
      inventory_count: inventory_count,
      inventory_value: inventory_value.round(2),
      sales_count: sales_count,
      sales_value: sales_value.round(2),
      avg_aging: avg_aging.round(0),
      turn: turn.round(2),
      overhang: overhang.round(0),
      needs_surplus: needs_surplus.round(2)
    }
  end

  def format_jewelry_list(response)
    response['hits']['hits'].map do |hit|
      source = hit['_source']
      {
        id: source['id'],
        serial_number: source['serial_number'],
        item_number: source['item_number'],
        type: source['type'],
        code: source['code'],
        carat_range: source['carat_range'],
        quality: source['quality'],
        total_carat_weight: source['total_carat_weight'],
        unit_price: source['unit_price'],
        description: source['description'],
        date_created: source['date_created'],
        state: source['state'],
        sold_at: source['sold_at']
      }
    end
  end

  def calculate_summary(stock_response, sales_response)
    stock_items = format_jewelry_list(stock_response)
    sales_items = format_jewelry_list(sales_response)

    {
      inventory_count: stock_items.count,
      inventory_value: stock_items.sum { |i| i[:unit_price] }.round(2),
      sales_count: sales_items.count,
      sales_value: sales_items.sum { |i| i[:unit_price] }.round(2)
    }
  end

  def days_in_period
    ((to_date - from_date) / 1.day).to_i
  end
end
