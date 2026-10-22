import { MarketData } from '@/app/lib/types';

const BATCH_STOCK_PROXY_URL = 'https://script.google.com/macros/s/AKfycbzlJZLp5_hA5eiUDZ2oSj8eWf094drGlHXmE4uYapt1oz3aTScbJm6W-AoJb6hdYhZ5UQ/exec';
const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/USD';

function formatSymbol(s: string, category: string) {
  if (!s) return '';
  const upper = s.toUpperCase().trim();
  if (category === 'Crypto' && !upper.includes('-') && !upper.includes('.')) {
    return `${upper}-USD`;
  }
  if (/^\d+$/.test(upper)) return `${upper}.TW`; // Taiwan stocks
  if (upper.endsWith('.SI')) return upper; // Singapore
  if (upper.length <= 4 && !upper.includes('.')) return upper; // US
  return upper;
}

export interface PriceInfo {
  price: number;
  currency: string;
}

// 快取匯率資料 10 分鐘，避免無效重複請求
let cachedRates: { rates: any; timestamp: number } | null = null;
const RATES_CACHE_TTL = 10 * 60 * 1000;

export async function fetchMarketData(
  assets: any[], 
  p1: number, 
  p2: number, 
  interval: string = '1d'
): Promise<{ marketData: MarketData; historicalTimeline: any[] }> {
  let rates = { TWD: 32.5, CNY: 7.2, USD: 1, SGD: 1.35 };
  const assetMarketPrices: Record<string, PriceInfo> = {};
  const historicalTimeline: any[] = [];

  // 1. 平行執行匯率快取抓取任務
  const ratesPromise = (async () => {
    if (cachedRates && (Date.now() - cachedRates.timestamp) < RATES_CACHE_TTL) {
      return cachedRates.rates;
    }
    try {
      const erResponse = await fetch(EXCHANGE_RATE_API, { signal: AbortSignal.timeout(8000) });
      if (erResponse.ok) {
        const data = await erResponse.json();
        if (data && data.rates) {
          const freshRates = { 
            TWD: data.rates.TWD || 32.5, 
            CNY: data.rates.CNY || 7.2, 
            USD: 1, 
            SGD: data.rates.SGD || 1.35 
          };
          cachedRates = { rates: freshRates, timestamp: Date.now() };
          return freshRates;
        }
      }
    } catch (e) { 
      console.warn('Rates fetch error - using defaults:', e); 
    }
    return rates;
  })();

  const fetchableAssets = (assets || []).filter(a => a.symbol && a.symbol.trim() !== '');
  const assetSymbolMap = fetchableAssets.map(a => ({
    asset: a,
    formattedSymbol: formatSymbol(a.symbol, a.category)
  }));
  const uniqueSymbols = Array.from(new Set(assetSymbolMap.map(x => x.formattedSymbol))).filter(Boolean);

  // 2. 平行執行市場行情批次查詢任務
  const stockPromise = (async () => {
    if (uniqueSymbols.length === 0) return [];
    try {
      const url = `${BATCH_STOCK_PROXY_URL}?symbols=${encodeURIComponent(uniqueSymbols.join(','))}&period1=${p1}&period2=${p2}&interval=${interval}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(18000) });
      if (response.ok) {
        const dataArray = await response.json();
        return Array.isArray(dataArray) ? dataArray : [];
      }
    } catch (e) {
      console.error('Market sync error:', e);
    }
    return [];
  })();

  // 匯率與行情資料同時並行請求 (Promise.all)，省去序列等待時間
  const [resolvedRates, dataArray] = await Promise.all([ratesPromise, stockPromise]);
  rates = resolvedRates;

  if (Array.isArray(dataArray) && dataArray.length > 0) {
    const chartBySymbol: Record<string, any> = {};
    uniqueSymbols.forEach((sym, idx) => {
      const chart = dataArray[idx]?.chart?.result?.[0];
      if (chart) {
        chartBySymbol[sym] = chart;
      }
    });

    const timelineMap: Record<number, any> = {};

    assetSymbolMap.forEach(({ asset, formattedSymbol }) => {
      const chart = chartBySymbol[formattedSymbol];
      if (!chart) return;

      const apiCurrency = chart.meta?.currency || (asset.category === 'Crypto' ? 'USD' : 'TWD');
      const currentPrice = chart.meta?.regularMarketPrice || 0;
      
      assetMarketPrices[asset.id] = {
        price: currentPrice,
        currency: apiCurrency
      };

      const timestamps = chart.timestamp || [];
      const prices = chart.indicators?.quote?.[0]?.close || chart.indicators?.adjclose?.[0]?.adjclose || [];

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

  return { 
    marketData: { exchangeRate: rates.TWD, rates, assetMarketPrices },
    historicalTimeline 
  };
}
