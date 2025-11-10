module Api
  module V1
    class SavedReportsController < ApplicationController
      # GET /api/v1/saved_reports
      def index
        reports = current_user.saved_reports.for_user(current_user).recent
        
        render json: {
          data: reports.map { |r| report_json(r) }
        }, status: :ok
      end

      # POST /api/v1/saved_reports
      def create
        report = current_user.saved_reports.build(report_params)
        report.account = current_account

        if report.save
          render json: { data: report_json(report) }, status: :created
        else
          render json: { errors: report.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # PUT /api/v1/saved_reports/:id
      def update
        report = current_user.saved_reports.find(params[:id])
        
        if report.update(report_params)
          render json: { data: report_json(report) }, status: :ok
        else
          render json: { errors: report.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/saved_reports/:id
      def destroy
        report = current_user.saved_reports.find(params[:id])
        report.destroy
        
        render json: { message: 'Report deleted successfully' }, status: :ok
      end

      # POST /api/v1/saved_reports/:id/use
      def use
        report = current_user.saved_reports.find(params[:id])
        report.touch_last_used!
        
        render json: { data: report_json(report) }, status: :ok
      end

      private

      def report_params
        params.require(:saved_report).permit(
          :name,
          :email_enabled,
          email_recipients: [],
          filters: {}
        )
      end

      def report_json(report)
        {
          id: report.id,
          name: report.name,
          filters: report.filters,
          email_enabled: report.email_enabled,
          email_recipients: report.email_recipients,
          last_used_at: report.last_used_at,
          created_at: report.created_at,
          updated_at: report.updated_at
        }
      end
    end
  end
end
