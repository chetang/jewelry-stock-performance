module Api
  module V1
    class AuthController < ApplicationController
      skip_before_action :authenticate_user!, only: [:login, :signup]
      skip_before_action :set_current_account, only: [:login, :signup]

      # POST /api/v1/auth/login
      def login
        user = User.find_by(email: params[:email])

        if user&.valid_password?(params[:password])
          token = generate_jwt(user)
          render json: {
            user: user_json(user),
            token: token
          }, status: :ok
        else
          render json: { error: 'Invalid email or password' }, status: :unauthorized
        end
      end

      # POST /api/v1/auth/signup
      def signup
        user = User.new(user_params)

        if user.save
          token = generate_jwt(user)
          render json: {
            user: user_json(user),
            token: token
          }, status: :created
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      # DELETE /api/v1/auth/logout
      def logout
        # JWT is added to denylist by devise-jwt automatically
        render json: { message: 'Logged out successfully' }, status: :ok
      end

      # GET /api/v1/auth/me
      def me
        render json: { user: user_json(current_user) }, status: :ok
      end

      private

      def user_params
        params.require(:user).permit(:email, :password, :password_confirmation, :first_name, :last_name, :account_id)
      end

      def generate_jwt(user)
        JWT.encode(
          {
            sub: user.id,
            exp: 24.hours.from_now.to_i
          },
          Rails.application.credentials.secret_key_base
        )
      end

      def user_json(user)
        {
          id: user.id,
          email: user.email,
          first_name: user.first_name,
          last_name: user.last_name,
          full_name: user.full_name,
          role: user.role,
          account_id: user.account_id
        }
      end
    end
  end
end
