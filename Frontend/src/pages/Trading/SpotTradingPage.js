import React, { useState, useEffect, useMemo } from 'react';
import { FiPieChart, FiArrowUpCircle, FiArrowDownCircle, FiX } from 'react-icons/fi';
import LivePriceChart from '../../components/LivePriceChart/LivePriceChart';
import { useAuth } from '../../hooks/useAuth';
import { walletAPI, tradingAPI } from '../../services/api';
import cryptoWebSocket from '../../services/cryptoWebSocket';
import binanceAPI from '../../services/binanceAPI';
import './SpotTradingPage.css';

const SUPPORTED_PAIRS = [
  { symbol: 'BTC/USDT', name: 'Bitcoin', icon: '₿', price: 0 },
  { symbol: 'ETH/USDT', name: 'Ethereum', icon: 'Ξ', price: 0 },
  { symbol: 'BNB/USDT', name: 'BNB', icon: '◇', price: 0 },
  { symbol: 'SOL/USDT', name: 'Solana', icon: '◎', price: 0 },
  { symbol: 'XRP/USDT', name: 'Ripple', icon: '✦', price: 0 },
  { symbol: 'ADA/USDT', name: 'Cardano', icon: '◈', price: 0 },
];

const formatNumber = (value, fractionDigits = 2) =>
  Number(value || 0).toLocaleString('vi-VN', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  });

const resolveAssetSymbol = (symbol = '', pair = '') => {
  if (!symbol) return pair;
  if (symbol.includes('/')) return symbol;
  return `${symbol.toUpperCase()}/USDT`;
};

const matchesAssetSymbol = (symbol = '', base, pair) => {
  if (!symbol) return false;
  return symbol.toUpperCase() === base.toUpperCase() || symbol.toUpperCase() === pair.toUpperCase();
};

