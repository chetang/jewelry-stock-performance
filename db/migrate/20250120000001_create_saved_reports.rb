class CreateSavedReports < ActiveRecord::Migration[7.0]
  def change
    create_table :saved_reports do |t|
      t.references :user, null: false, foreign_key: true
      t.references :account, null: false, foreign_key: true
      t.string :name, null: false
      t.jsonb :filters, null: false, default: {}
      t.boolean :email_enabled, default: false
      t.text :email_recipients, array: true, default: []
      t.datetime :last_used_at
      
      t.timestamps
    end

    add_index :saved_reports, [:user_id, :name]
    add_index :saved_reports, :account_id
  end
end
