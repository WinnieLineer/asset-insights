'use client';

import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip
} from 'recharts';
import { AssetCategory, Currency } from '@/app/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const getCategoryColor = (cat: string) => {
  const COLORS: Record<string, string> = {
    'Stock': '#1e293b',
    'ETF': '#334155',
    'Crypto': '#3730a3',
    'Option': '#7c3aed',
    'Fund': '#2563eb',
    'Index': '#4338ca',
    'Bank': '#064e3b',
    'Savings': '#78350f'
  };
  if (COLORS[cat]) return COLORS[cat];
  
  let hash = 0;
  for (let i = 0; i < cat.length; i++) {
    hash = cat.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash % 360)}, 35%, 45%)`;
};

const SYMBOLS: Record<Currency, string> = { TWD: 'NT$', USD: '$', CNY: '¥', SGD: 'S$' };

const t = {
  en: { 
    allocation: 'CURRENT ALLOCATION', 
    trend: 'ASSET EVOLUTION', 
    total: 'TOTAL', 
    categories: { 'Stock': 'Equity', 'Crypto': 'Crypto', 'Bank': 'Other', 'Savings': 'Deposit', 'ETF': 'ETF', 'Option': 'Option', 'Fund': 'Fund', 'Index': 'Index' }
  },
  zh: { 
    allocation: '當前資產配置比例', 
    trend: '歷史資產演變走勢', 
    total: '投資組合總計', 
    categories: { 'Stock': '股票', 'Crypto': '加密貨幣', 'Bank': '其他資產', 'Savings': '存款', 'ETF': 'ETF', 'Option': '選擇權', 'Fund': '基金', 'Index': '指數' }
  }
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent, langCategories }: any) => {
  if (!percent || percent < 0.01) return null; 
  
  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  
  const sx = cx + (outerRadius + 5) * cos;
  const sy = cy + (outerRadius + 5) * sin;
  const mx = cx + (outerRadius + 15) * cos;
  const my = cy + (outerRadius + 15) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 8;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="#cbd5e1" strokeWidth={1} fill="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 4} y={ey} dy={-2} textAnchor={textAnchor} fill="#64748b" fontSize={10} fontWeight={900} className="uppercase tracking-widest">
        {langCategories[name] || name}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 4} y={ey} dy={10} textAnchor={textAnchor} fill="#94a3b8" fontSize={9} fontWeight={700}>
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    </g>
  );
};

export function HistoricalTrendChart({ historicalData, displayCurrency, language, loading, height }: any) {
  const lang = t[language as keyof typeof t] || t.zh;
  const symbol = SYMBOLS[displayCurrency as Currency] || '$';
  
  if (loading && historicalData.length === 0) return <Skeleton className="w-full h-full rounded-2xl" />;

  const activeCategoriesInHistory = Array.from(new Set(
    historicalData.flatMap((d: any) => Object.keys(d).filter(k => !['timestamp', 'displayDate', 'shortDate', 'totalValue'].includes(k) && d[k] > 0))
  )) as AssetCategory[];

  const formatYAxis = (v: number) => {
    if (v >= 1000000) return `${symbol}${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${symbol}${(v / 1000).toFixed(0)}K`;
    return `${symbol}${v}`;
  };

  return (
    <div className="modern-card p-5 sm:p-6 border-slate-100 bg-white relative shadow-sm rounded-2xl h-full flex flex-col overflow-hidden" style={{ minHeight: height || 350 }}>
      <div className="w-full mb-4 flex items-center justify-between shrink-0">
        <h3 className="pro-label text-xs sm:text-sm">{lang.trend}</h3>
      </div>
      <div className="w-full flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 10, left: 20 }}>
            <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="shortDate" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 800 }} dy={5} />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              width={60}
              tick={{ fontSize: 11, fill: '#cbd5e1', fontWeight: 700 }} 
              tickFormatter={formatYAxis} 
            />
            {activeCategoriesInHistory.map((cat) => (
              <Bar 
                key={cat} 
                dataKey={cat} 
                stackId="a" 
                fill={getCategoryColor(cat)} 
                barSize={12} 
                isAnimationActive={false}
              />
            ))}
            <Line 
              type="monotone" 
              dataKey="totalValue" 
              stroke="#000000" 
              strokeWidth={2} 
              dot={false} 
              isAnimationActive={false}
            />
            <Tooltip content={() => null} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function AllocationPieChart({ allocationData, displayCurrency, language, loading, height }: any) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const lang = t[language as keyof typeof t] || t.zh;
  const symbol = SYMBOLS[displayCurrency as Currency] || '$';

  if (loading && (!allocationData || allocationData.length === 0)) return <Skeleton className="w-full h-full rounded-2xl" />;

  const filteredData = allocationData.filter((d: any) => d.value > 0);
  const totalValue = filteredData.reduce((acc: number, cur: any) => acc + cur.value, 0);

  const activeEntry = activeIndex !== null ? filteredData[activeIndex] : null;
  const displayLabel = activeEntry ? (lang.categories[activeEntry.name as keyof typeof lang.categories] || activeEntry.name) : lang.total;
  const displayPercent = activeEntry ? ((activeEntry.value / totalValue) * 100).toFixed(1) : "100";
  const displayValue = activeEntry ? activeEntry.value : totalValue;

  return (
    <div className="modern-card p-5 sm:p-6 flex flex-col items-center border-slate-100 bg-white relative shadow-sm rounded-2xl h-full overflow-hidden" style={{ minHeight: height || 350 }}>
      <div className="w-full mb-4 text-left shrink-0">
        <h3 className="pro-label text-xs sm:text-sm">{lang.allocation}</h3>
      </div>
      <div className="flex-1 w-full relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-10">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={filteredData} 
                cx="50%" cy="50%" 
                innerRadius="75%" 
                outerRadius="92%" 
                paddingAngle={2} 
                dataKey="value" 
                stroke="none" 
                onMouseEnter={(_, index) => setActiveIndex(index)} 
                onMouseLeave={() => setActiveIndex(null)} 
                label={(props) => renderCustomLabel({ ...props, symbol, langCategories: lang.categories })} 
                labelLine={false}
                isAnimationActive={false}
              >
                {filteredData.map((entry: any, i: number) => (
                  <Cell 
                    key={i} 
                    fill={getCategoryColor(entry.name)} 
                    className="outline-none transition-all duration-300"
                    opacity={activeIndex === null || activeIndex === i ? 1 : 0.4}
                  />
                ))}
              </Pie>
              <Tooltip content={() => null} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center max-w-[65%] z-0">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5 line-clamp-1">
            {displayLabel}
          </p>
          <div className="flex items-baseline gap-0.5">
             <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter leading-none">{displayPercent}</span>
             <span className="text-[12px] font-black text-slate-400">%</span>
          </div>
          <div className="mt-2 text-[10px] font-black text-white bg-slate-900 px-3 py-1 rounded-full shadow-lg border border-white/10 whitespace-nowrap">
            {symbol}{displayValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>
    </div>
  );
}
