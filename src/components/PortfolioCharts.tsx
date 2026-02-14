'use client';

import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Sector,
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { AssetCategory, Currency } from '@/app/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const getCategoryColor = (cat: string) => {
  const COLORS: Record<string, string> = {
    'Stock': '#1e293b',
    'ETF': '#0f172a',
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
  return `hsl(${Math.abs(hash % 360)}, 30%, 30%)`;
};

const SYMBOLS: Record<Currency, string> = { TWD: 'NT$', USD: '$', CNY: '¥', SGD: 'S$' };

const t = {
  en: { 
    allocation: 'CURRENT PORTFOLIO ALLOCATION', 
    trend: 'HISTORICAL ASSET EVOLUTION', 
    total: 'PORTFOLIO TOTAL', 
    categories: { 'Stock': 'Equity', 'Crypto': 'Crypto', 'Bank': 'Other', 'Savings': 'Deposit', 'ETF': 'ETF', 'Option': 'Option', 'Fund': 'Fund', 'Index': 'Index' }
  },
  zh: { 
    allocation: '當前資產配置比例', 
    trend: '歷史資產演變走勢', 
    total: '投資組合總計', 
    categories: { 'Stock': '股票', 'Crypto': '加密貨幣', 'Bank': '其他資產', 'Savings': '存款', 'ETF': 'ETF', 'Option': '選擇權', 'Fund': '基金', 'Index': '指數' }
  }
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <circle cx={cx} cy={cy} r={innerRadius - 8} fill={fill} opacity={0.1} />
    </g>
  );
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent, langCategories }: any) => {
  if (!percent || percent < 0.01) return null; 
  
  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  
  const sx = cx + (outerRadius + 5) * cos;
  const sy = cy + (outerRadius + 5) * sin;
  const mx = cx + (outerRadius + 20) * cos;
  const my = cy + (outerRadius + 20) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 15;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="#cbd5e1" strokeWidth={1} fill="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 5} y={ey} dy={-4} textAnchor={textAnchor} fill="#475569" fontSize={11} fontWeight={800} className="uppercase tracking-widest">
        {langCategories[name] || name}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 5} y={ey} dy={10} textAnchor={textAnchor} fill="#94a3b8" fontSize={10} fontWeight={600}>
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    </g>
  );
};

