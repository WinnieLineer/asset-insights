export type Currency = 'TWD' | 'USD' | 'CNY' | 'SGD';

export type AssetCategory = 'Stock' | 'Crypto' | 'Bank' | 'Savings' | 'ETF';

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  category: AssetCategory;
  amount: number;
  currency: Currency;
  acquisitionDate: string; // YYYY-MM-DD
  endDate?: string;        // YYYY-MM-DD (Optional, if set means position is closed)
  price?: number; 
  valueInTWD?: number;
}

export interface MarketData {
  exchangeRate: number; // 1 USD to TWD
  rates: {
    TWD: number;
    CNY: number;
    USD: number;
    SGD: number;
  };
  assetMarketPrices: Record<string, { price: number; currency: string }>;
}

export interface HistoricalPoint {
  date: string;
  displayDate: string;
  totalValue: number;
  [key: string]: any; 
}
