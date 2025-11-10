# == Schema Information
#
# Table name: user_preferences
#
#  id          :bigint           not null, primary key
#  user_id     :bigint           not null
#  ideal_turn  :float            default(1.4)
#  from_date   :date
#  to_date     :date
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#
class UserPreference < ApplicationRecord
  belongs_to :user

  validates :ideal_turn, numericality: { greater_than: 0 }, allow_nil: false

  def self.for_user(user)
    find_or_create_by(user: user)
  end
end
