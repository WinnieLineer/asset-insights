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

export const fetchMarketData = async (symbols: { cryptos: string[]; stocks: string[] }): Promise<MarketData> => {
  let exchangeRate = 32.5; 
  let rates = { TWD: 32.5, CNY: 7.2, USD: 1 };
  const cryptoPrices: Record<string, number> = {};
  const stockPrices: Record<string, number> = {};

  // 1. Fetch Exchange Rates
  try {
    const erResponse = await fetch(`${EXCHANGE_RATE_API}?cb=${Date.now()}`);
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

  // 2. Fetch Crypto Prices via CoinGecko
  try {
    const cryptoSymbols = [...new Set(symbols.cryptos.map(s => s.toUpperCase()))];
    if (cryptoSymbols.length > 0) {
      const mappedIds = cryptoSymbols.map(s => CRYPTO_ID_MAP[s] || s.toLowerCase());
      const idString = mappedIds.join(',');
      const cgResponse = await fetch(`${COINGECKO_API}?ids=${idString}&vs_currencies=usd&v=${Date.now()}`);
      if (cgResponse.ok) {
        const data = await cgResponse.json();
        cryptoSymbols.forEach((symbol) => {
          const mappedId = CRYPTO_ID_MAP[symbol] || symbol.toLowerCase();
          if (data[mappedId]) {
            cryptoPrices[symbol] = data[mappedId].usd;
          }
        });
      }
    }
  } catch (error) {
    console.error('Crypto fetch error:', error);
  }

  // 3. Batch Fetch via Yahoo Finance (Efficient & Consolidated)
  // Process stock symbols: numbers get .TW, others stay uppercase
  const stockYahooSymbols = symbols.stocks.map(s => {
    const isNumeric = /^\d+$/.test(s);
    return isNumeric ? `${s}.TW` : s.toUpperCase();
  });

  // Process crypto symbols for Yahoo as backup
  const cryptoYahooSymbols = symbols.cryptos.map(s => `${s.toUpperCase()}-USD`);
  
  const allYahooSymbols = [...new Set([...stockYahooSymbols, ...cryptoYahooSymbols])].join(',');

  if (allYahooSymbols) {
    try {
      const targetUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${allYahooSymbols}`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}&cb=${Date.now()}`;
      
      const response = await fetch(proxyUrl);
      if (response.ok) {
        const wrapper = await response.json();
        if (wrapper.contents) {
          const data = JSON.parse(wrapper.contents);
          const results = data.quoteResponse?.result || [];
          results.forEach((res: any) => {
            const sym = res.symbol;
            if (sym.includes('-USD')) {
              const baseSym = sym.replace('-USD', '');
              // Only fill if CoinGecko failed or to ensure latest
              cryptoPrices[baseSym] = res.regularMarketPrice;
            } else {
              // Extract original symbol (e.g., 2330.TW -> 2330)
              const baseSym = sym.split('.')[0];
              stockPrices[baseSym] = res.regularMarketPrice;
            }
          });
        }
      }
    } catch (e) {
      console.error('Yahoo batch fetch error:', e);
    }
  }

  // IMPORTANT: Must return rates to satisfy MarketData interface
  return {
    exchangeRate,
    rates,
    cryptoPrices,
    stockPrices,
  };
};