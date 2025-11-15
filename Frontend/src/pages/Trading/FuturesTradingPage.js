import React, { useState, useEffect, useMemo } from 'react';
import { FiTrendingUp, FiAlertTriangle, FiArrowUpCircle, FiArrowDownCircle } from 'react-icons/fi';
import LivePriceChart from '../../components/LivePriceChart/LivePriceChart';
import { useAuth } from '../../hooks/useAuth';
import { walletAPI, tradingAPI } from '../../services/api';
import cryptoWebSocket from '../../services/cryptoWebSocket';
import binanceAPI from '../../services/binanceAPI';
import './FuturesTradingPage.css';

const SUPPORTED_PAIRS = [
  { symbol: 'BTC/USDT', name: 'Bitcoin' },
  { symbol: 'ETH/USDT', name: 'Ethereum' },
  { symbol: 'BNB/USDT', name: 'BNB' },
  { symbol: 'SOL/USDT', name: 'Solana' },
  { symbol: 'XRP/USDT', name: 'Ripple' },
  { symbol: 'ADA/USDT', name: 'Cardano' },
];

const MAX_LEVERAGE = 5;

const formatNumber = (value, digits = 2) =>
  Number(value || 0).toLocaleString('vi-VN', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const FuturesTradingPage = () => {
  const { userId } = useAuth();
  const [selectedPair, setSelectedPair] = useState(SUPPORTED_PAIRS[0].symbol);
  const [side, setSide] = useState('long');
  const [margin, setMargin] = useState('');
  const [leverage, setLeverage] = useState(2);
  const [futureWallet, setFutureWallet] = useState(null);
  const [priceTickers, setPriceTickers] = useState({});
  const [openPositions, setOpenPositions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [closingId, setClosingId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const activeTicker = priceTickers[selectedPair];
  const activePrice = activeTicker?.price || 0;
  const walletBalance = parseFloat(futureWallet?.balance || 0);
  const positionPreview =
    margin && activePrice ? (parseFloat(margin) * leverage) / activePrice : 0;

  // Subscribe to websocket tickers
  useEffect(() => {
    const unsubscribers = SUPPORTED_PAIRS.map(({ symbol }) => {
      const normalized = symbol.replace('/', '').toUpperCase();
      return cryptoWebSocket.subscribe(normalized, (ticker) => {
        setPriceTickers((prev) => ({
          ...prev,
          [symbol]: {
            price: ticker.price,
            changePercent: ticker.changePercent24h,
            high: ticker.high24h,
            low: ticker.low24h,
            volume: ticker.volume24h,
          },
        }));
      });
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe && unsubscribe());
    };
  }, []);

  // Bootstrap initial prices
  useEffect(() => {
    let cancelled = false;
    const fetchInitial = async () => {
      const prices = await Promise.all(
        SUPPORTED_PAIRS.map(async ({ symbol }) => {
          const res = await binanceAPI.getCurrentPrice(symbol.replace('/', ''));
          return { symbol, price: res };
        })
      );
      if (cancelled) return;
      setPriceTickers((prev) => {
        const next = { ...prev };
        prices.forEach(({ symbol, price }) => {
          if (price) {
            next[symbol] = { ...(next[symbol] || {}), price };
          }
        });
        return next;
      });
    };

    fetchInitial();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadFutureWallet = async () => {
    if (!userId) return;
    try {
      const response = await walletAPI.getWalletByType(userId, 'future');
      if (response.success && response.data) {
        setFutureWallet(response.data);
      } else {
        setFutureWallet(null);
      }
    } catch (err) {
      console.error('Failed to load future wallet', err);
      setFutureWallet(null);
    }
  };

  const loadOpenPositions = async () => {
    if (!userId) return;
    try {
      const response = await tradingAPI.getOpenFutures(userId);
      if (response.success && Array.isArray(response.data)) {
        setOpenPositions(response.data);
      } else {
        setOpenPositions([]);
      }
    } catch (err) {
      console.error('Failed to load futures orders', err);
      setOpenPositions([]);
    }
  };

  useEffect(() => {
    loadFutureWallet();
    loadOpenPositions();
  }, [userId]);

  const handleSubmit = async () => {
    if (!futureWallet) {
      setError('Bạn chưa có ví Futures để giao dịch');
      return;
    }

    if (!margin || parseFloat(margin) <= 0) {
      setError('Vui lòng nhập số tiền ký quỹ hợp lệ');
      return;
    }

    if (!activePrice) {
      setError('Không thể lấy giá thị trường');
      return;
    }

    if (parseFloat(margin) > walletBalance) {
      setError('Số dư Futures không đủ');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await tradingAPI.openFuturePosition({
        userId,
        walletId: futureWallet.wallet_id,
        symbol: selectedPair,
        side,
        margin: parseFloat(margin),
        entryPrice: activePrice,
        leverage,
      });
      setSuccess('Đã mở vị thế thành công');
      setMargin('');
      loadFutureWallet();
      loadOpenPositions();
    } catch (err) {
      setError(err?.message || 'Không thể mở vị thế');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 3500);
    }
  };

  const handleClosePosition = async (order) => {
    const markPrice = priceTickers[order.symbol]?.price;
    if (!markPrice) {
      setError('Không thể lấy giá mark để đóng lệnh');
      return;
    }
    try {
      setClosingId(order.future_order_id);
      await tradingAPI.closeFuturePosition({
        orderId: order.future_order_id,
        userId,
        exitPrice: markPrice,
      });
      setSuccess('Đã đóng vị thế');
      loadFutureWallet();
      loadOpenPositions();
    } catch (err) {
      setError(err?.message || 'Không thể đóng vị thế');
    } finally {
      setClosingId(null);
      setTimeout(() => setSuccess(null), 3500);
    }
  };

  const calculatePnL = (order) => {
    const markPrice = priceTickers[order.symbol]?.price;
    if (!markPrice) return { pnl: 0, pnlPercent: 0 };
    const entry = parseFloat(order.entry_price);
    const size = parseFloat(order.position_size);
    const marginAmount = parseFloat(order.margin);
    const rawPnl =
      order.side === 'long'
        ? (markPrice - entry) * size
        : (entry - markPrice) * size;
    const pnlPercent = marginAmount ? (rawPnl / marginAmount) * 100 : 0;
    return { pnl: rawPnl, pnlPercent };
  };

  const pendingPositions = openPositions.map((order) => {
    const { pnl, pnlPercent } = calculatePnL(order);
    return { ...order, pnl, pnlPercent };
  });

  return (
    <div className="futures-trading-page">
      <div className="page-header">
        <div>
          <h1>Giao dịch Futures</h1>
          <p className="text-secondary">Chỉ hỗ trợ lệnh thị trường với đòn bẩy tối đa 5x</p>
        </div>
        <button className="btn btn-secondary" onClick={loadFutureWallet}>
          Làm mới số dư
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="futures-grid">
        <div className="futures-left">
          <div className="coins-section glass-card">
            <h3>Cặp được hỗ trợ</h3>
            <div className="coins-grid">
              {SUPPORTED_PAIRS.map((pair) => {
                const ticker = priceTickers[pair.symbol];
                const isActive = pair.symbol === selectedPair;
                return (
                  <div
                    key={pair.symbol}
                    className={`coin-card ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedPair(pair.symbol)}
                  >
                    <div className="coin-header">
                      <strong>{pair.symbol}</strong>
                      <span className={`coin-change ${ticker?.changePercent >= 0 ? 'positive' : 'negative'}`}>
                        {ticker?.changePercent ? `${ticker.changePercent.toFixed(2)}%` : '--'}
                      </span>
                    </div>
                    <div className="coin-price">${formatNumber(ticker?.price || 0)}</div>
                    <p className="text-secondary">{pair.name}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-card futures-order-panel">
            <div className="wallet-banner">
              <div>
                <p className="text-secondary">Số dư khả dụng</p>
                <h2>{formatNumber(walletBalance)} USDT</h2>
              </div>
              <span className="badge">Đòn bẩy 1 - {MAX_LEVERAGE}x</span>
            </div>

            {!futureWallet && (
              <div className="alert alert-warning">
                <FiAlertTriangle /> Bạn chưa có ví Futures. Vui lòng tạo ví trong phần ví của tôi trước.
              </div>
            )}

            <div className="side-switch">
              <button className={side === 'long' ? 'active buy' : ''} onClick={() => setSide('long')}>
                <FiArrowUpCircle /> Long (Mua)
              </button>
              <button className={side === 'short' ? 'active sell' : ''} onClick={() => setSide('short')}>
                <FiArrowDownCircle /> Short (Bán)
              </button>
            </div>

            <div className="order-field">
              <label>Ký quỹ (USDT)</label>
              <input
                type="number"
                min="0"
                value={margin}
                onChange={(e) => setMargin(e.target.value)}
                placeholder="Nhập số USDT muốn sử dụng"
              />
            </div>

            <div className="lever-field">
              <label>
                Đòn bẩy: <strong>{leverage}x</strong>
              </label>
              <input
                type="range"
                min="1"
                max={MAX_LEVERAGE}
                value={leverage}
                onChange={(e) => setLeverage(Number(e.target.value))}
              />
            </div>

            <div className="order-summary">
              <span>Giá thị trường</span>
              <strong>${formatNumber(activePrice || 0)}</strong>
            </div>

            <div className="order-summary">
              <span>Kích thước vị thế ước tính</span>
              <strong>
                {formatNumber(positionPreview || 0, 4)} {selectedPair.split('/')[0]}
              </strong>
            </div>

            <button
              className="btn btn-primary btn-gradient"
              onClick={handleSubmit}
              disabled={loading || !futureWallet}
            >
              {loading ? 'Đang tạo lệnh...' : 'Mở vị thế'}
            </button>
          </div>

          <div className="glass-card">
            <div className="card-header">
              <h3>Lệnh đang mở</h3>
            </div>
            {pendingPositions.length === 0 ? (
              <p className="text-secondary">Chưa có vị thế Futures nào</p>
            ) : (
              <div className="positions-list">
                {pendingPositions.map((order) => (
                  <div key={order.future_order_id} className="position-row">
                    <div>
                      <span className={`tag ${order.side === 'long' ? 'buy' : 'sell'}`}>
                        {order.side === 'long' ? 'Long' : 'Short'}
                      </span>
                      <p>{order.symbol}</p>
                      <p className="text-secondary">Đòn bẩy {order.leverage}x</p>
                    </div>
                    <div>
                      <p>Entry</p>
                      <strong>${formatNumber(order.entry_price)}</strong>
                    </div>
                    <div>
                      <p>Kích thước</p>
                      <strong>{formatNumber(order.position_size, 4)}</strong>
                    </div>
                    <div>
                      <p>PNL</p>
                      <strong className={order.pnl >= 0 ? 'text-success' : 'text-danger'}>
                        {formatNumber(order.pnl)} USDT
                      </strong>
                      <p className={order.pnlPercent >= 0 ? 'text-success' : 'text-danger'}>
                        {order.pnlPercent ? `${order.pnlPercent.toFixed(2)}%` : '--'}
                      </p>
                    </div>
                    <div className="text-right">
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleClosePosition(order)}
                        disabled={closingId === order.future_order_id}
                      >
                        {closingId === order.future_order_id ? 'Đang đóng...' : 'Đóng lệnh'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="futures-right">
          <div className="glass-card">
            <div className="chart-header">
              <h3>Biểu đồ {selectedPair}</h3>
              <span className="badge">
                <FiTrendingUp /> {selectedPair}
              </span>
            </div>
            <LivePriceChart symbol={selectedPair.replace('/', '')} height={520} />
          </div>
          <div className="glass-card market-stats">
            <h3>Chỉ số thị trường</h3>
            <div className="stats-grid">
              <div>
                <p className="text-secondary">Cao 24h</p>
                <strong>${formatNumber(activeTicker?.high || 0)}</strong>
              </div>
              <div>
                <p className="text-secondary">Thấp 24h</p>
                <strong>${formatNumber(activeTicker?.low || 0)}</strong>
              </div>
              <div>
                <p className="text-secondary">Khối lượng 24h</p>
                <strong>{formatNumber(activeTicker?.volume || 0)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FuturesTradingPage;

