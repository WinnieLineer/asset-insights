import { MarketData } from '@/app/lib/types';

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';
const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/USD';

/**
 * 抓取最新市場數據
 * 包含加密貨幣、股票價格與匯率
 */
export const fetchMarketData = async (symbols: { cryptos: string[]; stocks: string[] }): Promise<MarketData> => {
  let exchangeRate = 32.5; 
  let rates = { TWD: 32.5, CNY: 7.2, USD: 1 };
  const cryptoPrices: Record<string, number> = {};
  const stockPrices: Record<string, number> = {};

  // 1. 抓取匯率
  try {
    const erResponse = await fetch(EXCHANGE_RATE_API);
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
    if (symbols.cryptos.length > 0) {
      const ids = symbols.cryptos.map(s => s.toLowerCase()).join(',');
      const cgResponse = await fetch(`${COINGECKO_API}?ids=${ids}&vs_currencies=usd`);
      if (cgResponse.ok) {
        const data = await cgResponse.json();
        symbols.cryptos.forEach(id => {
          const lowerId = id.toLowerCase();
          if (data[lowerId]) {
            cryptoPrices[id.toUpperCase()] = data[lowerId].usd;
          }
        });
      }
    }
  } catch (error) {
    console.error('Crypto fetch error:', error);
  }

  // 3. 抓取股票價格 (使用 Yahoo Finance 搭配 CORS Proxy)
  for (const s of symbols.stocks) {
    const symbol = s.toUpperCase();
    const yahooSymbol = /^\d+$/.test(symbol) ? `${symbol}.TW` : symbol;
    
    try {
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?interval=1d&range=1d`)}`;
      const response = await fetch(proxyUrl);
      if (response.ok) {
        const data = await response.json();
        const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
        if (price) {
          stockPrices[symbol] = price;
        } else {
          stockPrices[symbol] = 0;
        }
      }
    } catch (e) {
      console.error(`Stock fetch error for ${symbol}:`, e);
      stockPrices[symbol] = 0;
    }
  }

  return {
    exchangeRate,
    rates,
    cryptoPrices,
    stockPrices,
  };
};