export function HistoricalTrendChart({ historicalData, displayCurrency, language, loading, height }: any) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const lang = t[language as keyof typeof t] || t.zh;
  const symbol = SYMBOLS[displayCurrency as Currency] || '$';
  
  if (loading && historicalData.length === 0) return <Skeleton className="w-full h-full rounded-2xl" />;

  const activeCategoriesInHistory = Array.from(new Set(
    historicalData.flatMap((d: any) => Object.keys(d).filter(k => !['timestamp', 'displayDate', 'shortDate', 'totalValue'].includes(k) && d[k] > 0))
  )) as AssetCategory[];

  const formatYAxis = (v: number) => {
    if (v >= 1000000) return `${symbol}${(v / 1000000).toFixed(1)}m`;
    if (v >= 1000) return `${symbol}${(v / 1000).toFixed(0)}k`;
    return `${symbol}${v}`;
  };

  return (
    <div className="modern-card p-6 sm:p-8 border-slate-100 bg-white relative shadow-sm rounded-2xl h-full flex flex-col overflow-hidden">
      <div className="w-full mb-6 flex items-center justify-between shrink-0">
        <h3 className="pro-label">{lang.trend}</h3>
      </div>
      <div className="w-full flex-1 min-h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={historicalData} margin={{ top: 10, right: 10, bottom: 10, left: 30 }}>
            <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="shortDate" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#94a3b8', fontWeight: 800 }} dy={10} />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              width={80}
              tick={{ fontSize: 13, fill: '#cbd5e1', fontWeight: 700 }} 
              tickFormatter={formatYAxis} 
            />
            <RechartsTooltip cursor={{ fill: '#f8fafc', opacity: 0.8 }} content={({ active, payload, label }) => {
              if (active && payload?.length) {
                const fullDate = payload[0].payload.displayDate || label;
                return (
                  <div className="bg-white border border-slate-100 p-6 rounded-xl shadow-xl z-[1000] min-w-[240px] pointer-events-none">
                    <p className="text-[12px] font-black text-slate-300 uppercase tracking-[0.4em] mb-4 border-b border-slate-50 pb-2">{fullDate}</p>
                    <div className="space-y-3">
                      {payload.map((p: any, i: number) => {
                        if (p.dataKey === 'totalValue' || !p.value) return null;
                        const isActive = !activeCategory || activeCategory === p.dataKey;
                        return (
                          <div key={i} className={`flex justify-between items-center gap-6 transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-15'}`}>
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor(p.name) }} />
                              <span className="text-[13px] font-black text-slate-600 uppercase tracking-widest">{lang.categories[p.name as keyof typeof lang.categories] || p.name}</span>
                            </div>
                            <span className="text-xl font-black text-black">{symbol}{Number(p.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                        );
                      })}
                      <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-[13px] font-black text-black uppercase tracking-[0.4em]">{lang.total}</span>
                        <span className="text-2xl font-black text-black">{symbol}{Number(payload.find((p:any)=>p.dataKey==='totalValue')?.value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }} />
            <Legend 
              verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} 
              content={({ payload }) => (
                <div className="flex flex-wrap justify-end gap-x-6 gap-y-2">
                  {payload?.map((entry: any, index: number) => {
                    if (!activeCategoriesInHistory.includes(entry.value)) return null;
                    return (
                      <div key={index} className={`flex items-center gap-2 cursor-pointer transition-all duration-200 ${(!activeCategory || activeCategory === entry.value) ? 'opacity-100' : 'opacity-20'}`} onMouseEnter={() => setActiveCategory(entry.value)} onMouseLeave={() => setActiveCategory(null)}>
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getCategoryColor(entry.value) }} />
                        <span className="text-[12px] font-black text-slate-400 uppercase tracking-widest">{lang.categories[entry.value as keyof typeof lang.categories] || entry.value}</span>
                      </div>
                    );
                  })}
                </div>
              )} 
            />
            {activeCategoriesInHistory.map((cat) => (
              <Bar 
                key={cat} 
                dataKey={cat} 
                stackId="a" 
                fill={getCategoryColor(cat)} 
                barSize={16} 
                isAnimationActive={false}
                opacity={(!activeCategory || activeCategory === cat) ? 1 : 0.15} 
                className="transition-opacity duration-300" 
              />
            ))}
            <Line 
              type="monotone" 
              dataKey="totalValue" 
              stroke="#000000" 
              strokeWidth={4} 
              dot={false} 
              isAnimationActive={false}
              activeDot={{ r: 6, fill: '#000', stroke: '#fff', strokeWidth: 2 }} 
              opacity={!activeCategory ? 1 : 0.1} 
              className="transition-opacity duration-300" 
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function AllocationPieChart({ allocationData, displayCurrency, language, loading, height }: any) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [activeEntry, setActiveEntry] = useState<any>(null);
  const lang = t[language as keyof typeof t] || t.zh;
  const symbol = SYMBOLS[displayCurrency as Currency] || '$';

  if (loading && (!allocationData || allocationData.length === 0)) return <Skeleton className="w-full h-full rounded-2xl" />;

  const filteredData = allocationData.filter((d: any) => d.value > 0);
  const totalValue = filteredData.reduce((acc: number, cur: any) => acc + cur.value, 0);

  const displayData = activeEntry || { name: 'TOTAL', value: totalValue, percent: 1.0 };
  const percentStr = activeEntry ? ((activeEntry.value / totalValue) * 100).toFixed(1) : "100";

  return (
    <div className="modern-card p-6 sm:p-8 flex flex-col items-center border-slate-100 bg-white relative shadow-sm rounded-2xl h-full overflow-hidden">
      <div className="w-full mb-6 text-left shrink-0">
        <h3 className="pro-label">{lang.allocation}</h3>
      </div>
      <div className="flex-1 w-full relative flex items-center justify-center">
        <div className="absolute inset-0 z-0 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                activeIndex={activeIndex ?? undefined} 
                activeShape={renderActiveShape} 
                data={filteredData} 
                cx="50%" cy="50%" 
                innerRadius="40%" outerRadius="55%" paddingAngle={6} 
                dataKey="value" stroke="transparent" 
                onMouseEnter={(_, index) => {
                  setActiveIndex(index);
                  setActiveEntry(filteredData[index]);
                }} 
                onMouseLeave={() => {
                  setActiveIndex(null);
                  setActiveEntry(null);
                }} 
                label={(props) => renderCustomLabel({ ...props, symbol, langCategories: lang.categories })} 
                labelLine={false}
                isAnimationActive={false}
              >
                {filteredData.map((entry: any, i: number) => (
                  <Cell key={i} fill={getCategoryColor(entry.name)} className="transition-all duration-300 outline-none" />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* 中心區域：智慧顯示總計或當前懸停類別 */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none text-center z-10 bg-white rounded-full w-[38%] h-[38%] shadow-2xl border border-slate-50 transition-all duration-300 scale-110">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">
            {activeEntry ? (lang.categories[activeEntry.name as keyof typeof lang.categories] || activeEntry.name) : 'TOTAL'}
          </p>
          <div className="flex items-baseline gap-1">
             <span className="text-3xl font-black text-black tracking-tighter">{percentStr}</span>
             <span className="text-sm font-black text-slate-400">%</span>
          </div>
          <div className="mt-1.5 text-[11px] font-black text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full shadow-inner border border-slate-200/50">
            {symbol}{displayData.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
      </div>
    </div>
  );
}
