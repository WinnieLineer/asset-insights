'use client';

import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend
} from 'recharts';
import { AssetCategory, Currency } from '@/app/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { ChevronRight, X } from 'lucide-react';

const getCategoryColor = (cat: string) => {
  const COLORS: Record<string, string> = {
    'Stock': '#1e293b',
    'ETF': '#334155',
    'Crypto': '#3730a3',
    'Forex': '#0ea5e9',
    'Option': '#7c3aed',
    'Fund': '#2563eb',
    'Index': '#4338ca',
    'Future': '#f59e0b',
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
    categoryDetail: 'Category Breakdown',
    noAssets: 'No assets in this category',
    tapHint: 'Hover chart for historical breakdown',
    categories: { 'Stock': 'Equity', 'Crypto': 'Crypto', 'Bank': 'Other', 'Savings': 'Deposit', 'ETF': 'ETF', 'Option': 'Option', 'Fund': 'Fund', 'Index': 'Index', 'Future': 'Future', 'Forex': 'Forex' }
  },
  zh: { 
    allocation: '當前資產配置比例', 
    trend: '歷史資產演變走勢', 
    total: '投資組合總計', 
    categoryDetail: '類別細項明細',
    noAssets: '此類別無資產',
    tapHint: '滑動圖表查看歷史細項',
    categories: { 'Stock': '股票', 'Crypto': '加密貨幣', 'Bank': '其他資產', 'Savings': '存款', 'ETF': 'ETF', 'Option': '選擇權', 'Fund': '基金', 'Index': '指數', 'Future': '期貨', 'Forex': '外匯' }
  }
};

const CustomTooltip = ({ active, payload, label, symbol, langCategories, selectedCategory }: any) => {
  if (active && payload && payload.length) {
    const categories = payload.filter((p: any) => p.dataKey !== 'totalValue' && p.value > 0);
    const totalEntry = payload.find((p: any) => p.dataKey === 'totalValue');
    const pointData = payload[0].payload;
    const fullDate = pointData.displayDate || label;

    return (
      <div className="bg-white/95 backdrop-blur-md border border-slate-200 p-4 shadow-2xl rounded-xl z-[1000] min-w-[200px]">
        <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">{fullDate}</p>
        <div className="space-y-2">
          {categories.map((entry: any, index: number) => (
            <div key={index} className={cn(
              "flex items-center justify-between gap-8",
              selectedCategory && selectedCategory !== entry.name && "opacity-30"
            )}>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color || entry.fill }} />
                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
                  {langCategories[entry.name] || entry.name}
                </span>
              </div>
              <span className="text-[11px] font-black text-slate-900 tabular-nums">
                {symbol}{Math.round(entry.value).toLocaleString()}
              </span>
            </div>
          ))}
          {totalEntry && (
            <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between gap-8">
              <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">Portfolio Total</span>
              <span className="text-[11px] font-black text-slate-900 tabular-nums">
                {symbol}{Math.round(totalEntry.value).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, name, percent, langCategories }: any) => {
  if (!percent || percent < 0.01) return null; 
  
  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const offset = isMobile ? 2 : 12;
  const sx = cx + (outerRadius + 2) * cos;
  const sy = cy + (outerRadius + 2) * sin;
  const mx = cx + (outerRadius + offset) * cos;
  const my = cy + (outerRadius + offset) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * (isMobile ? 2 : 8);
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke="#cbd5e1" strokeWidth={1} fill="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 3} y={ey} dy={-2} textAnchor={textAnchor} fill="#334155" fontSize={isMobile ? 8 : 10} fontWeight={900} className="uppercase tracking-widest">
        {langCategories[name] || name}
      </text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 3} y={ey} dy={8} textAnchor={textAnchor} fill="#64748b" fontSize={isMobile ? 8 : 9} fontWeight={700}>
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    </g>
  );
};

