import React, { useState, useEffect } from 'react';
import { FiSend, FiArrowRightCircle, FiClock } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { walletAPI, tradingAPI } from '../../services/api';
import './WalletPage.css';

const WalletPage = () => {
  const { userId } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [wallets, setWallets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Icon mapping for different crypto symbols
  const iconMap = {
    BTC: '₿',
    ETH: 'Ξ',
    USDT: '₮',
    BNB: 'BNB',
    SOL: 'SOL',
    XRP: 'XRP',
    ADA: 'ADA',
  };
  
  // Load wallet data on mount
  useEffect(() => {
    if (userId) {
      loadWalletData();
      loadTransactions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
  
  const loadWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await walletAPI.getWallets(userId);
      
      if (response.success && response.data) {
        // Map backend wallet data to display format
        const formattedWallets = response.data.map(wallet => ({
          symbol: wallet.symbol,
          name: wallet.symbol, // Could be enhanced with full names
          balance: parseFloat(wallet.balance) || 0,
          usdValue: parseFloat(wallet.balance) || 0, // TODO: Calculate with real-time prices
          icon: iconMap[wallet.symbol] || wallet.symbol,
          wallet_id: wallet.wallet_id,
        }));
        setWallets(formattedWallets);
      }
    } catch (err) {
      console.error('Error loading wallets:', err);
      setError(err.message || 'Không thể tải dữ liệu ví');
    } finally {
      setLoading(false);
    }
  };
  
  const loadTransactions = async () => {
    try {
      // Load recent spot transactions
      const response = await tradingAPI.getSpotHistory(userId, 10);
      
      if (response.success && response.data) {
        // Map backend transaction data to display format
        const formattedTransactions = response.data.map(tx => ({
          type: tx.side === 'buy' ? 'deposit' : 'withdraw',
          symbol: tx.symbol ? tx.symbol.split('/')[0] : 'N/A',
          amount: parseFloat(tx.amount) || 0,
          time: new Date(tx.timestamp).toLocaleString('vi-VN'),
          status: 'completed',
          transaction_id: tx.transaction_id,
        }));
        setTransactions(formattedTransactions);
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
    }
  };

  // Calculate total balance
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.usdValue, 0);
  
  return (
    <div className="wallet-page">
      <div className="page-header">
        <h1>Ví của tôi</h1>
        <p className="text-secondary">Quản lý tài sản và giao dịch</p>
      </div>
      
      {/* Loading State */}
      {loading && (
        <div className="loading-message">
          <p>Đang tải dữ liệu ví...</p>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
          <button className="btn btn-primary" onClick={loadWalletData}>
            Thử lại
          </button>
        </div>
      )}
      
      {/* Main Content */}
      {!loading && !error && (
        <>
          <div className="wallet-summary">
            <div className="summary-card main">
              <div className="summary-label">Tổng tài sản ước tính</div>
              <div className="summary-value">${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              <div className="summary-btc">
                {wallets.length > 0 ? `${wallets.length} loại tài sản` : 'Chưa có tài sản'}
              </div>
            </div>
        <div className="summary-actions">
          <button className="action-btn deposit">
            <FiArrowRightCircle size={20} />
            <span>Nạp tiền</span>
          </button>
          <button className="action-btn withdraw">
            <FiSend size={20} />
            <span>Rút tiền</span>
          </button>
          <button className="action-btn transfer">
            <FiClock size={20} />
            <span>Chuyển</span>
          </button>
        </div>
      </div>

      <div className="wallet-tabs">
        <button
          className={`wallet-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Tổng quan
        </button>
        <button
          className={`wallet-tab ${activeTab === 'spot' ? 'active' : ''}`}
          onClick={() => setActiveTab('spot')}
        >
          Ví Spot
        </button>
        <button
          className={`wallet-tab ${activeTab === 'futures' ? 'active' : ''}`}
          onClick={() => setActiveTab('futures')}
        >
          Ví Futures
        </button>
      </div>

      <div className="wallets-grid">
        {wallets.map((wallet) => (
          <div key={wallet.symbol} className="wallet-card">
            <div className="wallet-header">
              <div className="wallet-icon">{wallet.icon}</div>
              <div className="wallet-info">
                <div className="wallet-symbol">{wallet.symbol}</div>
                <div className="wallet-name">{wallet.name}</div>
              </div>
            </div>
            <div className="wallet-balance">
              <div className="balance-amount">
                {wallet.balance.toLocaleString()} {wallet.symbol}
              </div>
              <div className="balance-usd">
                ≈ ${wallet.usdValue.toLocaleString()}
              </div>
            </div>
            <div className="wallet-actions">
              <button className="wallet-action-btn">Nạp</button>
              <button className="wallet-action-btn">Rút</button>
              <button className="wallet-action-btn">Giao dịch</button>
            </div>
          </div>
        ))}
      </div>

      <div className="transactions-section">
        <div className="section-header">
          <h3>Lịch sử giao dịch gần đây</h3>
          <button className="btn-text">Xem tất cả</button>
        </div>
        <div className="transactions-list">
          <div className="transaction-header">
            <span>Loại</span>
            <span>Tiền</span>
            <span>Số lượng</span>
            <span>Thời gian</span>
            <span>Trạng thái</span>
          </div>
          {transactions.map((tx, index) => (
            <div key={index} className="transaction-item">
              <span className={`transaction-type ${tx.type}`}>
                {tx.type === 'deposit' ? 'Nạp tiền' : tx.type === 'withdraw' ? 'Rút tiền' : 'Chuyển'}
              </span>
              <span className="transaction-symbol">{tx.symbol}</span>
              <span className="transaction-amount">
                {tx.type === 'withdraw' ? '-' : '+'}{tx.amount} {tx.symbol}
              </span>
              <span className="transaction-time text-secondary">{tx.time}</span>
              <span className={`transaction-status ${tx.status}`}>
                {tx.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
              </span>
            </div>
          ))}
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default WalletPage;
