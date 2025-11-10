# Service for multi-level aggregations using Elasticsearch
class AggregationService
  attr_reader :account, :from_date, :to_date, :ideal_turn, :item_filters

  def initialize(account, from_date: nil, to_date: nil, ideal_turn: 3.0, item_filters: {})
    @account = account
    @from_date = from_date || 1.year.ago
    @to_date = to_date || Time.current
    @ideal_turn = ideal_turn.to_f
    @item_filters = item_filters || {}
  end

  # Level 1: Category (Type) × Carat Range
  def level1_grid
    response = Jewelry.client.search(
      index: account.jewelry_index_name,
      body: {
        size: 0,
        query: item_level_query,
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
        query: item_level_query(type: type, carat_range: carat_range),
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

  # Level 3: Stock, Jobs, and Sales lists for specific filters
  def level3_details(type:, carat_range:, code: nil, quality: nil)
    # Stock (instock items)
    stock_query = item_level_query(
      type: type,
      carat_range: carat_range,
      code: code,
      quality: quality,
      state: 'instock'
    )

    stock_response = Jewelry.client.search(
      index: account.jewelry_index_name,
      body: {
        query: stock_query,
        size: 10000,
        sort: [{ date_created: { order: 'desc' } }]
      }
    )

    # Jobs (onjobs items)
    jobs_query = item_level_query(
      type: type,
      carat_range: carat_range,
      code: code,
      quality: quality,
      state: 'onjobs'
    )

    jobs_response = Jewelry.client.search(
      index: account.jewelry_index_name,
      body: {
        query: jobs_query,
        size: 10000,
        sort: [{ date_created: { order: 'desc' } }]
      }
    )

    # Sales (sales items within date range)
    sales_query = item_level_query(
      type: type,
      carat_range: carat_range,
      code: code,
      quality: quality,
      state: 'sales'
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
      jobs: format_jewelry_list(jobs_response),
      sales: format_jewelry_list(sales_response),
      summary: calculate_summary(stock_response, jobs_response, sales_response)
    }
  end

  # Table view: All data grouped by Type, Carat Range, Code, Quality
  def table_view
    response = Jewelry.client.search(
      index: account.jewelry_index_name,
      body: {
        size: 0,
        query: item_level_query,
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

  def item_level_query(additional_filters = {})
    must_clauses = [{ term: { account_id: account.id } }]

    # Apply item-level filters from constructor
    apply_item_filters(must_clauses)

    # Apply additional filters from method parameters
    must_clauses << { term: { type: additional_filters[:type] } } if additional_filters[:type]
    must_clauses << { term: { carat_range: additional_filters[:carat_range] } } if additional_filters[:carat_range]
    must_clauses << { term: { code: additional_filters[:code] } } if additional_filters[:code]
    must_clauses << { term: { quality: additional_filters[:quality] } } if additional_filters[:quality]
    must_clauses << { term: { state: additional_filters[:state] } } if additional_filters[:state]

    # Date range for sold items
    if additional_filters[:state] == 'sales'
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

  def apply_item_filters(must_clauses)
    # Type filter
    if item_filters[:type].present?
      must_clauses << { terms: { type: Array(item_filters[:type]) } }
    end

    # Carat Range filter
    if item_filters[:carat_range].present?
      must_clauses << { terms: { carat_range: Array(item_filters[:carat_range]) } }
    end

    # Style No / Code filter
    if item_filters[:code].present?
      must_clauses << { terms: { code: Array(item_filters[:code]) } }
    end

    # Quality filter
    if item_filters[:quality].present?
      must_clauses << { terms: { quality: Array(item_filters[:quality]) } }
    end

    # Memo Status filter (location_code)
    if item_filters[:memo_status].present?
      location_values = []
      location_values += ['house', 'in_house', nil] if item_filters[:memo_status].include?('In-House')
      location_values += ['on_memo', 'memo'] if item_filters[:memo_status].include?('On-Memo')
      
      if location_values.present?
        should_clauses = location_values.compact.map { |val| { term: { location_code: val } } }
        # Also handle nil/missing location_code for In-House
        should_clauses << { bool: { must_not: { exists: { field: 'location_code' } } } } if item_filters[:memo_status].include?('In-House')
        must_clauses << { bool: { should: should_clauses, minimum_should_match: 1 } }
      end
    end

    # Days on Memo filter
    if item_filters[:days_on_memo_min].present? || item_filters[:days_on_memo_max].present?
      # Calculate date range based on days
      range_filter = {}
      
      if item_filters[:days_on_memo_max].present?
        max_days = item_filters[:days_on_memo_max].to_i
        range_filter[:gte] = (Time.current - max_days.days).to_date
      end
      
      if item_filters[:days_on_memo_min].present?
        min_days = item_filters[:days_on_memo_min].to_i
        range_filter[:lte] = (Time.current - min_days.days).to_date
      end

      must_clauses << { range: { shipment_date: range_filter } } if range_filter.present?
    end
  end

  def metrics_aggregations
    {
      inventory_count: {
        filter: { term: { state: 'instock' } },
        aggs: {
          count: { value_count: { field: 'id' } },
          total_value: { sum: { field: 'unit_price' } },
          avg_aging: {
            avg: {
              script: {
                source: "(new Date().getTime() - doc['date_created'].value.toInstant().toEpochMilli()) / (1000 * 60 * 60 * 24)"
              }
            }
          },
          in_house_count: {
            filter: {
              bool: {
                should: [
                  { term: { location_code: 'house' } },
                  { term: { location_code: 'in_house' } },
                  { bool: { must_not: { exists: { field: 'location_code' } } } }
                ],
                minimum_should_match: 1
              }
            }
          },
          on_memo_count: {
            filter: {
              bool: {
                should: [
                  { term: { location_code: 'on_memo' } },
                  { term: { location_code: 'memo' } }
                ],
                minimum_should_match: 1
              }
            },
            aggs: {
              avg_days_on_memo: {
                avg: {
                  script: {
                    source: "if (doc.containsKey('shipment_date') && doc['shipment_date'].size() > 0) { (new Date().getTime() - doc['shipment_date'].value.toInstant().toEpochMilli()) / (1000 * 60 * 60 * 24) } else { 0 }"
                  }
                }
              }
            }
          }
        }
      },
      jobs_count: {
        filter: { term: { state: 'onjobs' } },
        aggs: {
          count: { value_count: { field: 'id' } },
          total_value: { sum: { field: 'unit_price' } }
        }
      },
      sales_count: {
        filter: {
          bool: {
            must: [
              { term: { state: 'sales' } },
              { range: { sold_at: { gte: from_date, lte: to_date } } }
            ]
          }
        },
        aggs: {
          count: { value_count: { field: 'id' } },
          total_value: { sum: { field: 'unit_price' } },
          avg_aging: {
            avg: {
              script: {
                source: "if (doc.containsKey('sold_at') && doc.containsKey('date_created')) { (doc['sold_at'].value.toInstant().toEpochMilli() - doc['date_created'].value.toInstant().toEpochMilli()) / (1000 * 60 * 60 * 24) } else { 0 }"
              }
            }
          }
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
    jobs = bucket['jobs_count']
    sales = bucket['sales_count']

    inventory_count = inv['count']['value'].to_i
    inventory_value = inv['total_value']['value'].to_f
    inv_avg_aging = inv['avg_aging']['value'].to_f
    
    # Memo status metrics
    in_house_count = inv['in_house_count']['doc_count'].to_i
    on_memo_count = inv['on_memo_count']['doc_count'].to_i
    avg_days_on_memo = inv['on_memo_count']['avg_days_on_memo']['value'].to_f

    jobs_count = jobs['count']['value'].to_i
    jobs_value = jobs['total_value']['value'].to_f

    sales_count = sales['count']['value'].to_i
    sales_value = sales['total_value']['value'].to_f
    sales_avg_aging = sales['avg_aging']['value'].to_f

    # Calculate turn
    turn = if inventory_count > 0
             sales_count.to_f / inventory_count * (365.0 / days_in_period)
           else
             0.0
           end

    # Calculate needs/surplus: Needs = (ideal_turn × inventory_count) - sales_count - jobs_count
    ideal_inventory = turn > 0 ? (sales_count / turn * ideal_turn).round : (inventory_count * ideal_turn).round
    needs_surplus = ideal_inventory - inventory_count - jobs_count

    {
      inventory_count: inventory_count,
      inventory_value: inventory_value.round(2),
      inv_avg_aging: inv_avg_aging.round(0),
      in_house_count: in_house_count,
      on_memo_count: on_memo_count,
      avg_days_on_memo: avg_days_on_memo.round(1),
      jobs_count: jobs_count,
      jobs_value: jobs_value.round(2),
      sales_count: sales_count,
      sales_value: sales_value.round(2),
      sales_avg_aging: sales_avg_aging.round(0),
      turn: turn.round(2),
      needs_surplus: needs_surplus.round(0)
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
        metal_type: source['metal_type'],
        metal_code: source['metal_code'],
        total_carat_weight: source['total_carat_weight'],
        unit_price: source['unit_price'],
        description: source['description'],
        date_created: source['date_created'],
        shipment_date: source['shipment_date'],
        location_code: source['location_code'],
        salesperson_code: source['salesperson_code'],
        state: source['state'],
        sold_at: source['sold_at']
      }
    end
  end

  def calculate_summary(stock_response, jobs_response, sales_response)
    stock_items = format_jewelry_list(stock_response)
    jobs_items = format_jewelry_list(jobs_response)
    sales_items = format_jewelry_list(sales_response)

    {
      inventory_count: stock_items.count,
      inventory_value: stock_items.sum { |i| i[:unit_price] || 0 }.round(2),
      jobs_count: jobs_items.count,
      jobs_value: jobs_items.sum { |i| i[:unit_price] || 0 }.round(2),
      sales_count: sales_items.count,
      sales_value: sales_items.sum { |i| i[:unit_price] || 0 }.round(2)
    }
  end

  def days_in_period
    ((to_date - from_date) / 1.day).to_i
  end
end
