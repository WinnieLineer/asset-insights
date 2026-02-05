import { MarketData } from '@/app/lib/types';

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';
const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/USD';

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

export const fetchMarketData = async (symbols: { cryptos: string[]; stocks: string[] }): Promise<MarketData> => {
  let exchangeRate = 32.5; 
  let rates = { TWD: 32.5, CNY: 7.2, USD: 1 };
  const cryptoPrices: Record<string, number> = {};
  const stockPrices: Record<string, number> = {};

  // 1. 抓取匯率
  try {
    const erResponse = await fetch(`${EXCHANGE_RATE_API}?cb=${Date.now()}`);
    if (erResponse.ok) {
      const data = await erResponse.json();
      exchangeRate = data.rates.TWD;
      rates = {
        TWD: data.rates.TWD,
        CNY: data.rates.CNY,
        USD: 1
      };
    }
  } catch (error) {
    console.error('Exchange rate fetch error:', error);
  }

  // 2. 抓取加密貨幣 (CoinGecko)
  try {
    const cryptoSymbols = [...new Set(symbols.cryptos.map(s => s.toUpperCase()))];
    if (cryptoSymbols.length > 0) {
      const mappedIds = cryptoSymbols.map(s => CRYPTO_ID_MAP[s] || s.toLowerCase());
      const idString = mappedIds.join(',');
      const cgResponse = await fetch(`${COINGECKO_API}?ids=${idString}&vs_currencies=usd&v=${Date.now()}`);
      if (cgResponse.ok) {
        const data = await cgResponse.json();
        cryptoSymbols.forEach((symbol) => {
          const mappedId = CRYPTO_ID_MAP[symbol] || symbol.toLowerCase();
          if (data[mappedId]) {
            cryptoPrices[symbol] = data[mappedId].usd;
          }
        });
      }
    }
  } catch (error) {
    console.error('Crypto fetch error:', error);
  }

  // 3. 抓取股票價格 (使用 corsproxy.io 解析 Yahoo Finance)
  const stockSymbols = [...new Set(symbols.stocks.map(s => s.toUpperCase()))];
  for (const symbol of stockSymbols) {
    const isNumeric = /^\d+$/.test(symbol);
    const yahooSymbol = isNumeric ? `${symbol}.TW` : symbol;
    
    try {
      const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`;
      // 使用 corsproxy.io 並加上 timestamp 繞過快取
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}&cb=${Date.now()}`;
      
      const response = await fetch(proxyUrl);
      if (response.ok) {
        const data = await response.json();
        const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
        if (price) {
          stockPrices[symbol] = price;
        }
      }
    } catch (e) {
      console.error(`Stock fetch error for ${symbol}:`, e);
    }
  }

  return {
    exchangeRate,
    rates,
    cryptoPrices,
    stockPrices,
  };
};
