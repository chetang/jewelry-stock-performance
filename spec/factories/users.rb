FactoryBot.define do
  factory :user do
    email { Faker::Internet.email }
    password { 'password123' }
    password_confirmation { 'password123' }
    first_name { Faker::Name.first_name }
    last_name { Faker::Name.last_name }
    role { 'user' }
    association :account

    trait :admin do
      role { 'admin' }
    end

    trait :csr do
      role { 'csr' }
      account { nil }
    end
  end
end
