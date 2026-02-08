
import { MarketData } from '@/app/lib/types';

const BATCH_STOCK_PROXY_URL = 'https://script.google.com/macros/s/AKfycbz8Wjfhc-k8G19ZLsyD_bGDaPDwKa8MA-eL_21FPGGLuReTIUxX3hV_SqOyCzsEFlFX/exec';
const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/USD';

function formatSymbol(s: string, category: string) {
  const upper = s.toUpperCase();
  if (category === 'Crypto') return `${upper}-USD`;
  if (/^\d+$/.test(upper)) return `${upper}.TW`; // Taiwan
  if (upper.endsWith('.SI')) return upper; // Singapore
  if (upper.length <= 4 && !upper.includes('.')) return upper; // US
  return upper;
}

export async function fetchMarketData(symbols: { cryptos: string[]; stocks: string[] }): Promise<MarketData> {
  let rates = { TWD: 32.5, CNY: 7.2, USD: 1, SGD: 1.35 };
  const cryptoPrices: Record<string, number> = {};
  const stockPrices: Record<string, number> = {};

  try {
    const erResponse = await fetch(EXCHANGE_RATE_API);
    if (erResponse.ok) {
      const data = await erResponse.json();
      rates = { TWD: data.rates.TWD, CNY: data.rates.CNY, USD: 1, SGD: data.rates.SGD };
    }
  } catch (e) { console.error(e); }

  const formattedStocks = symbols.stocks.map(s => formatSymbol(s, 'Stock'));
  const formattedCryptos = symbols.cryptos.map(c => formatSymbol(c, 'Crypto'));
  const allSymbols = [...formattedStocks, ...formattedCryptos];

  if (allSymbols.length > 0) {
    try {
      const url = `${BATCH_STOCK_PROXY_URL}?symbols=${encodeURIComponent(allSymbols.join(','))}`;
      const response = await fetch(url);
      if (response.ok) {
        const dataArray = await response.json();
        symbols.stocks.forEach((s, i) => {
          stockPrices[s.toUpperCase()] = dataArray[i]?.chart?.result?.[0]?.meta?.regularMarketPrice || 0;
        });
        symbols.cryptos.forEach((c, i) => {
          const idx = symbols.stocks.length + i;
          cryptoPrices[c.toUpperCase()] = dataArray[idx]?.chart?.result?.[0]?.meta?.regularMarketPrice || 0;
        });
      }
    } catch (e) { console.error(e); }
  }

  return { exchangeRate: rates.TWD, rates, cryptoPrices, stockPrices };
}

export async function fetchHistoricalData(assets: any[], days: number) {
  const stocksAndCryptos = assets.filter(a => a.category === 'Stock' || a.category === 'Crypto');
  if (stocksAndCryptos.length === 0) return [];

  const symbols = stocksAndCryptos.map(a => formatSymbol(a.symbol, a.category));
  const period2 = Math.floor(Date.now() / 1000);
  const period1 = period2 - (days * 24 * 60 * 60);

  try {
    const url = `${BATCH_STOCK_PROXY_URL}?symbols=${encodeURIComponent(symbols.join(','))}&period1=${period1}&period2=${period2}&interval=1d`;
    const response = await fetch(url);
    if (!response.ok) return [];
    
    const dataArray = await response.json();
    
    // 建立時間線
    const timelineMap: Record<number, any> = {};
    
    dataArray.forEach((result: any, assetIdx: number) => {
      const chart = result?.chart?.result?.[0];
      if (!chart) return;
      
      const timestamps = chart.timestamp || [];
      const prices = chart.indicators?.adjclose?.[0]?.adjclose || chart.indicators?.quote?.[0]?.close || [];
      const asset = stocksAndCryptos[assetIdx];

      timestamps.forEach((ts: number, i: number) => {
        const price = prices[i];
        if (price === null || price === undefined) return;
        
        if (!timelineMap[ts]) timelineMap[ts] = { timestamp: ts, assets: {} };
        timelineMap[ts].assets[asset.id] = price;
      });
    });

    return Object.values(timelineMap).sort((a: any, b: any) => a.timestamp - b.timestamp);
  } catch (e) {
    console.error(e);
    return [];
  }
}
