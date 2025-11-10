# == Schema Information
#
# Table name: accounts
#
#  id         :bigint           not null, primary key
#  name       :string           not null
#  subdomain  :string           not null
#  active     :boolean          default(TRUE)
#  ftp_host   :string
#  ftp_username :string
#  ftp_password_encrypted :string
#  ftp_path   :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#
class Account < ApplicationRecord
  has_many :users, dependent: :destroy
  has_many :ftp_imports, dependent: :destroy
  has_many :saved_reports, dependent: :destroy

  validates :name, presence: true
  validates :subdomain, presence: true, uniqueness: true, 
            format: { with: /\A[a-z0-9\-]+\z/, message: "only lowercase letters, numbers, and hyphens" }

  # Encrypt FTP password
  attr_encrypted :ftp_password, key: ENV.fetch('ENCRYPTION_KEY', Rails.application.credentials.secret_key_base)

  def jewelry_index_name
    "jewelry_#{subdomain}_#{Rails.env}"
  end
end
