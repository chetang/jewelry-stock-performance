class CreateAccounts < ActiveRecord::Migration[7.1]
  def change
    create_table :accounts do |t|
      t.string :name, null: false
      t.string :subdomain, null: false
      t.boolean :active, default: true
      t.string :ftp_host
      t.string :ftp_username
      t.string :ftp_password_encrypted
      t.string :ftp_path

      t.timestamps
    end

    add_index :accounts, :subdomain, unique: true
  end
end
