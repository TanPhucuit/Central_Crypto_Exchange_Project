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
  const [spotWalletId, setSpotWalletId] = useState(null);
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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  useEffect(() => {
    if (userId && spotWalletId) {
      loadTransactions(spotWalletId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, spotWalletId]);
  
  const loadWalletData = async () => {
    try {
      setLoading(true);
      setError(null);
      setSpotWalletId(null);

      const response = await walletAPI.getWallets(userId);
      
      if (response.success && response.data) {
        const spotWallet = response.data.find((wallet) => wallet.type === 'spot');
        setSpotWalletId(spotWallet?.wallet_id || null);

        const formattedWallets = response.data.map((wallet) => {
          const symbol =
            wallet.type === 'spot'
              ? 'USDT'
              : wallet.symbol || (wallet.type ? wallet.type.toUpperCase() : 'WALLET');
          const balance = parseFloat(wallet.balance) || 0;

          return {
            symbol,
            name: symbol,
            balance,
            usdValue: balance, // TODO: replace with live price conversion
            icon: iconMap[symbol] || symbol,
            wallet_id: wallet.wallet_id,
          };
        });

        setWallets(formattedWallets);
      }
    } catch (err) {
      console.error('Error loading wallets:', err);
      setError(err.message || 'Không thể tải dữ liệu ví');
    } finally {
      setLoading(false);
    }
  };
  
  const loadTransactions = async (walletId) => {
    if (!walletId) {
      setTransactions([]);
      return;
    }

    try {
      // Load recent spot transactions
      const response = await tradingAPI.getSpotHistory(userId, walletId);
      
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
          <div className="wallet-hero">
            <div className="wallet-hero-info">
              <span className="eyebrow">Tổng tài sản ước tính</span>
              <h2>${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
              <p className="hero-subtitle">
                {wallets.length > 0 ? `${wallets.length} ví đang hoạt động` : 'Chưa có ví nào được tạo'}
              </p>
              <div className="wallet-stat-row">
                <div>
                  <span className="stat-label">Ví Spot</span>
                  <strong>{wallets.find(w => w.symbol === 'USDT')?.balance?.toLocaleString() || 0} USDT</strong>
                </div>
                <div>
                  <span className="stat-label">Ví Futures</span>
                  <strong>{wallets.find(w => w.symbol === 'FUTURE')?.balance?.toLocaleString() || 0}</strong>
                </div>
              </div>
            </div>
            <div className="wallet-hero-actions">
              <button className="action-chip">
                <FiArrowRightCircle /> Nạp tiền
              </button>
              <button className="action-chip">
                <FiSend /> Rút tiền
              </button>
              <button className="action-chip ghost">
                <FiClock /> Chuyển nội bộ
              </button>
            </div>
          </div>

          <div className="wallet-cards-grid">
            {wallets.map((wallet) => (
              <div key={wallet.wallet_id} className="wallet-card">
                <div className="wallet-card-header">
                  <div className="wallet-icon">{wallet.icon}</div>
                  <div>
                    <p className="wallet-label">{wallet.name}</p>
                    <span className="wallet-type">{wallet.symbol === 'USDT' ? 'Ví Spot' : wallet.symbol}</span>
                  </div>
                </div>
                <div className="wallet-card-body">
                  <div>
                    <span className="stat-label">Số dư</span>
                    <h3>{wallet.balance.toLocaleString()} {wallet.symbol}</h3>
                  </div>
                  <span className="subtle">≈ ${wallet.usdValue.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="wallet-layout">
            <div className="wallet-assets-panel">
              <div className="panel-header">
                <div>
                  <h3>Tài sản đang nắm giữ</h3>
                  <p className="panel-sub">Theo dõi danh mục và phân bổ tài sản của bạn</p>
                </div>
                <span className="badge">{wallets.length} ví</span>
              </div>
              <div className="asset-table">
                <div className="asset-row heading">
                  <span>Tài sản</span>
                  <span>Số dư</span>
                  <span>Giá trị ước tính</span>
                </div>
                {wallets.map((wallet) => (
                  <div key={`${wallet.wallet_id}-row`} className="asset-row">
                    <span className="asset-name">{wallet.symbol}</span>
                    <span>{wallet.balance.toLocaleString()} {wallet.symbol}</span>
                    <span>${wallet.usdValue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="transactions-panel">
              <div className="panel-header">
                <div>
                  <h3>Lịch sử giao dịch</h3>
                  <p className="panel-sub">Các lệnh Spot gần đây nhất</p>
                </div>
                <button className="btn-text">Xem tất cả</button>
              </div>
              <div className="transactions-timeline">
                {transactions.length === 0 && (
                  <p className="empty-state">Chưa có giao dịch nào</p>
                )}
                {transactions.map((tx) => (
                  <div key={tx.transaction_id} className="timeline-item">
                    <div className="timeline-dot" data-type={tx.type}></div>
                    <div>
                      <div className="timeline-top">
                        <span className="timeline-type">{tx.type === 'deposit' ? 'Nạp' : tx.type === 'withdraw' ? 'Rút' : 'Chuyển'}</span>
                        <span className="timeline-amount">
                          {tx.type === 'withdraw' ? '-' : '+'}{tx.amount} {tx.symbol}
                        </span>
                      </div>
                      <div className="timeline-bottom">
                        <span>{tx.time}</span>
                        <span className={`timeline-status ${tx.status}`}>{tx.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default WalletPage;
