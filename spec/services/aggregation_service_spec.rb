require 'rails_helper'

RSpec.describe AggregationService do
  let(:account) { create(:account) }
  let(:service) { described_class.new(account, ideal_turn: 3.0) }

  describe '#level1_grid' do
    it 'returns aggregated data by type and carat range' do
      # Mock Elasticsearch response
      allow(Jewelry.client).to receive(:search).and_return({
        'aggregations' => {
          'by_type' => {
            'buckets' => [
              {
                'key' => 'Rings',
                'by_carat_range' => {
                  'buckets' => [
                    {
                      'key' => '1.00-1.19',
                      'inventory_count' => {
                        'count' => { 'value' => 10 },
                        'total_value' => { 'value' => 50000 },
                        'avg_aging' => { 'value' => 120 }
                      },
                      'sales_count' => {
                        'count' => { 'value' => 5 },
                        'total_value' => { 'value' => 25000 }
                      }
                    }
                  ]
                }
              }
            ]
          }
        }
      })

      result = service.level1_grid

      expect(result).to be_an(Array)
      expect(result.first).to include(
        type: 'Rings',
        carat_range: '1.00-1.19',
        inventory_count: 10,
        sales_count: 5
      )
    end
  end
end
