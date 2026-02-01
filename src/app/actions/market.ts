
'use server';

import { MarketData } from '@/app/lib/types';

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';
const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/USD';

/**
 * 從 Yahoo Finance 抓取台灣股票價格 (例如 0050.TW)
 */
async function fetchYahooStockPrice(symbol: string): Promise<number | null> {
  const yahooSymbol = symbol === '0050' ? '0050.TW' : symbol;
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`;
  
  try {
    const response = await fetch(url, { next: { revalidate: 60 } });
    if (!response.ok) return null;
    const data = await response.json();
    const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
    return price || null;
  } catch (error) {
    console.error(`Failed to fetch stock price for ${symbol}:`, error);
    return null;
  }
}

export async function getMarketData(symbols: { cryptos: string[]; stocks: string[] }): Promise<MarketData> {
  let exchangeRate = 32.5;
  const cryptoPrices: Record<string, number> = {};
  const stockPrices: Record<string, number> = {};

  // 1. 抓取匯率
  try {
    const erResponse = await fetch(EXCHANGE_RATE_API);
    if (erResponse.ok) {
      const data = await erResponse.json();
      exchangeRate = data.rates.TWD;
    }
  } catch (e) {}

  // 2. 抓取加密貨幣
  try {
    if (symbols.cryptos.length > 0) {
      const ids = symbols.cryptos.join(',').toLowerCase();
      const cgResponse = await fetch(`${COINGECKO_API}?ids=${ids}&vs_currencies=usd`);
      if (cgResponse.ok) {
        const data = await cgResponse.json();
        symbols.cryptos.forEach(id => {
          if (data[id.toLowerCase()]) {
            cryptoPrices[id.toUpperCase()] = data[id.toLowerCase()].usd;
          }
        });
      }
    }
  } catch (e) {}

  // 3. 抓取股票 (包含 0050)
  for (const s of symbols.stocks) {
    const price = await fetchYahooStockPrice(s.toUpperCase());
    if (price !== null) {
      stockPrices[s.toUpperCase()] = price;
    } else {
      // Fallback 模擬值
      const fallbacks: Record<string, number> = { '0050': 198.5, 'AAPL': 225, 'TSLA': 350 };
      stockPrices[s.toUpperCase()] = fallbacks[s.toUpperCase()] || 100;
    }
  }

  return {
    exchangeRate,
    cryptoPrices,
    stockPrices,
  };
}
