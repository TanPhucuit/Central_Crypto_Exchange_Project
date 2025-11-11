import React, { useState, useEffect } from 'react';
import './MerchantWalletPage.css';
import { FiDollarSign, FiTrendingUp, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { walletAPI } from '../../services/api';

const MerchantWalletPage = () => {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem('user_id');

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      setLoading(true);
      const response = await walletAPI.getWallets(userId);
      console.log('Wallets:', response);
      
      // Find USDT wallet or create one
      if (response.success && response.data) {
        const usdtWallet = response.data.find(w => w.symbol === 'USDT');
        if (usdtWallet) {
          setWallet(usdtWallet);
        } else {
          // If no USDT wallet, create default structure
          setWallet({
            symbol: 'USDT',
            balance: 0,
            locked_balance: 0,
            available_balance: 0
          });
        }
      }
    } catch (err) {
      console.error('Failed to load wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalBalance = wallet ? (parseFloat(wallet.balance) || 0) : 0;
  const lockedBalance = wallet ? (parseFloat(wallet.locked_balance) || 0) : 0;
  const availableBalance = wallet ? (parseFloat(wallet.available_balance) || totalBalance - lockedBalance) : 0;

  if (loading) {
    return (
      <div className="merchant-wallet-page">
        <div className="page-header">
          <h1>Ví của tôi</h1>
          <p className="text-secondary">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="merchant-wallet-page">
      <div className="page-header">
        <h1>Ví của tôi</h1>
        <p className="text-secondary">Quản lý tài sản USDT của bạn</p>
      </div>

      <div className="wallet-cards">
        <div className="wallet-card primary">
          <div className="wallet-card-icon">
            <FiDollarSign />
          </div>
          <div className="wallet-card-content">
            <div className="wallet-card-label">Tổng tài sản</div>
            <div className="wallet-card-value">{totalBalance.toLocaleString()} USDT</div>
            <div className="wallet-card-usd">≈ ${totalBalance.toLocaleString()} USD</div>
          </div>
        </div>

        <div className="wallet-card success">
          <div className="wallet-card-icon">
            <FiTrendingUp />
          </div>
          <div className="wallet-card-content">
            <div className="wallet-card-label">Khả dụng</div>
            <div className="wallet-card-value">{availableBalance.toLocaleString()} USDT</div>
            <div className="wallet-card-detail">Có thể giao dịch</div>
          </div>
        </div>

        <div className="wallet-card warning">
          <div className="wallet-card-icon">
            <FiArrowDown />
          </div>
          <div className="wallet-card-content">
            <div className="wallet-card-label">Đang khóa</div>
            <div className="wallet-card-value">{lockedBalance.toLocaleString()} USDT</div>
            <div className="wallet-card-detail">Trong đơn hàng P2P</div>
          </div>
        </div>
      </div>

      <div className="wallet-info-card">
        <h3>Thông tin ví USDT</h3>
        <div className="wallet-info-grid">
          <div className="wallet-info-item">
            <span className="info-label">Loại tài sản</span>
            <span className="info-value">USDT (Tether)</span>
          </div>
          <div className="wallet-info-item">
            <span className="info-label">Mạng</span>
            <span className="info-value">TRC20</span>
          </div>
          <div className="wallet-info-item">
            <span className="info-label">Tổng tài sản</span>
            <span className="info-value">{totalBalance.toLocaleString()} USDT</span>
          </div>
          <div className="wallet-info-item">
            <span className="info-label">Khả dụng</span>
            <span className="info-value text-success">{availableBalance.toLocaleString()} USDT</span>
          </div>
          <div className="wallet-info-item">
            <span className="info-label">Đang khóa</span>
            <span className="info-value text-warning">{lockedBalance.toLocaleString()} USDT</span>
          </div>
          <div className="wallet-info-item">
            <span className="info-label">Giá trị USD</span>
            <span className="info-value">≈ ${totalBalance.toLocaleString()} USD</span>
          </div>
        </div>
      </div>

      <div className="wallet-notice">
        <FiArrowUp className="notice-icon" />
        <div>
          <div className="notice-title">Lưu ý về tài sản</div>
          <p>Số dư khả dụng là số USDT bạn có thể sử dụng để giao dịch P2P. Số dư đang khóa là USDT đang trong các đơn hàng P2P chưa hoàn thành.</p>
        </div>
      </div>
    </div>
  );
};

export default MerchantWalletPage;
