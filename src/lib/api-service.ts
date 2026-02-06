import { MarketData } from '@/app/lib/types';

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';
const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/USD';

const CRYPTO_ID_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'BNB': 'binancecoin',
  'USDT': 'tether',
  'USDC': 'usd-coin',
};

/**
 * 抓取市場數據
 * 使用模擬數值配合隨機波動，確保在 GitHub Pages 靜態環境下也能有穩定的「即時感」。
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

  // 2. 抓取加密貨幣價格 (CoinGecko)
  try {
    if (symbols.cryptos.length > 0) {
      const ids = symbols.cryptos.map(s => CRYPTO_ID_MAP[s.toUpperCase()] || s.toLowerCase()).join(',');
      const cgResponse = await fetch(`${COINGECKO_API}?ids=${ids}&vs_currencies=usd`);
      if (cgResponse.ok) {
        const data = await cgResponse.json();
        symbols.cryptos.forEach(s => {
          const id = CRYPTO_ID_MAP[s.toUpperCase()] || s.toLowerCase();
          if (data[id]) {
            cryptoPrices[s.toUpperCase()] = data[id].usd;
          }
        });
      }
    }
  } catch (error) {
    console.error('Failed to fetch crypto prices:', error);
  }

  // 3. 股市價格模擬 (依照指令改回模擬方式)
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
    // 加入 +/- 0.2% 的隨機波動
    const volatility = 1 + (Math.random() * 0.004 - 0.002);
    stockPrices[s.toUpperCase()] = parseFloat((basePrice * volatility).toFixed(2));
  });

  return {
    exchangeRate,
    rates: {
      TWD: exchangeRate,
      CNY: exchangeRate / 4.5, // 估算人民幣匯率
      USD: 1
    },
    cryptoPrices,
    stockPrices,
  };
};
