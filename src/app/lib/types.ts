
export type Currency = 'TWD' | 'USD';

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
}

export interface Snapshot {
  id: string;
  date: string;
  totalTWD: number;
  allocations: {
    category: AssetCategory;
    value: number;
  }[];
}

export interface MarketData {
  exchangeRate: number; // 1 USD to TWD
  cryptoPrices: Record<string, number>; // symbol to USD price
  stockPrices: Record<string, number>; // symbol to USD price
}
