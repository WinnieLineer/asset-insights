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
    categories: { 'Stock': 'Equity', 'Crypto': 'Crypto', 'Bank': 'Other', 'Savings': 'Deposit', 'ETF': 'ETF', 'Option': 'Option' }
  },
  zh: { 
    allocation: '當前資產配置比例', 
    trend: '歷史資產演變走勢', 
    total: '投資組合總計', 
    categories: { 'Stock': '股票', 'Crypto': '加密貨幣', 'Bank': '其他資產', 'Savings': '存款', 'ETF': 'ETF', 'Option': '選擇權' }
  }
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <circle cx={cx} cy={cy} r={innerRadius - 10} fill={fill} opacity={0.05} />
    </g>
  );
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent, langCategories }: any) => {
  const displayPercent = percent || 0;
  if (displayPercent < 0.01) return null; 
  
  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  
  const sx = cx + (outerRadius + 5) * cos;
  const sy = cy + (outerRadius + 5) * sin;
  const mx = cx + (outerRadius + 15) * cos;
  const my = cy + (outerRadius + 15) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 12;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="#e2e8f0" strokeWidth={1} fill="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 5} y={ey} dy={-4} textAnchor={textAnchor} fill="#64748b" fontSize={11} fontWeight={800} className="uppercase tracking-widest">
        {langCategories[name] || name}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 5} y={ey} dy={10} textAnchor={textAnchor} fill="#94a3b8" fontSize={9} fontWeight={600}>
        {`${(displayPercent * 100).toFixed(1)}%`}
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
  const lang = t[language as keyof typeof t] || t.zh;
  const symbol = SYMBOLS[displayCurrency as Currency] || '$';

  if (loading && (!allocationData || allocationData.length === 0)) return <Skeleton className="w-full h-full rounded-2xl" />;

  const filteredData = allocationData.filter((d: any) => d.value > 0);
  const totalValue = filteredData.reduce((acc: number, cur: any) => acc + cur.value, 0);

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
                innerRadius="40%" outerRadius="55%" paddingAngle={5} 
                dataKey="value" stroke="transparent" 
                onMouseEnter={(_, index) => setActiveIndex(index)} 
                onMouseLeave={() => setActiveIndex(null)} 
                label={(props) => renderCustomLabel({ ...props, symbol, langCategories: lang.categories })} 
                labelLine={false}
                isAnimationActive={false}
              >
                {filteredData.map((entry: any, i: number) => (
                  <Cell key={i} fill={getCategoryColor(entry.name)} className="transition-all duration-300 outline-none" />
                ))}
              </Pie>
              <RechartsTooltip 
                position={{ y: 20 }} 
                content={({ active, payload, coordinate }) => {
                  if (active && payload?.length && coordinate) {
                    const quadrantX = coordinate.x > 300 ? -220 : 60;
                    const val = Number(payload[0].value);
                    const percentVal = totalValue > 0 ? ((val / totalValue) * 100).toFixed(1) : "0.0";
                    
                    return (
                      <div 
                        className="bg-white border border-slate-100 p-5 rounded-2xl shadow-2xl z-[1000] min-w-[200px] pointer-events-none animate-in fade-in zoom-in-95 duration-200"
                        style={{
                          position: 'absolute',
                          left: quadrantX,
                          top: 0,
                        }}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.4em]">{lang.categories[payload[0].name as keyof typeof lang.categories] || payload[0].name}</p>
                          <span className="text-[11px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                            {percentVal}%
                          </span>
                        </div>
                        <p className="text-xl font-black text-black leading-tight">{symbol}{val.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                      </div>
                    );
                  }
                  return null;
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center pointer-events-none text-center z-10 bg-white/60 backdrop-blur-[4px] rounded-full w-32 h-32 shadow-inner border border-white/50">
          <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-1">TOTAL</p>
          <p className="text-3xl font-black text-black tracking-tighter leading-none">100%</p>
          <div className="mt-2 text-[10px] font-black text-slate-300 tracking-widest">{symbol}{totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
        </div>
      </div>
    </div>
  );
}
