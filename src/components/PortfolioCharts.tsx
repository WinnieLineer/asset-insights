'use client';

import React, { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Sector,
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { AssetCategory } from '@/app/lib/types';

// Monochrome colors for the charts - Professional Greyscale
const COLORS = [
  '#000000', // Black (Stock)
  '#27272a', // Zinc 800 (Crypto)
  '#52525b', // Zinc 600 (Bank)
  '#71717a', // Zinc 500 (Fixed Deposit)
  '#a1a1aa', // Zinc 400 (Savings)
  '#e4e4e7', // Zinc 200 (Others)
];

const CATEGORIES: AssetCategory[] = ['Stock', 'Crypto', 'Bank', 'Fixed Deposit', 'Savings'];

const t = {
  en: { 
    allocation: 'Portfolio Allocation', 
    trend: 'Asset Evolution Matrix', 
    total: 'Total Portfolio', 
    ratio: 'Ratio',
    categories: {
      'Stock': 'Equity',
      'Crypto': 'Crypto',
      'Bank': 'Bank',
      'Fixed Deposit': 'Fixed Deposit',
      'Savings': 'Savings'
    }
  },
  zh: { 
    allocation: '當前資產配置比例', 
    trend: '歷史資產演變走勢', 
    total: '投資組合總計', 
    ratio: '佔比',
    categories: {
      'Stock': '股票資產',
      'Crypto': '加密貨幣',
      'Bank': '銀行存款',
      'Fixed Deposit': '定期存款',
      'Savings': '活期儲蓄'
    }
  }
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 6}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <circle cx={cx} cy={cy} r={innerRadius - 4} fill={fill} opacity={0.05} />
    </g>
  );
};

