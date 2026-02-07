
import { MarketData } from '@/app/lib/types';

const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/USD';
const BATCH_STOCK_PROXY_URL = 'https://script.google.com/macros/s/AKfycbz8Wjfhc-k8G19ZLsyD_bGDaPDwKa8MA-eL_21FPGGLuReTIUxX3hV_SqOyCzsEFlFX/exec?symbols=';

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

export async function fetchMarketData(symbols: { cryptos: string[]; stocks: string[] }): Promise<MarketData> {
  let rates = { TWD: 32.5, CNY: 7.2, USD: 1 };
  const cryptoPrices: Record<string, number> = {};
  const stockPrices: Record<string, number> = {};

  try {
    const erResponse = await fetch(EXCHANGE_RATE_API);
    if (erResponse.ok) {
      const data = await erResponse.json();
      rates = { TWD: data.rates.TWD, CNY: data.rates.CNY, USD: 1 };
    }
  } catch (e) {}

  if (symbols.stocks.length > 0) {
    try {
      const mappedSymbols = symbols.stocks.map(s => /^\d+$/.test(s) ? `${s}.TW` : s.toUpperCase());
      const finalUrl = `${BATCH_STOCK_PROXY_URL}${encodeURIComponent(mappedSymbols.join(','))}`;
      const response = await fetch(finalUrl);
      if (response.ok) {
        const dataArray = await response.json();
        symbols.stocks.forEach((s, i) => {
          const price = dataArray[i]?.chart?.result?.[0]?.meta?.regularMarketPrice;
          stockPrices[s.toUpperCase()] = price || 0;
        });
      }
    } catch (e) {}
  }

  // Crypto fallback (using simpler binance API to avoid CoinGecko rate limits on client)
  for (const s of symbols.cryptos) {
    try {
      const res = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${s.toUpperCase()}USDT`);
      if (res.ok) {
        const data = await res.json();
        cryptoPrices[s.toUpperCase()] = parseFloat(data.price);
      }
    } catch (e) {
      cryptoPrices[s.toUpperCase()] = 0;
    }
  }

  return {
    exchangeRate: rates.TWD,
    rates,
    cryptoPrices,
    stockPrices,
  };
}
