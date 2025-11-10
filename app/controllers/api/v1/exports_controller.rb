module Api
  module V1
    class ExportsController < ApplicationController
      # GET /api/v1/exports/table
      def table
        service = aggregation_service
        data = service.table_view

        csv_data = CsvExportService.new(data, :table).generate

        send_data csv_data,
                  filename: "jewelry_table_#{Date.current.strftime('%Y%m%d')}.csv",
                  type: 'text/csv'
      end

      # GET /api/v1/exports/inventory
      def inventory
        unless params[:type] && params[:carat_range]
          return render json: { error: 'type and carat_range are required' }, status: :bad_request
        end

        service = aggregation_service
        details = service.level3_details(
          type: params[:type],
          carat_range: params[:carat_range],
          code: params[:code],
          quality: params[:quality]
        )

        csv_data = CsvExportService.new(details[:stock], :inventory).generate

        send_data csv_data,
                  filename: "inventory_#{params[:type]}_#{params[:carat_range]}_#{Date.current.strftime('%Y%m%d')}.csv",
                  type: 'text/csv'
      end

      # GET /api/v1/exports/jobs
      def jobs
        unless params[:type] && params[:carat_range]
          return render json: { error: 'type and carat_range are required' }, status: :bad_request
        end

        service = aggregation_service
        details = service.level3_details(
          type: params[:type],
          carat_range: params[:carat_range],
          code: params[:code],
          quality: params[:quality]
        )

        csv_data = CsvExportService.new(details[:jobs], :jobs).generate

        send_data csv_data,
                  filename: "jobs_#{params[:type]}_#{params[:carat_range]}_#{Date.current.strftime('%Y%m%d')}.csv",
                  type: 'text/csv'
      end

      # GET /api/v1/exports/sales
      def sales
        unless params[:type] && params[:carat_range]
          return render json: { error: 'type and carat_range are required' }, status: :bad_request
        end

        service = aggregation_service
        details = service.level3_details(
          type: params[:type],
          carat_range: params[:carat_range],
          code: params[:code],
          quality: params[:quality]
        )

        csv_data = CsvExportService.new(details[:sales], :sales).generate

        send_data csv_data,
                  filename: "sales_#{params[:type]}_#{params[:carat_range]}_#{Date.current.strftime('%Y%m%d')}.csv",
                  type: 'text/csv'
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
