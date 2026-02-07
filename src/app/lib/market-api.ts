import { MarketData } from '@/app/lib/types';

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';
const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/USD';
const BATCH_STOCK_PROXY_URL = 'https://script.google.com/macros/s/AKfycbz8Wjfhc-k8G19ZLsyD_bGDaPDwKa8MA-eL_21FPGGLuReTIUxX3hV_SqOyCzsEFlFX/exec?symbols=';

// 加密貨幣代號與 CoinGecko ID 的對照表
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

  // 1. 抓取最新匯率 (USD base)
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

  // 2. 抓取加密貨幣價格 (CoinGecko)
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

  // 3. 批量抓取股票價格 (一次請求獲取所有股票)
  if (symbols.stocks.length > 0) {
    try {
      const mappedSymbols = symbols.stocks.map(s => /^\d+$/.test(s) ? `${s}.TW` : s.toUpperCase());
      const symbolsQuery = mappedSymbols.join(',');
      const finalUrl = `${BATCH_STOCK_PROXY_URL}${encodeURIComponent(symbolsQuery)}`;

      const response = await fetch(finalUrl);
      if (response.ok) {
        const dataArray = await response.json(); // 回傳 JSON Array
        symbols.stocks.forEach((originalSymbol, index) => {
          const item = dataArray[index];
          // 解析結構與 Yahoo Finance chart API 一致
          const price = item?.chart?.result?.[0]?.meta?.regularMarketPrice;
          stockPrices[originalSymbol.toUpperCase()] = price || 0;
        });
      }
    } catch (error) {
      console.error('Batch stock fetch failed:', error);
      // 發生錯誤時確保 key 存在
      symbols.stocks.forEach(s => {
        if (!stockPrices[s.toUpperCase()]) stockPrices[s.toUpperCase()] = 0;
      });
    }
  }

  return {
    exchangeRate: rates.TWD,
    rates,
    cryptoPrices,
    stockPrices,
  };
}
