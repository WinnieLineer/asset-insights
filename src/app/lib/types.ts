
export type Currency = 'TWD' | 'USD' | 'CNY';

export type AssetCategory = 'Stock' | 'Crypto' | 'Bank' | 'Fixed Deposit' | 'Savings';

export interface Asset {
  id: string;
  name: string;
  symbol: string;
  category: AssetCategory;
  amount: number;
  currency: Currency;
  interestRate?: number; // For Fixed Deposit
  price?: number; // Current market price in its base currency
  valueInTWD?: number; // 儲存快照時的台幣總價值
}

export interface Snapshot {
  id: string;
  date: string;
  totalTWD: number;
  allocations: {
    category: AssetCategory;
    value: number;
  }[];
  assets?: Asset[]; // 儲存當時的詳細資產清單
}

export interface MarketData {
  exchangeRate: number; // 1 USD to TWD
  rates: {
    TWD: number;
    CNY: number;
    USD: number;
  };
  cryptoPrices: Record<string, number>; // symbol to USD price
  stockPrices: Record<string, number>; // symbol to USD price
}
