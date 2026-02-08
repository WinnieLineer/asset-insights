'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Asset, MarketData, AssetCategory, Currency } from './lib/types';
import { fetchMarketData } from '@/app/lib/market-api';
import { AssetForm } from '@/components/AssetForm';
import { PortfolioCharts } from '@/components/PortfolioCharts';
import { AITipCard } from '@/components/AITipCard';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  RefreshCw, 
  Trash2, 
  Globe, 
  Wallet, 
  BarChart3,
  Edit2,
  Loader2,
  Calendar,
  ArrowRightLeft,
  Clock,
  TrendingUp,
  TrendingDown,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Check,
  Maximize2,
  Minimize2,
  Move
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  TWD: 'NT$',
  USD: '$',
  CNY: '¥',
  SGD: 'S$',
};

const translations = {
  en: {
    title: 'Asset Insights Pro',
    subtitle: 'PROFESSIONAL ASSET INSIGHT TRACKING',
    syncMarket: 'Sync Market',
    totalValue: 'Total Portfolio Value',
    addAsset: 'Add New Position',
    assetName: 'Asset',
    holdings: 'Quantity',
    valuation: 'Market Value',
    unitPrice: 'Unit Price',
    dashboard: 'Portfolio Overview',
    change: 'Daily Change',
    editAsset: 'Edit Position',
    cancel: 'Cancel',
    saveChanges: 'Save',
    fetching: 'Syncing...',
    exchangeRate: 'Live Exchange Rates',
    baseRange: 'Tracking Range',
    interval: 'Frequency',
    days30: '30 Days',
    days90: '90 Days',
    days180: '180 Days',
    days365: '365 Days',
    int1d: 'Daily',
    int1wk: 'Weekly',
    int1mo: 'Monthly',
    assetDeleted: 'Asset removed.',
    dataUpdated: 'Market data synced.',
    acqDate: 'Hold Since',
    reorderMode: 'Layout Customization Mode',
    exitReorder: 'Save Layout',
    longPressTip: 'Long press any section to unlock dashboard grid arrangement',
    widen: 'Widen',
    shrink: 'Shrink',
    categoryNames: {
      Stock: 'Equity',
      Crypto: 'Crypto',
      Bank: 'Other',
      Savings: 'Deposit'
    }
  },
  zh: {
    title: 'Asset Insights Pro',
    subtitle: '專業資產部位追蹤系統',
    syncMarket: '同步最新市場數據',
    totalValue: '投資組合總淨值',
    addAsset: '新增資產部位',
    assetName: '資產名稱',
    holdings: '持有數量',
    valuation: '帳面價值',
    unitPrice: '單位市場價值',
    dashboard: '資產部位概覽與分析',
    change: '今日漲跌',
    editAsset: '編輯部位資訊',
    cancel: '取消',
    saveChanges: '儲存變更',
    fetching: '同步中...',
    exchangeRate: '即時換算匯率',
    baseRange: '追蹤區間',
    interval: '資料頻率',
    days30: '過去 30 天',
    days90: '過去 90 天',
    days180: '過去 180 天',
    days365: '過去 365 天',
    int1d: '日線',
    int1wk: '週線',
    int1mo: '月線',
    assetDeleted: '資產已移除',
    dataUpdated: '市場數據已更新',
    acqDate: '持有日期',
    reorderMode: '佈局自由調整模式',
    exitReorder: '儲存目前佈局',
    longPressTip: '長按任何區塊以解除鎖定並自由調整位置與長寬',
    widen: '增加寬度',
    shrink: '縮減寬度',
    categoryNames: {
      Stock: '股票',
      Crypto: '加密貨幣',
      Bank: '其他資產',
      Savings: '存款'
    }
  }
};

type SectionId = 'summary' | 'controls' | 'table' | 'charts' | 'ai' | 'form';

interface LayoutItem {
  id: SectionId;
  w: number; // 1-12 columns
  order: number;
}

