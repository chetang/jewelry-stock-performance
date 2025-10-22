FactoryBot.define do
  factory :account do
    name { Faker::Company.name }
    subdomain { Faker::Internet.domain_word }
    active { true }
    ftp_host { 'ftp.example.com' }
    ftp_username { 'testuser' }
    ftp_password { 'testpass' }
    ftp_path { '/inventory' }
  end
end
