'use client';

import React from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Snapshot, Currency } from '@/app/lib/types';

const COLORS = ['#3F51B5', '#FF4500', '#4CAF50', '#9C27B0', '#FF9800'];

const t = {
  en: { allocation: 'Asset Allocation', trend: 'History Trend', total: 'Total Assets' },
  zh: { allocation: '資產配置比例', trend: '資產歷史趨勢', total: '總資產' }
};

interface PortfolioChartsProps {
  allocationData: { name: string; value: number }[];
  historicalData: Snapshot[];
  displayCurrency: Currency;
  rates: { TWD: number, CNY: number, USD: number };
  language: 'en' | 'zh';
}

export function PortfolioCharts({ allocationData, historicalData, displayCurrency, rates, language }: PortfolioChartsProps) {
  const lang = t[language];
  const symbol = displayCurrency === 'USD' ? '$' : displayCurrency === 'CNY' ? '¥' : 'NT$';
  const convert = (val: number) => displayCurrency === 'USD' ? val / rates.TWD : displayCurrency === 'CNY' ? val * (rates.CNY / rates.TWD) : val;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col items-center">
        <h3 className="font-headline font-bold text-lg mb-4 self-start">{lang.allocation}</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={allocationData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {allocationData.map((_, i) => (<Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />))}
              </Pie>
              <RechartsTooltip formatter={(v: number) => `${symbol}${v.toLocaleString()}`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white p-6 rounded-xl border shadow-sm">
        <h3 className="font-headline font-bold text-lg mb-4">{lang.trend} ({displayCurrency})</h3>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historicalData.map(d => ({ ...d, totalValue: convert(d.totalTWD) }))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
              <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', { month: 'short', day: 'numeric' })} />
              <YAxis tickFormatter={(v) => `${symbol}${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
              <RechartsTooltip 
                formatter={(v: number) => [`${symbol}${v.toLocaleString()}`, lang.total]} 
                labelFormatter={(l) => new Date(l).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW')}
              />
              <Line type="monotone" dataKey="totalValue" stroke="#3F51B5" strokeWidth={3} dot={{ r: 4, fill: '#3F51B5' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
