# Background job to sync inventory from FTP (runs hourly)
class FtpSyncJob < ApplicationJob
  queue_as :default

  def perform(account_id)
    account = Account.find(account_id)
    
    Rails.logger.info "Starting FTP sync for account: #{account.name}"
    
    service = FtpSyncService.new(account)
    success = service.call
    
    if success
      Rails.logger.info "FTP sync completed successfully for account: #{account.name}"
    else
      Rails.logger.error "FTP sync failed for account: #{account.name}"
    end
  rescue => e
    Rails.logger.error "FTP sync job failed: #{e.message}\n#{e.backtrace.join("\n")}"
    raise
  end
end
