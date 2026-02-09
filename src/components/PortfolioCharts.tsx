'use client';

import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Sector,
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Legend, Brush
} from 'recharts';
import { AssetCategory, Currency } from '@/app/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#000000', '#27272a', '#52525b', '#a1a1aa'];
const CATEGORIES: AssetCategory[] = ['Stock', 'Crypto', 'Bank', 'Savings'];
const SYMBOLS: Record<Currency, string> = { TWD: 'NT$', USD: '$', CNY: '¥', SGD: 'S$' };

const t = {
  en: { 
    allocation: 'PORTFOLIO ALLOCATION', 
    trend: 'ASSET EVOLUTION MATRIX', 
    total: 'PORTFOLIO TOTAL', 
    categories: { 'Stock': 'Equity', 'Crypto': 'Crypto', 'Bank': 'Other', 'Savings': 'Deposit' }
  },
  zh: { 
    allocation: '當前資產配置比例', 
    trend: '歷史資產演變走勢', 
    total: '投資組合總計', 
    categories: { 'Stock': '股票', 'Crypto': '加密貨幣', 'Bank': '其他資產', 'Savings': '存款' }
  }
};

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, percent } = props;
  return (
    <g>
      <text x={cx} y={cy} dy={12} textAnchor="middle" fill="#000" fontSize={36} fontWeight={900}>
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <circle cx={cx} cy={cy} r={innerRadius - 10} fill={fill} opacity={0.05} />
    </g>
  );
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent, langCategories }: any) => {
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

  if (percent < 0.03) return null; // Hide labels for very small slices to prevent overlap

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="#e2e8f0" strokeWidth={1} fill="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 4} y={ey} dy={-2} textAnchor={textAnchor} fill="#64748b" fontSize={10} fontWeight={800} className="uppercase tracking-widest">{langCategories[name] || name}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 4} y={ey} dy={12} textAnchor={textAnchor} fill="#94a3b8" fontSize={9} fontWeight={600}>{`${(percent * 100).toFixed(1)}%`}</text>
    </g>
  );
};

export function HistoricalTrendChart({ historicalData, displayCurrency, language, loading, height }: any) {
  const lang = t[language as keyof typeof t] || t.zh;
  const symbol = SYMBOLS[displayCurrency as Currency] || '$';
  
  if (loading && historicalData.length === 0) return <Skeleton className="w-full h-full rounded-2xl" />;

  return (
    <div className="modern-card p-10 border-slate-100 bg-white relative shadow-3xl rounded-2xl h-full flex flex-col overflow-hidden">
      <div className="w-full mb-8 flex items-center justify-between shrink-0">
        <h3 className="text-[10px] xl:text-sm font-black text-slate-400 uppercase tracking-widest">{lang.trend}</h3>
      </div>
      <div className="w-full flex-1" style={{ height: height ? `${height - 160}px` : '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={historicalData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
            <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="#f8fafc" />
            <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#cbd5e1', fontWeight: 800 }} dy={10} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#e2e8f0', fontWeight: 700 }} tickFormatter={(v) => `${symbol}${(v/1000).toFixed(0)}k`} />
            <RechartsTooltip cursor={{ fill: '#f8fafc', opacity: 0.6 }} content={({ active, payload, label }) => {
              if (active && payload?.length) {
                return (
                  <div className="bg-white border border-slate-100 p-6 rounded-2xl shadow-3xl z-[1000] min-w-[240px] pointer-events-none ring-8 ring-black/5">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] mb-4 border-b border-slate-50 pb-2">{label}</p>
                    <div className="space-y-3">
                      {payload.map((p: any, i: number) => {
                        if (p.dataKey === 'totalValue' || !p.value) return null;
                        return (
                          <div key={i} className="flex justify-between items-center gap-8">
                            <div className="flex items-center gap-3">
                              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{lang.categories[p.name] || p.name}</span>
                            </div>
                            <span className="text-xs font-black text-black">{symbol}{Number(p.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                        );
                      })}
                      <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-[10px] font-black text-black uppercase tracking-[0.4em]">{lang.total}</span>
                        <span className="text-xl font-black text-black">{symbol}{Number(payload.find((p:any)=>p.dataKey==='totalValue')?.value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }} />
            <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingTop: '0px', paddingBottom: '30px' }} content={({ payload }) => (
              <div className="flex flex-wrap justify-end gap-x-6 gap-y-2">
                {payload?.map((entry: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 cursor-pointer group hover:opacity-100 opacity-60 transition-opacity">
                    <div className="w-2.5 h-2.5 rounded-full transition-transform group-hover:scale-110" style={{ backgroundColor: entry.color }} />
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] group-hover:text-black">{lang.categories[entry.value] || entry.value}</span>
                  </div>
                ))}
              </div>
            )} />
            {CATEGORIES.map((cat, i) => (<Bar key={cat} dataKey={cat} stackId="a" fill={COLORS[i % COLORS.length]} barSize={20} radius={i === 0 ? [0, 0, 4, 4] : [0, 0, 0, 0]} />))}
            <Line type="monotone" dataKey="totalValue" stroke="#000000" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#000000', stroke: '#fff', strokeWidth: 2 }} />
            <Brush dataKey="displayDate" height={24} stroke="#f1f5f9" fill="#fafafa" travellerWidth={10} className="font-black text-[9px]" />
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

  return (
    <div className="modern-card p-10 flex flex-col items-center border-slate-100 bg-white relative shadow-3xl rounded-2xl h-full overflow-hidden">
      <div className="w-full mb-8 text-left shrink-0">
        <h3 className="text-[10px] xl:text-sm font-black text-slate-400 uppercase tracking-widest">{lang.allocation}</h3>
      </div>
      <div className="flex-1 w-full relative" style={{ height: height ? `${height - 160}px` : '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie 
              activeIndex={activeIndex ?? undefined} 
              activeShape={renderActiveShape} 
              data={allocationData} 
              cx="50%" 
              cy="50%" 
              innerRadius={Math.min(90, (height||400)/5)} 
              outerRadius={Math.min(130, (height||400)/3.5)} 
              paddingAngle={4} 
              dataKey="value" 
              stroke="transparent" 
              onMouseEnter={(_, index) => setActiveIndex(index)} 
              onMouseLeave={() => setActiveIndex(null)} 
              label={(props) => renderCustomLabel({ ...props, symbol, langCategories: lang.categories })} 
              labelLine={true}
            >
              {allocationData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <RechartsTooltip content={({ active, payload }) => {
              if (active && payload?.length) {
                return (
                  <div className="bg-white border border-slate-100 p-4 rounded-xl shadow-3xl z-[1000] min-w-[160px] pointer-events-none ring-8 ring-black/5">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.4em] mb-1">{lang.categories[payload[0].name] || payload[0].name}</p>
                    <p className="text-xl font-black text-black">{symbol}{Number(payload[0].value).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                );
              }
              return null;
            }} />
          </PieChart>
        </ResponsiveContainer>
        {!activeIndex && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-2">
            <p className="text-[9px] font-black text-slate-200 uppercase tracking-[0.4em]">{lang.total}</p>
            <p className="text-2xl xl:text-3xl font-black text-slate-100 tracking-tighter">100%</p>
          </div>
        )}
      </div>
    </div>
  );
}
