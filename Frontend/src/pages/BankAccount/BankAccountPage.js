import React, { useState, useEffect } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiSend } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { bankAPI } from '../../services/api';
import './BankAccountPage.css';

const BankAccountPage = () => {
  const { userId } = useAuth();
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  const [transferData, setTransferData] = useState({
    fromAccount: '',
    toAccount: '',
    amount: '',
    note: '',
  });
  
  const [newAccountData, setNewAccountData] = useState({
    bank_name: '',
    account_number: '',
    account_name: '',
    branch: '',
  });
  
  const [bankAccounts, setBankAccounts] = useState([]);
  
  // Load bank accounts on mount
  useEffect(() => {
    if (userId) {
      loadBankAccounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
  
  const loadBankAccounts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await bankAPI.getAccounts(userId);
      
      if (response.success && response.data) {
        setBankAccounts(response.data);
      }
    } catch (err) {
      console.error('Error loading bank accounts:', err);
      setError(err.message || 'Không thể tải danh sách tài khoản ngân hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = () => {
    setShowAddModal(true);
    setNewAccountData({
      bank_name: '',
      account_number: '',
      account_name: '',
      branch: '',
    });
  };
  
  const handleAddAccountSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      // Backend expects: account_number, bank_name, account_balance (optional)
      const response = await bankAPI.createAccount(
        userId, 
        newAccountData.account_number, 
        newAccountData.bank_name,
        0 // Initial balance
      );
      
      if (response.success) {
        setSuccess('Thêm tài khoản ngân hàng thành công!');
        setShowAddModal(false);
        loadBankAccounts(); // Reload list
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.message || 'Không thể thêm tài khoản ngân hàng');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAccount = (id) => {
    // TODO: Implement edit functionality
    alert('Chức năng chỉnh sửa sẽ sớm được triển khai!');
  };

  const handleDeleteAccount = async (id) => {
    if (window.confirm('Bạn có chắc muốn xóa tài khoản ngân hàng này?')) {
      try {
        setLoading(true);
        setError(null);
        
        const response = await bankAPI.deleteAccount(userId, id);
        
        if (response.success) {
          setSuccess('Xóa tài khoản ngân hàng thành công!');
          loadBankAccounts(); // Reload list
          setTimeout(() => setSuccess(null), 3000);
        }
      } catch (err) {
        setError(err.message || 'Không thể xóa tài khoản ngân hàng');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSetDefault = (id) => {
    // TODO: Implement set default functionality
    alert('Chức năng đặt làm mặc định sẽ sớm được triển khai!');
  };

  const handleTransfer = () => {
    setShowTransferModal(true);
  };

  const handleTransferSubmit = (e) => {
    e.preventDefault();
    // TODO: API call to process transfer
    console.log('Transfer:', transferData);
    alert('Chuyển khoản thành công!');
    setShowTransferModal(false);
    setTransferData({ fromAccount: '', toAccount: '', amount: '', note: '' });
  };

  return (
    <div className="bank-account-page">
      <div className="page-header">
        <div>
          <h1>Tài khoản ngân hàng</h1>
          <p className="text-secondary">Quản lý tài khoản ngân hàng liên kết</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleTransfer}>
            <FiSend /> Chuyển khoản
          </button>
          <button className="btn btn-primary" onClick={handleAddAccount}>
            <FiPlus /> Thêm tài khoản
          </button>
        </div>
      </div>
      
      {/* Success/Error Messages */}
      {success && (
        <div className="alert alert-success">
          ✓ {success}
        </div>
      )}
      {error && (
        <div className="alert alert-danger">
          ⚠️ {error}
        </div>
      )}
      
      {/* Loading State */}
      {loading && bankAccounts.length === 0 ? (
        <div className="loading-container">
          <p>Đang tải danh sách tài khoản...</p>
        </div>
      ) : (
        <>
          <div className="bank-accounts-grid">
            {bankAccounts.length > 0 ? (
              bankAccounts.map((account) => (
                <div key={account.account_id || account.id} className="bank-card">
            {account.isDefault && (
              <div className="default-badge">Mặc định</div>
            )}
            
            <div className="bank-header">
              <div className="bank-logo">
                {(account.bank_name || account.bankName || 'B').charAt(0).toUpperCase()}
              </div>
              <div className="bank-info">
                <h3>{account.bank_name || account.bankName || 'Unknown Bank'}</h3>
                <p className="text-secondary">{account.branch || 'Chi nhánh chính'}</p>
              </div>
            </div>

            <div className="bank-details">
              <div className="detail-row">
                <span className="detail-label">Số tài khoản:</span>
                <span className="detail-value">{account.account_number || account.accountNumber || 'N/A'}</span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Số dư:</span>
                <span className="detail-value">${parseFloat(account.account_balance || 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="bank-actions">
              {!account.isDefault && (
                <button
                  className="action-btn"
                  onClick={() => handleSetDefault(account.account_number)}
                >
                  Đặt làm mặc định
                </button>
              )}
              <button
                className="action-btn"
                onClick={() => handleEditAccount(account.account_number)}
              >
                <FiEdit2 /> Sửa
              </button>
              <button
                className="action-btn danger"
                onClick={() => handleDeleteAccount(account.account_number)}
              >
                <FiTrash2 /> Xóa
              </button>
            </div>
          </div>
        ))
            ) : (
              <div className="empty-state">
                <p>Chưa có tài khoản ngân hàng nào</p>
                <p className="text-secondary">Thêm tài khoản để bắt đầu giao dịch</p>
              </div>
            )}

            <div className="add-bank-card" onClick={handleAddAccount}>
              <FiPlus size={40} />
              <span>Thêm tài khoản mới</span>
            </div>
          </div>

          <div className="info-section">
            <h3>Lưu ý quan trọng</h3>
            <ul className="info-list">
              <li>Tài khoản ngân hàng phải trùng tên với chủ tài khoản sàn giao dịch</li>
              <li>Hệ thống sẽ xác minh thông tin tài khoản trong vòng 24h</li>
              <li>Bạn có thể thêm tối đa 5 tài khoản ngân hàng</li>
              <li>Chỉ tài khoản đã xác minh mới có thể sử dụng cho giao dịch P2P</li>
            </ul>
          </div>
        </>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Chuyển khoản ngân hàng</h3>
              <button className="modal-close" onClick={() => setShowTransferModal(false)}>×</button>
            </div>
            <form onSubmit={handleTransferSubmit} className="transfer-form">
              <div className="form-group">
                <label>Từ tài khoản</label>
                <select
                  className="form-input"
                  value={transferData.fromAccount}
                  onChange={(e) => setTransferData({ ...transferData, fromAccount: e.target.value })}
                  required
                >
                  <option value="">Chọn tài khoản nguồn</option>
                  {bankAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bankName} - {acc.accountNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Đến tài khoản</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập số tài khoản đích"
                  value={transferData.toAccount}
                  onChange={(e) => setTransferData({ ...transferData, toAccount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Số tiền</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="Nhập số tiền"
                  value={transferData.amount}
                  onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Nội dung chuyển khoản</label>
                <textarea
                  className="form-input"
                  placeholder="Nhập nội dung (tùy chọn)"
                  rows="3"
                  value={transferData.note}
                  onChange={(e) => setTransferData({ ...transferData, note: e.target.value })}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTransferModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary btn-gradient">
                  <FiSend /> Chuyển khoản
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Add Bank Account Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Thêm tài khoản ngân hàng</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddAccountSubmit} className="transfer-form">
              <div className="form-group">
                <label>Tên ngân hàng</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Vietcombank, Techcombank..."
                  value={newAccountData.bank_name}
                  onChange={(e) => setNewAccountData({ ...newAccountData, bank_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Số tài khoản</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Nhập số tài khoản"
                  value={newAccountData.account_number}
                  onChange={(e) => setNewAccountData({ ...newAccountData, account_number: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Tên chủ tài khoản</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="NGUYEN VAN A"
                  value={newAccountData.account_name}
                  onChange={(e) => setNewAccountData({ ...newAccountData, account_name: e.target.value.toUpperCase() })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Chi nhánh</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="VD: Chi nhánh TP.HCM"
                  value={newAccountData.branch}
                  onChange={(e) => setNewAccountData({ ...newAccountData, branch: e.target.value })}
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary btn-gradient" disabled={loading}>
                  <FiPlus /> {loading ? 'Đang xử lý...' : 'Thêm tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BankAccountPage;
