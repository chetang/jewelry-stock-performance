# == Schema Information
#
# Table name: saved_reports
#
#  id                :bigint           not null, primary key
#  user_id           :bigint           not null
#  account_id        :bigint           not null
#  name              :string           not null
#  filters           :jsonb            not null
#  email_enabled     :boolean          default(FALSE)
#  email_recipients  :text             default([]), is an Array
#  last_used_at      :datetime
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#
class SavedReport < ApplicationRecord
  belongs_to :user
  belongs_to :account

  validates :name, presence: true
  validates :filters, presence: true

  scope :for_user, ->(user) { where(user_id: user.id) }
  scope :recent, -> { order(last_used_at: :desc, created_at: :desc) }

  def touch_last_used!
    update(last_used_at: Time.current)
  end
end
