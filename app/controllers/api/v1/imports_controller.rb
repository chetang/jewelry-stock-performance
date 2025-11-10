module Api
  module V1
    class ImportsController < ApplicationController
      # POST /api/v1/imports/csv
      def csv
        unless params[:file].present?
          return render json: { error: 'No file provided' }, status: :bad_request
        end

        service = CsvImportService.new(current_account, params[:file])
        result = service.call

        if result[:success]
          render json: {
            message: 'Import completed',
            imported: result[:imported],
            updated: result[:updated],
            errors: result[:errors]
          }, status: :ok
        else
          render json: { errors: result[:errors] }, status: :unprocessable_entity
        end
      end
    end
  end
end
