'use client';

import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Sector,
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import { AssetCategory, Currency } from '@/app/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

const ASSET_COLORS: Record<string, string> = {
  'Stock': '#000000',   
  'Crypto': '#3730a3',  
  'Bank': '#064e3b',    
  'Savings': '#92400e'  
};

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
      <text x={cx} y={cy} dy={16} textAnchor="middle" fill="#000" fontSize={48} fontWeight={900}>
        {`${(percent * 100).toFixed(1)}%`}
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 12} startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <circle cx={cx} cy={cy} r={innerRadius - 15} fill={fill} opacity={0.08} />
    </g>
  );
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent, langCategories }: any) => {
  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const sx = cx + (outerRadius + 10) * cos;
  const sy = cy + (outerRadius + 10) * sin;
  const mx = cx + (outerRadius + 25) * cos;
  const my = cy + (outerRadius + 25) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 20;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  if (percent < 0.03) return null; 

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="#e2e8f0" strokeWidth={2} fill="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} dy={-6} textAnchor={textAnchor} fill="#64748b" fontSize={14} fontWeight={800} className="uppercase tracking-widest">{langCategories[name] || name}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 8} y={ey} dy={14} textAnchor={textAnchor} fill="#94a3b8" fontSize={13} fontWeight={600}>{`${(percent * 100).toFixed(1)}%`}</text>
    </g>
  );
};

