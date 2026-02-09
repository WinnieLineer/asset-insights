'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Asset, MarketData, AssetCategory, Currency } from './lib/types';
import { fetchMarketData } from '@/app/lib/market-api';
import { AssetForm } from '@/components/AssetForm';
import { HistoricalTrendChart, AllocationPieChart } from '@/components/PortfolioCharts';
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
  Clock,
  Download,
  Upload,
  TrendingUp,
  TrendingDown,
  ChevronUp,
  ChevronDown,
  Check,
  Maximize2,
  Minimize2,
  Plus,
  ArrowRightLeft
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
    title: 'ASSET INSIGHTS PRO',
    subtitle: 'PROFESSIONAL TRACKING',
    syncMarket: 'Sync',
    totalValue: 'PORTFOLIO NET VALUE',
    addAsset: 'ADD POSITION',
    assetName: 'ASSET',
    holdings: 'QUANTITY',
    valuation: 'VALUATION',
    unitPrice: 'UNIT PRICE',
    dashboard: 'PORTFOLIO INSIGHTS',
    activePositions: 'Holdings',
    closedPositions: 'History',
    change: 'Daily Change',
    editAsset: 'EDIT POSITION',
    cancel: 'Cancel',
    saveChanges: 'Save',
    fetching: 'Syncing...',
    exchangeRate: 'RATES',
    baseRange: 'TRACKING RANGE',
    interval: 'INTERVAL',
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
    exportData: 'Export',
    importData: 'Import',
    importSuccess: 'Data imported successfully.',
    exitReorder: 'DONE',
    liveRates: 'LIVE RATES (1 USD)',
    categoryNames: {
      Stock: 'Equity',
      Crypto: 'Crypto',
      Bank: 'Other',
      Savings: 'Deposit'
    }
  },
  zh: {
    title: 'ASSET INSIGHTS PRO',
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
    baseRange: '追蹤時間區間',
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
    exitReorder: '完成調整',
    liveRates: '即時匯率 (1 USD)',
    categoryNames: {
      Stock: '股票',
      Crypto: '加密貨幣',
      Bank: '其他資產',
      Savings: '存款'
    }
  }
};

