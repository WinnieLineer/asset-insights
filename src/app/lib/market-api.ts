
import { MarketData } from '@/app/lib/types';

const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/USD';
const BATCH_STOCK_PROXY_URL = 'https://script.google.com/macros/s/AKfycbz8Wjfhc-k8G19ZLsyD_bGDaPDwKa8MA-eL_21FPGGLuReTIUxX3hV_SqOyCzsEFlFX/exec?symbols=';

export async function fetchMarketData(symbols: { cryptos: string[]; stocks: string[] }): Promise<MarketData> {
  let rates = { TWD: 32.5, CNY: 7.2, USD: 1, SGD: 1.35 };
  const cryptoPrices: Record<string, number> = {};
  const stockPrices: Record<string, number> = {};

  // 1. Fetch Exchange Rates
  try {
    const erResponse = await fetch(EXCHANGE_RATE_API);
    if (erResponse.ok) {
      const data = await erResponse.json();
      rates = { 
        TWD: data.rates.TWD, 
        CNY: data.rates.CNY, 
        USD: 1, 
        SGD: data.rates.SGD 
      };
    }
  } catch (e) {
    console.error('Exchange rate fetch error:', e);
  }

  // 2. Prepare symbols for batch request
  const formattedStocks = symbols.stocks.map(s => {
    const upper = s.toUpperCase();
    if (/^\d+$/.test(upper)) return `${upper}.TW`; // Taiwan stocks
    if (upper.endsWith('.SI')) return upper; // Singapore stocks already suffixed
    if (upper.length <= 4 && !upper.includes('.')) return upper; // Likely US stocks
    return upper;
  });
  
  // 使用 BTC-USD 格式
  const formattedCryptos = symbols.cryptos.map(c => `${c.toUpperCase()}-USD`);
  const allSymbols = [...formattedStocks, ...formattedCryptos];

  // 3. Single Batch Request
  if (allSymbols.length > 0) {
    try {
      const finalUrl = `${BATCH_STOCK_PROXY_URL}${encodeURIComponent(allSymbols.join(','))}`;
      const response = await fetch(finalUrl);
      if (response.ok) {
        const dataArray = await response.json();
        
        symbols.stocks.forEach((s, i) => {
          const result = dataArray[i]?.chart?.result?.[0]?.meta;
          stockPrices[s.toUpperCase()] = result?.regularMarketPrice || 0;
        });

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
