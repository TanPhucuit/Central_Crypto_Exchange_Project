import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiActivity, FiDownload } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { walletAPI, tradingAPI, dashboardAPI } from '../../services/api';
import useAuth from '../../hooks/useAuth';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user, userId } = useAuth();
  const [portfolioData, setPortfolioData] = useState([]);
  const [wallets, setWallets] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalBalance: 0,
    availableBalance: 0,
    lockedBalance: 0,
    profitLoss: 0,
    profitLossPercent: 0,
  });
  
  // Crypto name mapping
  const cryptoNames = {
    BTC: 'Bitcoin',
    ETH: 'Ethereum',
    USDT: 'Tether',
    BNB: 'Binance Coin',
    SOL: 'Solana',
    XRP: 'Ripple',
    ADA: 'Cardano',
  };

  useEffect(() => {
    if (userId) {
      loadDashboardData();
    }
  }, [userId]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load data - wallet data first (critical), then transactions (optional)
      await loadWalletData();
      loadRecentTransactions(); // Don't await - load in background
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(error.message || 'Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadWalletData = async () => {
    try {
      // Load dashboard summary with calculated assets
      const response = await dashboardAPI.getSummary(userId);
      
      if (response.success && response.data) {
        const summary = response.data;
        
        // Format wallet data for display
        const formattedWallets = summary.wallets
          .filter(wallet => wallet.total_value > 0)
          .map(wallet => ({
            wallet_id: wallet.wallet_id,
            type: wallet.type,
            balance: wallet.usdt_balance,
            totalValue: wallet.total_value,
            holdings: wallet.holdings,
          }));
        
        setWallets(formattedWallets);
        
        // Update stats with calculated values
        setStats({
          totalBalance: summary.total_asset_value,
          availableBalance: summary.available_balance,
          lockedBalance: summary.locked_balance,
          profitLoss: summary.profit_loss,
          profitLossPercent: summary.profit_loss_percent,
        });
      }
    } catch (error) {
      console.error('Error loading wallet data:', error);
      throw error;
    }
  };
  
  const loadRecentTransactions = async () => {
    try {
      // Load recent spot transactions
      const response = await tradingAPI.getSpotHistory(userId, 5);
      
      if (response.success && response.data) {
        const formatted = response.data.map(tx => ({
          id: tx.transaction_id,
          type: tx.side, // 'buy' or 'sell'
          pair: tx.symbol || 'N/A',
          amount: parseFloat(tx.amount || 0),
          price: parseFloat(tx.price || 0),
          timestamp: tx.timestamp,
          status: 'completed',
        }));
        setRecentTransactions(formatted);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Don't throw - transactions are not critical for dashboard
    }
  };

  const handleExportReport = () => {
    // TODO: Implement export report functionality
    console.log('Exporting report...');
    alert('Chức năng xuất báo cáo sẽ sớm được triển khai!');
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Xin chào, {user?.username}!</h1>
            <p className="text-secondary">Tổng quan tài khoản của bạn - User ID: {userId}</p>
          </div>
          <button className="btn-export btn-gradient" onClick={handleExportReport}>
            <FiDownload /> Xuất Báo Cáo
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Đang tải dữ liệu...</p>
        </div>
      ) : (
        <>
          <div className="stats-cards">
            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Tổng tài sản</span>
                <FiDollarSign className="stat-icon" />
              </div>
              <h2 className="stat-value">${stats.totalBalance.toFixed(2)}</h2>
              <div className={`stat-change ${stats.profitLossPercent >= 0 ? 'positive' : 'negative'}`}>
                {stats.profitLossPercent >= 0 ? <FiTrendingUp /> : <FiTrendingDown />}
                <span>{stats.profitLossPercent >= 0 ? '+' : ''}{stats.profitLossPercent}%</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Số dư khả dụng</span>
                <FiActivity className="stat-icon" />
              </div>
              <h2 className="stat-value">${stats.availableBalance.toFixed(2)}</h2>
              <p className="stat-description">Có thể giao dịch</p>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Số dư bị khóa</span>
                <FiActivity className="stat-icon" />
              </div>
              <h2 className="stat-value">${stats.lockedBalance.toFixed(2)}</h2>
              <p className="stat-description">Trong lệnh chờ</p>
            </div>

            <div className="stat-card">
              <div className="stat-card-header">
                <span className="stat-label">Lãi/Lỗ hôm nay</span>
                <FiTrendingUp className="stat-icon" />
              </div>
              <h2 className={`stat-value ${stats.profitLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                ${stats.profitLoss.toFixed(2)}
              </h2>
              <p className="stat-description">24h</p>
            </div>
          </div>

          <div className="dashboard-grid">
        {/* Cexora Logo & Icons Section */}
        <div className="cexora-showcase">
          <div className="showcase-content">
            <div className="logo-container">
              <div className="logo-glow"></div>
              <h1 className="cexora-logo">
                <span className="logo-text">CEXORA</span>
                <span className="logo-subtitle">Crypto Exchange Oracle</span>
              </h1>
            </div>
            
            <div className="animated-icons">
              <div className="icon-item" style={{ animationDelay: '0s' }}>
                <FiTrendingUp className="floating-icon" />
                <span>Giao dịch</span>
              </div>
              <div className="icon-item" style={{ animationDelay: '0.2s' }}>
                <FiDollarSign className="floating-icon" />
                <span>Ví điện tử</span>
              </div>
              <div className="icon-item" style={{ animationDelay: '0.4s' }}>
                <FiActivity className="floating-icon" />
                <span>Thị trường</span>
              </div>
              <div className="icon-item" style={{ animationDelay: '0.6s' }}>
                <FiDownload className="floating-icon" />
                <span>Báo cáo</span>
              </div>
            </div>

            <div className="showcase-stats">
              <div className="showcase-stat">
                <span className="stat-number">24/7</span>
                <span className="stat-text">Hỗ trợ</span>
              </div>
              <div className="showcase-stat">
                <span className="stat-number">100+</span>
                <span className="stat-text">Crypto</span>
              </div>
              <div className="showcase-stat">
                <span className="stat-number">0.1%</span>
                <span className="stat-text">Phí thấp</span>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3>Danh mục đầu tư</h3>
          </div>
          <div className="portfolio-list">
            {wallets.length > 0 ? (
              wallets.map((wallet) => (
                <div key={wallet.wallet_id} className="portfolio-item">
                  <div className="portfolio-info">
                    <span className="portfolio-symbol">{wallet.symbol}</span>
                    <span className="portfolio-name">{wallet.name}</span>
                  </div>
                  <div className="portfolio-values">
                    <span className="portfolio-amount">
                      {wallet.balance.toLocaleString('en-US', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: wallet.symbol === 'BTC' ? 8 : 2 
                      })} {wallet.symbol}
                    </span>
                    <span className="portfolio-value">
                      ${wallet.balance.toLocaleString('en-US', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                      })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <p>Chưa có tài sản nào trong ví</p>
                <p className="text-secondary">Nạp tiền để bắt đầu giao dịch</p>
              </div>
            )}
          </div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">
              <h3>Giao dịch gần đây</h3>
        </div>
        <div className="transactions-table">
          <table>
            <thead>
              <tr>
                <th>Loại</th>
                <th>Cặp giao dịch</th>
                <th>Số lượng</th>
                <th>Giá</th>
                <th>Thời gian</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      <span className={`badge ${tx.type === 'buy' ? 'badge-success' : 'badge-danger'}`}>
                        {tx.type === 'buy' ? 'Mua' : 'Bán'}
                      </span>
                    </td>
                    <td>{tx.pair}</td>
                    <td>{tx.amount.toFixed(4)} {tx.pair.split('/')[0]}</td>
                    <td>${tx.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td>{new Date(tx.timestamp).toLocaleString('vi-VN')}</td>
                    <td>
                      <span className={`badge ${tx.status === 'completed' ? 'badge-completed' : 'badge-pending'}`}>
                        {tx.status === 'completed' ? 'Hoàn thành' : 'Đang xử lý'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="empty-state">
                    <p>Chưa có giao dịch nào</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