interface LayoutConfig {
  width: number;
  height: number;
}

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
  
  const [sections, setSections] = useState<string[]>(['summary', 'controls', 'historicalTrend', 'allocation', 'list', 'ai', 'addAsset']);
  const [layoutConfigs, setLayoutConfigs] = useState<Record<string, LayoutConfig>>({
    summary: { width: 12, height: 320 },
    controls: { width: 12, height: 140 },
    historicalTrend: { width: 12, height: 480 },
    allocation: { width: 12, height: 480 },
    list: { width: 12, height: 750 },
    ai: { width: 12, height: 550 },
    addAsset: { width: 12, height: 550 }
  });

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
    const savedConfigs = localStorage.getItem('layoutConfigs');
    if (savedConfigs) setLayoutConfigs(JSON.parse(savedConfigs));
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
      localStorage.setItem('layoutConfigs', JSON.stringify(layoutConfigs));
    }
  }, [assets, sections, layoutConfigs, mounted]);

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

    const historyData: any[] = [];
    const lastKnownPrices: Record<string, number> = {};
    const sortedTimeline = [...marketTimeline].sort((a, b) => a.timestamp - b.timestamp);

    sortedTimeline.forEach((point: any) => {
      const pointTime = point.timestamp * 1000;
      const dateKey = new Date(pointTime).toISOString().split('T')[0];
      let pointTotalTWD = 0;
      const categories: Record<AssetCategory, number> = { 'Stock': 0, 'Crypto': 0, 'Bank': 0, 'Savings': 0 };

      processedAssets.forEach(asset => {
        const acqTime = new Date(asset.acquisitionDate).getTime();
        const endTimeStr = asset.endDate || '9999-12-31';
        if (pointTime < acqTime || dateKey > endTimeStr) return; 

        // Forward filling logic
        if (point.assets[asset.id] !== undefined) {
          lastKnownPrices[asset.id] = point.assets[asset.id];
        }

        let priceAtT = lastKnownPrices[asset.id];
        if (priceAtT === undefined) {
          if (asset.category === 'Bank' || asset.category === 'Savings') priceAtT = 1;
          else return; 
        }

        const apiCurrency = marketData.assetMarketPrices[asset.id]?.currency || asset.currency || 'TWD';
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
      });

      if (pointTotalTWD > 0) {
        const item = { 
          timestamp: point.timestamp, 
          displayDate: new Date(pointTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), 
          totalValue: pointTotalTWD * (displayRate / rateTWD) 
        };
        Object.entries(categories).forEach(([cat, val]) => { 
          item[cat] = val * (displayRate / rateTWD); 
        });
        historyData.push(item);
      }
    });

    return { 
      processedAssets, 
      activeAssets: processedAssets.filter(a => !a.isClosed),
      closedAssets: processedAssets.filter(a => a.isClosed),
      totalTWD, 
      totalDisplay: totalTWD * (displayRate / rateTWD), 
      allocationData: Object.entries(allocationMap).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value: value * (displayRate / rateTWD) })),
      chartData: historyData
    };
  }, [assets, marketData, displayCurrency, marketTimeline]);

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...sections];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newSections.length) return;
    [newSections[index], newSections[target]] = [newSections[target], newSections[index]];
    setSections(newSections);
  };

  const resizeSection = (id: string, axis: 'x' | 'y', direction: 'inc' | 'dec') => {
    setLayoutConfigs(prev => {
      const config = { ...prev[id] };
      if (axis === 'x') {
        const steps = [4, 6, 8, 10, 12];
        const currentIdx = steps.indexOf(config.width);
        if (direction === 'inc' && currentIdx < steps.length - 1) config.width = steps[currentIdx + 1];
        if (direction === 'dec' && currentIdx > 0) config.width = steps[currentIdx - 1];
      } else {
        if (direction === 'inc') config.height = Math.min(1500, config.height + 50);
        if (direction === 'dec') config.height = Math.max(100, config.height - 50);
      }
      return { ...prev, [id]: config };
    });
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('button, input, select, [role="tab"], .recharts-surface')) return;
    const cleanup = () => {
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
      window.removeEventListener('mouseup', cleanup);
      window.removeEventListener('touchend', cleanup);
    };
    window.addEventListener('mouseup', cleanup);
    window.addEventListener('touchend', cleanup);
    longPressTimer.current = setTimeout(() => { setIsReordering(true); cleanup(); }, 800);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify({ assets, sections, layoutConfigs }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `assets-insights-pro-backup.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderSection = (id: string, index: number) => {
    const config = layoutConfigs[id] || { width: 12, height: 400 };
    const controls = isReordering && (
      <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2 bg-black text-white px-4 py-2 rounded-full shadow-2xl border border-white/20">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => moveSection(index, 'up')} disabled={index === 0}><ChevronUp className="w-5 h-5" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => moveSection(index, 'down')} disabled={index === sections.length - 1}><ChevronDown className="w-5 h-5" /></Button>
        <div className="w-px h-6 bg-white/20 mx-1" />
        <span className="text-[10px] font-black uppercase tracking-widest px-1 opacity-60">W</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => resizeSection(id, 'x', 'dec')}><Minimize2 className="w-5 h-5" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => resizeSection(id, 'x', 'inc')}><Maximize2 className="w-5 h-5" /></Button>
        <div className="w-px h-6 bg-white/20 mx-1" />
        <span className="text-[10px] font-black uppercase tracking-widest px-1 opacity-60">H</span>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => resizeSection(id, 'y', 'dec')}><ChevronUp className="w-5 h-5 rotate-180" /></Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20" onClick={() => resizeSection(id, 'y', 'inc')}><ChevronDown className="w-5 h-5" /></Button>
      </div>
    );

    const commonClass = cn(
      "relative transition-all duration-300",
      isReordering && "ring-4 ring-black ring-offset-2 rounded-2xl z-[105]",
      config.width === 4 && "xl:col-span-4",
      config.width === 6 && "xl:col-span-6",
      config.width === 8 && "xl:col-span-8",
      config.width === 10 && "xl:col-span-10",
      config.width === 12 && "xl:col-span-12"
    );

    const wrapperStyle = { height: `${config.height}px` };

    switch (id) {
      case 'summary':
        return (
          <div key={id} className={commonClass} style={wrapperStyle}>
            {controls}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
              <Card className="lg:col-span-9 modern-card p-10 relative overflow-hidden bg-white shadow-3xl border-slate-100 flex flex-col justify-center rounded-2xl">
                <div className="space-y-4 z-20 relative">
                  <div className="text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-4">
                    <Globe className="w-5 h-5" /> {t.totalValue}
                  </div>
                  <div className="text-4xl xl:text-6xl font-black tracking-tighter flex items-baseline gap-4">
                    <span className="text-slate-200 font-medium">{CURRENCY_SYMBOLS[displayCurrency]}</span>
                    <span>{assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    {loading && <Loader2 className="w-10 h-10 animate-spin text-slate-200 ml-4" />}
                  </div>
                </div>
                <div className="absolute bottom-10 right-10 opacity-10 pointer-events-none">
                  <Wallet className="w-32 h-32 text-black" />
                </div>
              </Card>
              <div className="lg:col-span-3">
                <Button onClick={() => updateAllData(assets)} disabled={loading} className="w-full h-full min-h-[120px] bg-black text-white hover:bg-slate-800 font-black flex flex-col items-center justify-center gap-3 rounded-2xl shadow-xl transition-all active:scale-95">
                  <RefreshCw className={cn("w-8 h-8", loading && "animate-spin")} />
                  <span className="text-[10px] tracking-[0.3em] uppercase">{loading ? t.fetching : t.syncMarket}</span>
                </Button>
              </div>
            </section>
          </div>
        );
      case 'controls':
        return (
          <div key={id} className={commonClass} style={wrapperStyle}>
            {controls}
            <section className="bg-slate-50/80 backdrop-blur-md p-6 border border-slate-100 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-4 shadow-inner h-full content-center">
              <div className="md:col-span-3 space-y-2">
                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1"><Calendar className="w-4 h-4" /> {t.baseRange}</Label>
                <Select value={trackingDays} onValueChange={setTrackingDays}>
                  <SelectTrigger className="h-10 bg-white font-black text-xs rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">{t.days30}</SelectItem>
                    <SelectItem value="90">{t.days90}</SelectItem>
                    <SelectItem value="180">{t.days180}</SelectItem>
                    <SelectItem value="365">{t.days365}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3 space-y-2">
                <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1"><Clock className="w-4 h-4" /> {t.interval}</Label>
                <Select value={interval} onValueChange={setInterval}>
                  <SelectTrigger className="h-10 bg-white font-black text-xs rounded-xl border-slate-200"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1d">{t.int1d}</SelectItem>
                    <SelectItem value="1wk">{t.int1wk}</SelectItem>
                    <SelectItem value="1mo">{t.int1mo}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-6 flex items-end gap-2">
                <Button variant="outline" onClick={handleExport} className="flex-1 h-10 font-black text-[9px] uppercase tracking-[0.2em] gap-2 bg-white rounded-xl shadow-sm"><Download className="w-4 h-4" /> {t.exportData}</Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1 h-10 font-black text-[9px] uppercase tracking-[0.2em] gap-2 bg-white rounded-xl shadow-sm"><Upload className="w-4 h-4" /> {t.importData}</Button>
                <input type="file" ref={fileInputRef} onChange={(e) => {
                   const file = e.target.files?.[0]; if (!file) return;
                   const reader = new FileReader(); reader.onload = (event) => {
                     try { const data = JSON.parse(event.target?.result as string); if (data.assets) setAssets(data.assets); toast({ title: t.importSuccess }); } catch (err) { toast({ variant: 'destructive', title: '匯入失敗' }); }
                   }; reader.readAsText(file);
                }} accept=".json" className="hidden" />
              </div>
            </section>
          </div>
        );
      case 'historicalTrend':
        return (
          <div key={id} className={commonClass} style={wrapperStyle}>
            {controls}
            <HistoricalTrendChart 
              language={language} 
              historicalData={assetCalculations.chartData} 
              displayCurrency={displayCurrency} 
              loading={loading}
              height={config.height}
            />
          </div>
        );
      case 'allocation':
        return (
          <div key={id} className={commonClass} style={wrapperStyle}>
            {controls}
            <AllocationPieChart 
              language={language} 
              allocationData={assetCalculations.allocationData} 
              displayCurrency={displayCurrency} 
              loading={loading}
              height={config.height}
            />
          </div>
        );
      case 'list':
        return (
          <div key={id} className={commonClass} style={wrapperStyle}>
            {controls}
            <Card className="modern-card bg-white shadow-3xl border-slate-100 rounded-2xl overflow-hidden h-full flex flex-col">
              <div className="px-8 py-6 border-b border-slate-50 shrink-0">
                <CardTitle className="text-xs xl:text-sm font-black tracking-widest uppercase flex items-center gap-4 text-slate-400">
                  <BarChart3 className="w-5 h-5" /> {t.dashboard}
                </CardTitle>
              </div>
              <CardContent className="p-0 flex-1 overflow-auto">
                <Table className="min-w-[800px]">
                  <TableHeader className="bg-slate-50/80 sticky top-0 z-10 backdrop-blur-md">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="px-8 h-10 text-[9px] font-black text-slate-500 uppercase tracking-widest">{t.assetName}</TableHead>
                      <TableHead className="h-10 text-[9px] font-black text-slate-500 uppercase tracking-widest">{t.holdings}</TableHead>
                      <TableHead className="h-10 text-[9px] font-black text-slate-500 uppercase tracking-widest">{t.unitPrice}</TableHead>
                      <TableHead className="h-10 text-[9px] font-black text-slate-500 uppercase tracking-widest">{t.change}</TableHead>
                      <TableHead className="h-10 text-[9px] font-black text-slate-500 uppercase tracking-widest text-right pr-8">{t.valuation}</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assetCalculations.activeAssets.map((asset: any) => (
                      <TableRow key={asset.id} className="group hover:bg-slate-50/50 border-slate-50 transition-colors">
                        <TableCell className="px-8 py-4">
                          <div className="font-black text-xs text-slate-900">{asset.name}</div>
                          <div className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5">{asset.symbol || t.categoryNames[asset.category as AssetCategory]}</div>
                        </TableCell>
                        <TableCell><span className="text-xs font-black text-slate-700">{asset.amount.toLocaleString()}</span></TableCell>
                        <TableCell><div className="flex items-center gap-2"><span className="text-[9px] font-black text-slate-300">{CURRENCY_SYMBOLS[displayCurrency]}</span><span className="text-xs font-black text-slate-700">{asset.priceInDisplay.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div></TableCell>
                        <TableCell>
                          {(asset.category === 'Stock' || asset.category === 'Crypto') ? (
                            <div className={cn("flex items-center gap-2 font-black text-[10px]", asset.dayChangeInDisplay >= 0 ? "text-emerald-600" : "text-rose-600")}>
                              {asset.dayChangeInDisplay >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                              <span>{asset.dayChangePercent.toFixed(1)}%</span>
                            </div>
                          ) : <span className="text-slate-200">—</span>}
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="font-black text-sm">
                            <span className="text-slate-300 text-[10px] mr-1">{CURRENCY_SYMBOLS[displayCurrency]}</span>
                            {asset.valueInDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </div>
                        </TableCell>
                        <TableCell className="pr-8 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-slate-100" onClick={() => { setEditingAsset(asset); setEditAmount(asset.amount); setEditDate(asset.acquisitionDate); setEditEndDate(asset.endDate || ''); }}><Edit2 className="w-3 h-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-rose-50 text-rose-300" onClick={() => { setAssets(prev => prev.filter(a => a.id !== asset.id)); }}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );
      case 'ai':
        return (
          <div key={id} className={commonClass} style={wrapperStyle}>
            {controls}
            <AITipCard language={language} assets={assetCalculations.processedAssets} totalTWD={assetCalculations.totalTWD} />
          </div>
        );
      case 'addAsset':
        return (
          <div key={id} className={commonClass} style={wrapperStyle}>
            {controls}
            <Card className="modern-card bg-white shadow-3xl border-slate-100 rounded-2xl h-full flex flex-col">
              <CardHeader className="px-8 py-6 border-b border-slate-50 shrink-0">
                <CardTitle className="text-xs xl:text-sm font-black uppercase tracking-widest flex items-center gap-4 text-slate-400">
                  <Plus className="w-5 h-5" /> {t.addAsset}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex-1 overflow-auto">
                <AssetForm language={language} onAdd={(a) => { const newAsset = { ...a, id: crypto.randomUUID() }; setAssets(prev => [...prev, newAsset]); updateAllData([...assets, newAsset]); }} />
              </CardContent>
            </Card>
          </div>
        );
      default: return null;
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white text-black pb-32 font-sans overflow-x-hidden" onMouseDown={handleMouseDown}>
      <header className="fixed top-0 left-0 right-0 border-b border-slate-100 z-[120] bg-white/95 backdrop-blur-3xl h-10 xl:h-12">
        <div className="max-w-[1900px] mx-auto px-6 h-full flex items-center justify-between gap-6 overflow-hidden">
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-6 h-6 bg-black rounded-lg flex items-center justify-center shrink-0 shadow-lg"><Activity className="w-3.5 h-3.5 text-white" /></div>
            <h1 className="text-xs xl:text-sm font-black tracking-tighter uppercase leading-none hidden sm:block">{t.title}</h1>
          </div>
          
          <div className="flex-1 flex items-center gap-6 overflow-hidden">
            <div className="flex items-center gap-4 px-4 border-l border-slate-100 overflow-auto no-scrollbar">
               <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest whitespace-nowrap">
                 {t.liveRates.replace('USD', displayCurrency)}
               </span>
               <div className="flex items-center gap-4">
                 {Object.entries(marketData.rates).filter(([cur]) => cur !== displayCurrency).map(([cur, rate]) => {
                   const baseRate = marketData.rates[displayCurrency] || 1;
                   const targetRate = rate;
                   const relativeRate = targetRate / baseRate;
                   return (
                     <div key={cur} className="flex items-center gap-1.5 whitespace-nowrap">
                       <span className="text-[10px] font-black text-slate-900">{cur}</span>
                       <ArrowRightLeft className="w-2.5 h-2.5 text-slate-200" />
                       <span className="text-[10px] font-black text-emerald-600">
                         {relativeRate < 0.1 ? relativeRate.toFixed(4) : relativeRate.toFixed(2)}
                       </span>
                     </div>
                   );
                 })}
               </div>
            </div>
          </div>

          <div className="flex items-center gap-3 scale-90 xl:scale-100 shrink-0">
            {isReordering ? (
              <Button onClick={() => setIsReordering(false)} className="h-7 bg-black text-white px-4 font-black text-[9px] uppercase tracking-[0.2em] gap-2 rounded-full"><Check className="w-3 h-3" /> {t.exitReorder}</Button>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex bg-slate-100 p-0.5 rounded-lg">
                  <Button variant={language === 'zh' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('zh')} className="h-6 px-2 font-black text-[9px]">繁中</Button>
                  <Button variant={language === 'en' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('en')} className="h-6 px-2 font-black text-[9px]">EN</Button>
                </div>
                <Tabs value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)}>
                  <TabsList className="h-7 bg-slate-100 p-0.5 rounded-lg">
                    {(['TWD', 'USD', 'CNY', 'SGD'] as Currency[]).map(cur => (<TabsTrigger key={cur} value={cur} className="text-[9px] font-black uppercase px-2 h-6">{cur}</TabsTrigger>))}
                  </TabsList>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="max-w-[1900px] mx-auto px-6 pt-16 xl:pt-20">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {sections.map((id, index) => renderSection(id, index))}
        </div>
      </main>

      <Dialog open={!!editingAsset} onOpenChange={(open) => !open && setEditingAsset(null)}>
        <DialogContent className="max-w-[420px] bg-white rounded-3xl p-8 shadow-3xl border-slate-100">
          <DialogHeader><DialogTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-3"><Edit2 className="w-5 h-5 text-primary" /> {t.editAsset}</DialogTitle></DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-1.5"><Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.assetName}</Label><div className="p-3 bg-slate-50 rounded-xl font-black text-xs text-slate-900 border border-slate-100">{editingAsset?.name}</div></div>
            <div className="space-y-1.5"><Label htmlFor="amount" className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.holdings}</Label><Input id="amount" type="number" value={editAmount} onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)} className="h-10 font-black text-base border-slate-200 rounded-xl" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.acqDate}</Label><Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-10 font-black text-xs rounded-xl border-slate-200" /></div>
              <div className="space-y-1.5"><Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.posEndDate}</Label><Input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} className="h-10 font-black text-xs rounded-xl border-slate-200" /></div>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="ghost" onClick={() => setEditingAsset(null)} className="font-black h-10 flex-1 rounded-xl text-[9px] uppercase tracking-[0.2em]">{t.cancel}</Button>
            <Button onClick={() => {
              const updated = assets.map(a => a.id === editingAsset?.id ? { ...a, amount: editAmount, acquisitionDate: editDate, endDate: editEndDate || undefined } : a);
              setAssets(updated); setEditingAsset(null); updateAllData(updated);
            }} className="bg-black text-white font-black h-10 flex-1 rounded-xl text-[9px] uppercase tracking-[0.2em] shadow-xl">{t.saveChanges}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
