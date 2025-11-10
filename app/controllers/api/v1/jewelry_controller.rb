module Api
  module V1
    class JewelryController < ApplicationController
      # GET /api/v1/jewelry/level1
      # Returns Level 1 grid: Type × Carat Range
      def level1
        service = aggregation_service

        data = service.level1_grid

        render json: { data: data }, status: :ok
      end

      # GET /api/v1/jewelry/level2
      # Returns Level 2 grid: Code × Quality for specific Type and Carat Range
      def level2
        unless params[:type] && params[:carat_range]
          return render json: { error: 'type and carat_range are required' }, status: :bad_request
        end

        service = aggregation_service

        data = service.level2_grid(
          type: params[:type],
          carat_range: params[:carat_range]
        )

        render json: { data: data }, status: :ok
      end

      # GET /api/v1/jewelry/level3
      # Returns Level 3: Stock, Jobs, and Sales lists with summary
      def level3
        unless params[:type] && params[:carat_range]
          return render json: { error: 'type and carat_range are required' }, status: :bad_request
        end

        service = aggregation_service

        data = service.level3_details(
          type: params[:type],
          carat_range: params[:carat_range],
          code: params[:code],
          quality: params[:quality]
        )

        render json: data, status: :ok
      end

      # GET /api/v1/jewelry/table
      # Returns table view: All data grouped by Type, Carat Range, Code, Quality
      def table
        service = aggregation_service

        data = service.table_view

        render json: { data: data }, status: :ok
      end

      # GET /api/v1/jewelry/filter_options
      def filter_options
        response = Jewelry.client.search(
          index: current_account.jewelry_index_name,
          body: {
            size: 0,
            query: { term: { account_id: current_account.id } },
            aggs: {
              types: { terms: { field: 'type', size: 100 } },
              carat_ranges: { terms: { field: 'carat_range', size: 100 } },
              codes: { terms: { field: 'code', size: 100 } },
              qualities: { terms: { field: 'quality', size: 100 } }
            }
          }
        )

        render json: {
          types: response['aggregations']['types']['buckets'].map { |b| b['key'] }.sort,
          carat_ranges: response['aggregations']['carat_ranges']['buckets'].map { |b| b['key'] }.sort,
          codes: response['aggregations']['codes']['buckets'].map { |b| b['key'] }.sort,
          qualities: response['aggregations']['qualities']['buckets'].map { |b| b['key'] }.sort
        }, status: :ok
      end

      private

      def aggregation_service
        AggregationService.new(
          current_account,
          from_date: parse_date(params[:from_date]),
          to_date: parse_date(params[:to_date]),
          ideal_turn: params[:ideal_turn] || current_user.preference.ideal_turn,
          item_filters: parse_item_filters
        )
      end

      def parse_item_filters
        {
          type: params[:filter_type],
          carat_range: params[:filter_carat_range],
          code: params[:filter_code],
          quality: params[:filter_quality],
          memo_status: params[:filter_memo_status],
          days_on_memo_min: params[:filter_days_on_memo_min],
          days_on_memo_max: params[:filter_days_on_memo_max]
        }.compact
      end

      def parse_date(date_string)
        return nil unless date_string
        Date.parse(date_string)
      rescue ArgumentError
        nil
      end
    end
  end
end