export function HistoricalTrendChart({ historicalData, displayCurrency, language, loading, height }: any) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const lang = t[language as keyof typeof t] || t.zh;
  const symbol = SYMBOLS[displayCurrency as Currency] || '$';
  
  if (loading && historicalData.length === 0) return <Skeleton className="w-full h-full rounded-2xl" />;

  const activeCategoriesInHistory = Array.from(new Set(
    historicalData.flatMap((d: any) => Object.keys(d).filter(k => ASSET_COLORS[k]))
  )) as AssetCategory[];

  return (
    <div className="modern-card p-10 border-slate-100 bg-white relative shadow-3xl rounded-2xl h-full flex flex-col overflow-hidden">
      <div className="w-full mb-8 flex items-center justify-between shrink-0">
        <h3 className="text-[10px] xl:text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">{lang.trend}</h3>
      </div>
      <div className="w-full flex-1" style={{ height: height ? `${height - 140}px` : '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={historicalData} margin={{ top: 15, right: 25, bottom: 15, left: 25 }}>
            <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="displayDate" axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#94a3b8', fontWeight: 800 }} dy={15} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#cbd5e1', fontWeight: 700 }} tickFormatter={(v) => `${symbol}${(v/1000).toFixed(0)}k`} />
            <RechartsTooltip cursor={{ fill: '#f8fafc', opacity: 0.8 }} content={({ active, payload, label }) => {
              if (active && payload?.length) {
                return (
                  <div className="bg-white border-2 border-slate-100 p-8 rounded-2xl shadow-3xl z-[1000] min-w-[280px] pointer-events-none ring-12 ring-black/5">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] mb-5 border-b border-slate-50 pb-3">{label}</p>
                    <div className="space-y-4">
                      {payload.map((p: any, i: number) => {
                        if (p.dataKey === 'totalValue' || !p.value) return null;
                        const isActive = !activeCategory || activeCategory === p.dataKey;
                        return (
                          <div key={i} className={`flex justify-between items-center gap-10 transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-15'}`}>
                            <div className="flex items-center gap-4">
                              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: ASSET_COLORS[p.name] || '#ccc' }} />
                              <span className="text-[13px] font-black text-slate-600 uppercase tracking-widest">{lang.categories[p.name] || p.name}</span>
                            </div>
                            <span className="text-lg font-black text-black">{symbol}{Number(p.value).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                          </div>
                        );
                      })}
                      <div className="mt-5 pt-5 border-t border-slate-50 flex justify-between items-center">
                        <span className="text-[14px] font-black text-black uppercase tracking-[0.5em]">{lang.total}</span>
                        <span className="text-3xl font-black text-black">{symbol}{Number(payload.find((p:any)=>p.dataKey==='totalValue')?.value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            }} />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle" 
              wrapperStyle={{ paddingTop: '0px', paddingBottom: '30px' }} 
              onMouseEnter={(e: any) => setActiveCategory(e.dataKey || e.value)}
              onMouseLeave={() => setActiveCategory(null)}
              content={({ payload }) => (
                <div className="flex flex-wrap justify-end gap-x-8 gap-y-3">
                  {payload?.map((entry: any, index: number) => (
                    <div 
                      key={index} 
                      className={`flex items-center gap-3 cursor-pointer transition-all duration-200 ${(!activeCategory || activeCategory === entry.value) ? 'opacity-100' : 'opacity-20'}`}
                      onMouseEnter={() => setActiveCategory(entry.value)}
                      onMouseLeave={() => setActiveCategory(null)}
                    >
                      <div className="w-4 h-4 rounded-full transition-transform" style={{ backgroundColor: ASSET_COLORS[entry.value] || entry.color }} />
                      <span className="text-[13px] font-black text-slate-400 uppercase tracking-[0.35em]">{lang.categories[entry.value] || entry.value}</span>
                    </div>
                  ))}
                </div>
              )} 
            />
            {activeCategoriesInHistory.map((cat) => (
              <Bar 
                key={cat} 
                dataKey={cat} 
                stackId="a" 
                fill={ASSET_COLORS[cat]} 
                barSize={20} 
                opacity={(!activeCategory || activeCategory === cat) ? 1 : 0.15}
                className="transition-opacity duration-300"
              />
            ))}
            <Line 
              type="monotone" 
              dataKey="totalValue" 
              stroke="#000000" 
              strokeWidth={6} 
              dot={false} 
              activeDot={{ r: 9, fill: '#000000', stroke: '#fff', strokeWidth: 4 }} 
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

  return (
    <div className="modern-card p-10 flex flex-col items-center border-slate-100 bg-white relative shadow-3xl rounded-2xl h-full overflow-hidden">
      <div className="w-full mb-8 text-left shrink-0">
        <h3 className="text-[10px] xl:text-[11px] font-black text-slate-400 uppercase tracking-[0.4em]">{lang.allocation}</h3>
      </div>
      <div className="flex-1 w-full relative" style={{ height: height ? `${height - 140}px` : '400px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie 
              activeIndex={activeIndex ?? undefined} 
              activeShape={renderActiveShape} 
              data={filteredData} 
              cx="50%" 
              cy="50%" 
              innerRadius={Math.min(100, (height||400)/4.2)} 
              outerRadius={Math.min(150, (height||400)/2.8)} 
              paddingAngle={6} 
              dataKey="value" 
              stroke="transparent" 
              onMouseEnter={(_, index) => setActiveIndex(index)} 
              onMouseLeave={() => setActiveIndex(null)} 
              label={(props) => renderCustomLabel({ ...props, symbol, langCategories: lang.categories })} 
              labelLine={true}
            >
              {filteredData.map((entry: any, i: number) => (
                <Cell 
                  key={i} 
                  fill={ASSET_COLORS[entry.name] || '#ccc'} 
                  opacity={activeIndex === null || activeIndex === i ? 1 : 0.2}
                  className="transition-opacity duration-300 outline-none"
                />
              ))}
            </Pie>
            <RechartsTooltip content={({ active, payload }) => {
              if (active && payload?.length) {
                return (
                  <div className="bg-white border-2 border-slate-100 p-6 rounded-xl shadow-3xl z-[1000] min-w-[200px] pointer-events-none ring-10 ring-black/5">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em] mb-2">{lang.categories[payload[0].name] || payload[0].name}</p>
                    <p className="text-3xl font-black text-black">{symbol}{Number(payload[0].value).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                  </div>
                );
              }
              return null;
            }} />
          </PieChart>
        </ResponsiveContainer>
        {activeIndex === null && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-4">
            <p className="text-[10px] font-black text-slate-200 uppercase tracking-[0.5em]">{lang.total}</p>
            <p className="text-4xl xl:text-5xl font-black text-slate-100 tracking-tighter">100%</p>
          </div>
        )}
      </div>
    </div>
  );
}
