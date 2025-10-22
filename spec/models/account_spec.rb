require 'rails_helper'

RSpec.describe Account, type: :model do
  describe 'associations' do
    it { should have_many(:users).dependent(:destroy) }
    it { should have_many(:ftp_imports).dependent(:destroy) }
  end

  describe 'validations' do
    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:subdomain) }
    it { should validate_uniqueness_of(:subdomain) }
  end

  describe '#jewelry_index_name' do
    let(:account) { create(:account, subdomain: 'testcompany') }

    it 'returns the correct index name' do
      expect(account.jewelry_index_name).to eq("jewelry_testcompany_test")
    end
  end
end