const SpotTradingPage = () => {
  const { userId } = useAuth();
  const [selectedPair, setSelectedPair] = useState(SUPPORTED_PAIRS[0].symbol);
  const [side, setSide] = useState('buy');
  const [amount, setAmount] = useState('');
  const [spotWalletId, setSpotWalletId] = useState(null);
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [holdings, setHoldings] = useState([]);
  const [holdingsLoading, setHoldingsLoading] = useState(false);
  const [openOrders, setOpenOrders] = useState([]);
  const [priceTickers, setPriceTickers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAssets, setShowAssets] = useState(false);

  const baseAsset = useMemo(() => selectedPair.split('/')[0], [selectedPair]);
  const selectedMeta = useMemo(
    () => SUPPORTED_PAIRS.find((pair) => pair.symbol === selectedPair),
    [selectedPair]
  );
  const activeTicker = priceTickers[selectedPair];
  const activePrice = activeTicker?.price || selectedMeta?.price || 0;
  const coinHolding = useMemo(
    () => holdings.find((asset) => matchesAssetSymbol(asset.symbol, baseAsset, selectedPair)),
    [holdings, baseAsset, selectedPair]
  );
  const coinBalance = coinHolding ? parseFloat(coinHolding.unit_number || 0) : 0;
  const estimatedCost = parseFloat(amount || 0) * activePrice;

  // Subscribe to Binance websocket streams once
  useEffect(() => {
    const unsubscribers = SUPPORTED_PAIRS.map(({ symbol }) => {
      const streamSymbol = symbol.replace('/', '').toUpperCase();
      return cryptoWebSocket.subscribe(streamSymbol, (ticker) => {
        setPriceTickers((prev) => ({
          ...prev,
          [symbol]: {
            price: ticker.price,
            change: ticker.change24h,
            changePercent: ticker.changePercent24h,
            high: ticker.high24h,
            low: ticker.low24h,
            volume: ticker.volume24h,
            timestamp: ticker.timestamp,
          },
        }));
      });
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe && unsubscribe());
    };
  }, []);

  // Fetch initial prices so UI has data before websocket pushes
  useEffect(() => {
    let cancelled = false;
    const bootstrapPrices = async () => {
      try {
        const results = await Promise.all(
          SUPPORTED_PAIRS.map(async ({ symbol }) => {
            const apiSymbol = symbol.replace('/', '');
            const price = await binanceAPI.getCurrentPrice(apiSymbol);
            return { symbol, price };
          })
        );

        if (cancelled) return;
        setPriceTickers((prev) => {
          const next = { ...prev };
          results.forEach(({ symbol, price }) => {
            if (!price) return;
            next[symbol] = {
              ...(next[symbol] || {}),
              price,
            };
          });
          return next;
        });
      } catch (err) {
        console.error('Failed to bootstrap prices', err);
      }
    };

    bootstrapPrices();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadSpotHoldings = async (walletId) => {
    if (!walletId || !userId) return;
    try {
      setHoldingsLoading(true);
      const response = await walletAPI.getWalletWithProperties(userId, walletId);
      if (response.success && response.data) {
        setUsdtBalance(parseFloat(response.data.balance) || 0);
        setHoldings(response.data.properties || []);
      }
    } catch (err) {
      console.error('Failed to load holdings', err);
    } finally {
      setHoldingsLoading(false);
    }
  };

  const loadOpenOrders = async (walletId) => {
    if (!walletId || !userId) {
      setOpenOrders([]);
      return;
    }
    try {
      const response = await tradingAPI.getSpotHistory(userId, walletId);
      if (response.success && Array.isArray(response.data)) {
        setOpenOrders(response.data.slice(0, 5));
      } else {
        setOpenOrders([]);
      }
    } catch (err) {
      console.error('Failed to load spot history', err);
      setOpenOrders([]);
    }
  };

  const loadWallets = async () => {
    if (!userId) return;
    try {
      const response = await walletAPI.getWallets(userId);
      if (response.success && Array.isArray(response.data)) {
        const spotWallet = response.data.find((wallet) => wallet.type === 'spot');
        if (spotWallet) {
          setSpotWalletId(spotWallet.wallet_id);
          setUsdtBalance(parseFloat(spotWallet.balance) || 0);
          loadSpotHoldings(spotWallet.wallet_id);
          loadOpenOrders(spotWallet.wallet_id);
        } else {
          setSpotWalletId(null);
          setUsdtBalance(0);
          setHoldings([]);
          setOpenOrders([]);
        }
      }
    } catch (err) {
      console.error('Failed to load wallets', err);
      setError('Không thể tải dữ liệu ví Spot');
    }
  };

  useEffect(() => {
    loadWallets();
  }, [userId]);

  useEffect(() => {
    if (spotWalletId) {
      loadSpotHoldings(spotWalletId);
      loadOpenOrders(spotWalletId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotWalletId]);

  const handlePlaceOrder = async () => {
    if (!userId || !spotWalletId) {
      setError('Bạn chưa có ví Spot để giao dịch');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Vui lòng nhập số lượng hợp lệ');
      return;
    }

    if (!activePrice) {
      setError('Không thể lấy giá thị trường. Vui lòng thử lại');
      return;
    }

    if (side === 'buy' && estimatedCost > usdtBalance) {
      setError('Số dư USDT không đủ để mua');
      return;
    }

    if (side === 'sell' && parseFloat(amount) > coinBalance) {
      setError(`Bạn chỉ còn ${formatNumber(coinBalance)} ${baseAsset} để bán`);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const quantity = parseFloat(amount);
      if (side === 'buy') {
        await tradingAPI.spotBuy(userId, spotWalletId, selectedPair, quantity, activePrice);
      } else {
        await tradingAPI.spotSell(userId, spotWalletId, selectedPair, quantity, activePrice);
      }

      setSuccess(side === 'buy' ? 'Đặt lệnh mua thành công' : 'Đặt lệnh bán thành công');
      setAmount('');
      loadSpotHoldings(spotWalletId);
      loadOpenOrders(spotWalletId);
    } catch (err) {
      setError(err?.message || 'Không thể thực hiện lệnh. Vui lòng thử lại');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(null), 4000);
    }
  };

  const renderOrderRow = (order) => {
    const typeLabel = order.type === 'buy' ? 'Mua' : 'Bán';
    const timestamp = order.ts ? new Date(order.ts).toLocaleString('vi-VN') : '--';
    const orderBase = order.symbol?.includes('/') ? order.symbol.split('/')[0] : order.symbol;
    return (
      <div key={order.transaction_id} className="order-history-row">
        <div>
          <span className={`tag ${order.type}`}>{typeLabel}</span>
          <p>{order.symbol}</p>
        </div>
        <div>
          <strong>
            {formatNumber(order.unit_numbers, 4)} {orderBase}
          </strong>
          <p className="text-secondary">@ {formatNumber(order.index_price)}</p>
        </div>
        <div className="text-right">
          <span className="text-secondary">{timestamp}</span>
        </div>
      </div>
    );
  };

  const assetRows = holdings.map((asset) => {
    const pairSymbol = resolveAssetSymbol(asset.symbol, selectedPair);
    const price = priceTickers[pairSymbol]?.price || 0;
    const value = price * parseFloat(asset.unit_number || 0);
    return (
      <div key={`${asset.wallet_id}-${asset.symbol}`} className="asset-row">
        <div>
          <strong>{asset.symbol}</strong>
          <p className="text-secondary">Giá mua TB: {formatNumber(asset.average_buy_price || 0)}</p>
        </div>
        <div className="text-right">
          <strong>{formatNumber(asset.unit_number || 0, 6)}</strong>
          <p className="text-secondary">{value ? `${formatNumber(value)} USDT` : '--'}</p>
        </div>
      </div>
    );
  });

  return (
    <div className="spot-trading-page">
      <div className="page-header">
        <div>
          <h1>Giao dịch Spot</h1>
          <p className="text-secondary">Lệnh thị trường với dữ liệu giá real-time từ Binance</p>
        </div>
        <button className="btn btn-secondary" onClick={() => setShowAssets(true)}>
          <FiPieChart /> Tài sản của tôi
        </button>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="spot-layout">
        <div className="spot-left">
          <div className="coins-section glass-card">
            <h3>Cặp giao dịch</h3>
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
                      <span className="coin-icon">{pair.icon}</span>
                      <div>
                        <strong>{pair.symbol}</strong>
                        <p className="text-secondary">{pair.name}</p>
                      </div>
                    </div>
                    <div className="coin-price">
                      ${formatNumber(ticker?.price || pair.price || 0, 2)}
                    </div>
                    <span className={`coin-change ${ticker?.changePercent >= 0 ? 'positive' : 'negative'}`}>
                      {ticker?.changePercent ? `${ticker.changePercent.toFixed(2)}%` : '--'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="order-panel-binance">
            <div className="order-panel-header">
              <div>
                <p className="text-secondary">Giá hiện tại</p>
                <h2>${formatNumber(activePrice || 0, activePrice > 10 ? 2 : 4)}</h2>
              </div>
              <div className="panel-stats">
                <span>Cao 24h: {formatNumber(activeTicker?.high || 0)}</span>
                <span>Thấp 24h: {formatNumber(activeTicker?.low || 0)}</span>
              </div>
            </div>

            <div className="side-switch">
              <button
                className={side === 'buy' ? 'active buy' : ''}
                onClick={() => setSide('buy')}
              >
                <FiArrowUpCircle /> Mua
              </button>
              <button
                className={side === 'sell' ? 'active sell' : ''}
                onClick={() => setSide('sell')}
              >
                <FiArrowDownCircle /> Bán
              </button>
            </div>

            <div className="order-field">
              <label>Số lượng ({baseAsset})</label>
              <input
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Nhập số ${baseAsset} muốn ${side === 'buy' ? 'mua' : 'bán'}`}
              />
            </div>

            <div className="order-summary">
              <span>Giá thị trường</span>
              <strong>${formatNumber(activePrice || 0, activePrice > 10 ? 2 : 4)}</strong>
            </div>

            <div className="order-summary">
              <span>Tổng giá trị ước tính</span>
              <strong>${formatNumber(estimatedCost || 0)}</strong>
            </div>

            <div className="balance-row">
              <span>Số dư USDT</span>
              <strong>{formatNumber(usdtBalance)}</strong>
            </div>

            <div className="balance-row">
              <span>Số dư {baseAsset}</span>
              <strong>{formatNumber(coinBalance, 6)}</strong>
            </div>

            <button className="btn btn-primary btn-gradient" onClick={handlePlaceOrder} disabled={loading}>
              {loading ? 'Đang xử lý...' : side === 'buy' ? 'Mua ngay' : 'Bán ngay'}
            </button>
          </div>

          <div className="glass-card order-history-card">
            <div className="card-header">
              <h3>Lịch sử gần đây</h3>
            </div>
            {openOrders.length === 0 ? (
              <p className="text-secondary">Chưa có giao dịch nào</p>
            ) : (
              openOrders.map(renderOrderRow)
            )}
          </div>
        </div>

        <div className="spot-right">
          <div className="chart-card glass-card">
            <div className="chart-header">
              <h3>Biểu đồ giá {selectedPair}</h3>
              <button className="btn-text" onClick={() => setShowAssets(true)}>
                <FiPieChart /> Danh mục coin
              </button>
            </div>
            <LivePriceChart symbol={selectedPair.replace('/', '')} height={520} />
          </div>

          <div className="market-stats glass-card">
            <h3>Số liệu thị trường</h3>
            <div className="stats-grid">
              <div>
                <p className="text-secondary">Khối lượng 24h</p>
                <strong>{formatNumber(activeTicker?.volume || 0)}</strong>
              </div>
              <div>
                <p className="text-secondary">Thay đổi 24h</p>
                <strong className={activeTicker?.changePercent >= 0 ? 'text-success' : 'text-danger'}>
                  {activeTicker?.changePercent ? `${activeTicker.changePercent.toFixed(2)}%` : '--'}
                </strong>
              </div>
              <div>
                <p className="text-secondary">Thời gian cập nhật</p>
                <strong>
                  {activeTicker?.timestamp ? new Date(activeTicker.timestamp).toLocaleTimeString('vi-VN') : '--'}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAssets && (
        <div className="asset-drawer-overlay" onClick={() => setShowAssets(false)}>
          <div className="asset-drawer glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <h3>Tài sản Spot</h3>
                <p className="text-secondary">{holdings.length} loại coin đang nắm giữ</p>
              </div>
              <button className="drawer-close" onClick={() => setShowAssets(false)}>
                <FiX />
              </button>
            </div>
            {holdingsLoading ? (
              <p>Đang tải dữ liệu...</p>
            ) : holdings.length === 0 ? (
              <p className="text-secondary">Chưa có tài sản nào trong ví Spot</p>
            ) : (
              <div className="asset-list">{assetRows}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpotTradingPage;
