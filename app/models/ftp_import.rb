# == Schema Information
#
# Table name: ftp_imports
#
#  id                :bigint           not null, primary key
#  account_id        :bigint           not null
#  filename          :string
#  status            :string           default("pending")
#  total_records     :integer          default(0)
#  processed_records :integer          default(0)
#  new_items         :integer          default(0)
#  updated_items     :integer          default(0)
#  sold_items        :integer          default(0)
#  error_message     :text
#  started_at        :datetime
#  completed_at      :datetime
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#
class FtpImport < ApplicationRecord
  belongs_to :account

  STATUSES = %w[pending processing completed failed].freeze

  validates :status, inclusion: { in: STATUSES }

  scope :pending, -> { where(status: 'pending') }
  scope :processing, -> { where(status: 'processing') }
  scope :completed, -> { where(status: 'completed') }
  scope :failed, -> { where(status: 'failed') }
  scope :recent, -> { order(created_at: :desc).limit(10) }

  def mark_as_processing!
    update!(status: 'processing', started_at: Time.current)
  end

  def mark_as_completed!(stats = {})
    update!(
      status: 'completed',
      completed_at: Time.current,
      new_items: stats[:new_items] || 0,
      updated_items: stats[:updated_items] || 0,
      sold_items: stats[:sold_items] || 0,
      processed_records: stats[:processed_records] || 0
    )
  end

  def mark_as_failed!(error)
    update!(
      status: 'failed',
      completed_at: Time.current,
      error_message: error.to_s
    )
  end
end
