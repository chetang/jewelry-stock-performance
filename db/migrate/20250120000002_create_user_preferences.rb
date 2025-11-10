class CreateUserPreferences < ActiveRecord::Migration[7.0]
  def change
    create_table :user_preferences do |t|
      t.references :user, null: false, foreign_key: true
      t.float :ideal_turn, default: 1.4
      t.date :from_date
      t.date :to_date
      
      t.timestamps
    end

    add_index :user_preferences, :user_id, unique: true
  end
end