const DEFAULT_LAYOUT: LayoutItem[] = [
  { id: 'summary', w: 12, order: 0 },
  { id: 'controls', w: 12, order: 1 },
  { id: 'table', w: 12, order: 2 },
  { id: 'charts', w: 12, order: 3 },
  { id: 'ai', w: 12, order: 4 },
  { id: 'form', w: 12, order: 5 },
];

export default function AssetInsightsPage() {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState<'en' | 'zh'>('zh');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('TWD');
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editDate, setEditDate] = useState<string>('');
  const [trackingDays, setTrackingDays] = useState<string>("30");
  const [interval, setInterval] = useState<string>("1d");
  const [marketTimeline, setMarketTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Advanced Grid Layout State
  const [isReordering, setIsReordering] = useState(false);
  const [layout, setLayout] = useState<LayoutItem[]>(DEFAULT_LAYOUT);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const [marketData, setMarketData] = useState<MarketData>({
    exchangeRate: 32.5,
    rates: { TWD: 32.5, CNY: 7.2, USD: 1, SGD: 1.35 },
    assetMarketPrices: {}
  });

  const t = translations[language];

  const updateAllData = useCallback(async (currentAssets: Asset[]) => {
    if (!mounted || loading) return;
    setLoading(true);
    try {
      const { marketData: newData, historicalTimeline } = await fetchMarketData(
        currentAssets, 
        parseInt(trackingDays), 
        interval
      );
      setMarketData(newData);
      setMarketTimeline(historicalTimeline);
      toast({ title: t.dataUpdated });
    } catch (error) {
      toast({ variant: 'destructive', title: '市場同步失敗' });
    } finally {
      setLoading(false);
    }
  }, [mounted, trackingDays, interval, t.dataUpdated, loading, toast]);

  useEffect(() => {
    setMounted(true);
    const savedAssets = localStorage.getItem('assets');
    if (savedAssets) setAssets(JSON.parse(savedAssets));
    
    const savedLayout = localStorage.getItem('assetInsightsLayout');
    if (savedLayout) setLayout(JSON.parse(savedLayout));
  }, []);

  useEffect(() => {
    if (mounted && assets.length > 0) {
      updateAllData(assets);
    }
  }, [mounted, trackingDays, interval, assets.length]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('assets', JSON.stringify(assets));
    }
  }, [assets, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('assetInsightsLayout', JSON.stringify(layout));
    }
  }, [layout, mounted]);

  const getCurrencySymbol = (cur: Currency) => CURRENCY_SYMBOLS[cur] || 'NT$';

  const assetCalculations = useMemo(() => {
    let totalTWD = 0;
    const allocationMap: Record<AssetCategory, number> = {
      'Stock': 0, 'Crypto': 0, 'Bank': 0, 'Savings': 0,
    };
    
    const rateTWD = marketData.rates.TWD || 32.5;
    const displayRate = marketData.rates[displayCurrency] || 1;

    const processedAssets = assets.map(asset => {
      const marketInfo = marketData.assetMarketPrices[asset.id];
      const nativePrice = marketInfo?.price || 0;
      const apiCurrency = marketInfo?.currency || 'TWD';
      
      const apiCurrencyRate = (marketData.rates[apiCurrency as Currency] || 1);
      const priceInTWD = nativePrice * (rateTWD / apiCurrencyRate);
      
      let valueInTWD = 0;
      let dayChangeInTWD = 0;
      let dayChangePercent = 0;

      if (asset.category === 'Stock' || asset.category === 'Crypto') {
        valueInTWD = asset.amount * priceInTWD;
        
        if (marketTimeline.length >= 2) {
          const lastPoint = marketTimeline[marketTimeline.length - 1];
          const prevPoint = marketTimeline[marketTimeline.length - 2];
          const currentP = lastPoint.assets[asset.id];
          const prevP = prevPoint.assets[asset.id];
          if (currentP !== undefined && prevP !== undefined) {
            const priceDiff = (currentP - prevP) * (rateTWD / apiCurrencyRate);
            dayChangeInTWD = asset.amount * priceDiff;
            dayChangePercent = ((currentP - prevP) / prevP) * 100;
          }
        }
      } else {
        const assetCurrencyRate = marketData.rates[asset.currency] || 1;
        valueInTWD = asset.amount * (rateTWD / assetCurrencyRate);
      }
      
      totalTWD += valueInTWD;
      allocationMap[asset.category] += valueInTWD;
      
      const valueInDisplay = valueInTWD * (displayRate / rateTWD);
      const unitPriceInDisplay = (asset.category === 'Stock' || asset.category === 'Crypto') 
        ? priceInTWD * (displayRate / rateTWD)
        : (rateTWD / (marketData.rates[asset.currency] || 1)) * (displayRate / rateTWD);

      return { 
        ...asset, 
        nativePrice,
        nativeCurrency: apiCurrency,
        valueInTWD, 
        valueInDisplay, 
        priceInDisplay: unitPriceInDisplay,
        dayChangeInDisplay: dayChangeInTWD * (displayRate / rateTWD),
        dayChangePercent
      };
    });

    const lastKnownPrices: Record<string, number> = {};
    const chartData = marketTimeline.map((point: any) => {
      const pointTime = point.timestamp * 1000;
      const item: any = {
        date: new Date(pointTime).toISOString(),
        displayDate: new Date(pointTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      };
      
      let pointTotalTWD = 0;
      const categories: Record<AssetCategory, number> = { 'Stock': 0, 'Crypto': 0, 'Bank': 0, 'Savings': 0 };

      processedAssets.forEach(asset => {
        const acqTime = new Date(asset.acquisitionDate).getTime();
        if (pointTime < acqTime) return; 

        let priceAtT = point.assets[asset.id];
        if (priceAtT === undefined) priceAtT = lastKnownPrices[asset.id];
        else lastKnownPrices[asset.id] = priceAtT;

        if (asset.category === 'Bank' || asset.category === 'Savings') priceAtT = 1;

        if (priceAtT !== undefined) {
          const apiCurrency = marketData.assetMarketPrices[asset.id]?.currency || 'TWD';
          const apiCurrencyRate = marketData.rates[apiCurrency as Currency] || 1;
          const priceInTWDAtT = priceAtT * (rateTWD / apiCurrencyRate);
          
          let valInTWD = 0;
          if (asset.category === 'Stock' || asset.category === 'Crypto') {
            valInTWD = asset.amount * priceInTWDAtT;
          } else {
            const assetCurrencyRate = marketData.rates[asset.currency] || 1;
            valInTWD = asset.amount * (rateTWD / assetCurrencyRate);
          }
          
          pointTotalTWD += valInTWD;
          categories[asset.category] += valInTWD;
        }
      });

      item.totalValue = pointTotalTWD * (displayRate / rateTWD);
      Object.entries(categories).forEach(([cat, val]) => {
        item[cat] = val * (displayRate / rateTWD);
      });

      return item;
    });

    return { 
      processedAssets, 
      totalTWD, 
      totalDisplay: totalTWD * (displayRate / rateTWD), 
      allocationData: Object.entries(allocationMap).filter(([_, v]) => v > 0).map(([name, value]) => ({ 
        name, 
        value: value * (displayRate / rateTWD) 
      })),
      chartData,
      allocationMap
    };
  }, [assets, marketData, displayCurrency, marketTimeline]);

  const handleAddAsset = async (newAsset: Omit<Asset, 'id'>) => {
    const assetWithId = { ...newAsset, id: crypto.randomUUID() };
    const updatedAssets = [...assets, assetWithId];
    setAssets(updatedAssets);
    await updateAllData(updatedAssets);
  };

  const saveEdit = () => {
    if (!editingAsset) return;
    const updated = assets.map(a => a.id === editingAsset.id ? { ...a, amount: editAmount, acquisitionDate: editDate } : a);
    setAssets(updated);
    setEditingAsset(null);
    updateAllData(updated);
  };

  const dynamicRates = useMemo(() => {
    const base = marketData.rates[displayCurrency] || 1;
    return (['TWD', 'USD', 'CNY', 'SGD'] as Currency[])
      .filter(c => c !== displayCurrency)
      .map(c => ({ 
        code: c, 
        symbol: getCurrencySymbol(c),
        rate: (marketData.rates[c] / base).toFixed(3) 
      }));
  }, [displayCurrency, marketData.rates]);

  // Long press handler
  const handleMouseDown = () => {
    longPressTimer.current = setTimeout(() => {
      setIsReordering(true);
      toast({ title: t.reorderMode, description: t.longPressTip });
    }, 1500);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const moveSection = (id: SectionId, direction: 'up' | 'down') => {
    const newLayout = [...layout];
    const index = newLayout.findIndex(i => i.id === id);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLayout.length) return;
    
    [newLayout[index].order, newLayout[targetIndex].order] = [newLayout[targetIndex].order, newLayout[index].order];
    newLayout.sort((a, b) => a.order - b.order);
    setLayout(newLayout);
  };

  const resizeSection = (id: SectionId, direction: 'widen' | 'shrink') => {
    setLayout(prev => prev.map(item => {
      if (item.id !== id) return item;
      const step = 2; // Column steps
      let newW = direction === 'widen' ? item.w + step : item.w - step;
      newW = Math.max(4, Math.min(12, newW));
      return { ...item, w: newW };
    }));
  };

  const renderSection = (item: LayoutItem) => {
    const { id, w } = item;
    const colClass = `xl:col-span-${w}`;
    
    const wrapper = (content: React.ReactNode) => (
      <div key={id} className={cn("relative group transition-all duration-300", colClass)}>
        {isReordering && (
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-[60] bg-white border border-slate-200 shadow-xl rounded-full px-4 py-2">
            <Button size="icon" variant="ghost" onClick={() => moveSection(id, 'up')} className="h-8 w-8"><ChevronUp /></Button>
            <Button size="icon" variant="ghost" onClick={() => moveSection(id, 'down')} className="h-8 w-8"><ChevronDown /></Button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <Button size="icon" variant="ghost" onClick={() => resizeSection(id, 'shrink')} className="h-8 w-8"><Minimize2 /></Button>
            <Button size="icon" variant="ghost" onClick={() => resizeSection(id, 'widen')} className="h-8 w-8"><Maximize2 /></Button>
            <div className="ml-2 font-bold text-xs text-slate-400">W: {w}/12</div>
          </div>
        )}
        <div className={cn(isReordering && "ring-4 ring-black/5 rounded-2xl p-1")}>
          {content}
        </div>
      </div>
    );

    switch (id) {
      case 'summary':
        return wrapper(
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-9 modern-card p-10 relative overflow-hidden bg-white shadow-xl border-slate-100">
              <div className="space-y-4 z-20 relative">
                <div className="flex items-center gap-2 text-slate-400 text-sm font-bold uppercase tracking-widest">
                  <Globe className="w-5 h-5" />
                  {t.totalValue}
                </div>
                <div className="text-6xl font-bold tracking-tighter flex items-baseline flex-wrap gap-2">
                  <span className="text-slate-300">{getCurrencySymbol(displayCurrency)}</span>
                  <span className="break-all">{assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  {loading && <Loader2 className="w-8 h-8 animate-spin text-slate-200 ml-3" />}
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 opacity-[0.03] pointer-events-none">
                <Wallet className="w-64 h-64 text-black" />
              </div>
            </Card>
            <div className="lg:col-span-3">
              <Button 
                onClick={() => updateAllData(assets)} 
                disabled={loading}
                className="w-full h-full bg-black text-white hover:bg-slate-800 font-bold flex flex-col items-center justify-center gap-2 rounded-xl transition-all shadow-lg active:scale-95"
              >
                <RefreshCw className={cn("w-6 h-6", loading && "animate-spin")} />
                <span className="text-sm tracking-widest uppercase">{loading ? t.fetching : t.syncMarket}</span>
              </Button>
            </div>
          </div>
        );
      case 'controls':
        return wrapper(
          <div className="bg-slate-50 p-6 border border-slate-100 rounded-xl flex items-center gap-8">
            <div className="flex items-center gap-8 flex-1">
              <div className="space-y-2 flex-1 max-w-[240px]">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <Calendar className="w-4 h-4" />
                  {t.baseRange}
                </Label>
                <Select value={trackingDays} onValueChange={setTrackingDays}>
                  <SelectTrigger className="h-11 bg-white border-slate-200 font-bold text-sm rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30" className="font-bold">{t.days30}</SelectItem>
                    <SelectItem value="90" className="font-bold">{t.days90}</SelectItem>
                    <SelectItem value="180" className="font-bold">{t.days180}</SelectItem>
                    <SelectItem value="365" className="font-bold">{t.days365}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 flex-1 max-w-[240px]">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                  <Clock className="w-4 h-4" />
                  {t.interval}
                </Label>
                <Select value={interval} onValueChange={setInterval}>
                  <SelectTrigger className="h-11 bg-white border-slate-200 font-bold text-sm rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1d" className="font-bold">{t.int1d}</SelectItem>
                    <SelectItem value="1wk" className="font-bold">{t.int1wk}</SelectItem>
                    <SelectItem value="1mo" className="font-bold">{t.int1mo}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
      case 'table':
        return wrapper(
          <Card className="modern-card overflow-hidden bg-white shadow-xl border-slate-100 rounded-xl">
            <CardHeader className="px-8 py-6 border-b border-slate-50">
              <CardTitle className="text-xl font-bold flex items-center gap-3">
                <BarChart3 className="w-6 h-6" />
                {t.dashboard}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="w-full overflow-auto">
                <Table className="min-w-[1100px]">
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="px-8 h-14 text-xs font-bold text-slate-400 uppercase tracking-widest">{t.assetName}</TableHead>
                      <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.holdings}</TableHead>
                      <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.unitPrice}</TableHead>
                      <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.change}</TableHead>
                      <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-widest text-right">{t.valuation}</TableHead>
                      <TableHead className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.acqDate}</TableHead>
                      <TableHead className="w-[120px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assetCalculations.processedAssets.map(asset => (
                      <TableRow key={asset.id} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
                        <TableCell className="px-8 py-6">
                          <div className="font-bold text-base text-black">{asset.name}</div>
                          <div className="text-xs font-bold text-slate-400 tracking-widest uppercase mt-1">
                            {asset.symbol || t.categoryNames[asset.category]}
                          </div>
                        </TableCell>
                        <TableCell><span className="text-base font-bold text-slate-700">{asset.amount.toLocaleString()}</span></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-300">{getCurrencySymbol(displayCurrency)}</span>
                            <span className="text-base font-bold">{asset.priceInDisplay.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {(asset.category === 'Stock' || asset.category === 'Crypto') ? (
                            <div className={cn("flex items-center gap-1 font-bold text-sm", asset.dayChangeInDisplay >= 0 ? "text-emerald-600" : "text-rose-600")}>
                              {asset.dayChangeInDisplay >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                              <span>{getCurrencySymbol(displayCurrency)}{Math.abs(asset.dayChangeInDisplay).toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                              <span className="text-xs opacity-70 ml-1">({asset.dayChangePercent >= 0 ? '+' : ''}{asset.dayChangePercent.toFixed(1)}%)</span>
                            </div>
                          ) : <span className="text-slate-200">—</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-bold text-base whitespace-nowrap text-black">
                            <span className="text-slate-300 text-xs mr-1">{getCurrencySymbol(displayCurrency)}</span>
                            {asset.valueInDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </TableCell>
                        <TableCell><span className="text-sm font-bold text-slate-400">{asset.acquisitionDate}</span></TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-400 hover:text-black" onClick={() => { setEditingAsset(asset); setEditAmount(asset.amount); setEditDate(asset.acquisitionDate); }}><Edit2 className="w-5 h-5" /></Button>
                            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-200 hover:text-rose-600" onClick={() => { setAssets(prev => prev.filter(a => a.id !== asset.id)); toast({ title: t.assetDeleted }); }}><Trash2 className="w-5 h-5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        );
      case 'charts':
        return wrapper(
          <PortfolioCharts 
            language={language} 
            allocationData={assetCalculations.allocationData} 
            historicalData={assetCalculations.chartData} 
            displayCurrency={displayCurrency} 
            rates={marketData.rates} 
            loading={loading}
          />
        );
      case 'ai':
        return wrapper(
          <AITipCard 
            language={language} 
            assets={assetCalculations.processedAssets} 
            totalTWD={assetCalculations.totalTWD} 
            marketConditions={loading ? "同步中" : "市場穩定"}
          />
        );
      case 'form':
        return wrapper(
          <Card className="modern-card bg-white shadow-xl border-slate-100 rounded-xl">
            <CardHeader className="px-8 py-6 border-b border-slate-50">
              <CardTitle className="text-xl font-bold uppercase tracking-widest text-black">{t.addAsset}</CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <AssetForm language={language} onAdd={handleAddAsset} />
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  if (!mounted) return null;

  return (
    <div 
      className="min-h-screen bg-white text-black pb-32 font-sans overflow-x-hidden"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
    >
      <header className="glass-nav py-6 border-b border-slate-100">
        <div className="max-w-[1440px] mx-auto px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center shrink-0 shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight uppercase leading-none">{t.title}</h1>
              <p className="text-xs font-bold text-slate-400 tracking-widest uppercase mt-2">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-6 w-full sm:w-auto">
            {isReordering && (
              <Button onClick={() => setIsReordering(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 px-6 h-11 rounded-full shadow-lg">
                <Check className="w-5 h-5" />
                {t.exitReorder}
              </Button>
            )}
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t.exchangeRate}</span>
              <span className="text-sm font-bold text-black flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100 shadow-sm">
                <ArrowRightLeft className="w-4 h-4 text-slate-400" />
                1 {getCurrencySymbol(displayCurrency)}{displayCurrency} = {dynamicRates.map(r => `${r.symbol}${r.rate} ${r.code}`).join(' | ')}
              </span>
            </div>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <Button variant={language === 'zh' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('zh')} className="h-9 px-4 font-bold text-sm">繁中</Button>
              <Button variant={language === 'en' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('en')} className="h-9 px-4 font-bold text-sm">EN</Button>
            </div>
            <Tabs value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)}>
              <TabsList className="h-11 bg-slate-100 p-1 rounded-xl">
                {(['TWD', 'USD', 'CNY', 'SGD'] as Currency[]).map(cur => (
                  <TabsTrigger key={cur} value={cur} className="text-sm font-bold uppercase px-4 h-9">{cur}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>
      
      <main className="max-w-[1440px] mx-auto px-8 py-12">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10 auto-rows-auto">
          {layout.map(item => renderSection(item))}
        </div>
      </main>

      <Dialog open={!!editingAsset} onOpenChange={(open) => !open && setEditingAsset(null)}>
        <DialogContent className="max-w-[425px] bg-white rounded-2xl p-8 shadow-2xl">
          <DialogHeader><DialogTitle className="text-2xl font-bold uppercase tracking-tight text-black">{t.editAsset}</DialogTitle></DialogHeader>
          <div className="grid gap-8 py-8">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{t.assetName}</Label>
              <div className="p-5 bg-slate-50 rounded-xl font-bold text-base border border-slate-100 text-slate-700">{editingAsset?.name} ({editingAsset?.symbol || '—'})</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{t.holdings}</Label>
              <Input id="amount" type="number" value={editAmount} onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)} className="h-14 font-bold bg-slate-50 border-slate-200 text-lg rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date" className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">{t.acqDate}</Label>
              <Input id="date" type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-14 font-bold bg-slate-50 border-slate-200 text-lg rounded-xl" />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-4">
            <Button variant="ghost" onClick={() => setEditingAsset(null)} className="font-bold text-sm uppercase tracking-widest h-14 flex-1 rounded-xl">{t.cancel}</Button>
            <Button onClick={saveEdit} className="bg-black text-white hover:bg-slate-800 font-bold text-sm uppercase tracking-widest h-14 flex-1 shadow-lg active:scale-95 rounded-xl">{t.saveChanges}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
