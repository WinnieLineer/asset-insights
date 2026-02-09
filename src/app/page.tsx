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
  ChevronUp,
  ChevronDown,
  Check,
  Maximize2,
  Minimize2,
  History,
  Briefcase,
  Download,
  Upload,
  ArrowUp,
  ArrowDown,
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
    reorderMode: 'Layout Mode',
    exitReorder: 'Save Layout',
    movedToClosed: 'Asset moved to historical records.',
    movedToClosedDesc: 'The end date is active. Position moved to history.',
    exportData: 'Export',
    importData: 'Import',
    importSuccess: 'Data imported successfully.',
    importError: 'Import failed. Invalid file format.',
    allocation: 'Portfolio Allocation',
    trend: 'Asset Evolution Matrix',
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
    reorderMode: '佈局調整模式',
    exitReorder: '儲存佈局',
    movedToClosed: '資產已移至歷史結清',
    movedToClosedDesc: '結清日期已生效，已移動至歷史分頁。',
    exportData: '匯出資料',
    importData: '匯入資料',
    importSuccess: '資產資料已成功匯入。',
    importError: '匯入失敗，請確認檔案格式正確。',
    allocation: '當前資產配置比例',
    trend: '歷史資產演變走勢',
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
  w: number; 
  h: number; 
  order: number;
}

