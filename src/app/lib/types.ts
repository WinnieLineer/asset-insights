
export type Currency = 'TWD' | 'USD' | 'CNY' | 'SGD';

export type AssetCategory = 'Stock' | 'Crypto' | 'Bank' | 'Savings';

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  category: AssetCategory;
  amount: number;
  currency: Currency;
  price?: number; // 當前單價 (持有幣別)
  valueInTWD?: number; // 換算後的台幣價值
}

export interface MarketData {
  exchangeRate: number; // 1 USD to TWD
  rates: {
    TWD: number;
    CNY: number;
    USD: number;
    SGD: number;
  };
  cryptoPrices: Record<string, number>; // symbol to USD price
  stockPrices: Record<string, number>; // symbol to USD price
}

export interface HistoricalPoint {
  date: string;
  totalTWD: number;
  [key: string]: any; // 用於存放各類別價值
}
