import { MarketData } from '@/app/lib/types';

const BINANCE_API = 'https://api.binance.com/api/v3/ticker/price';
const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/USD';

const CRYPTO_SYMBOL_MAP: Record<string, string> = {
  'BTC': 'BTCUSDT',
  'ETH': 'ETHUSDT',
  'SOL': 'SOLUSDT',
  'BNB': 'BNBUSDT',
  'USDT': 'USDTUSD',
};

/**
 * 抓取市場數據
 * 採用 Binance API 獲取加密貨幣，匯率採用 Open ER API，股市採用基準值模擬。
 */
export const fetchMarketData = async (symbols: { cryptos: string[]; stocks: string[] }): Promise<MarketData> => {
  let exchangeRate = 32.5; 
  const cryptoPrices: Record<string, number> = {};
  const stockPrices: Record<string, number> = {};

  // 1. 抓取匯率 (USD to TWD)
  try {
    const erResponse = await fetch(EXCHANGE_RATE_API);
    if (erResponse.ok) {
      const data = await erResponse.json();
      exchangeRate = data.rates.TWD;
    }
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error);
  }

  // 2. 抓取加密貨幣價格 (Binance) - 比 CoinGecko 穩定且無頻率限制問題
  try {
    if (symbols.cryptos.length > 0) {
      await Promise.all(symbols.cryptos.map(async (s) => {
        const binanceSymbol = CRYPTO_SYMBOL_MAP[s.toUpperCase()] || `${s.toUpperCase()}USDT`;
        try {
          const response = await fetch(`${BINANCE_API}?symbol=${binanceSymbol}`);
          if (response.ok) {
            const data = await response.json();
            cryptoPrices[s.toUpperCase()] = parseFloat(data.price);
          }
        } catch (e) {
          console.warn(`Failed to fetch crypto ${s} from Binance`);
        }
      }));
    }
  } catch (error) {
    console.error('Failed to fetch crypto prices:', error);
  }

  // 3. 股市價格模擬 (採用基準值 + 隨機波動，確保前端不噴 CORS 錯誤)
  const stockFallbacks: Record<string, number> = {
    'QQQ': 445.5,
    'VTI': 260.2,
    'SCHG': 95.8,
    'NVDA': 140.5,
    'AAPL': 225.0,
    'TSLA': 350.0,
    '0050': 198.5,
    '2330': 1050.0,
    '2317': 210.0
  };

  symbols.stocks.forEach(s => {
    const basePrice = stockFallbacks[s.toUpperCase()] || 100;
    const volatility = 1 + (Math.random() * 0.004 - 0.002);
    stockPrices[s.toUpperCase()] = parseFloat((basePrice * volatility).toFixed(2));
  });

  return {
    exchangeRate,
    rates: {
      TWD: exchangeRate,
      CNY: exchangeRate / 4.5, 
      USD: 1
    },
    cryptoPrices,
    stockPrices,
  };
};