const DEFAULT_LAYOUT: LayoutItem[] = [
  { id: 'summary', w: 12, h: 100, order: 0 },
  { id: 'controls', w: 12, h: 100, order: 1 },
  { id: 'table', w: 12, h: 500, order: 2 },
  { id: 'charts', w: 12, h: 500, order: 3 },
  { id: 'ai', w: 12, h: 500, order: 4 },
  { id: 'form', w: 12, h: 550, order: 5 },
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
  const [editEndDate, setEditEndDate] = useState<string>('');
  const [trackingDays, setTrackingDays] = useState<string>("30");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [interval, setInterval] = useState<string>("1d");
  const [marketTimeline, setMarketTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [isReordering, setIsReordering] = useState(false);
  const [layout, setLayout] = useState<LayoutItem[]>(DEFAULT_LAYOUT);
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
    
    const savedLayout = localStorage.getItem('assetInsightsLayoutV4');
    if (savedLayout) setLayout(JSON.parse(savedLayout));
  }, []);

  useEffect(() => {
    if (mounted && assets.length > 0) {
      updateAllData(assets);
    }
  }, [mounted, trackingDays, customStartDate, customEndDate, interval, assets.length]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('assets', JSON.stringify(assets));
    }
  }, [assets, mounted]);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('assetInsightsLayoutV4', JSON.stringify(layout));
    }
  }, [layout, mounted]);

  const assetCalculations = useMemo(() => {
    let totalTWD = 0;
    const allocationMap: Record<AssetCategory, number> = {
      'Stock': 0, 'Crypto': 0, 'Bank': 0, 'Savings': 0,
    };
    
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

      return { 
        ...asset, 
        isClosed,
        nativePrice,
        nativeCurrency: apiCurrency,
        valueInTWD, 
        valueInDisplay, 
        priceInDisplay: unitPriceInDisplay,
        dayChangeInDisplay: dayChangeInTWD * (displayRate / rateTWD),
        dayChangePercent
      };
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
        if (asset.category === 'Stock' || asset.category === 'Crypto') {
          valInTWD = asset.amount * priceInTWDAtT;
        } else {
          const assetCurrencyRate = marketData.rates[asset.currency] || 1;
          valInTWD = asset.amount * (rateTWD / assetCurrencyRate);
        }
        
        pointTotalTWD += valInTWD;
        categories[asset.category] += valInTWD;
      });

      // 日線去重與 0 值過濾 (Deduplication & Filtering 0)
      if (pointTotalTWD > 0) {
        const item = {
          date: new Date(pointTime).toISOString(),
          displayDate: new Date(pointTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          totalValue: pointTotalTWD * (displayRate / rateTWD),
          timestamp: point.timestamp
        };
        Object.entries(categories).forEach(([cat, val]) => {
          item[cat as keyof typeof item] = (val * (displayRate / rateTWD)) as any;
        });
        
        historyMap.set(dateKey, item);
      }
    });

    const chartData = Array.from(historyMap.values()).sort((a, b) => a.timestamp - b.timestamp);

    return { 
      processedAssets, 
      activeAssets: processedAssets.filter(a => !a.isClosed),
      closedAssets: processedAssets.filter(a => a.isClosed),
      totalTWD, 
      totalDisplay: totalTWD * (displayRate / rateTWD), 
      allocationData: Object.entries(allocationMap).filter(([_, v]) => v > 0).map(([name, value]) => ({ 
        name, 
        value: value * (displayRate / rateTWD) 
      })),
      chartData
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
    
    const todayStr = new Date().toISOString().split('T')[0];
    const isNowClosed = editEndDate && editEndDate <= todayStr;

    const updated = assets.map(a => a.id === editingAsset.id ? { 
      ...a, 
      amount: editAmount || 0, 
      acquisitionDate: editDate || a.acquisitionDate,
      endDate: editEndDate || undefined
    } : a);
    
    setAssets(updated);
    setEditingAsset(null);
    updateAllData(updated);

    if (isNowClosed && (!editingAsset.endDate || editingAsset.endDate > todayStr)) {
      toast({
        title: t.movedToClosed,
        description: t.movedToClosedDesc,
      });
    }
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(assets, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `asset-insights-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (Array.isArray(imported)) {
          setAssets(imported);
          toast({ title: t.importSuccess });
        } else {
          throw new Error();
        }
      } catch (err) {
        toast({ variant: 'destructive', title: t.importError });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const target = e.target as HTMLElement;
    
    const isInteractive = (el: HTMLElement | null): boolean => {
      if (!el) return false;
      const tagName = el.tagName.toLowerCase();
      const role = el.getAttribute('role');
      const isRechartsBrush = el.closest('.recharts-brush') !== null || el.classList.contains('recharts-brush');
      const isRadix = el.getAttribute('data-radix-collection-item') !== null || 
                       el.className?.toString().includes('radix') ||
                       el.hasAttribute('aria-haspopup') ||
                       el.closest('[data-radix-popper-content-wrapper]') !== null ||
                       el.closest('[role="combobox"]') !== null ||
                       el.closest('[role="tab"]') !== null;
      
      return (
        tagName === 'button' ||
        tagName === 'input' ||
        tagName === 'select' ||
        tagName === 'textarea' ||
        tagName === 'a' ||
        role === 'button' ||
        role === 'combobox' ||
        role === 'tab' ||
        role === 'menuitem' ||
        isRechartsBrush ||
        isRadix
      );
    };

    if (isInteractive(target)) return;

    if (longPressTimer.current) clearTimeout(longPressTimer.current);

    longPressTimer.current = setTimeout(() => {
      setIsReordering(true);
      toast({ title: t.reorderMode });
    }, 1500);

    const clearTimer = () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      window.removeEventListener('mouseup', clearTimer);
      window.removeEventListener('touchend', clearTimer);
    };
    window.addEventListener('mouseup', clearTimer);
    window.addEventListener('touchend', clearTimer);
  };

  const handleMouseUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const moveSection = (id: SectionId, direction: 'up' | 'down') => {
    const newLayout = [...layout];
    const index = newLayout.findIndex(i => i.id === id);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newLayout.length) return;
    
    const currentOrder = newLayout[index].order;
    newLayout[index].order = newLayout[targetIndex].order;
    newLayout[targetIndex].order = currentOrder;
    newLayout.sort((a, b) => a.order - b.order);
    setLayout(newLayout);
  };

  const resizeSection = (id: SectionId, type: 'w' | 'h', direction: 'increase' | 'decrease') => {
    setLayout(prev => prev.map(item => {
      if (item.id !== id) return item;
      if (type === 'w') {
        let newW = direction === 'increase' ? item.w + 2 : item.w - 2;
        newW = Math.max(4, Math.min(12, newW));
        return { ...item, w: newW };
      } else {
        let newH = direction === 'increase' ? item.h + 50 : item.h - 50;
        newH = Math.max(100, Math.min(1500, newH));
        return { ...item, h: newH };
      }
    }));
  };

  const renderSection = (item: LayoutItem) => {
    const { id, w, h } = item;
    const colSpanClasses: Record<number, string> = { 4: 'xl:col-span-4', 6: 'xl:col-span-6', 8: 'xl:col-span-8', 10: 'xl:col-span-10', 12: 'xl:col-span-12' };

    const wrapper = (content: React.ReactNode) => (
      <div key={id} className={cn("relative transition-all duration-500", colSpanClasses[w] || 'xl:col-span-12')} style={{ minHeight: isReordering ? h : 'auto' }}>
        {isReordering && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex items-center gap-1 z-[60] bg-white border border-slate-200 shadow-2xl rounded-full px-4 py-1.5 scale-90">
            <Button size="icon" variant="ghost" onClick={() => moveSection(id, 'up')} className="h-7 w-7"><ChevronUp className="w-3.5 h-3.5" /></Button>
            <Button size="icon" variant="ghost" onClick={() => moveSection(id, 'down')} className="h-7 w-7"><ChevronDown className="w-3.5 h-3.5" /></Button>
            <div className="w-px h-3 bg-slate-200 mx-1" />
            <Button size="icon" variant="ghost" onClick={() => resizeSection(id, 'w', 'decrease')} className="h-7 w-7"><Minimize2 className="w-3.5 h-3.5" /></Button>
            <Button size="icon" variant="ghost" onClick={() => resizeSection(id, 'w', 'increase')} className="h-7 w-7"><Maximize2 className="w-3.5 h-3.5" /></Button>
            <div className="w-px h-3 bg-slate-200 mx-1" />
            <Button size="icon" variant="ghost" onClick={() => resizeSection(id, 'h', 'decrease')} className="h-7 w-7"><ArrowUp className="w-3.5 h-3.5" /></Button>
            <Button size="icon" variant="ghost" onClick={() => resizeSection(id, 'h', 'increase')} className="h-7 w-7"><ArrowDown className="w-3.5 h-3.5" /></Button>
          </div>
        )}
        <div className={cn("h-full", isReordering && "ring-4 ring-primary/10 rounded-2xl bg-slate-50/30 p-1")} style={{ height: id === 'summary' || id === 'controls' ? 'auto' : h }}>
          {content}
        </div>
      </div>
    );

    switch (id) {
      case 'summary':
        return wrapper(
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
            <Card className="lg:col-span-9 modern-card p-6 relative overflow-hidden bg-white shadow-xl border-slate-100">
              <div className="space-y-3 z-20 relative">
                <div className="text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {t.totalValue}
                </div>
                <div className="text-3xl xl:text-4xl font-black tracking-tighter flex items-baseline gap-2">
                  <span className="text-slate-200 font-medium">{CURRENCY_SYMBOLS[displayCurrency]}</span>
                  <span>{assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  {loading && <Loader2 className="w-5 h-5 animate-spin text-slate-200 ml-2" />}
                </div>
              </div>
              <div className="absolute -bottom-6 -right-6 opacity-[0.03] pointer-events-none">
                <Wallet className="w-32 h-32 text-black" />
              </div>
            </Card>
            <div className="lg:col-span-3">
              <Button onClick={() => updateAllData(assets)} disabled={loading} className="w-full h-full min-h-[80px] bg-black text-white hover:bg-slate-800 font-black flex flex-col items-center justify-center gap-2 rounded-xl shadow-lg">
                <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
                <span className="text-[9px] tracking-widest uppercase">{loading ? t.fetching : t.syncMarket}</span>
              </Button>
            </div>
          </div>
        );
      case 'controls':
        return wrapper(
          <div className="bg-slate-50/80 backdrop-blur-sm p-4 border border-slate-100 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-4 h-full shadow-inner">
            <div className="md:col-span-3 space-y-1">
              <Label className="text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Calendar className="w-3 h-3" /> {t.baseRange}
              </Label>
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
              <Label className="text-[10px] xl:text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 ml-1">
                <Clock className="w-3 h-3" /> {t.interval}
              </Label>
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
              <Button variant="outline" onClick={handleExport} className="flex-1 h-10 font-black text-[9px] uppercase tracking-widest gap-2 bg-white border-slate-200">
                <Download className="w-3 h-3" /> {t.exportData}
              </Button>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1 h-10 font-black text-[9px] uppercase tracking-widest gap-2 bg-white border-slate-200">
                <Upload className="w-3 h-3" /> {t.importData}
              </Button>
              <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
            </div>

            {trackingDays === 'custom' && (
              <div className="md:col-span-12 grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 animate-fade-in">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.startDate}</Label>
                  <Input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="h-10 bg-white font-bold text-xs rounded-lg" />
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.endDate}</Label>
                  <Input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="h-10 bg-white font-bold text-xs rounded-lg" />
                </div>
              </div>
            )}
          </div>
        );
      case 'table':
        return wrapper(
          <Card className="modern-card bg-white shadow-xl border-slate-100 rounded-xl overflow-hidden flex flex-col h-full">
            <Tabs defaultValue="active" className="w-full flex flex-col h-full">
              <CardHeader className="px-4 py-3 border-b border-slate-50 shrink-0">
                <div className="flex flex-row items-center justify-between mb-3">
                  <CardTitle className="text-base xl:text-lg font-black tracking-tighter uppercase flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    {t.dashboard}
                  </CardTitle>
                </div>
                <TabsList className="bg-slate-100 p-0.5 rounded-lg w-fit h-8">
                  <TabsTrigger value="active" className="text-[10px] font-black px-3 gap-1.5 h-7">
                    <Briefcase className="w-3 h-3" />
                    {t.activePositions}
                  </TabsTrigger>
                  <TabsTrigger value="closed" className="text-[10px] font-black px-3 gap-1.5 h-7">
                    <History className="w-3 h-3" />
                    {t.closedPositions}
                  </TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-y-auto">
                <TabsContent value="active" className="m-0 h-full">
                  {renderTable(assetCalculations.activeAssets)}
                </TabsContent>
                <TabsContent value="closed" className="m-0 h-full">
                  {renderTable(assetCalculations.closedAssets, true)}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        );
      case 'charts':
        return wrapper(
          <div className="h-full">
            <PortfolioCharts 
              language={language} 
              allocationData={assetCalculations.allocationData} 
              historicalData={assetCalculations.chartData} 
              displayCurrency={displayCurrency} 
              rates={marketData.rates} 
              loading={loading}
            />
          </div>
        );
      case 'ai':
        return wrapper(
          <div className="h-full">
            <AITipCard 
              language={language} 
              assets={assetCalculations.processedAssets} 
              totalTWD={assetCalculations.totalTWD} 
              marketConditions={loading ? "同步中" : "市場穩定"}
            />
          </div>
        );
      case 'form':
        return wrapper(
          <Card className="modern-card bg-white shadow-xl border-slate-100 rounded-xl h-full overflow-y-auto">
            <CardHeader className="px-4 py-4 border-b border-slate-50">
              <CardTitle className="text-base xl:text-lg font-black uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                {t.addAsset}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <AssetForm language={language} onAdd={handleAddAsset} />
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  const renderTable = (data: any[], isClosed = false) => (
    <div className="w-full">
      <Table className="min-w-[800px]">
        <TableHeader className="bg-slate-50/50 sticky top-0 z-10">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="px-4 h-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.assetName}</TableHead>
            <TableHead className="h-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.holdings}</TableHead>
            {!isClosed && <TableHead className="h-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.unitPrice}</TableHead>}
            {!isClosed && <TableHead className="h-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.change}</TableHead>}
            <TableHead className="h-10 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.valuation}</TableHead>
            <TableHead className="h-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.acqDate}</TableHead>
            {isClosed && <TableHead className="h-10 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.posEndDate}</TableHead>}
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(asset => (
            <TableRow key={asset.id} className={cn("group hover:bg-slate-50/40 transition-colors border-slate-50", isClosed && "opacity-60")}>
              <TableCell className="px-4 py-3">
                <div className="font-bold text-xs text-black">{asset.name}</div>
                <div className="text-[8px] font-black text-slate-300 tracking-widest uppercase mt-0.5">
                  {asset.symbol || t.categoryNames[asset.category as AssetCategory]}
                </div>
              </TableCell>
              <TableCell><span className="text-xs font-bold text-slate-700">{asset.amount.toLocaleString()}</span></TableCell>
              {!isClosed && (
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] font-black text-slate-200">{CURRENCY_SYMBOLS[displayCurrency]}</span>
                    <span className="text-xs font-bold text-slate-800">{asset.priceInDisplay.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                </TableCell>
              )}
              {!isClosed && (
                <TableCell>
                  {(asset.category === 'Stock' || asset.category === 'Crypto') ? (
                    <div className={cn("flex items-center gap-0.5 font-bold text-[10px]", asset.dayChangeInDisplay >= 0 ? "text-emerald-600" : "text-rose-600")}>
                      {asset.dayChangeInDisplay >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      <span>{CURRENCY_SYMBOLS[displayCurrency]}{Math.abs(asset.dayChangeInDisplay).toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                      <span className="text-[8px] opacity-60 ml-0.5">({asset.dayChangePercent >= 0 ? '+' : ''}{asset.dayChangePercent.toFixed(1)}%)</span>
                    </div>
                  ) : <span className="text-slate-200">—</span>}
                </TableCell>
              )}
              <TableCell className="text-right pr-4">
                <span className="font-bold text-xs whitespace-nowrap">
                  <span className="text-slate-200 text-[10px] mr-0.5">{CURRENCY_SYMBOLS[displayCurrency]}</span>
                  {asset.valueInDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </TableCell>
              <TableCell><span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{asset.acquisitionDate}</span></TableCell>
              {isClosed && <TableCell><span className="text-[10px] font-bold text-rose-400 whitespace-nowrap">{asset.endDate}</span></TableCell>}
              <TableCell className="pr-4">
                <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-black" onClick={() => { 
                    setEditingAsset(asset); 
                    setEditAmount(asset.amount || 0); 
                    setEditDate(asset.acquisitionDate || '');
                    setEditEndDate(asset.endDate || '');
                  }}>
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-200 hover:text-rose-600" onClick={() => { setAssets(prev => prev.filter(a => a.id !== asset.id)); toast({ title: t.assetDeleted }); }}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  if (!mounted) return null;

  return (
    <div 
      className="min-h-screen bg-white text-black pb-32 font-sans overflow-x-hidden"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleMouseDown}
      onTouchEnd={handleMouseUp}
    >
      <header className="fixed top-0 left-0 right-0 py-2 xl:py-4 border-b border-slate-100 z-[100] bg-white/80 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-4 flex flex-row items-center justify-between gap-2 xl:gap-4">
          <div className="flex items-center gap-2 xl:gap-4 shrink-0">
            <div className="w-6 h-6 xl:w-10 xl:h-10 bg-black rounded flex items-center justify-center shrink-0 shadow-lg">
              <Activity className="w-3.5 h-3.5 xl:w-6 xl:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[10px] xl:text-xl font-black tracking-tighter uppercase leading-none">{t.title}</h1>
              <p className="hidden xl:block text-[8px] font-black text-slate-400 tracking-[0.2em] uppercase mt-1">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-1.5 xl:gap-4 scale-90 xl:scale-100 shrink-0">
            {isReordering && (
              <Button onClick={() => setIsReordering(false)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-black gap-1.5 px-3 h-7 xl:h-10 rounded-full shadow-2xl animate-bounce text-[8px] xl:text-[9px]">
                <Check className="w-3 h-3" /> {t.exitReorder}
              </Button>
            )}
            <div className="hidden xl:flex flex-col items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.exchangeRate}</span>
              <span className="text-[9px] font-bold text-black flex items-center gap-2 bg-slate-50/80 px-3 py-1 rounded-lg border border-slate-100">
                <ArrowRightLeft className="w-3 h-3 text-primary" />
                1 {displayCurrency} = {(['TWD', 'USD', 'CNY', 'SGD'] as Currency[]).filter(c => c !== displayCurrency).slice(0, 2).map(c => `${CURRENCY_SYMBOLS[c]}${(marketData.rates[c] / marketData.rates[displayCurrency]).toFixed(2)}`).join(' | ')}
              </span>
            </div>
            <div className="flex bg-slate-100 p-0.5 rounded-lg shrink-0">
              <Button variant={language === 'zh' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('zh')} className="h-6 px-2 font-bold text-[8px] xl:text-[9px]">繁中</Button>
              <Button variant={language === 'en' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('en')} className="h-6 px-2 font-bold text-[8px] xl:text-[9px]">EN</Button>
            </div>
            <Tabs value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)} className="shrink-0">
              <TabsList className="h-7 xl:h-9 bg-slate-100 p-0.5 rounded-lg">
                {(['TWD', 'USD', 'CNY', 'SGD'] as Currency[]).map(cur => (
                  <TabsTrigger key={cur} value={cur} className="text-[8px] xl:text-[9px] font-black uppercase px-1.5 xl:px-3 h-6 xl:h-7">{cur}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>
      
      <main className="max-w-[1600px] mx-auto px-4 pt-20 xl:pt-32 pb-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-8 items-stretch">
          {layout.map(item => renderSection(item))}
        </div>
      </main>

      <Dialog open={!!editingAsset} onOpenChange={(open) => !open && setEditingAsset(null)}>
        <DialogContent className="max-w-[420px] bg-white rounded-2xl p-6 shadow-2xl border-none">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase tracking-tight text-black flex items-center gap-3">
              <Edit2 className="w-4 h-4 text-primary" />
              {t.editAsset}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.assetName}</Label>
              <div className="p-3 bg-slate-50/80 rounded-lg font-bold text-xs border border-slate-100 text-slate-700">
                {editingAsset?.name} <span className="text-slate-300 font-medium ml-2">{editingAsset?.symbol || '—'}</span>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.holdings}</Label>
              <Input id="amount" type="number" value={editAmount ?? 0} onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)} className="h-10 font-black bg-slate-50 border-slate-200 text-base" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.acqDate}</Label>
                <Input id="date" type="date" value={editDate ?? ''} onChange={(e) => setEditDate(e.target.value)} className="h-10 font-black bg-slate-50 border-slate-200 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.posEndDate}</Label>
                <Input id="endDate" type="date" value={editEndDate || ''} onChange={(e) => setEditEndDate(e.target.value)} className="h-10 font-black bg-slate-50 border-slate-200 text-xs" />
              </div>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="ghost" onClick={() => setEditingAsset(null)} className="font-bold text-[10px] uppercase tracking-widest h-10 flex-1">{t.cancel}</Button>
            <Button onClick={saveEdit} className="bg-black text-white hover:bg-slate-800 font-black text-[10px] uppercase tracking-widest h-10 flex-1 shadow-xl">{t.saveChanges}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}