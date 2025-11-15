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
  { symbol: 'ADA/USDT', name: 'Cardano' }
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
    const [activeTab, setActiveTab] = useState('trading');
    const [futureHistory, setFutureHistory] = useState([]);

    const activeTicker = priceTickers[selectedPair];
    const activePrice = activeTicker?.price || 0;
    const walletBalance = parseFloat(futureWallet?.balance || 0);
    const positionPreview = margin && activePrice ? (parseFloat(margin) * leverage) / activePrice : 0;

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

    const createFutureWallet = async () => {
      if (!userId) {
        setError('Bạn cần đăng nhập để tạo ví Futures');
        return;
      }
      try {
        setLoading(true);
        const res = await walletAPI.createWallet(userId, 'future');
        if (res && res.success && res.data) {
          await loadFutureWallet();
          setSuccess('Đã tạo ví Futures');
        } else {
          setError(res?.message || 'Không thể tạo ví Futures');
        }
      } catch (e) {
        console.error('Failed to create future wallet', e);
        setError('Lỗi khi tạo ví Futures');
      } finally {
        setLoading(false);
        setTimeout(() => setSuccess(null), 3000);
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
      // also load history when wallet available
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    useEffect(() => {
      const loadHistory = async () => {
        if (!futureWallet || !userId) return;
        try {
          const res = await tradingAPI.getFutureHistory(userId, futureWallet.wallet_id);
          if (res && res.success && Array.isArray(res.data)) {
            setFutureHistory(res.data);
          } else if (Array.isArray(res)) {
            setFutureHistory(res);
          } else {
            setFutureHistory([]);
          }
        } catch (err) {
          console.error('Failed to load future history', err);
          setFutureHistory([]);
        }
      };

      loadHistory();
    }, [futureWallet, userId]);

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
        // send base asset symbol (e.g. 'BTC') to match properties table
        const symbolToSend = selectedPair.includes('/') ? selectedPair.split('/')[0] : selectedPair;
        const res = await tradingAPI.openFuturePosition({
          userId,
          walletId: futureWallet.wallet_id,
          symbol: symbolToSend,
          side,
          margin: parseFloat(margin),
          entryPrice: activePrice,
          leverage,
        });
        console.log('openFuturePosition response', res);

        setSuccess('Đã mở vị thế thành công');
        setMargin('');
        await loadFutureWallet();
        await loadOpenPositions();
      } catch (err) {
        console.error('Open future error:', err);
        const msg = err?.message || err?.error || (err && typeof err === 'string' ? err : null) || 'Không thể mở vị thế';
        setError(msg);
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
        await loadFutureWallet();
        await loadOpenPositions();
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
      const rawPnl = order.side === 'long' ? (markPrice - entry) * size : (entry - markPrice) * size;
      const pnlPercent = marginAmount ? (rawPnl / marginAmount) * 100 : 0;
      return { pnl: rawPnl, pnlPercent };
    };

    const pendingPositions = openPositions.map((order) => {
      const { pnl, pnlPercent } = calculatePnL(order);
      return { ...order, pnl, pnlPercent };
    });

    return (
      <div className="futures-trading-page">
        <div className="tabs">
          <button className={activeTab === 'trading' ? 'active' : ''} onClick={() => setActiveTab('trading')}>Giao dịch</button>
          <button className={activeTab === 'positions' ? 'active' : ''} onClick={() => setActiveTab('positions')}>Lệnh đang mở</button>
          <button className={activeTab === 'history' ? 'active' : ''} onClick={() => setActiveTab('history')}>Lịch sử</button>
        </div>

        {activeTab === 'trading' ? (
          <div className="trading-full-width">
            <div className="coin-grid">
              {SUPPORTED_PAIRS.map((pair) => (
                <div
                  key={pair.symbol}
                  className={`coin-card ${selectedPair === pair.symbol ? 'active' : ''}`}
                  onClick={() => setSelectedPair(pair.symbol)}
                >
                  <h3>{pair.name}</h3>
                  <p>{formatNumber(priceTickers[pair.symbol]?.price || 0)} USDT</p>
                </div>
              ))}
            </div>

            <div className="chart-card" style={{ width: '100%', backgroundColor: '#000' }}>
              <LivePriceChart symbol={selectedPair.replace('/', '')} height={520} />
            </div>

            <div className="order-panel-compact">
              <div className="wallet-banner">
                <p className="text-secondary">Số dư khả dụng</p>
                {futureWallet ? (
                  <>
                    <h3 className="balance-value">{formatNumber(walletBalance)} USDT</h3>
                    <span className="badge">Đòn bẩy {leverage}x</span>
                  </>
                ) : (
                  <>
                    <h3 className="balance-value">--</h3>
                    <p className="text-secondary">Chưa có ví Futures</p>
                  </>
                )}
              </div>

              <div className="side-switch-compact">
                <button
                  className={`btn-buy ${side === 'long' ? 'active' : ''}`}
                  onClick={() => setSide('long')}
                >
                  Long
                </button>
                <button
                  className={`btn-sell ${side === 'short' ? 'active' : ''}`}
                  onClick={() => setSide('short')}
                >
                  Short
                </button>
              </div>

              <div className="order-field">
                <label>Ký quỹ (USDT)</label>
                <input
                  type="number"
                  value={margin}
                  onChange={(e) => setMargin(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                />
              </div>

              <div className="lever-field">
                <label>Đòn bẩy: <strong>{leverage}x</strong></label>
                <input type="range" min="1" max={MAX_LEVERAGE} value={leverage} onChange={(e) => setLeverage(Number(e.target.value))} />
              </div>

              <div className="order-summary compact">
                <span>Vị thế ước tính</span>
                <strong>{formatNumber(positionPreview || 0)} {selectedPair.split('/')[0]}</strong>
              </div>

              {!futureWallet ? (
                <button className="btn-trade btn-primary" onClick={createFutureWallet} disabled={loading}>
                  {loading ? 'Đang xử lý...' : 'Tạo ví Futures'}
                </button>
              ) : (
                <button className="btn-trade btn-primary" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Đang tạo lệnh...' : 'Mở vị thế'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="tab-content">
            {activeTab === 'positions' && (
              <div className="positions-list glass-card">
                <div className="card-header"><h3>Lệnh đang mở</h3></div>
                {openPositions.length === 0 ? (
                  <p className="text-secondary">Chưa có vị thế Futures nào</p>
                ) : (
                  <div className="positions-grid">
                    {pendingPositions.map((order) => (
                      <div key={order.future_order_id} className="position-row">
                        <div>
                          <span className={`tag ${order.side === 'long' ? 'buy' : 'sell'}`}>
                            {order.side === 'long' ? 'Long' : 'Short'}
                          </span>
                          <p>{order.symbol}</p>
                        </div>
                        <div>
                          <p>Entry</p>
                          <strong>${formatNumber(order.entry_price)}</strong>
                        </div>
                        <div>
                          <p>Kích thước</p>
                          <strong>{formatNumber(order.position_size, 4)}</strong>
                        </div>
                        <div className="position-actions">
                          <button className="btn btn-secondary" onClick={() => handleClosePosition(order)} disabled={closingId === order.future_order_id}>
                            {closingId === order.future_order_id ? 'Đang đóng...' : 'Đóng vị thế'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="order-history-card glass-card">
                <div className="card-header"><h3>Lịch sử Futures</h3></div>
                {futureHistory.length === 0 ? (
                  <p className="text-secondary">Chưa có lịch sử Futures nào</p>
                ) : (
                  <div className="order-history-list">
                    {futureHistory.map((order) => (
                      <div key={order.future_order_id} className="order-history-row">
                        <div>
                          <span className={`tag ${order.side === 'long' ? 'buy' : 'sell'}`}>{order.side === 'long' ? 'Long' : 'Short'}</span>
                          <p>{order.symbol}</p>
                        </div>
                        <div>
                          <strong>{formatNumber(order.position_size, 4)}</strong>
                          <p className="text-secondary">Entry @ {formatNumber(order.entry_price)}</p>
                        </div>
                        <div className="text-right">
                          <span className="text-secondary">{order.open_ts ? new Date(order.open_ts).toLocaleString('vi-VN') : '--'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  export default FuturesTradingPage;