export function HistoricalTrendChart({ historicalData, displayCurrency, language, loading, height, activeAssets }: any) {
  const lang = t[language as keyof typeof t] || t.zh;
  const symbol = SYMBOLS[displayCurrency as Currency] || '$';
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [hoveredPointData, setHoveredPointData] = useState<any>(null);
  
  if (loading && historicalData.length === 0) return <Skeleton className="w-full rounded-2xl" style={{ height: height || 250 }} />;

  const activeCategoriesInHistory = Array.from(new Set(
    historicalData.flatMap((d: any) => Object.keys(d).filter(k => !['timestamp', 'displayDate', 'shortDate', 'totalValue', '_assetDetails'].includes(k) && d[k] > 0))
  )) as AssetCategory[];

  const formatYAxis = (v: number) => {
    if (v >= 1000000) return `${symbol}${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${symbol}${(v / 1000).toFixed(0)}K`;
    return `${symbol}${v}`;
  };

  // Get per-asset breakdown for the selected category at the hovered time point
  const getDetailAssets = () => {
    if (!selectedCategory) return [];
    
    const pointData = hoveredPointData;
    if (!pointData || !pointData._assetDetails) {
      // Fall back to the latest data point
      const lastPoint = historicalData.length > 0 ? historicalData[historicalData.length - 1] : null;
      if (!lastPoint || !lastPoint._assetDetails) return [];
      const details = lastPoint._assetDetails;
      return Object.entries(details)
        .filter(([_, d]: any) => d.category === selectedCategory)
        .map(([id, d]: any) => ({ id, ...d }))
        .sort((a: any, b: any) => b.value - a.value);
    }
    
    const details = pointData._assetDetails;
    return Object.entries(details)
      .filter(([_, d]: any) => d.category === selectedCategory)
      .map(([id, d]: any) => ({ id, ...d }))
      .sort((a: any, b: any) => b.value - a.value);
  };

  const detailAssets = getDetailAssets();
  const detailTotal = detailAssets.reduce((sum: number, a: any) => sum + (a.value || 0), 0);
  const detailDate = hoveredPointData?.displayDate || (historicalData.length > 0 ? historicalData[historicalData.length - 1]?.displayDate : '');

  const effectiveHover = selectedCategory || hoveredCategory;

  return (
    <div className="modern-card p-5 sm:p-6 border-slate-100 bg-white relative shadow-sm rounded-2xl h-full flex flex-col overflow-hidden" style={{ minHeight: '250px' }}>
      <div className="w-full mb-4 flex items-center justify-between shrink-0">
        <h3 className="pro-label text-xs sm:text-sm">{lang.trend}</h3>
        {selectedCategory && (
          <button 
            onClick={() => { setSelectedCategory(null); setHoveredPointData(null); }}
            className="flex items-center gap-1 text-[10px] font-black text-slate-500 hover:text-black uppercase tracking-widest transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="w-full min-h-[120px] relative" style={{ height: height ? (height - 80) : 170 }}>
        {historicalData.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-[12px] font-black uppercase tracking-widest opacity-40">No Data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart 
              data={historicalData} 
              margin={{ top: 10, right: 10, bottom: 10, left: 20 }}
              onMouseMove={(state: any) => {
                if (state && state.activePayload && state.activePayload.length > 0) {
                  setHoveredPointData(state.activePayload[0].payload);
                }
              }}
              onMouseLeave={() => {
                if (!selectedCategory) {
                  setHoveredPointData(null);
                }
              }}
            >
            <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="shortDate" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b', fontWeight: 800 }} dy={5} />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              width={60}
              tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 700 }} 
              tickFormatter={formatYAxis} 
            />
            <Tooltip 
              content={(props) => (
                <CustomTooltip 
                  {...props} 
                  symbol={symbol} 
                  langCategories={lang.categories} 
                  selectedCategory={selectedCategory}
                />
              )} 
            />
            <Legend 
              verticalAlign="top" 
              align="right" 
              iconType="circle"
              content={({ payload }) => (
                <div className="flex flex-wrap justify-end gap-3 mb-4">
                  {payload?.map((entry: any, index: number) => {
                    if (entry.value === 'totalValue') return null;
                    const isSelected = selectedCategory === entry.value;
                    return (
                      <div 
                        key={index} 
                        className={cn(
                          "flex items-center gap-1.5 cursor-pointer transition-all select-none",
                          isSelected ? "opacity-100 scale-105" : (effectiveHover && effectiveHover !== entry.value ? "opacity-30" : "opacity-100"),
                          isSelected && "bg-slate-100 px-2 py-0.5 rounded-md"
                        )}
                        onMouseEnter={() => !selectedCategory && setHoveredCategory(entry.value)}
                        onMouseLeave={() => !selectedCategory && setHoveredCategory(null)}
                        onClick={() => {
                          if (selectedCategory === entry.value) {
                            setSelectedCategory(null);
                            setHoveredPointData(null);
                          } else {
                            setSelectedCategory(entry.value);
                            setHoveredCategory(null);
                          }
                        }}
                      >
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                          {lang.categories[entry.value as keyof typeof lang.categories] || entry.value}
                        </span>
                        {isSelected && <ChevronRight className="w-3 h-3 text-slate-900" />}
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
                name={cat}
                stackId="a" 
                fill={getCategoryColor(cat)} 
                barSize={12} 
                isAnimationActive={false}
                opacity={effectiveHover && effectiveHover !== cat ? 0.15 : 1}
                cursor="pointer"
                onClick={() => {
                  if (selectedCategory === cat) {
                    setSelectedCategory(null);
                    setHoveredPointData(null);
                  } else {
                    setSelectedCategory(cat);
                    setHoveredCategory(null);
                  }
                }}
              />
            ))}
            <Line 
              type="monotone" 
              dataKey="totalValue" 
              name="totalValue"
              stroke="#000000" 
              strokeWidth={2} 
              dot={false} 
              isAnimationActive={false}
              opacity={effectiveHover ? 0.1 : 1}
            />
          </ComposedChart>
        </ResponsiveContainer>
        )}
      </div>

      {/* Category detail panel — shows per-asset historical values */}
      {selectedCategory && detailAssets.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 shrink-0 animate-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getCategoryColor(selectedCategory) }} />
              <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">
                {lang.categories[selectedCategory as keyof typeof lang.categories] || selectedCategory}
              </span>
              <span className="text-[11px] font-black text-slate-900 ml-1">
                {symbol}{detailTotal.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <span className="text-[10px] font-bold text-slate-500">{detailDate}</span>
          </div>
          <div className="space-y-1 max-h-[180px] overflow-auto no-scrollbar">
            {detailAssets.map((asset: any) => {
              const pct = detailTotal > 0 ? (asset.value / detailTotal * 100) : 0;
              return (
                <div key={asset.id} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="w-1 h-6 rounded-full shrink-0" style={{ backgroundColor: getCategoryColor(selectedCategory), opacity: 0.4 }} />
                    <div className="min-w-0">
                      <div className="text-[12px] font-black text-slate-900 truncate">{asset.name}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{asset.symbol || '—'}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <div className="text-[12px] font-black text-slate-900 tabular-nums">
                      {symbol}{(asset.value || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className="text-[10px] font-bold text-slate-500 tabular-nums">{pct.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
          {!hoveredPointData && (
            <div className="text-center mt-2 text-[10px] font-bold text-slate-400 italic">{lang.tapHint}</div>
          )}
        </div>
      )}
    </div>
  );
}

export function AllocationPieChart({ allocationData, displayCurrency, language, loading, height }: any) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const lang = t[language as keyof typeof t] || t.zh;
  const symbol = SYMBOLS[displayCurrency as Currency] || '$';

  if (loading && (!allocationData || allocationData.length === 0)) return <Skeleton className="w-full rounded-2xl" style={{ height: height || 250 }} />;

  const filteredData = allocationData.filter((d: any) => d.value > 0);
  const totalValue = filteredData.reduce((acc: number, cur: any) => acc + cur.value, 0);

  const activeEntry = activeIndex !== null ? filteredData[activeIndex] : null;
  const displayLabel = activeEntry ? (lang.categories[activeEntry.name as keyof typeof lang.categories] || activeEntry.name) : lang.total;
  const displayPercent = activeEntry ? ((activeEntry.value / totalValue) * 100).toFixed(1) : "100";
  const displayValue = activeEntry ? activeEntry.value : totalValue;

  return (
    <div className="modern-card p-5 sm:p-6 flex flex-col items-center border-slate-100 bg-white relative shadow-sm rounded-2xl h-full overflow-hidden" style={{ minHeight: '250px', height: height || 250 }}>
      <div className="w-full mb-4 text-left shrink-0">
        <h3 className="pro-label text-xs sm:text-sm">{lang.allocation}</h3>
      </div>
      <div className="flex-1 w-full relative flex items-center justify-center overflow-hidden min-h-[120px]">
        {filteredData.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 text-[12px] font-black uppercase tracking-widest opacity-40">No Data</div>
        ) : (
          <>
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
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center max-w-[65%] z-0">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-0.5 line-clamp-1">
            {displayLabel}
          </p>
          <div className="flex items-baseline gap-0.5">
             <span className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tighter leading-none">{displayPercent}</span>
             <span className="text-[12px] font-black text-slate-500">%</span>
          </div>
          <div className="mt-2 text-[10px] font-black text-white bg-slate-900 px-3 py-1 rounded-full shadow-lg border border-white/10 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
            {symbol}{displayValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
