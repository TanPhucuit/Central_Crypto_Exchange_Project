import React from 'react';
import { FiDollarSign, FiTrendingUp, FiUsers, FiCheckCircle } from 'react-icons/fi';
import './MerchantDashboardPage.css';

const MerchantDashboardPage = () => {
  const stats = {
    totalOrders: 1250,
    completedOrders: 1225,
    totalVolume: 5250000,
    averageRating: 4.8,
    completionRate: 98.5,
  };

  const recentOrders = [
    {
      id: 'P2P001',
      user: 'User123',
      type: 'buy',
      amount: 1000,
      crypto: 'USDT',
      total: 24500000,
      status: 'completed',
      time: '10:30',
    },
    {
      id: 'P2P002',
      user: 'User456',
      type: 'sell',
      amount: 500,
      crypto: 'USDT',
      total: 12250000,
      status: 'pending',
      time: '09:15',
    },
    {
      id: 'P2P003',
      user: 'User789',
      type: 'buy',
      amount: 2000,
      crypto: 'USDT',
      total: 49000000,
      status: 'processing',
      time: '08:45',
    },
  ];

  return (
    <div className="merchant-dashboard-page">
      <div className="page-header">
        <h1>Dashboard Merchant</h1>
        <p className="text-secondary">Tổng quan hoạt động P2P của bạn</p>
      </div>

      <div className="merchant-stats-grid">
        <div className="merchant-stat-card">
          <div className="stat-icon blue">
            <FiUsers />
          </div>
          <div className="stat-content">
            <div className="stat-label">Tổng đơn hàng</div>
            <div className="stat-value">{stats.totalOrders}</div>
          </div>
        </div>

        <div className="merchant-stat-card">
          <div className="stat-icon green">
            <FiCheckCircle />
          </div>
          <div className="stat-content">
            <div className="stat-label">Đơn hoàn thành</div>
            <div className="stat-value">{stats.completedOrders}</div>
            <div className="stat-detail text-success">{stats.completionRate}% tỷ lệ</div>
          </div>
        </div>

        <div className="merchant-stat-card">
          <div className="stat-icon purple">
            <FiDollarSign />
          </div>
          <div className="stat-content">
            <div className="stat-label">Tổng khối lượng</div>
            <div className="stat-value">{stats.totalVolume.toLocaleString()} VND</div>
          </div>
        </div>

        <div className="merchant-stat-card">
          <div className="stat-icon orange">
            <FiTrendingUp />
          </div>
          <div className="stat-content">
            <div className="stat-label">Đánh giá</div>
            <div className="stat-value">{stats.averageRating} ⭐</div>
            <div className="stat-detail text-secondary">Trung bình</div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="orders-section">
          <div className="section-header">
            <h3>Đơn hàng gần đây</h3>
            <button className="btn-text">Xem tất cả</button>
          </div>
          
          <div className="orders-list">
            {recentOrders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <span className="order-id">{order.id}</span>
                  <span className={`order-type ${order.type}`}>
                    {order.type === 'buy' ? 'Mua' : 'Bán'}
                  </span>
                </div>
                
                <div className="order-details">
                  <div className="order-detail">
                    <span className="detail-label">Người dùng:</span>
                    <span className="detail-value">{order.user}</span>
                  </div>
                  <div className="order-detail">
                    <span className="detail-label">Số lượng:</span>
                    <span className="detail-value">{order.amount} {order.crypto}</span>
                  </div>
                  <div className="order-detail">
                    <span className="detail-label">Tổng tiền:</span>
                    <span className="detail-value">{order.total.toLocaleString()} VND</span>
                  </div>
                  <div className="order-detail">
                    <span className="detail-label">Thời gian:</span>
                    <span className="detail-value">{order.time}</span>
                  </div>
                </div>

                <div className="order-footer">
                  <span className={`status-badge ${order.status}`}>
                    {order.status === 'completed' ? 'Hoàn thành' : 
                     order.status === 'pending' ? 'Chờ thanh toán' : 'Đang xử lý'}
                  </span>
                  {order.status !== 'completed' && (
                    <button className="btn-small btn-primary">Xử lý</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="wallet-summary">
          <h3>Nguồn vốn</h3>
          <div className="wallet-card">
            <div className="wallet-item">
              <span className="wallet-label">USDT khả dụng</span>
              <span className="wallet-amount">50,000 USDT</span>
              <span className="wallet-usd">≈ $50,000</span>
            </div>
            <div className="wallet-item">
              <span className="wallet-label">VND khả dụng</span>
              <span className="wallet-amount">1,225,000,000 VND</span>
              <span className="wallet-usd">≈ $50,000</span>
            </div>
            <div className="wallet-actions">
              <button className="btn btn-primary btn-block">Nạp tiền</button>
              <button className="btn btn-secondary btn-block">Rút tiền</button>
            </div>
          </div>

          <h3 style={{ marginTop: 'var(--spacing-xl)' }}>Cài đặt P2P</h3>
          <div className="settings-card">
            <div className="setting-item">
              <span>Giá mua USDT:</span>
              <input type="number" className="setting-input" placeholder="24,500" />
            </div>
            <div className="setting-item">
              <span>Giá bán USDT:</span>
              <input type="number" className="setting-input" placeholder="24,550" />
            </div>
            <div className="setting-item">
              <span>Số lượng tối thiểu:</span>
              <input type="number" className="setting-input" placeholder="100" />
            </div>
            <div className="setting-item">
              <span>Số lượng tối đa:</span>
              <input type="number" className="setting-input" placeholder="10000" />
            </div>
            <button className="btn btn-primary btn-block">Cập nhật</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantDashboardPage;
