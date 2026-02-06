import { MarketData } from '@/app/lib/types';

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';
const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/USD';

// 加密貨幣代號與 CoinGecko ID 的對照表
const CRYPTO_ID_MAP: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'SOL': 'solana',
  'BNB': 'binancecoin',
  'XRP': 'ripple',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'DOT': 'polkadot',
  'MATIC': 'polygon-ecosystem-native',
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'LINK': 'chainlink',
  'AVAX': 'avalanche-2',
};

/**
 * 從 Yahoo Finance 抓取價格
 */
async function fetchYahooStockPrice(symbol: string): Promise<number | null> {
  const isNumeric = /^\d+$/.test(symbol);
  // 台股若輸入數字，自動補上 .TW
  const yahooSymbol = isNumeric ? `${symbol}.TW` : symbol.toUpperCase();
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`;
  
  try {
    const response = await fetch(url, { 
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    if (!response.ok) return null;
    const data = await response.json();
    const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
    return price || null;
  } catch (error) {
    console.error(`Failed to fetch stock price for ${yahooSymbol}:`, error);
    return null;
  }
}

export async function getMarketData(symbols: { cryptos: string[]; stocks: string[] }): Promise<MarketData> {
  let rates = { TWD: 32.5, CNY: 7.2, USD: 1 };
  const cryptoPrices: Record<string, number> = {};
  const stockPrices: Record<string, number> = {};

  // 1. 抓取最新匯率 (USD base)
  try {
    const erResponse = await fetch(EXCHANGE_RATE_API);
    if (erResponse.ok) {
      const data = await erResponse.json();
      rates = {
        TWD: data.rates.TWD,
        CNY: data.rates.CNY,
        USD: 1
      };
    }
  } catch (e) {}

  // 2. 抓取加密貨幣價格 (CoinGecko)
  try {
    if (symbols.cryptos.length > 0) {
      // 將代號轉換為 ID，如果找不到則嘗試原字串
      const mappedIds = symbols.cryptos.map(s => CRYPTO_ID_MAP[s.toUpperCase()] || s.toLowerCase());
      const idString = mappedIds.join(',');
      
      const cgResponse = await fetch(`${COINGECKO_API}?ids=${idString}&vs_currencies=usd`);
      if (cgResponse.ok) {
        const data = await cgResponse.json();
        symbols.cryptos.forEach((symbol, index) => {
          const id = mappedIds[index];
          if (data[id]) {
            cryptoPrices[symbol.toUpperCase()] = data[id].usd;
          }
        });
      }
    }
  } catch (e) {
    console.error('Crypto fetch error:', e);
  }

  // 3. 抓取股票價格
  for (const s of symbols.stocks) {
    const price = await fetchYahooStockPrice(s);
    if (price !== null) {
      stockPrices[s.toUpperCase()] = price;
    } else {
      stockPrices[s.toUpperCase()] = 0;
    }
  }

  return {
    exchangeRate: rates.TWD,
    rates,
    cryptoPrices,
    stockPrices,
  };
}
