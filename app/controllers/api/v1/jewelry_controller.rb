module Api
  module V1
    class JewelryController < ApplicationController
      # GET /api/v1/jewelry/level1
      # Returns Level 1 grid: Type × Carat Range
      def level1
        service = AggregationService.new(
          current_account,
          from_date: parse_date(params[:from_date]),
          to_date: parse_date(params[:to_date]),
          ideal_turn: params[:ideal_turn] || 3.0
        )

        data = service.level1_grid

        render json: { data: data }, status: :ok
      end

      # GET /api/v1/jewelry/level2
      # Returns Level 2 grid: Code × Quality for specific Type and Carat Range
      def level2
        unless params[:type] && params[:carat_range]
          return render json: { error: 'type and carat_range are required' }, status: :bad_request
        end

        service = AggregationService.new(
          current_account,
          from_date: parse_date(params[:from_date]),
          to_date: parse_date(params[:to_date]),
          ideal_turn: params[:ideal_turn] || 3.0
        )

        data = service.level2_grid(
          type: params[:type],
          carat_range: params[:carat_range]
        )

        render json: { data: data }, status: :ok
      end

      # GET /api/v1/jewelry/level3
      # Returns Level 3: Stock and Sales lists with summary
      def level3
        unless params[:type] && params[:carat_range]
          return render json: { error: 'type and carat_range are required' }, status: :bad_request
        end

        service = AggregationService.new(
          current_account,
          from_date: parse_date(params[:from_date]),
          to_date: parse_date(params[:to_date]),
          ideal_turn: params[:ideal_turn] || 3.0
        )

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
        service = AggregationService.new(
          current_account,
          from_date: parse_date(params[:from_date]),
          to_date: parse_date(params[:to_date]),
          ideal_turn: params[:ideal_turn] || 3.0
        )

        data = service.table_view

        render json: { data: data }, status: :ok
      end

      private

      def parse_date(date_string)
        return nil unless date_string
        Date.parse(date_string)
      rescue ArgumentError
        nil
      end
    end
  end
end
