class CreateFtpImports < ActiveRecord::Migration[7.1]
  def change
    create_table :ftp_imports do |t|
      t.references :account, null: false, foreign_key: true
      t.string :filename
      t.string :status, default: 'pending'
      t.integer :total_records, default: 0
      t.integer :processed_records, default: 0
      t.integer :new_items, default: 0
      t.integer :updated_items, default: 0
      t.integer :sold_items, default: 0
      t.text :error_message
      t.datetime :started_at
      t.datetime :completed_at

      t.timestamps
    end

    add_index :ftp_imports, :status
    add_index :ftp_imports, :created_at
  end
end
