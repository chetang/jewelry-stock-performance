module Api
  module V1
    class UserPreferencesController < ApplicationController
      # GET /api/v1/user_preferences
      def show
        preference = current_user.preference
        
        render json: { data: preference_json(preference) }, status: :ok
      end

      # PUT /api/v1/user_preferences
      def update
        preference = current_user.preference
        
        if preference.update(preference_params)
          render json: { data: preference_json(preference) }, status: :ok
        else
          render json: { errors: preference.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def preference_params
        params.require(:user_preference).permit(:ideal_turn, :from_date, :to_date)
      end

      def preference_json(preference)
        {
          id: preference.id,
          ideal_turn: preference.ideal_turn,
          from_date: preference.from_date,
          to_date: preference.to_date,
          created_at: preference.created_at,
          updated_at: preference.updated_at
        }
      end
    end
  end
end
