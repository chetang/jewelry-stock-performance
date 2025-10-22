Rails.application.routes.draw do
  devise_for :users, skip: [:sessions, :registrations]

  namespace :api do
    namespace :v1 do
      # Authentication
      post 'auth/login', to: 'auth#login'
      post 'auth/signup', to: 'auth#signup'
      delete 'auth/logout', to: 'auth#logout'
      get 'auth/me', to: 'auth#me'

      # Jewelry APIs
      get 'jewelry/level1', to: 'jewelry#level1'
      get 'jewelry/level2', to: 'jewelry#level2'
      get 'jewelry/level3', to: 'jewelry#level3'
      get 'jewelry/table', to: 'jewelry#table'
    end
  end

  # Health check
  get 'health', to: proc { [200, {}, ['OK']] }
end
