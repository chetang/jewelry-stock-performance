require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'associations' do
    it { should belong_to(:account).optional }
  end

  describe 'validations' do
    it { should validate_presence_of(:email) }
    it { should validate_inclusion_of(:role).in_array(User::ROLES) }
  end

  describe 'role methods' do
    let(:user) { create(:user) }
    let(:admin) { create(:user, :admin) }
    let(:csr) { create(:user, :csr) }

    it 'correctly identifies user role' do
      expect(user.user?).to be true
      expect(user.admin?).to be false
      expect(user.csr?).to be false
    end

    it 'correctly identifies admin role' do
      expect(admin.user?).to be false
      expect(admin.admin?).to be true
      expect(admin.csr?).to be false
    end

    it 'correctly identifies csr role' do
      expect(csr.user?).to be false
      expect(csr.admin?).to be false
      expect(csr.csr?).to be true
    end
  end

  describe 'CSR validation' do
    it 'prevents CSR from having an account' do
      account = create(:account)
      csr = build(:user, role: 'csr', account: account)
      
      expect(csr).not_to be_valid
      expect(csr.errors[:account_id]).to include("CSR users cannot belong to a specific account")
    end
  end
end
