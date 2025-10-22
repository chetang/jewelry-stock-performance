class ApplicationController < ActionController::API
  before_action :authenticate_user!
  before_action :set_current_account

  rescue_from Pundit::NotAuthorizedError, with: :user_not_authorized

  private

  def set_current_account
    if current_user.csr?
      # CSR can access any account via account_id param
      @current_account = Account.find_by(id: params[:account_id])
    else
      # Regular users can only access their own account
      @current_account = current_user.account
    end

    render json: { error: 'Account not found' }, status: :not_found unless @current_account
  end

  def current_account
    @current_account
  end

  def user_not_authorized
    render json: { error: 'You are not authorized to perform this action' }, status: :forbidden
  end
end
