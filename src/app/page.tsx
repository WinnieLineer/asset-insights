
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
  Briefcase,
  Download,
  Upload,
  History,
  TrendingUp,
  TrendingDown,
  Layout,
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
    subtitle: 'PROFESSIONAL TRACKING',
    syncMarket: 'Sync',
    totalValue: 'Portfolio Value',
    addAsset: 'Add New Position',
    assetName: 'Asset',
    holdings: 'Quantity',
    valuation: 'Market Value',
    unitPrice: 'Unit Price',
    dashboard: 'Portfolio Insights',
    activePositions: 'Holdings',
    closedPositions: 'History',
    change: 'Daily Change',
    editAsset: 'Edit Position',
    cancel: 'Cancel',
    saveChanges: 'Save',
    fetching: 'Syncing...',
    exchangeRate: 'Rates',
    baseRange: 'Range',
    interval: 'Interval',
    days30: '30 Days',
    days90: '90 Days',
    days180: '180 Days',
    days365: '365 Days',
    customRange: 'Custom',
    startDate: 'Start',
    endDate: 'End',
    int1d: 'Daily',
    int1wk: 'Weekly',
    int1mo: 'Monthly',
    assetDeleted: 'Asset removed.',
    dataUpdated: 'Market data synced.',
    acqDate: 'Acquired',
    posEndDate: 'Closed',
    movedToClosed: 'Asset moved to historical records.',
    movedToClosedDesc: 'The end date is active. Position moved to history.',
    exportData: 'Export',
    importData: 'Import',
    importSuccess: 'Data imported successfully.',
    reorderMode: 'Layout Mode',
    exitReorder: 'Done',
    categoryNames: {
      Stock: 'Equity',
      Crypto: 'Crypto',
      Bank: 'Other',
      Savings: 'Deposit'
    }
  },
  zh: {
    title: 'Asset Insights Pro',
    subtitle: '專業資產追蹤',
    syncMarket: '同步',
    totalValue: '投資組合總淨值',
    addAsset: '新增資產部位',
    assetName: '資產名稱',
    holdings: '持有數量',
    valuation: '帳面價值',
    unitPrice: '單位價值',
    dashboard: '資產部位概覽與分析',
    activePositions: '當前持有',
    closedPositions: '歷史結清',
    change: '今日漲跌',
    editAsset: '編輯部位資訊',
    cancel: '取消',
    saveChanges: '儲存',
    fetching: '同步中',
    exchangeRate: '即時匯率',
    baseRange: '追蹤區間',
    interval: '資料頻率',
    days30: '30 天',
    days90: '90 天',
    days180: '180 天',
    days365: '365 天',
    customRange: '自定義範圍',
    startDate: '起始日期',
    endDate: '結束日期',
    int1d: '日線',
    int1wk: '週線',
    int1mo: '月線',
    assetDeleted: '資產已移除',
    dataUpdated: '市場數據已更新',
    acqDate: '持有日期',
    posEndDate: '結清日期',
    movedToClosed: '資產已移至歷史結清',
    movedToClosedDesc: '結清日期已生效，已移動至歷史分頁。',
    exportData: '匯出資料',
    importData: '匯入資料',
    importSuccess: '資產資料已成功匯入。',
    reorderMode: '佈局調整模式',
    exitReorder: '完成調整',
    categoryNames: {
      Stock: '股票',
      Crypto: '加密貨幣',
      Bank: '其他資產',
      Savings: '存款'
    }
  }
};

