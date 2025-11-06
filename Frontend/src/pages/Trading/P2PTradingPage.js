import React, { useState } from 'react';
import { FiSearch, FiFilter } from 'react-icons/fi';
import './P2PTradingPage.css';

const P2PTradingPage = () => {
  const [activeTab, setActiveTab] = useState('buy'); // buy or sell
  const [selectedCrypto, setSelectedCrypto] = useState('USDT');
  const [selectedCurrency, setSelectedCurrency] = useState('VND');

  const merchants = [
    {
      id: 1,
      name: 'Merchant A',
      orders: 1250,
      completionRate: 98.5,
      price: 24500,
      available: 50000,
      limits: '1,000,000 - 50,000,000',
      paymentMethods: ['Bank Transfer', 'Momo', 'ZaloPay'],
    },
    {
      id: 2,
      name: 'Merchant B',
      orders: 850,
      completionRate: 99.2,
      price: 24450,
      available: 30000,
      limits: '500,000 - 30,000,000',
      paymentMethods: ['Bank Transfer', 'Momo'],
    },
    {
      id: 3,
      name: 'Merchant C',
      orders: 2100,
      completionRate: 97.8,
      price: 24550,
      available: 75000,
      limits: '2,000,000 - 100,000,000',
      paymentMethods: ['Bank Transfer'],
    },
  ];

  const handleCreateOrder = (merchant) => {
    // TODO: Open order creation modal
    console.log('Create order with merchant:', merchant);
  };

  return (
    <div className="p2p-trading-page">
      <div className="page-header">
        <h1>Giao dịch P2P</h1>
        <p className="text-secondary">Mua bán trực tiếp với Merchant</p>
      </div>

      <div className="trading-controls">
        <div className="tab-buttons">
          <button
            className={`tab-btn ${activeTab === 'buy' ? 'active' : ''}`}
            onClick={() => setActiveTab('buy')}
          >
            Mua
          </button>
          <button
            className={`tab-btn ${activeTab === 'sell' ? 'active' : ''}`}
            onClick={() => setActiveTab('sell')}
          >
            Bán
          </button>
        </div>

        <div className="filters">
          <select
            className="filter-select"
            value={selectedCrypto}
            onChange={(e) => setSelectedCrypto(e.target.value)}
          >
            <option value="USDT">USDT</option>
            <option value="BTC">BTC</option>
            <option value="ETH">ETH</option>
          </select>

          <select
            className="filter-select"
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value)}
          >
            <option value="VND">VND</option>
            <option value="USD">USD</option>
          </select>

          <button className="filter-btn">
            <FiFilter /> Bộ lọc
          </button>

          <div className="search-box">
            <FiSearch />
            <input type="text" placeholder="Tìm kiếm merchant..." />
          </div>
        </div>
      </div>

      <div className="merchants-list">
        <div className="list-header">
          <div className="header-col">Merchant</div>
          <div className="header-col">Giá</div>
          <div className="header-col">Khả dụng</div>
          <div className="header-col">Giới hạn</div>
          <div className="header-col">Phương thức</div>
          <div className="header-col">Hành động</div>
        </div>

        {merchants.map((merchant) => (
          <div key={merchant.id} className="merchant-item">
            <div className="merchant-info">
              <div className="merchant-name">{merchant.name}</div>
              <div className="merchant-stats">
                <span>{merchant.orders} đơn</span>
                <span className="text-success">{merchant.completionRate}%</span>
              </div>
            </div>

            <div className="merchant-price">
              <div className="price">{merchant.price.toLocaleString()} {selectedCurrency}</div>
            </div>

            <div className="merchant-available">
              <div className="available">{merchant.available.toLocaleString()} {selectedCrypto}</div>
            </div>

            <div className="merchant-limits">
              <div className="limits">{merchant.limits} {selectedCurrency}</div>
            </div>

            <div className="merchant-payment">
              <div className="payment-methods">
                {merchant.paymentMethods.map((method, index) => (
                  <span key={index} className="payment-badge">{method}</span>
                ))}
              </div>
            </div>

            <div className="merchant-action">
              <button
                className={`btn ${activeTab === 'buy' ? 'btn-success' : 'btn-danger'}`}
                onClick={() => handleCreateOrder(merchant)}
              >
                {activeTab === 'buy' ? 'Mua' : 'Bán'} {selectedCrypto}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="my-orders-section">
        <h3>Đơn hàng của tôi</h3>
        <div className="orders-tabs">
          <button className="orders-tab active">Đang xử lý</button>
          <button className="orders-tab">Hoàn thành</button>
          <button className="orders-tab">Đã hủy</button>
        </div>
        <div className="orders-list">
          <div className="empty-state">
            <p>Bạn chưa có đơn hàng nào</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default P2PTradingPage;
