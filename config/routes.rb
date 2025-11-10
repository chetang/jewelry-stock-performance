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
      get 'jewelry/filter_options', to: 'jewelry#filter_options'

      # Saved reports
      resources :saved_reports, only: [:index, :create, :update, :destroy] do
        member do
          post :use
        end
      end

      # User preferences
      resource :user_preferences, only: [:show, :update]

      # Imports
      post 'imports/csv', to: 'imports#csv'

      # Exports
      get 'exports/table', to: 'exports#table'
      get 'exports/inventory', to: 'exports#inventory'
      get 'exports/jobs', to: 'exports#jobs'
      get 'exports/sales', to: 'exports#sales'
    end
  end

  # Health check
  get 'health', to: proc { [200, {}, ['OK']] }
end
