import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrendingUp } from 'react-icons/fi';
import LivePriceChart from '../../components/LivePriceChart/LivePriceChart';
import { useAuth } from '../../hooks/useAuth';
import { walletAPI, tradingAPI } from '../../services/api';
import './SpotTradingPage.css';

const SpotTradingPage = () => {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [selectedPair, setSelectedPair] = useState(null);
  const [orderType, setOrderType] = useState('limit'); // limit or market
  const [side, setSide] = useState('buy'); // buy or sell
  const [price, setPrice] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Available coins from market (mock data - could use external API)
  const [coins] = useState([
    { symbol: 'BTC/USDT', name: 'Bitcoin', price: 45820, change: 2.5, volume: '1.2B' },
    { symbol: 'ETH/USDT', name: 'Ethereum', price: 2000, change: -1.2, volume: '856M' },
    { symbol: 'BNB/USDT', name: 'Binance Coin', price: 300, change: 3.8, volume: '450M' },
    { symbol: 'SOL/USDT', name: 'Solana', price: 120, change: 5.2, volume: '320M' },
    { symbol: 'XRP/USDT', name: 'Ripple', price: 0.52, change: -0.8, volume: '280M' },
    { symbol: 'ADA/USDT', name: 'Cardano', price: 0.45, change: 1.5, volume: '150M' },
  ]);
  
  // Real wallet balances from backend
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [coinBalance, setCoinBalance] = useState(0);
  const [openOrders, setOpenOrders] = useState([]);
  
  // Load wallet balances when pair is selected or on mount
  useEffect(() => {
    if (userId) {
      loadWalletBalances();
      loadOpenOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, selectedPair]);

  const loadWalletBalances = async () => {
    try {
      const response = await walletAPI.getWallets(userId);
      
      if (response.success && response.data) {
        // Find USDT balance
        const usdtWallet = response.data.find(w => w.symbol === 'USDT');
        setUsdtBalance(usdtWallet ? parseFloat(usdtWallet.balance) : 0);
        
        // Find selected coin balance
        if (selectedPair) {
          const coinSymbol = selectedPair.split('/')[0];
          const coinWallet = response.data.find(w => w.symbol === coinSymbol);
          setCoinBalance(coinWallet ? parseFloat(coinWallet.balance) : 0);
        }
      }
    } catch (err) {
      console.error('Error loading wallet balances:', err);
    }
  };
  
  const loadOpenOrders = async () => {
    try {
      const response = await tradingAPI.getSpotHistory(userId, 10);
      
      if (response.success && response.data) {
        // Filter for pending orders only (if backend supports status)
        setOpenOrders(response.data.slice(0, 5)); // Get last 5 transactions
      }
    } catch (err) {
      console.error('Error loading open orders:', err);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedPair) {
      setError('Vui lòng chọn cặp giao dịch!');
      return;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setError('Vui lòng nhập số lượng hợp lệ!');
      return;
    }
    
    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) {
      setError('Vui lòng nhập giá hợp lệ!');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const orderPrice = orderType === 'market' 
        ? coins.find(c => c.symbol === selectedPair)?.price || 0
        : parseFloat(price);
      
      const response = await tradingAPI.createSpotTransaction(userId, {
        symbol: selectedPair,
        type: orderType,
        side: side,
        amount: parseFloat(amount),
        price: orderPrice,
      });
      
      if (response.success) {
        setSuccess(`Đặt lệnh ${side === 'buy' ? 'mua' : 'bán'} thành công!`);
        setAmount('');
        setPrice('');
        
        // Reload balances and orders
        loadWalletBalances();
        loadOpenOrders();
        
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.message || 'Không thể đặt lệnh');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="spot-trading-page">
      <div className="trading-header">
        <h1>Giao dịch Spot</h1>
        <p className="text-secondary">Chọn coin để bắt đầu giao dịch</p>
      </div>

      {/* Coins List */}
      <div className="coins-section glass-card">
        <h3>Danh sách Coins</h3>
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
          <h2>📊 Chọn coin để xem biểu đồ và giao dịch</h2>
          <p>Vui lòng chọn một coin từ danh sách bên trên</p>
        </div>
      ) : (
        <>
          <div className="trading-pair-header">
            <div className="pair-info">
              <h2>{selectedPair}</h2>
              <div className="pair-stats">
                <span className="current-price">
                  ${coins.find(c => c.symbol === selectedPair)?.price.toLocaleString()}
                </span>
                <span className={`price-change ${coins.find(c => c.symbol === selectedPair)?.change >= 0 ? 'text-success' : 'text-danger'}`}>
                  {coins.find(c => c.symbol === selectedPair)?.change >= 0 ? '+' : ''}
                  {coins.find(c => c.symbol === selectedPair)?.change}%
                </span>
              </div>
            </div>
            {/* PnL Button in Header */}
            <button className="btn-pnl-header btn-gradient" onClick={() => navigate('/trading/pnl-analytics')}>
              <FiTrendingUp /> Phân Tích PnL
            </button>
          </div>

          {/* Full Width Chart Section */}
          <div className="chart-full-section">
            {selectedPair ? (
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

          {/* Binance-style Order Panel */}
          <div className="order-panel-binance">
            {/* Buy Side */}
            <div className="order-side buy-side">
              <div className="order-type-tabs">
                <button className={`type-tab ${orderType === 'limit' ? 'active' : ''}`} onClick={() => setOrderType('limit')}>
                  Giới hạn
                </button>
                <button className={`type-tab ${orderType === 'market' ? 'active' : ''}`} onClick={() => setOrderType('market')}>
                  Thị trường
                </button>
                <button className="type-tab">Stop Limit</button>
              </div>

              <div className="balance-row">
                <span className="label">Khả dụng</span>
                <span className="value">{usdtBalance.toLocaleString()} USDT</span>
              </div>

              {orderType === 'limit' && (
                <div className="input-group">
                  <label>Giá</label>
                  <div className="input-box">
                    <input type="number" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} />
                    <span className="suffix">USDT</span>
                  </div>
                </div>
              )}

              <div className="input-group">
                <label>Số lượng</label>
                <div className="input-box">
                  <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  <span className="suffix">{selectedPair?.split('/')[0]}</span>
                </div>
              </div>

              <div className="percentage-buttons">
                <button className="pct-btn">25%</button>
                <button className="pct-btn">50%</button>
                <button className="pct-btn">75%</button>
                <button className="pct-btn">100%</button>
              </div>

              <div className="total-row">
                <span className="label">Tổng</span>
                <span className="value">0.00 USDT</span>
              </div>

              <button className="btn-trade btn-buy" onClick={handlePlaceOrder}>
                Mua {selectedPair?.split('/')[0]}
              </button>
            </div>

            {/* Sell Side */}
            <div className="order-side sell-side">
              <div className="order-type-tabs">
                <button className={`type-tab ${orderType === 'limit' ? 'active' : ''}`} onClick={() => setOrderType('limit')}>
                  Giới hạn
                </button>
                <button className={`type-tab ${orderType === 'market' ? 'active' : ''}`} onClick={() => setOrderType('market')}>
                  Thị trường
                </button>
                <button className="type-tab">Stop Limit</button>
              </div>

              <div className="balance-row">
                <span className="label">Khả dụng</span>
                <span className="value">{coins.find(c => c.symbol === selectedPair)?.walletBalance || 0} {selectedPair?.split('/')[0]}</span>
              </div>

              {orderType === 'limit' && (
                <div className="input-group">
                  <label>Giá</label>
                  <div className="input-box">
                    <input type="number" placeholder="0.00" value={price} onChange={(e) => setPrice(e.target.value)} />
                    <span className="suffix">USDT</span>
                  </div>
                </div>
              )}

              <div className="input-group">
                <label>Số lượng</label>
                <div className="input-box">
                  <input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  <span className="suffix">{selectedPair?.split('/')[0]}</span>
                </div>
              </div>

              <div className="percentage-buttons">
                <button className="pct-btn">25%</button>
                <button className="pct-btn">50%</button>
                <button className="pct-btn">75%</button>
                <button className="pct-btn">100%</button>
              </div>

              <div className="total-row">
                <span className="label">Tổng</span>
                <span className="value">0.00 USDT</span>
              </div>

              <button className="btn-trade btn-sell" onClick={handlePlaceOrder}>
                Bán {selectedPair?.split('/')[0]}
              </button>
            </div>
          </div>

          <div className="open-orders-section">
        <div className="section-header">
          <h4>Lệnh mở</h4>
          <button className="btn-text">Hủy tất cả</button>
        </div>
        <div className="orders-table">
          <div className="empty-state">
            <p>Không có lệnh nào đang mở</p>
          </div>
        </div>
      </div>
        </>
      )}
    </div>
  );
};

export default SpotTradingPage;
