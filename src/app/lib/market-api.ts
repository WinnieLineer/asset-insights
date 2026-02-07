
import { MarketData } from '@/app/lib/types';

const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/USD';
const BATCH_STOCK_PROXY_URL = 'https://script.google.com/macros/s/AKfycbz8Wjfhc-k8G19ZLsyD_bGDaPDwKa8MA-eL_21FPGGLuReTIUxX3hV_SqOyCzsEFlFX/exec?symbols=';

export async function fetchMarketData(symbols: { cryptos: string[]; stocks: string[] }): Promise<MarketData> {
  let rates = { TWD: 32.5, CNY: 7.2, USD: 1 };
  const cryptoPrices: Record<string, number> = {};
  const stockPrices: Record<string, number> = {};

  // 1. Fetch Exchange Rates
  try {
    const erResponse = await fetch(EXCHANGE_RATE_API);
    if (erResponse.ok) {
      const data = await erResponse.json();
      rates = { TWD: data.rates.TWD, CNY: data.rates.CNY, USD: 1 };
    }
  } catch (e) {}

  // 2. Prepare symbols for batch request
  const formattedStocks = symbols.stocks.map(s => /^\d+$/.test(s) ? `${s}.TW` : s.toUpperCase());
  const formattedCryptos = symbols.cryptos.map(c => `${c}USDT`);
  const allSymbols = [...formattedStocks, ...formattedCryptos];

  // 3. Single Batch Request for all prices
  if (allSymbols.length > 0) {
    try {
      const finalUrl = `${BATCH_STOCK_PROXY_URL}${encodeURIComponent(allSymbols.join(','))}`;
      const response = await fetch(finalUrl);
      if (response.ok) {
        const dataArray = await response.json();
        
        // Parse stock prices from the beginning of the array
        symbols.stocks.forEach((s, i) => {
          const result = dataArray[i]?.chart?.result?.[0]?.meta;
          stockPrices[s.toUpperCase()] = result?.regularMarketPrice || 0;
        });

        // Parse crypto prices from the end of the array
        symbols.cryptos.forEach((c, i) => {
          const cryptoIndex = symbols.stocks.length + i;
          const result = dataArray[cryptoIndex]?.chart?.result?.[0]?.meta;
          cryptoPrices[c.toUpperCase()] = result?.regularMarketPrice || 0;
        });
      }
    } catch (e) {
      console.error('Market fetch error:', e);
    }
  }

  return {
    exchangeRate: rates.TWD,
    rates,
    cryptoPrices,
    stockPrices,
  };
}
