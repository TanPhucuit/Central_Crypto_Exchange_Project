import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrendingUp } from 'react-icons/fi';
import LivePriceChart from '../../components/LivePriceChart/LivePriceChart';
import './FuturesTradingPage.css';

const FuturesTradingPage = () => {
  const navigate = useNavigate();
  const [selectedPair, setSelectedPair] = useState(null);
  const [orderType, setOrderType] = useState('limit'); // limit or market
  const [leverage, setLeverage] = useState(10);
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  
  // Available coins from market
  const [coins] = useState([
    { symbol: 'BTC/USDT', name: 'Bitcoin', price: 45820, change: 2.5, volume: '1.2B', walletBalance: 0.5 },
    { symbol: 'ETH/USDT', name: 'Ethereum', price: 2000, change: -1.2, volume: '856M', walletBalance: 2.5 },
    { symbol: 'BNB/USDT', name: 'Binance Coin', price: 300, change: 3.8, volume: '450M', walletBalance: 10 },
    { symbol: 'SOL/USDT', name: 'Solana', price: 120, change: 5.2, volume: '320M', walletBalance: 5 },
    { symbol: 'XRP/USDT', name: 'Ripple', price: 0.52, change: -0.8, volume: '280M', walletBalance: 1000 },
    { symbol: 'ADA/USDT', name: 'Cardano', price: 0.45, change: 1.5, volume: '150M', walletBalance: 500 },
  ]);
  const [usdtBalance] = useState(10000);
  
  const selectedCoin = coins.find(c => c.symbol === selectedPair);
  
  // Mock PnL Stats for Futures
  const [pnlStats] = useState({
    totalPnL: 2850.75,
    totalPnLPercent: 28.5,
    todayPnL: 425.50,
    todayPnLPercent: 4.8,
    winRate: 72.3,
    totalTrades: 89,
    profitTrades: 64,
    lossTrades: 25,
    totalVolume: 125000,
    avgLeverage: 10,
  });

  return (
    <div className="futures-trading-page">
      <div className="page-header">
        <h1>Giao dịch Futures</h1>
        <p className="text-secondary">Chọn coin để bắt đầu giao dịch với đòn bẩy</p>
      </div>

      {/* Coins List */}
      <div className="coins-section glass-card">
        <h3>Danh sách Futures</h3>
        <div className="coins-grid">
          {coins.map((coin, index) => (
            <div
              key={index}
              className={`coin-card ${selectedPair === coin.symbol ? 'active' : ''}`}
              onClick={() => setSelectedPair(coin.symbol)}
            >
              <div className="coin-header">
                <span className="coin-symbol">{coin.symbol}</span>
                <span className={`coin-change ${coin.change >= 0 ? 'positive' : 'negative'}`}>
                  {coin.change >= 0 ? '+' : ''}{coin.change}%
                </span>
              </div>
              <div className="coin-price">${coin.price.toLocaleString()}</div>
              <div className="coin-volume">Vol: {coin.volume}</div>
            </div>
          ))}
        </div>
      </div>

      {!selectedPair ? (
        <div className="empty-selection glass-card">
          <h2>📊 Chọn coin để xem biểu đồ và giao dịch Futures</h2>
          <p>Vui lòng chọn một coin từ danh sách bên trên để bắt đầu</p>
        </div>
      ) : (
        <>
          <div className="trading-pair-header glass-card">
            <div className="header-left">
              <h2>{selectedPair} Futures</h2>
              <div className="pair-stats">
                <span className="current-price">
                  ${coins.find(c => c.symbol === selectedPair)?.price.toLocaleString()}
                </span>
                <span className={`price-change ${coins.find(c => c.symbol === selectedPair)?.change >= 0 ? 'text-success' : 'text-danger'}`}>
                  {coins.find(c => c.symbol === selectedPair)?.change >= 0 ? '+' : ''}
                  {coins.find(c => c.symbol === selectedPair)?.change}%
                </span>
              </div>
              <div className="wallet-balance">
                <span className="text-secondary">Số dư khả dụng:</span>
                <span className="balance-value">{usdtBalance.toLocaleString()} USDT</span>
              </div>
            </div>
            {/* PnL Button in Header */}
            <button className="btn-pnl-header btn-gradient" onClick={() => navigate('/trading/pnl-analytics')}>
              <FiTrendingUp /> Phân Tích PnL
            </button>
          </div>

          {/* Full Width Live Price Chart */}
          <div className="chart-full-section">
            {selectedPair && typeof selectedPair === 'string' ? (
              <LivePriceChart 
                symbol={selectedPair.replace('/', '')} 
                height={600} 
              />
            ) : (
              <div className="no-pair-selected">
                <p>📊 Vui lòng chọn cặp giao dịch để xem biểu đồ nến</p>
              </div>
            )}
          </div>

          {/* Long/Short Order Panel - Binance Style */}
          <div className="order-panel-futures">
            {/* Long Side */}
            <div className="order-side long-side">
              <div className="order-type-tabs">
                <button 
                  className={`tab-btn ${orderType === 'limit' ? 'active' : ''}`}
                  onClick={() => setOrderType('limit')}
                >
                  Limit
                </button>
                <button 
                  className={`tab-btn ${orderType === 'market' ? 'active' : ''}`}
                  onClick={() => setOrderType('market')}
                >
                  Market
                </button>
              </div>

              <div className="leverage-section">
                <label>Đòn bẩy</label>
                <div className="leverage-slider">
                  <input 
                    type="range" 
                    min="1" 
                    max="125" 
                    value={leverage}
                    onChange={(e) => setLeverage(e.target.value)}
                    className="slider"
                  />
                  <span className="leverage-value">{leverage}x</span>
                </div>
              </div>

              {orderType === 'limit' && (
                <div className="input-group">
                  <label>Giá</label>
                  <div className="input-box">
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                    <span className="input-suffix">USDT</span>
                  </div>
                </div>
              )}

              <div className="input-group">
                <label>Số lượng</label>
                <div className="input-box">
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <span className="input-suffix">{selectedCoin?.symbol.split('/')[0]}</span>
                </div>
              </div>

              <div className="percentage-buttons">
                <button onClick={() => setAmount((usdtBalance * 0.25 * leverage / selectedCoin?.price).toFixed(6))}>25%</button>
                <button onClick={() => setAmount((usdtBalance * 0.5 * leverage / selectedCoin?.price).toFixed(6))}>50%</button>
                <button onClick={() => setAmount((usdtBalance * 0.75 * leverage / selectedCoin?.price).toFixed(6))}>75%</button>
                <button onClick={() => setAmount((usdtBalance * leverage / selectedCoin?.price).toFixed(6))}>100%</button>
              </div>

              <div className="order-summary">
                <div className="summary-row">
                  <span>Ký quỹ</span>
                  <span>{amount && selectedCoin ? ((amount * selectedCoin.price) / leverage).toFixed(2) : '0.00'} USDT</span>
                </div>
                <div className="summary-row">
                  <span>Giá trị vị thế</span>
                  <span>{amount && selectedCoin ? (amount * selectedCoin.price).toFixed(2) : '0.00'} USDT</span>
                </div>
              </div>

              <button className="btn-trade btn-long">
                Mở Long {selectedCoin?.symbol.split('/')[0]}
              </button>

              <div className="balance-footer">
                <span>Số dư: {usdtBalance.toLocaleString()} USDT</span>
              </div>
            </div>

            {/* Short Side */}
            <div className="order-side short-side">
              <div className="order-type-tabs">
                <button 
                  className={`tab-btn ${orderType === 'limit' ? 'active' : ''}`}
                  onClick={() => setOrderType('limit')}
                >
                  Limit
                </button>
                <button 
                  className={`tab-btn ${orderType === 'market' ? 'active' : ''}`}
                  onClick={() => setOrderType('market')}
                >
                  Market
                </button>
              </div>

              <div className="leverage-section">
                <label>Đòn bẩy</label>
                <div className="leverage-slider">
                  <input 
                    type="range" 
                    min="1" 
                    max="125" 
                    value={leverage}
                    onChange={(e) => setLeverage(e.target.value)}
                    className="slider"
                  />
                  <span className="leverage-value">{leverage}x</span>
                </div>
              </div>

              {orderType === 'limit' && (
                <div className="input-group">
                  <label>Giá</label>
                  <div className="input-box">
                    <input 
                      type="number" 
                      placeholder="0.00"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                    <span className="input-suffix">USDT</span>
                  </div>
                </div>
              )}

              <div className="input-group">
                <label>Số lượng</label>
                <div className="input-box">
                  <input 
                    type="number" 
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                  <span className="input-suffix">{selectedCoin?.symbol.split('/')[0]}</span>
                </div>
              </div>

              <div className="percentage-buttons">
                <button onClick={() => setAmount((usdtBalance * 0.25 * leverage / selectedCoin?.price).toFixed(6))}>25%</button>
                <button onClick={() => setAmount((usdtBalance * 0.5 * leverage / selectedCoin?.price).toFixed(6))}>50%</button>
                <button onClick={() => setAmount((usdtBalance * 0.75 * leverage / selectedCoin?.price).toFixed(6))}>75%</button>
                <button onClick={() => setAmount((usdtBalance * leverage / selectedCoin?.price).toFixed(6))}>100%</button>
              </div>

              <div className="order-summary">
                <div className="summary-row">
                  <span>Ký quỹ</span>
                  <span>{amount && selectedCoin ? ((amount * selectedCoin.price) / leverage).toFixed(2) : '0.00'} USDT</span>
                </div>
                <div className="summary-row">
                  <span>Giá trị vị thế</span>
                  <span>{amount && selectedCoin ? (amount * selectedCoin.price).toFixed(2) : '0.00'} USDT</span>
                </div>
              </div>

              <button className="btn-trade btn-short">
                Mở Short {selectedCoin?.symbol.split('/')[0]}
              </button>

              <div className="balance-footer">
                <span>Số dư: {usdtBalance.toLocaleString()} USDT</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FuturesTradingPage;