export default function AssetInsightsPage() {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState<'en' | 'zh'>('zh');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('TWD');
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editDate, setEditDate] = useState<string>('');
  const [editEndDate, setEditEndDate] = useState<string>('');
  const [trackingDays, setTrackingDays] = useState<string>("30");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [interval, setInterval] = useState<string>("1d");
  const [marketTimeline, setMarketTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [sections, setSections] = useState<string[]>(['summary', 'controls', 'charts', 'list', 'ai']);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      let p2 = Math.floor(Date.now() / 1000);
      let p1;
      if (trackingDays === 'custom') {
        p1 = customStartDate ? Math.floor(new Date(customStartDate).getTime() / 1000) : p2 - (30 * 24 * 60 * 60);
        p2 = customEndDate ? Math.floor(new Date(customEndDate).getTime() / 1000) : p2;
      } else {
        p1 = p2 - (parseInt(trackingDays) * 24 * 60 * 60);
      }

      const { marketData: newData, historicalTimeline } = await fetchMarketData(
        currentAssets, 
        p1, 
        p2, 
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
  }, [mounted, trackingDays, customStartDate, customEndDate, interval, t.dataUpdated, loading, toast]);

  useEffect(() => {
    setMounted(true);
    const savedAssets = localStorage.getItem('assets');
    if (savedAssets) setAssets(JSON.parse(savedAssets));
    const savedSections = localStorage.getItem('sections');
    if (savedSections) setSections(JSON.parse(savedSections));
  }, []);

  useEffect(() => {
    if (mounted && assets.length > 0) {
      updateAllData(assets);
    }
  }, [mounted, trackingDays, customStartDate, customEndDate, interval, assets.length]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('assets', JSON.stringify(assets));
      localStorage.setItem('sections', JSON.stringify(sections));
    }
  }, [assets, sections, mounted]);

  const assetCalculations = useMemo(() => {
    let totalTWD = 0;
    const allocationMap: Record<AssetCategory, number> = { 'Stock': 0, 'Crypto': 0, 'Bank': 0, 'Savings': 0 };
    const rateTWD = marketData.rates.TWD || 32.5;
    const displayRate = marketData.rates[displayCurrency] || 1;
    const todayStr = new Date().toISOString().split('T')[0];

    const processedAssets = assets.map(asset => {
      const marketInfo = marketData.assetMarketPrices[asset.id];
      const nativePrice = marketInfo?.price || 0;
      const apiCurrency = marketInfo?.currency || 'TWD';
      const apiCurrencyRate = (marketData.rates[apiCurrency as Currency] || 1);
      const priceInTWD = nativePrice * (rateTWD / apiCurrencyRate);
      let valueInTWD = 0;
      let dayChangeInTWD = 0;
      let dayChangePercent = 0;
      const isClosed = asset.endDate ? asset.endDate <= todayStr : false;

      if (!isClosed) {
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
      }
      
      const valueInDisplay = valueInTWD * (displayRate / rateTWD);
      const unitPriceInDisplay = (asset.category === 'Stock' || asset.category === 'Crypto') 
        ? priceInTWD * (displayRate / rateTWD)
        : (rateTWD / (marketData.rates[asset.currency] || 1)) * (displayRate / rateTWD);

      return { ...asset, isClosed, valueInDisplay, priceInDisplay: unitPriceInDisplay, dayChangeInDisplay: dayChangeInTWD * (displayRate / rateTWD), dayChangePercent };
    });

    const historyMap = new Map();
    marketTimeline.forEach((point: any) => {
      const pointTime = point.timestamp * 1000;
      const dateKey = new Date(pointTime).toISOString().split('T')[0];
      let pointTotalTWD = 0;
      const categories: Record<AssetCategory, number> = { 'Stock': 0, 'Crypto': 0, 'Bank': 0, 'Savings': 0 };

      processedAssets.forEach(asset => {
        const acqTime = new Date(asset.acquisitionDate).getTime();
        const endTimeStr = asset.endDate || '9999-12-31';
        if (pointTime < acqTime || dateKey > endTimeStr) return; 
        let priceAtT = point.assets[asset.id];
        if (priceAtT === undefined) return;
        if (asset.category === 'Bank' || asset.category === 'Savings') priceAtT = 1;
        const apiCurrency = marketData.assetMarketPrices[asset.id]?.currency || 'TWD';
        const apiCurrencyRate = marketData.rates[apiCurrency as Currency] || 1;
        const priceInTWDAtT = priceAtT * (rateTWD / apiCurrencyRate);
        let valInTWD = 0;
        if (asset.category === 'Stock' || asset.category === 'Crypto') valInTWD = asset.amount * priceInTWDAtT;
        else valInTWD = asset.amount * (rateTWD / (marketData.rates[asset.currency] || 1));
        pointTotalTWD += valInTWD;
        categories[asset.category] += valInTWD;
      });

      if (pointTotalTWD > 0) {
        const item = { timestamp: point.timestamp, displayDate: new Date(pointTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), totalValue: pointTotalTWD * (displayRate / rateTWD) };
        Object.entries(categories).forEach(([cat, val]) => { item[cat] = val * (displayRate / rateTWD); });
        historyMap.set(dateKey, item);
      }
    });

    const chartData = Array.from(historyMap.values()).sort((a: any, b: any) => a.timestamp - b.timestamp);
    return { 
      processedAssets, 
      activeAssets: processedAssets.filter(a => !a.isClosed),
      closedAssets: processedAssets.filter(a => a.isClosed),
      totalTWD, 
      totalDisplay: totalTWD * (displayRate / rateTWD), 
      allocationData: Object.entries(allocationMap).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value: value * (displayRate / rateTWD) })),
      chartData
    };
  }, [assets, marketData, displayCurrency, marketTimeline]);

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newSections.length) return;
    [newSections[index], newSections[target]] = [newSections[target], newSections[index]];
    setSections(newSections);
  };

  const isInteractive = (el: HTMLElement | null): boolean => {
    if (!el) return false;
    const interactiveTags = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'LABEL'];
    if (interactiveTags.includes(el.tagName)) return true;
    if (el.closest('[role="tab"], [role="menuitem"], [role="combobox"], [role="slider"], .recharts-brush')) return true;
    return false;
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (isInteractive(e.target as HTMLElement)) return;
    const cleanup = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      window.removeEventListener('mouseup', cleanup);
      window.removeEventListener('touchend', cleanup);
      window.removeEventListener('scroll', cleanup);
    };
    window.addEventListener('mouseup', cleanup);
    window.addEventListener('touchend', cleanup);
    window.addEventListener('scroll', cleanup);
    longPressTimer.current = setTimeout(() => {
      setIsReordering(true);
      cleanup();
    }, 800);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(assets, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `assets-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderSection = (id: string, index: number) => {
    const controls = isReordering && (
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-[50] flex items-center gap-1 bg-black text-white px-2 py-1 rounded-full shadow-2xl border border-white/20 scale-90">
        <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={() => moveSection(index, 'up')} disabled={index === 0}><ChevronUp className="w-3 h-3" /></Button>
        <div className="w-px h-3 bg-white/20 mx-1" />
        <Button variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={() => moveSection(index, 'down')} disabled={index === sections.length - 1}><ChevronDown className="w-3 h-3" /></Button>
      </div>
    );

    switch (id) {
      case 'summary':
        return (
          <div key={id} className={cn("relative lg:col-span-12", isReordering && "ring-2 ring-black ring-offset-4 rounded-xl animate-pulse")}>
            {controls}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <Card className="lg:col-span-9 modern-card p-6 relative overflow-hidden bg-white shadow-xl border-slate-100 flex flex-col justify-center">
                <div className="space-y-3 z-20 relative">
                  <div className="text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Globe className="w-4 h-4" /> {t.totalValue}</div>
                  <div className="text-3xl xl:text-4xl font-black tracking-tighter flex items-baseline gap-2">
                    <span className="text-slate-200 font-medium">{CURRENCY_SYMBOLS[displayCurrency]}</span>
                    <span>{assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    {loading && <Loader2 className="w-5 h-5 animate-spin text-slate-200 ml-2" />}
                  </div>
                </div>
                <div className="absolute -bottom-6 -right-6 opacity-[0.03] pointer-events-none"><Wallet className="w-32 h-32 text-black" /></div>
              </Card>
              <div className="lg:col-span-3">
                <Button onClick={() => updateAllData(assets)} disabled={loading} className="w-full h-full min-h-[80px] bg-black text-white hover:bg-slate-800 font-black flex flex-col items-center justify-center gap-2 rounded-xl shadow-lg">
                  <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                  <span className="text-[9px] tracking-widest uppercase">{loading ? t.fetching : t.syncMarket}</span>
                </Button>
              </div>
            </section>
          </div>
        );
      case 'controls':
        return (
          <div key={id} className={cn("relative lg:col-span-12", isReordering && "ring-2 ring-black ring-offset-4 rounded-xl animate-pulse")}>
            {controls}
            <section className="bg-slate-50/80 backdrop-blur-sm p-4 border border-slate-100 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-4 shadow-inner">
              <div className="md:col-span-3 space-y-1">
                <Label className="text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1"><Calendar className="w-3 h-3" /> {t.baseRange}</Label>
                <Select value={trackingDays} onValueChange={setTrackingDays}>
                  <SelectTrigger className="h-10 bg-white font-bold text-xs rounded-lg shadow-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30" className="font-bold">{t.days30}</SelectItem>
                    <SelectItem value="90" className="font-bold">{t.days90}</SelectItem>
                    <SelectItem value="180" className="font-bold">{t.days180}</SelectItem>
                    <SelectItem value="365" className="font-bold">{t.days365}</SelectItem>
                    <SelectItem value="custom" className="font-bold">{t.customRange}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3 space-y-1">
                <Label className="text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1"><Clock className="w-3 h-3" /> {t.interval}</Label>
                <Select value={interval} onValueChange={setInterval}>
                  <SelectTrigger className="h-10 bg-white font-bold text-xs rounded-lg shadow-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1d" className="font-bold">{t.int1d}</SelectItem>
                    <SelectItem value="1wk" className="font-bold">{t.int1wk}</SelectItem>
                    <SelectItem value="1mo" className="font-bold">{t.int1mo}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-6 flex items-end gap-2">
                <Button variant="outline" onClick={handleExport} className="flex-1 h-10 font-black text-[9px] uppercase tracking-widest gap-2 bg-white border-slate-200 hover:bg-slate-50"><Download className="w-3 h-3" /> {t.exportData}</Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1 h-10 font-black text-[9px] uppercase tracking-widest gap-2 bg-white border-slate-200 hover:bg-slate-50"><Upload className="w-3 h-3" /> {t.importData}</Button>
                <input type="file" ref={fileInputRef} onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const imported = JSON.parse(event.target?.result as string);
                      if (Array.isArray(imported)) { setAssets(imported); toast({ title: t.importSuccess }); }
                    } catch (err) { toast({ variant: 'destructive', title: '匯入失敗' }); }
                  };
                  reader.readAsText(file);
                }} accept=".json" className="hidden" />
              </div>
              {trackingDays === 'custom' && (
                <div className="md:col-span-12 grid grid-cols-2 gap-4 pt-3 border-t border-slate-100 animate-fade-in">
                  <div className="space-y-1"><Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.startDate}</Label><Input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="h-10 bg-white font-bold text-xs" /></div>
                  <div className="space-y-1"><Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.endDate}</Label><Input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="h-10 bg-white font-bold text-xs" /></div>
                </div>
              )}
            </section>
          </div>
        );
      case 'charts':
        return (
          <div key={id} className={cn("relative xl:col-span-8", isReordering && "ring-2 ring-black ring-offset-4 rounded-xl animate-pulse")}>
            {controls}
            <PortfolioCharts language={language} allocationData={assetCalculations.allocationData} historicalData={assetCalculations.chartData} displayCurrency={displayCurrency} loading={loading} />
          </div>
        );
      case 'list':
        return (
          <div key={id} className={cn("relative xl:col-span-8", isReordering && "ring-2 ring-black ring-offset-4 rounded-xl animate-pulse")}>
            {controls}
            <Card className="modern-card bg-white shadow-xl border-slate-100 rounded-xl overflow-hidden">
              <Tabs defaultValue="active">
                <CardHeader className="px-4 py-3 border-b border-slate-50">
                  <CardTitle className="text-base xl:text-lg font-black tracking-tighter uppercase flex items-center gap-2 mb-3"><BarChart3 className="w-4 h-4 text-primary" /> {t.dashboard}</CardTitle>
                  <TabsList className="bg-slate-100 p-0.5 rounded-lg w-fit h-8">
                    <TabsTrigger value="active" className="text-[10px] font-black px-3 gap-1.5 h-7"><Briefcase className="w-3 h-3" /> {t.activePositions}</TabsTrigger>
                    <TabsTrigger value="closed" className="text-[10px] font-black px-3 gap-1.5 h-7"><History className="w-3 h-3" /> {t.closedPositions}</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent className="p-0">
                  <TabsContent value="active" className="m-0">
                    <Table className="min-w-[700px]">
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-none">
                          <TableHead className="px-4 h-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.assetName}</TableHead>
                          <TableHead className="h-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.holdings}</TableHead>
                          <TableHead className="h-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.unitPrice}</TableHead>
                          <TableHead className="h-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.change}</TableHead>
                          <TableHead className="h-10 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.valuation}</TableHead>
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assetCalculations.activeAssets.map((asset: any) => (
                          <TableRow key={asset.id} className="group hover:bg-slate-50/40 border-slate-50">
                            <TableCell className="px-4 py-3"><div className="font-bold text-xs">{asset.name}</div><div className="text-[8px] font-black text-slate-300 uppercase mt-0.5">{asset.symbol || t.categoryNames[asset.category as AssetCategory]}</div></TableCell>
                            <TableCell><span className="text-xs font-bold">{asset.amount.toLocaleString()}</span></TableCell>
                            <TableCell><div className="flex items-center gap-1"><span className="text-[10px] font-black text-slate-200">{CURRENCY_SYMBOLS[displayCurrency]}</span><span className="text-xs font-bold">{asset.priceInDisplay.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div></TableCell>
                            <TableCell>{(asset.category === 'Stock' || asset.category === 'Crypto') ? (<div className={cn("flex items-center gap-0.5 font-bold text-[10px]", asset.dayChangeInDisplay >= 0 ? "text-emerald-600" : "text-rose-600")}>{asset.dayChangeInDisplay >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}<span>{CURRENCY_SYMBOLS[displayCurrency]}{Math.abs(asset.dayChangeInDisplay).toLocaleString(undefined, { maximumFractionDigits: 1 })}</span><span className="text-[8px] opacity-60 ml-0.5">({asset.dayChangePercent.toFixed(1)}%)</span></div>) : <span className="text-slate-200">—</span>}</TableCell>
                            <TableCell className="text-right pr-4"><span className="font-bold text-xs"><span className="text-slate-200 text-[10px] mr-0.5">{CURRENCY_SYMBOLS[displayCurrency]}</span>{asset.valueInDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span></TableCell>
                            <TableCell className="pr-4"><div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingAsset(asset); setEditAmount(asset.amount); setEditDate(asset.acquisitionDate); setEditEndDate(asset.endDate || ''); }}><Edit2 className="w-3 h-3" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-rose-200" onClick={() => { setAssets(prev => prev.filter(a => a.id !== asset.id)); toast({ title: t.assetDeleted }); }}><Trash2 className="w-3 h-3" /></Button></div></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TabsContent>
                </CardContent>
              </Tabs>
            </Card>
          </div>
        );
      case 'ai':
        return (
          <div key={id} className={cn("relative xl:col-span-4 space-y-8", isReordering && "ring-2 ring-black ring-offset-4 rounded-xl animate-pulse")}>
            {controls}
            <AITipCard language={language} assets={assetCalculations.processedAssets} totalTWD={assetCalculations.totalTWD} />
            <Card className="modern-card bg-white shadow-xl border-slate-100 rounded-xl">
              <CardHeader className="px-4 py-4 border-b border-slate-50"><CardTitle className="text-base xl:text-lg font-black uppercase tracking-widest flex items-center gap-2"><Activity className="w-4 h-4 text-primary" /> {t.addAsset}</CardTitle></CardHeader>
              <CardContent className="p-4"><AssetForm language={language} onAdd={(a) => { setAssets(prev => [...prev, { ...a, id: crypto.randomUUID() }]); updateAllData([...assets, { ...a, id: 'temp' } as any]); }} /></CardContent>
            </Card>
          </div>
        );
      default: return null;
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white text-black pb-32 font-sans overflow-x-hidden" onMouseDown={handleMouseDown} onTouchStart={handleMouseDown}>
      <header className="fixed top-0 left-0 right-0 border-b border-slate-100 z-[100] bg-white/80 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 h-12 xl:h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 xl:w-8 xl:h-8 bg-black rounded flex items-center justify-center shrink-0 shadow-lg"><Activity className="w-3.5 h-3.5 xl:w-4 xl:h-4 text-white" /></div>
            <div>
              <h1 className="text-[10px] xl:text-base font-black tracking-tighter uppercase leading-none">{t.title}</h1>
              <p className="hidden xl:block text-[8px] font-black text-slate-400 tracking-[0.2em] uppercase mt-0.5">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 xl:gap-6 scale-90 xl:scale-100">
            {isReordering ? (
              <Button onClick={() => setIsReordering(false)} className="h-7 xl:h-8 bg-black text-white px-4 font-black text-[9px] uppercase tracking-widest gap-2 shadow-2xl animate-bounce"><Check className="w-3 h-3" /> {t.exitReorder}</Button>
            ) : (
              <div className="flex items-center gap-2 xl:gap-6">
                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                  <Button variant={language === 'zh' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('zh')} className="h-6 px-2 font-bold text-[8px] xl:text-[9px]">繁中</Button>
                  <Button variant={language === 'en' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('en')} className="h-6 px-2 font-bold text-[8px] xl:text-[9px]">EN</Button>
                </div>
                <Tabs value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)}>
                  <TabsList className="h-7 xl:h-8 bg-slate-100 p-0.5 rounded-lg">
                    {(['TWD', 'USD', 'CNY', 'SGD'] as Currency[]).map(cur => (<TabsTrigger key={cur} value={cur} className="text-[8px] xl:text-[9px] font-black uppercase px-1.5 xl:px-3 h-6 xl:h-7">{cur}</TabsTrigger>))}
                  </TabsList>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="max-w-[1600px] mx-auto px-4 pt-20 xl:pt-24 space-y-8">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {sections.map((id, index) => renderSection(id, index))}
        </div>
      </main>

      <Dialog open={!!editingAsset} onOpenChange={(open) => !open && setEditingAsset(null)}>
        <DialogContent className="max-w-[420px] bg-white rounded-2xl p-6 shadow-2xl">
          <DialogHeader><DialogTitle className="text-lg font-black uppercase flex items-center gap-3"><Edit2 className="w-4 h-4" /> {t.editAsset}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.assetName}</Label><div className="p-3 bg-slate-50 rounded-lg font-bold text-xs">{editingAsset?.name}</div></div>
            <div className="space-y-1.5"><Label htmlFor="amount" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.holdings}</Label><Input id="amount" type="number" value={editAmount} onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)} className="h-10 font-black" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.acqDate}</Label><Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-10 font-bold" /></div>
              <div className="space-y-1.5"><Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.posEndDate}</Label><Input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} className="h-10 font-bold" /></div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="ghost" onClick={() => setEditingAsset(null)} className="font-bold flex-1">{t.cancel}</Button>
            <Button onClick={() => {
              const updated = assets.map(a => a.id === editingAsset?.id ? { ...a, amount: editAmount, acquisitionDate: editDate, endDate: editEndDate || undefined } : a);
              setAssets(updated); setEditingAsset(null); updateAllData(updated);
            }} className="bg-black text-white font-black flex-1">{t.saveChanges}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
