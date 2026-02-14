import { MarketData } from '@/app/lib/types';

const BATCH_STOCK_PROXY_URL = 'https://script.google.com/macros/s/AKfycbyQ12dBnspvRGwcNRZmZw3sXon8tnmPTttJ2b5LDw_3G1Zw7aaM6OPe9dSLhPPv-xRL/exec';
const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/USD';

function formatSymbol(s: string, category: string) {
  const upper = s.toUpperCase();
  if (category === 'Crypto') return `${upper}-USD`;
  if (/^\d+$/.test(upper)) return `${upper}.TW`; // Taiwan
  if (upper.endsWith('.SI')) return upper; // Singapore
  if (upper.length <= 4 && !upper.includes('.')) return upper; // US
  return upper;
}

export interface PriceInfo {
  price: number;
  currency: string;
}

export async function fetchMarketData(
  assets: any[], 
  p1: number, 
  p2: number, 
  interval: string = '1d'
): Promise<{ marketData: MarketData; historicalTimeline: any[] }> {
  let rates = { TWD: 32.5, CNY: 7.2, USD: 1, SGD: 1.35 };
  const assetMarketPrices: Record<string, PriceInfo> = {};
  const historicalTimeline: any[] = [];

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
  } catch (e) { console.error('Rates fetch error:', e); }

  // 只要有代碼的資產都嘗試抓取價格
  const fetchableAssets = assets.filter(a => a.symbol && a.symbol.trim() !== '');
  
  if (fetchableAssets.length === 0) {
    return { 
      marketData: { exchangeRate: rates.TWD, rates, assetMarketPrices },
      historicalTimeline: [] 
    };
  }

  const symbols = fetchableAssets.map(a => formatSymbol(a.symbol, a.category));

  try {
    const url = `${BATCH_STOCK_PROXY_URL}?symbols=${encodeURIComponent(symbols.join(','))}&period1=${p1}&period2=${p2}&interval=${interval}`;
    const response = await fetch(url);
    if (response.ok) {
      const dataArray = await response.json();
      const timelineMap: Record<number, any> = {};

      dataArray.forEach((result: any, idx: number) => {
        const chart = result?.chart?.result?.[0];
        if (!chart) return;

        const asset = fetchableAssets[idx];
        const apiCurrency = chart.meta?.currency || (asset.category === 'Crypto' ? 'USD' : 'TWD');
        const currentPrice = chart.meta?.regularMarketPrice || 0;
        
        assetMarketPrices[asset.id] = {
          price: currentPrice,
          currency: apiCurrency
        };

        const timestamps = chart.timestamp || [];
        const prices = chart.indicators?.adjclose?.[0]?.adjclose || chart.indicators?.quote?.[0]?.close || [];

        timestamps.forEach((ts: number, i: number) => {
          const price = prices[i];
          if (price === null || price === undefined) return;
          if (!timelineMap[ts]) timelineMap[ts] = { timestamp: ts, assets: {} };
          timelineMap[ts].assets[asset.id] = price;
        });
      });

      const sortedTimeline = Object.values(timelineMap).sort((a: any, b: any) => a.timestamp - b.timestamp);
      historicalTimeline.push(...sortedTimeline);
    }
  } catch (e) {
    console.error('Combined market fetch error:', e);
  }

  return { 
    marketData: { exchangeRate: rates.TWD, rates, assetMarketPrices },
    historicalTimeline 
  };
}
