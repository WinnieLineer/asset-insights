
'use client';

import React, { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Sector,
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { AssetCategory, Currency } from '@/app/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#000000', '#27272a', '#52525b', '#a1a1aa'];
const CATEGORIES: AssetCategory[] = ['Stock', 'Crypto', 'Bank', 'Savings'];
const SYMBOLS: Record<Currency, string> = { TWD: 'NT$', USD: '$', CNY: '¥', SGD: 'S$' };

const t = {
  en: { 
    allocation: 'Portfolio Allocation', 
    trend: 'Asset Evolution Matrix', 
    total: 'Total Portfolio', 
    categories: { 'Stock': 'Equity', 'Crypto': 'Crypto', 'Bank': 'Other Assets', 'Savings': 'Deposits' }
  },
  zh: { 
    allocation: '當前資產配置比例', 
    trend: '歷史資產演變走勢', 
    total: '投資組合總計', 
    categories: { 'Stock': '股票資產', 'Crypto': '加密貨幣', 'Bank': '其他資產', 'Savings': '存款 (Deposits)' }
  }
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <circle cx={cx} cy={cy} r={innerRadius - 4} fill={fill} opacity={0.05} />
    </g>
  );
};

export function PortfolioCharts({ allocationData, historicalData, displayCurrency, language, loading }: any) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const lang = t[language as keyof typeof t] || t.zh;
  const symbol = SYMBOLS[displayCurrency as Currency] || '$';
  
  const totalAllocationValue = useMemo(() => allocationData.reduce((acc: number, curr: any) => acc + curr.value, 0), [allocationData]);

  if (loading && historicalData.length === 0) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
        <Skeleton className="lg:col-span-4 h-[400px]" />
        <Skeleton className="lg:col-span-8 h-[400px]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
      <div className="lg:col-span-4 modern-card p-6 sm:p-8 flex flex-col items-center min-h-[400px] border-slate-100 bg-white relative shadow-lg">
        <div className="w-full mb-6 text-left">
          <h3 className="text-[10px] lg:text-xs font-black text-black uppercase tracking-widest">{lang.allocation}</h3>
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Current Weight Distribution</p>
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
              >
                {allocationData.map((_: any, i: number) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <RechartsTooltip 
                wrapperStyle={{ zIndex: 9999 }}
                content={({ active, payload }) => {
                  if (active && payload?.length) {
                    const val = Number(payload[0].value);
                    return (
                      <div className="bg-white border border-slate-200 p-3 rounded shadow-2xl z-[10000] min-w-[140px] pointer-events-none opacity-100 ring-1 ring-black/5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 border-b border-slate-50 pb-1">
                          {lang.categories[payload[0].name as keyof typeof lang.categories] || payload[0].name}
                        </p>
                        <p className="text-xs sm:text-sm font-black text-black">{symbol}{val.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none w-full max-w-[120px]">
            {activeIndex !== null && allocationData[activeIndex] ? (
              <div className="animate-fade-in">
                <p className="text-[9px] font-black text-black uppercase tracking-widest truncate">
                  {lang.categories[allocationData[activeIndex].name as keyof typeof lang.categories] || allocationData[activeIndex].name}
                </p>
                <p className="text-2xl font-black text-black tracking-tighter">
                  {((allocationData[activeIndex].value / (totalAllocationValue || 1)) * 100).toFixed(1)}%
                </p>
              </div>
            ) : (
              <div className="animate-fade-in">
                <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{lang.total}</p>
                <p className="text-2xl font-black text-slate-200 tracking-tighter">100%</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="lg:col-span-8 modern-card p-6 sm:p-8 flex flex-col min-h-[400px] border-slate-100 bg-white relative shadow-lg">
        <div className="w-full mb-6 text-left flex justify-between items-start">
          <div>
            <h3 className="text-[10px] lg:text-xs font-black text-black uppercase tracking-widest">{lang.trend}</h3>
            <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Holdings Value Evolution</p>
          </div>
        </div>

        <div className="h-[280px] w-full mt-auto">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#cbd5e1', fontWeight: 600 }} tickFormatter={(v) => `${symbol}${(v/1000).toFixed(0)}k`} />
              <RechartsTooltip 
                wrapperStyle={{ zIndex: 9999 }}
                cursor={{ fill: '#f8fafc' }}
                content={({ active, payload, label }) => {
                  if (active && payload?.length) {
                    return (
                      <div className="bg-white border border-slate-200 p-3 sm:p-4 rounded shadow-2xl z-[10000] min-w-[180px] pointer-events-none opacity-100 ring-1 ring-black/5">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5 pb-1.5 border-b border-slate-100">{label}</p>
                        <div className="space-y-2">
                          {payload.map((p: any, i: number) => {
                            if (p.dataKey === 'totalValue' || !p.value) return null;
                            return (
                              <div key={i} className="flex justify-between items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                                    {lang.categories[p.name as keyof typeof lang.categories] || p.name}
                                  </span>
                                </div>
                                <span className="text-[10px] font-black text-black">{symbol}{Number(p.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                              </div>
                            );
                          })}
                          <div className="mt-2.5 pt-2 border-t border-black/10 flex justify-between items-center">
                            <span className="text-[9px] font-black text-black uppercase tracking-widest">{lang.total}</span>
                            <span className="text-xs font-black text-black">{symbol}{Number(payload.find((p:any)=>p.dataKey==='totalValue')?.value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend 
                verticalAlign="top" align="right" iconType="circle"
                content={({ payload }) => (
                  <div className="flex flex-wrap justify-end gap-x-4 gap-y-1 mb-4">
                    {payload?.map((entry: any, index: number) => (
                      <div key={`item-${index}`} className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{lang.categories[entry.value as keyof typeof lang.categories] || entry.value}</span>
                      </div>
                    ))}
                  </div>
                )}
              />
              {CATEGORIES.map((cat, i) => (
                <Bar key={cat} dataKey={cat} stackId="a" fill={COLORS[i % COLORS.length]} barSize={12} radius={i === 0 ? [0, 0, 2, 2] : [0, 0, 0, 0]} />
              ))}
              <Line type="monotone" dataKey="totalValue" stroke="#000000" strokeWidth={2} dot={{ r: 3, fill: '#000000', strokeWidth: 0 }} activeDot={{ r: 5, fill: '#000000' }} animationDuration={1000} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
