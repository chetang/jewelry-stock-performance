# == Schema Information
#
# Table name: users
#
#  id                     :bigint           not null, primary key
#  email                  :string           not null
#  encrypted_password     :string           not null
#  first_name             :string
#  last_name              :string
#  role                   :string           default("user")
#  account_id             :bigint
#  reset_password_token   :string
#  reset_password_sent_at :datetime
#  remember_created_at    :datetime
#  created_at             :datetime         not null
#  updated_at             :datetime         not null
#
class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: JwtDenylist

  belongs_to :account, optional: true # CSR users don't belong to specific account
  has_many :saved_reports, dependent: :destroy
  has_one :user_preference, dependent: :destroy

  ROLES = %w[user admin csr].freeze

  validates :email, presence: true, uniqueness: true
  validates :role, inclusion: { in: ROLES }
  validate :csr_cannot_have_account

  scope :users, -> { where(role: 'user') }
  scope :admins, -> { where(role: 'admin') }
  scope :csrs, -> { where(role: 'csr') }

  def user?
    role == 'user'
  end

  def admin?
    role == 'admin'
  end

  def csr?
    role == 'csr'
  end

  def full_name
    "#{first_name} #{last_name}".strip.presence || email
  end

  def preference
    user_preference || create_user_preference
  end

  private

  def csr_cannot_have_account
    if csr? && account_id.present?
      errors.add(:account_id, "CSR users cannot belong to a specific account")
    end
  end
end
