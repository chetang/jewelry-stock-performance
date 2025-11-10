require 'csv'

class CsvExportService
  attr_reader :data, :type

  HEADERS = {
    table: ['Type', 'Carat Range', 'Code', 'Quality', 'Inventory Count', 'Inventory Value', 
            'In-House Count', 'On-Memo Count', 'Avg Days On Memo', 'Jobs Count', 'Jobs Value',
            'Sales Count', 'Sales Value', 'Turn', 'Needs/Surplus'],
    inventory: ['Serial No.', 'Item No.', 'Type', 'Code', 'Carat Range', 'Quality', 
                'Metal Type', 'Metal Code', 'Total Carat Weight', 'Unit Price', 
                'Date Created', 'Shipment Date', 'Location Code', 'Salesperson Code', 'Description'],
    jobs: ['Serial No.', 'Item No.', 'Type', 'Code', 'Carat Range', 'Quality', 
           'Metal Type', 'Metal Code', 'Total Carat Weight', 'Unit Price', 
           'Date Created', 'Description'],
    sales: ['Serial No.', 'Item No.', 'Type', 'Code', 'Carat Range', 'Quality', 
            'Metal Type', 'Metal Code', 'Total Carat Weight', 'Unit Price', 
            'Date Created', 'Sold At', 'Days to Sale', 'Description']
  }

  def initialize(data, type)
    @data = data
    @type = type.to_sym
  end

  def generate
    CSV.generate do |csv|
      csv << HEADERS[type]
      
      case type
      when :table
        data.each do |row|
          csv << format_table_row(row)
        end
      when :inventory, :jobs, :sales
        data.each do |item|
          csv << format_item_row(item)
        end
      end
    end
  end

  private

  def format_table_row(row)
    [
      row[:type],
      row[:carat_range],
      row[:code],
      row[:quality],
      row[:inventory_count],
      row[:inventory_value],
      row[:in_house_count],
      row[:on_memo_count],
      row[:avg_days_on_memo],
      row[:jobs_count],
      row[:jobs_value],
      row[:sales_count],
      row[:sales_value],
      row[:turn],
      row[:needs_surplus]
    ]
  end

  def format_item_row(item)
    base = [
      item[:serial_number],
      item[:item_number],
      item[:type],
      item[:code],
      item[:carat_range],
      item[:quality],
      item[:metal_type],
      item[:metal_code],
      item[:total_carat_weight],
      item[:unit_price],
      format_date(item[:date_created])
    ]

    case type
    when :inventory
      base + [
        format_date(item[:shipment_date]),
        item[:location_code],
        item[:salesperson_code],
        item[:description]
      ]
    when :jobs
      base + [item[:description]]
    when :sales
      base + [
        format_date(item[:sold_at]),
        calculate_days_to_sale(item),
        item[:description]
      ]
    end
  end

  def format_date(date)
    return '' unless date
    Date.parse(date.to_s).strftime('%m/%d/%Y')
  rescue
    ''
  end

  def calculate_days_to_sale(item)
    return '' unless item[:sold_at] && item[:date_created]
    
    sold = Date.parse(item[:sold_at].to_s)
    created = Date.parse(item[:date_created].to_s)
    (sold - created).to_i
  rescue
    ''
  end
end
