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
  Check
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
    reorderMode: 'Reorder Mode',
    exitReorder: 'Done',
    longPressTip: 'Long press any section to reorder dashboard',
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
    reorderMode: '佈局調整模式',
    exitReorder: '完成安排',
    longPressTip: '長按任何區塊以重新安排顯示位置',
    categoryNames: {
      Stock: '股票',
      Crypto: '加密貨幣',
      Bank: '其他資產',
      Savings: '存款'
    }
  }
};

type DashboardSection = 'summary' | 'controls' | 'table' | 'charts' | 'ai' | 'form';

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
  
  // Reordering states
  const [isReordering, setIsReordering] = useState(false);
  const [dashboardOrder, setDashboardOrder] = useState<DashboardSection[]>(['summary', 'controls', 'table', 'charts', 'ai', 'form']);
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
      toast({ variant: 'destructive', title: 'Sync Error' });
    } finally {
      setLoading(false);
    }
  }, [mounted, trackingDays, interval, t.dataUpdated, loading]);

  useEffect(() => {
    setMounted(true);
    const savedAssets = localStorage.getItem('assets');
    if (savedAssets) setAssets(JSON.parse(savedAssets));
    
    const savedOrder = localStorage.getItem('dashboardOrder');
    if (savedOrder) setDashboardOrder(JSON.parse(savedOrder));
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
      localStorage.setItem('dashboardOrder', JSON.stringify(dashboardOrder));
    }
  }, [dashboardOrder, mounted]);

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

    chartData.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

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

  // Long press handler for reordering
  const handleMouseDown = () => {
    longPressTimer.current = setTimeout(() => {
      setIsReordering(true);
      toast({ title: t.reorderMode, description: t.longPressTip });
    }, 1500);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...dashboardOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;
    
    [newOrder[index], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[index]];
    setDashboardOrder(newOrder);
  };

  const renderSection = (id: DashboardSection) => {
    switch (id) {
      case 'summary':
        return (
          <div key="summary" className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative group">
            {isReordering && (
              <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
                <Button size="icon" variant="outline" onClick={() => moveSection(dashboardOrder.indexOf('summary'), 'up')}><ChevronUp /></Button>
                <Button size="icon" variant="outline" onClick={() => moveSection(dashboardOrder.indexOf('summary'), 'down')}><ChevronDown /></Button>
              </div>
            )}
            <Card className={cn("lg:col-span-9 modern-card p-8 sm:p-10 relative overflow-hidden bg-white shadow-xl", isReordering && "ring-2 ring-black")}>
              <div className="space-y-4 z-20 relative">
                <div className="flex items-center gap-2 text-slate-400 text-sm font-bold uppercase tracking-widest">
                  <Globe className="w-5 h-5" />
                  {t.totalValue}
                </div>
                <div className="text-5xl sm:text-7xl font-bold tracking-tighter flex items-baseline flex-wrap gap-2">
                  <span className="text-slate-300">{getCurrencySymbol(displayCurrency)}</span>
                  <span className="break-all">{assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  {loading && <Loader2 className="w-8 h-8 animate-spin text-slate-200 ml-3" />}
                </div>
              </div>
              <div className="absolute -bottom-10 -right-10 opacity-[0.03] pointer-events-none">
                <Wallet className="w-48 h-48 sm:w-64 sm:h-64 text-black" />
              </div>
            </Card>
            <div className="lg:col-span-3 flex flex-col gap-3">
              <Button 
                onClick={() => updateAllData(assets)} 
                disabled={loading}
                className="w-full h-full bg-black text-white hover:bg-slate-800 font-bold flex flex-col items-center justify-center gap-2 rounded transition-all shadow-lg active:scale-95"
              >
                <RefreshCw className={cn("w-6 h-6", loading && "animate-spin")} />
                <span className="text-sm tracking-widest uppercase">{loading ? t.fetching : t.syncMarket}</span>
              </Button>
            </div>
          </div>
        );
      case 'controls':
        return (
          <div key="controls" className="relative group">
            {isReordering && (
              <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
                <Button size="icon" variant="outline" onClick={() => moveSection(dashboardOrder.indexOf('controls'), 'up')}><ChevronUp /></Button>
                <Button size="icon" variant="outline" onClick={() => moveSection(dashboardOrder.indexOf('controls'), 'down')}><ChevronDown /></Button>
              </div>
            )}
            <div className={cn("bg-slate-50 p-4 border border-slate-100 rounded-lg flex items-center gap-6", isReordering && "ring-2 ring-black")}>
              <div className="flex items-center gap-6 flex-1">
                <div className="space-y-1.5 flex-1 max-w-[200px]">
                  <Label className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {t.baseRange}
                  </Label>
                  <Select value={trackingDays} onValueChange={setTrackingDays}>
                    <SelectTrigger className="h-10 bg-white border-slate-200 font-bold text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">{t.days30}</SelectItem>
                      <SelectItem value="90">{t.days90}</SelectItem>
                      <SelectItem value="180">{t.days180}</SelectItem>
                      <SelectItem value="365">{t.days365}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 flex-1 max-w-[200px]">
                  <Label className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {t.interval}
                  </Label>
                  <Select value={interval} onValueChange={setInterval}>
                    <SelectTrigger className="h-10 bg-white border-slate-200 font-bold text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1d">{t.int1d}</SelectItem>
                      <SelectItem value="1wk">{t.int1wk}</SelectItem>
                      <SelectItem value="1mo">{t.int1mo}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        );
      case 'table':
        return (
          <div key="table" className="xl:col-span-9 relative group">
            {isReordering && (
              <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
                <Button size="icon" variant="outline" onClick={() => moveSection(dashboardOrder.indexOf('table'), 'up')}><ChevronUp /></Button>
                <Button size="icon" variant="outline" onClick={() => moveSection(dashboardOrder.indexOf('table'), 'down')}><ChevronDown /></Button>
              </div>
            )}
            <Card className={cn("modern-card overflow-hidden bg-white shadow-lg border-slate-100", isReordering && "ring-2 ring-black")}>
              <CardHeader className="px-6 py-5 border-b border-slate-50">
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <BarChart3 className="w-6 h-6" />
                  {t.dashboard}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="w-full overflow-auto">
                  <Table className="min-w-[1000px]">
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="px-6 h-12 text-sm font-bold text-slate-400 uppercase tracking-widest">{t.assetName}</TableHead>
                        <TableHead className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t.holdings}</TableHead>
                        <TableHead className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t.unitPrice}</TableHead>
                        <TableHead className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t.change}</TableHead>
                        <TableHead className="text-sm font-bold text-slate-400 uppercase tracking-widest text-right">{t.valuation}</TableHead>
                        <TableHead className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t.acqDate}</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assetCalculations.processedAssets.map(asset => (
                        <TableRow key={asset.id} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
                          <TableCell className="px-6 py-5">
                            <div className="font-bold text-base text-black">{asset.name}</div>
                            <div className="text-sm text-slate-400 font-bold mt-0.5">{asset.symbol || t.categoryNames[asset.category]}</div>
                          </TableCell>
                          <TableCell><span className="text-base font-bold text-slate-700">{asset.amount.toLocaleString()}</span></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-bold text-slate-300">{getCurrencySymbol(displayCurrency)}</span>
                              <span className="text-base font-bold">{asset.priceInDisplay.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {(asset.category === 'Stock' || asset.category === 'Crypto') ? (
                              <div className={cn("flex items-center gap-1 font-bold text-sm", asset.dayChangeInDisplay >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                {asset.dayChangeInDisplay >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                <span>{getCurrencySymbol(displayCurrency)}{Math.abs(asset.dayChangeInDisplay).toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                                <span className="text-xs opacity-70">({asset.dayChangePercent >= 0 ? '+' : ''}{asset.dayChangePercent.toFixed(1)}%)</span>
                              </div>
                            ) : <span className="text-slate-200">—</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-bold text-base whitespace-nowrap text-black">
                              <span className="text-slate-300 text-sm mr-1">{getCurrencySymbol(displayCurrency)}</span>
                              {asset.valueInDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                          </TableCell>
                          <TableCell><span className="text-sm font-bold text-slate-400">{asset.acquisitionDate}</span></TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
          </div>
        );
      case 'charts':
        return (
          <div key="charts" className="xl:col-span-9 relative group">
            {isReordering && (
              <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
                <Button size="icon" variant="outline" onClick={() => moveSection(dashboardOrder.indexOf('charts'), 'up')}><ChevronUp /></Button>
                <Button size="icon" variant="outline" onClick={() => moveSection(dashboardOrder.indexOf('charts'), 'down')}><ChevronDown /></Button>
              </div>
            )}
            <div className={cn(isReordering && "ring-2 ring-black rounded-xl p-4")}>
              <PortfolioCharts 
                language={language} 
                allocationData={assetCalculations.allocationData} 
                historicalData={assetCalculations.chartData} 
                displayCurrency={displayCurrency} 
                rates={marketData.rates} 
                loading={loading}
              />
            </div>
          </div>
        );
      case 'ai':
        return (
          <div key="ai" className="xl:col-span-12 relative group">
            {isReordering && (
              <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
                <Button size="icon" variant="outline" onClick={() => moveSection(dashboardOrder.indexOf('ai'), 'up')}><ChevronUp /></Button>
                <Button size="icon" variant="outline" onClick={() => moveSection(dashboardOrder.indexOf('ai'), 'down')}><ChevronDown /></Button>
              </div>
            )}
            <div className={cn(isReordering && "ring-2 ring-black rounded-xl")}>
              <AITipCard 
                language={language} 
                assets={assetCalculations.processedAssets} 
                totalTWD={assetCalculations.totalTWD} 
                marketConditions={loading ? "Syncing" : "Stable"}
              />
            </div>
          </div>
        );
      case 'form':
        return (
          <div key="form" className="xl:col-span-3 relative group">
            {isReordering && (
              <div className="absolute -left-12 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
                <Button size="icon" variant="outline" onClick={() => moveSection(dashboardOrder.indexOf('form'), 'up')}><ChevronUp /></Button>
                <Button size="icon" variant="outline" onClick={() => moveSection(dashboardOrder.indexOf('form'), 'down')}><ChevronDown /></Button>
              </div>
            )}
            <Card className={cn("modern-card bg-white shadow-lg border-slate-100", isReordering && "ring-2 ring-black")}>
              <CardHeader className="px-6 py-5 border-b border-slate-50">
                <CardTitle className="text-lg font-bold uppercase tracking-widest text-black">{t.addAsset}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <AssetForm language={language} onAdd={handleAddAsset} />
              </CardContent>
            </Card>
          </div>
        );
      default:
        return null;
    }
  };

  if (!mounted) return null;

  return (
    <div 
      className="min-h-screen bg-white text-black pb-20 font-sans overflow-x-hidden selection:bg-primary/10"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
    >
      <header className="glass-nav h-auto min-h-20 py-4 border-b border-slate-100">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 bg-black rounded flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight uppercase leading-none">{t.title}</h1>
              <p className="text-sm font-bold text-slate-400 tracking-widest uppercase mt-1">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto">
            {isReordering && (
              <Button onClick={() => setIsReordering(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2">
                <Check className="w-4 h-4" />
                {t.exitReorder}
              </Button>
            )}
            <div className="flex flex-col items-center sm:items-end">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{t.exchangeRate}</span>
              <span className="text-sm font-bold text-black flex items-center gap-1.5 whitespace-nowrap bg-slate-50 px-3 py-1.5 rounded border border-slate-100 shadow-sm">
                <ArrowRightLeft className="w-4 h-4 text-slate-400" />
                1 {getCurrencySymbol(displayCurrency)}{displayCurrency} = {dynamicRates.map(r => `${r.symbol}${r.rate} ${r.code}`).join(' | ')}
              </span>
            </div>
            <div className="flex bg-slate-100 p-0.5 rounded">
              <Button variant={language === 'zh' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('zh')} className="h-8 px-3 font-bold text-sm">繁中</Button>
              <Button variant={language === 'en' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('en')} className="h-8 px-3 font-bold text-sm">EN</Button>
            </div>
            <Tabs value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)}>
              <TabsList className="h-9 bg-slate-100">
                {(['TWD', 'USD', 'CNY', 'SGD'] as Currency[]).map(cur => (
                  <TabsTrigger key={cur} value={cur} className="text-sm font-bold uppercase">{cur}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>
      
      <main className="max-w-[1440px] mx-auto px-4 sm:px-5 py-6 sm:py-10 space-y-8 sm:space-y-10">
        {dashboardOrder.map(id => (
          <div key={id} className={cn(id === 'form' || id === 'table' || id === 'charts' ? "grid grid-cols-1 xl:grid-cols-12 gap-8" : "w-full")}>
            {renderSection(id)}
          </div>
        ))}
      </main>

      <Dialog open={!!editingAsset} onOpenChange={(open) => !open && setEditingAsset(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-[425px] bg-white rounded-lg p-6">
          <DialogHeader><DialogTitle className="text-xl font-bold uppercase tracking-tight">{t.editAsset}</DialogTitle></DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-2">
              <Label className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">{t.assetName}</Label>
              <div className="p-4 bg-slate-50 rounded font-bold text-base border border-slate-100">{editingAsset?.name} ({editingAsset?.symbol || '—'})</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">{t.holdings}</Label>
              <Input id="amount" type="number" value={editAmount ?? 0} onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)} className="h-12 font-bold bg-slate-50 border-slate-200 text-base" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">{t.acqDate}</Label>
              <Input id="date" type="date" value={editDate ?? ''} onChange={(e) => setEditDate(e.target.value)} className="h-12 font-bold bg-slate-50 border-slate-200 text-base" />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button variant="ghost" onClick={() => setEditingAsset(null)} className="font-bold text-sm uppercase tracking-widest h-12 flex-1">{t.cancel}</Button>
            <Button onClick={saveEdit} className="bg-black text-white hover:bg-slate-800 font-bold text-sm uppercase tracking-widest h-12 flex-1 shadow-md active:scale-95">{t.saveChanges}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}