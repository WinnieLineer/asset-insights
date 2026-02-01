
import { MarketData } from '@/app/lib/types';

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price';
const EXCHANGE_RATE_API = 'https://open.er-api.com/v6/latest/USD';

// Free APIs often have rate limits, so we provide fallbacks
export const fetchMarketData = async (symbols: { cryptos: string[]; stocks: string[] }): Promise<MarketData> => {
  let exchangeRate = 32.5; // Default fallback
  const cryptoPrices: Record<string, number> = {};
  const stockPrices: Record<string, number> = {};

  try {
    // 1. Fetch Exchange Rate (USD to TWD)
    const erResponse = await fetch(EXCHANGE_RATE_API);
    if (erResponse.ok) {
      const data = await erResponse.json();
      exchangeRate = data.rates.TWD;
    }
  } catch (error) {
    console.error('Failed to fetch exchange rate:', error);
  }

  try {
    // 2. Fetch Crypto Prices from CoinGecko
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
  } catch (error) {
    console.error('Failed to fetch crypto prices:', error);
  }

  // 3. Stock prices (Placeholder/Mock as most stock APIs require API keys or have strict limits)
  // Added 0050 as a supported ticker
  const stockFallbacks: Record<string, number> = {
    'QQQ': 445.5,
    'VTI': 260.2,
    'SCHG': 95.8,
    'NVDA': 140.5,
    'AAPL': 225.0,
    'TSLA': 350.0,
    '0050': 100.0 // User specified price point
  };

  symbols.stocks.forEach(s => {
    stockPrices[s.toUpperCase()] = stockFallbacks[s.toUpperCase()] || 100;
  });

  return {
    exchangeRate,
    cryptoPrices,
    stockPrices,
  };
};
