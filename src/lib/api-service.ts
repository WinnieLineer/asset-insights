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

async function fetchYahooStockPrice(symbol: string): Promise<number | null> {
  const isNumeric = /^\d+$/.test(symbol);
  const yahooSymbol = isNumeric ? `${symbol}.TW` : symbol.toUpperCase();
  const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`;
  const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}&cb=${Date.now()}`;
  
  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) return null;
    const wrapper = await response.json();
    const data = JSON.parse(wrapper.contents);
    const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
    return price || null;
  } catch (error) {
    console.error(`Failed to fetch stock price for ${yahooSymbol}:`, error);
    return null;
  }
}

export const fetchMarketData = async (symbols: { cryptos: string[]; stocks: string[] }): Promise<MarketData> => {
  let rates = { TWD: 32.5, CNY: 7.2, USD: 1 };
  const cryptoPrices: Record<string, number> = {};
  const stockPrices: Record<string, number> = {};

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

  try {
    if (symbols.cryptos.length > 0) {
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
  } catch (e) {}

  for (const s of symbols.stocks) {
    const price = await fetchYahooStockPrice(s);
    stockPrices[s.toUpperCase()] = price || 0;
  }

  return {
    exchangeRate: rates.TWD,
    rates,
    cryptoPrices,
    stockPrices,
  };
};