export function PortfolioCharts({ allocationData, historicalData, displayCurrency, rates, language }: any) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const lang = t[language as keyof typeof t] || t.zh;
  const symbol = displayCurrency === 'USD' ? '$' : displayCurrency === 'CNY' ? '¥' : 'NT$';
  
  const convert = (val: number) => {
    const rate = rates.TWD || 32.5;
    if (displayCurrency === 'USD') return val / rate;
    if (displayCurrency === 'CNY') return val * (rates.CNY / rate);
    return val;
  };

  const chartData = useMemo(() => {
    return historicalData.map((snapshot: any) => {
      const item: any = {
        displayDate: new Date(snapshot.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        totalValue: convert(snapshot.totalTWD),
      };
      
      CATEGORIES.forEach(cat => {
        const catAssets = snapshot.assets?.filter((a: any) => a.category === cat) || [];
        const sumTWD = catAssets.reduce((acc: number, curr: any) => acc + (curr.valueInTWD || 0), 0);
        
        if (sumTWD === 0 && snapshot.allocations) {
          const alloc = snapshot.allocations.filter((a: any) => a.category === cat);
          const allocSum = alloc.reduce((acc: number, curr: any) => acc + curr.value, 0);
          item[cat] = convert(allocSum);
        } else {
          item[cat] = convert(sumTWD);
        }
      });
      
      return item;
    });
  }, [historicalData, displayCurrency, rates]);

  const totalAllocationValue = useMemo(() => {
    return allocationData.reduce((acc: number, curr: any) => acc + curr.value, 0);
  }, [allocationData]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
      {/* Allocation Pie Chart */}
      <div className="lg:col-span-4 modern-card p-6 sm:p-8 flex flex-col items-center min-h-[400px] border-slate-200 bg-white relative z-20">
        <div className="w-full mb-4 text-left">
          <h3 className="text-xs sm:text-sm font-black text-black uppercase tracking-widest">{lang.allocation}</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Asset Mix Matrix</p>
        </div>
        
        <div className="h-[280px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                activeIndex={activeIndex ?? undefined}
                activeShape={renderActiveShape}
                data={allocationData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={90}
                paddingAngle={4}
                dataKey="value"
                stroke="transparent"
                onMouseEnter={(_, index) => setActiveIndex(index)}
                onMouseLeave={() => setActiveIndex(null)}
                animationDuration={600}
              >
                {allocationData.map((_: any, i: number) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <RechartsTooltip 
                wrapperStyle={{ zIndex: 9999 }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length && payload[0]) {
                    const val = Number(payload[0].value);
                    return (
                      <div className="bg-white border border-slate-200 p-3 rounded shadow-2xl animate-fade-in z-[10000] opacity-100 ring-1 ring-black/5 pointer-events-none min-w-[140px]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 border-b border-slate-50 pb-1">
                          {lang.categories[payload[0].name as keyof typeof lang.categories] || payload[0].name}
                        </p>
                        <p className="text-xs sm:text-sm lg:text-base font-black text-black">{symbol}{val.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-full max-w-[120px] px-2">
            {activeIndex !== null && allocationData[activeIndex] ? (
              <div className="animate-fade-in">
                <p className="text-[10px] font-black text-black uppercase tracking-widest truncate">
                  {lang.categories[allocationData[activeIndex].name as keyof typeof lang.categories] || allocationData[activeIndex].name}
                </p>
                <p className="text-2xl font-black text-black tracking-tighter">
                  {((allocationData[activeIndex].value / (totalAllocationValue || 1)) * 100).toFixed(1)}%
                </p>
              </div>
            ) : (
              <div className="animate-fade-in">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{lang.total}</p>
                <p className="text-2xl font-black text-slate-200 tracking-tighter">100%</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Evolution Composed Chart */}
      <div className="lg:col-span-8 modern-card p-6 sm:p-8 flex flex-col min-h-[400px] border-slate-200 bg-white relative z-20">
        <div className="w-full mb-6 text-left flex justify-between items-start">
          <div>
            <h3 className="text-xs sm:text-sm font-black text-black uppercase tracking-widest">{lang.trend}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Historical Proportions & Net Growth</p>
          </div>
        </div>

        <div className="h-[280px] w-full mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="displayDate" 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }}
                dy={10}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 9, fill: '#cbd5e1', fontWeight: 600 }}
                tickFormatter={(value) => `${symbol}${(value/1000).toFixed(0)}k`}
              />
              <RechartsTooltip 
                wrapperStyle={{ zIndex: 9999 }}
                cursor={{ fill: '#f8fafc' }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded shadow-2xl animate-fade-in z-[10000] min-w-[180px] opacity-100 ring-1 ring-black/5 pointer-events-none">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5 pb-1.5 border-b border-slate-100">{label}</p>
                        <div className="space-y-2">
                          {payload.map((p: any, i: number) => {
                            if (p.dataKey === 'totalValue') return null;
                            if (!p.value) return null;
                            return (
                              <div key={i} className="flex justify-between items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                    {lang.categories[p.name as keyof typeof lang.categories] || p.name}
                                  </span>
                                </div>
                                <span className="text-[11px] font-black text-black">{symbol}{Number(p.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                              </div>
                            );
                          })}
                          <div className="mt-2.5 pt-2 border-t border-black/10 flex justify-between items-center">
                            <span className="text-[10px] font-black text-black uppercase tracking-widest">{lang.total}</span>
                            <span className="text-xs sm:text-sm font-black text-black">{symbol}{Number(payload.find((p:any)=>p.dataKey==='totalValue')?.value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle"
                content={({ payload }) => (
                  <div className="flex flex-wrap justify-end gap-x-4 gap-y-1 mb-4">
                    {payload?.map((entry: any, index: number) => (
                      <div key={`item-${index}`} className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          {lang.categories[entry.value as keyof typeof lang.categories] || entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              />
              {CATEGORIES.map((cat, i) => (
                <Bar 
                  key={cat}
                  dataKey={cat} 
                  stackId="a" 
                  fill={COLORS[i % COLORS.length]} 
                  barSize={12}
                  radius={i === 0 ? [0, 0, 2, 2] : [0, 0, 0, 0]}
                />
              ))}
              <Line 
                type="monotone" 
                dataKey="totalValue" 
                stroke="#000000" 
                strokeWidth={2.5} 
                dot={{ r: 3.5, fill: '#000000', strokeWidth: 0 }} 
                activeDot={{ r: 5, strokeWidth: 0, fill: '#000000' }}
                animationDuration={1000}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
