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
  ArrowRightLeft,
  History,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Info
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
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
import { Badge } from '@/components/ui/badge';

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  TWD: 'NT$',
  USD: '$',
  CNY: '¥',
  SGD: 'S$',
};

const translations = {
  en: {
    title: 'ASSET INSIGHTS PRO',
    syncMarket: 'Sync',
    totalValue: 'PORTFOLIO NET VALUE',
    addAsset: 'ADD POSITION',
    assetName: 'ASSET',
    holdings: 'HOLDINGS',
    valuation: 'VALUATION',
    unitPrice: 'UNIT PRICE',
    category: 'CATEGORY',
    dashboard: 'ASSET OVERVIEW',
    closedPositions: 'CLOSED POSITIONS',
    change: 'Daily Change',
    editAsset: 'EDIT POSITION',
    cancel: 'Cancel',
    saveChanges: 'Save',
    fetching: 'Syncing...',
    exchangeRate: 'LIVE RATES (1 [CUR])',
    baseRange: 'TRACKING RANGE',
    interval: 'INTERVAL',
    days30: '30 Days',
    days90: '90 Days',
    days180: '180 Days',
    days365: '365 Days',
    maxRange: 'Max',
    customRange: 'Custom',
    int1d: 'Daily',
    int1wk: 'Weekly',
    int1mo: 'Monthly',
    dataUpdated: 'Market data synced.',
    acqDate: 'Acquired',
    posEndDate: 'Closed',
    exportData: 'Export',
    importData: 'Import',
    importSuccess: 'Data imported successfully.',
    exitReorder: 'DONE',
    reorderHint: 'REORDER MODE ACTIVE',
    layoutHint: 'Long press card area to adjust layout',
    lastUpdated: 'Last Updated',
    allCategories: 'All',
    categoryNames: { Stock: 'Equity', Crypto: 'Crypto', Bank: 'Other', Savings: 'Deposit', ETF: 'ETF', Option: 'Option', Fund: 'Fund', Index: 'Index' }
  },
  zh: {
    title: 'ASSET INSIGHTS PRO',
    syncMarket: '同步',
    totalValue: '投資組合總淨值',
    addAsset: '新增資產部位',
    assetName: '資產名稱',
    holdings: '持有數量',
    valuation: '帳面價值',
    unitPrice: '單位價值',
    category: '類別',
    dashboard: '資產部位概覽',
    closedPositions: '已結清資產部位',
    change: '今日漲跌',
    editAsset: '編輯部位資訊',
    cancel: '取消',
    saveChanges: '儲存',
    fetching: '同步中',
    exchangeRate: '即時匯率 (1 [CUR])',
    baseRange: '追蹤時間區間',
    interval: '資料頻率',
    days30: '30 天',
    days90: '90 天',
    days180: '180 天',
    days365: '365 天',
    maxRange: '最長',
    customRange: '自定義',
    int1d: '日線',
    int1wk: '週線',
    int1mo: '月線',
    dataUpdated: '市場數據已更新',
    acqDate: '持有日期',
    posEndDate: '結清日期',
    exportData: '匯出資料',
    importData: '匯入資料',
    importSuccess: '資產資料已成功匯入。',
    exitReorder: '完成調整',
    reorderHint: '已進入佈局調整模式',
    layoutHint: '提示：長按卡片區塊可調整佈局',
    lastUpdated: '最後更新',
    allCategories: '全部類別',
    categoryNames: { Stock: '股票', Crypto: '加密貨幣', Bank: '其他資產', Savings: '存款', ETF: 'ETF', Option: '選擇權', Fund: '基金', Index: '指數' }
  }
};

interface LayoutConfig {
  width: number;
  height: number;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc' | null;
}

const formatNumber = (num: number) => {
  return parseFloat(num.toFixed(5)).toString();
};

export default function AssetInsightsPage() {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState<'en' | 'zh'>('zh');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('TWD');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editDate, setEditDate] = useState<string>('');
  const [editEndDate, setEditEndDate] = useState<string>('');
  const [trackingDays, setTrackingDays] = useState<string>("30");
  const [customStartDate, setCustomStartDate] = useState<string>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [customEndDate, setCustomEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [interval, setInterval] = useState<string>("1d");
  const [marketTimeline, setMarketTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  
  const [activeSort, setActiveSort] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [closedSort, setClosedSort] = useState<SortConfig>({ key: 'endDate', direction: 'desc' });
  
  // 調整後的初始順序
  const [sections, setSections] = useState<string[]>(['summary', 'controls', 'addAsset', 'historicalTrend', 'allocation', 'list', 'closedList', 'ai']);
  
  // 調整後的初始寬高 (更短的初始值)
  const [layoutConfigs, setLayoutConfigs] = useState<Record<string, LayoutConfig>>({
    summary: { width: 12, height: 160 },
    controls: { width: 12, height: 80 },
    addAsset: { width: 12, height: 500 },
    historicalTrend: { width: 12, height: 450 },
    allocation: { width: 12, height: 450 },
    list: { width: 12, height: 600 },
    closedList: { width: 12, height: 400 },
    ai: { width: 12, height: 650 }
  });

  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [marketData, setMarketData] = useState<MarketData>({
    exchangeRate: 32.5,
    rates: { TWD: 32.5, CNY: 7.2, USD: 1, SGD: 1.35 },
    assetMarketPrices: {}
  });

  const t = translations[language];

  useEffect(() => {
    setMounted(true);
    const savedAssets = localStorage.getItem('assets');
    if (savedAssets) setAssets(JSON.parse(savedAssets));
    
    const savedSections = localStorage.getItem('sections');
    if (savedSections) setSections(JSON.parse(savedSections));
    
    const savedConfigs = localStorage.getItem('layoutConfigs');
    if (savedConfigs) setLayoutConfigs(JSON.parse(savedConfigs));

    const savedLang = localStorage.getItem('pref_language');
    if (savedLang) setLanguage(savedLang as 'en' | 'zh');

    const savedCurrency = localStorage.getItem('pref_currency');
    if (savedCurrency) setDisplayCurrency(savedCurrency as Currency);

    const savedTracking = localStorage.getItem('pref_trackingDays');
    if (savedTracking) setTrackingDays(savedTracking);

    const savedInterval = localStorage.getItem('pref_interval');
    if (savedInterval) setInterval(savedInterval);

    const savedUpdated = localStorage.getItem('pref_lastUpdated');
    if (savedUpdated) setLastUpdated(savedUpdated);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('assets', JSON.stringify(assets));
      localStorage.setItem('sections', JSON.stringify(sections));
      localStorage.setItem('layoutConfigs', JSON.stringify(layoutConfigs));
      localStorage.setItem('pref_language', language);
      localStorage.setItem('pref_currency', displayCurrency);
      localStorage.setItem('pref_trackingDays', trackingDays);
      localStorage.setItem('pref_interval', interval);
      if (lastUpdated) localStorage.setItem('pref_lastUpdated', lastUpdated);
    }
  }, [assets, sections, layoutConfigs, language, displayCurrency, trackingDays, interval, lastUpdated, mounted]);

  const updateAllData = useCallback(async (currentAssets: Asset[]) => {
    if (!mounted || loading) return;
    setLoading(true);
    try {
      let p2 = Math.floor(Date.now() / 1000);
      let p1: number;

      if (trackingDays === 'max') {
        if (currentAssets.length > 0) {
          const dates = currentAssets.map(a => new Date(a.acquisitionDate).getTime());
          p1 = Math.floor(Math.min(...dates) / 1000);
        } else {
          p1 = 0;
        }
      } else if (trackingDays === 'custom') {
        p1 = Math.floor(new Date(customStartDate).getTime() / 1000);
        p2 = Math.floor(new Date(customEndDate).getTime() / 1000);
      } else {
        p1 = p2 - (parseInt(trackingDays) * 24 * 60 * 60);
      }

      const { marketData: newData, historicalTimeline } = await fetchMarketData(currentAssets, p1, p2, interval);
      setMarketData(newData);
      setMarketTimeline(historicalTimeline);
      
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      setLastUpdated(timestamp);
      
      toast({ title: t.dataUpdated });
    } catch (error) {
      toast({ variant: 'destructive', title: '市場同步失敗' });
    } finally {
      setLoading(false);
    }
  }, [mounted, trackingDays, customStartDate, customEndDate, interval, t.dataUpdated, loading, toast]);

  useEffect(() => {
    if (mounted && assets.length > 0) {
      updateAllData(assets);
    }
  }, [mounted, trackingDays, interval, customStartDate, customEndDate, assets.length]);

  const assetCalculations = useMemo(() => {
    let totalTWD = 0;
    const allocationMap: Record<string, number> = {};
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
        if (asset.symbol && asset.symbol.trim() !== '') {
          valueInTWD = asset.amount * priceInTWD;
          if (marketTimeline.length >= 2) {
            const sortedTimeline = [...marketTimeline].sort((a, b) => a.timestamp - b.timestamp);
            const lastPoint = sortedTimeline[sortedTimeline.length - 1];
            const prevPoint = sortedTimeline[sortedTimeline.length - 2];
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
        allocationMap[asset.category] = (allocationMap[asset.category] || 0) + valueInTWD;
      }
      
      const valueInDisplay = valueInTWD * (displayRate / rateTWD);
      const unitPriceInDisplay = (asset.symbol && asset.symbol.trim() !== '') 
        ? priceInTWD * (displayRate / rateTWD)
        : (rateTWD / (marketData.rates[asset.currency] || 1)) * (displayRate / rateTWD);

      return { ...asset, isClosed, valueInDisplay, priceInDisplay: unitPriceInDisplay, dayChangeInDisplay: dayChangeInTWD * (displayRate / rateTWD), dayChangePercent };
    });

    const historyData: any[] = [];
    const lastKnownPrices: Record<string, number> = {};
    const sortedTimeline = [...marketTimeline].sort((a, b) => a.timestamp - b.timestamp);

    sortedTimeline.forEach((point: any) => {
      const pointTime = point.timestamp * 1000;
      const dateObj = new Date(pointTime);
      const dateKey = dateObj.toISOString().split('T')[0];
      let pointTotalTWD = 0;
      const categories: Record<string, number> = {};

      processedAssets.forEach(asset => {
        const acqTime = new Date(asset.acquisitionDate).getTime();
        const endTimeStr = asset.endDate || '9999-12-31';
        if (pointTime < acqTime || dateKey > endTimeStr) return; 

        if (point.assets[asset.id] !== undefined) {
          lastKnownPrices[asset.id] = point.assets[asset.id];
        }

        let priceAtT = lastKnownPrices[asset.id];
        if (priceAtT === undefined) {
          if (!asset.symbol || asset.symbol.trim() === '') priceAtT = 1;
          else return; 
        }

        const apiCurrency = marketData.assetMarketPrices[asset.id]?.currency || asset.currency || 'TWD';
        const apiCurrencyRate = marketData.rates[apiCurrency as Currency] || 1;
        const priceInTWDAtT = priceAtT * (rateTWD / apiCurrencyRate);
        
        let valInTWD = 0;
        if (asset.symbol && asset.symbol.trim() !== '') {
          valInTWD = asset.amount * priceInTWDAtT;
        } else {
          const assetCurrencyRate = marketData.rates[asset.currency] || 1;
          valInTWD = asset.amount * (rateTWD / assetCurrencyRate);
        }
        
        pointTotalTWD += valInTWD;
        categories[asset.category] = (categories[asset.category] || 0) + valInTWD;
      });

      if (pointTotalTWD > 0) {
        const item = { 
          timestamp: point.timestamp, 
          displayDate: dateObj.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
          shortDate: dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
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

  const getSortedItems = useCallback((items: any[], config: SortConfig) => {
    if (!config.direction) return items;
    return [...items].sort((a, b) => {
      let aVal = a[config.key];
      let bVal = b[config.key];
      if (typeof aVal === 'string') { aVal = aVal.toLowerCase(); bVal = bVal.toLowerCase(); }
      if (aVal < bVal) return config.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return config.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, []);

  const sortedActiveAssets = useMemo(() => {
    let filtered = assetCalculations.activeAssets;
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(a => a.category === categoryFilter);
    }
    return getSortedItems(filtered, activeSort);
  }, [assetCalculations.activeAssets, activeSort, getSortedItems, categoryFilter]);

  const sortedClosedAssets = useMemo(() => getSortedItems(assetCalculations.closedAssets, closedSort), [assetCalculations.closedAssets, closedSort, getSortedItems]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    assets.forEach(a => cats.add(a.category));
    return Array.from(cats);
  }, [assets]);

  const requestSort = (list: 'active' | 'closed', key: string) => {
    const setter = list === 'active' ? setActiveSort : setClosedSort;
    const current = list === 'active' ? activeSort : closedSort;
    let direction: 'asc' | 'desc' | null = 'asc';
    if (current.key === key && current.direction === 'asc') direction = 'desc';
    else if (current.key === key && current.direction === 'desc') direction = null;
    setter({ key, direction });
  };

  const SortIcon = ({ config, columnKey }: { config: SortConfig, columnKey: string }) => {
    if (config.key !== columnKey || !config.direction) return <ArrowUpDown className="w-3 h-3 ml-2 opacity-20" />;
    return config.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-2 text-black" /> : <ArrowDown className="w-3 h-3 ml-2 text-black" />;
  };

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
    if ((e.target as HTMLElement).closest('button, input, select, [role="tab"], .recharts-surface, .lucide, textarea, th')) return;
    const cleanup = () => {
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
      window.removeEventListener('mouseup', cleanup);
      window.removeEventListener('touchend', cleanup);
    };
    window.addEventListener('mouseup', cleanup);
    window.addEventListener('touchend', cleanup);
    longPressTimer.current = setTimeout(() => { 
      setIsReordering(true); 
      toast({ title: t.reorderHint });
      cleanup(); 
    }, 800);
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
      <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full shadow-2xl border border-white/20 scale-90 sm:scale-100">
        <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/20" onClick={() => moveSection(index, 'up')} disabled={index === 0}><ChevronUp className="w-5 h-5" /></Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/20" onClick={() => moveSection(index, 'down')} disabled={index === sections.length - 1}><ChevronDown className="w-5 h-5" /></Button>
        <div className="w-px h-6 bg-white/20 mx-1" />
        <span className="text-[14px] font-black uppercase tracking-widest px-1 opacity-60">W</span>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/20" onClick={() => resizeSection(id, 'x', 'dec')}><Minimize2 className="w-5 h-5" /></Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/20" onClick={() => resizeSection(id, 'x', 'inc')}><Maximize2 className="w-5 h-5" /></Button>
        <div className="w-px h-6 bg-white/20 mx-1" />
        <span className="text-[14px] font-black uppercase tracking-widest px-1 opacity-60">H</span>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/20" onClick={() => resizeSection(id, 'y', 'dec')}><ChevronDown className="w-5 h-5" /></Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/20" onClick={() => resizeSection(id, 'y', 'inc')}><ChevronUp className="w-5 h-5" /></Button>
      </div>
    );

    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1280;

    const commonClass = cn(
      "relative transition-all duration-300",
      isReordering && "ring-4 ring-black ring-offset-2 rounded-2xl z-[105] shadow-2xl scale-[0.98]",
      config.width === 4 && "xl:col-span-4",
      config.width === 6 && "xl:col-span-6",
      config.width === 8 && "xl:col-span-8",
      config.width === 10 && "xl:col-span-10",
      config.width === 12 && "xl:col-span-12",
      !isDesktop && "h-auto min-h-0"
    );

    const wrapperStyle = isDesktop ? { minHeight: `${config.height}px`, height: `${config.height}px` } : {};

    switch (id) {
      case 'summary':
        return (
          <div key={id} className={commonClass} style={wrapperStyle}>
            {controls}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
              <Card className="lg:col-span-9 modern-card p-6 sm:p-8 relative overflow-hidden bg-white flex flex-col justify-center min-h-[160px]">
                <div className="space-y-3 z-20 relative text-left">
                  <div className="pro-label">
                    <Globe className="w-4 h-4" /> {t.totalValue}
                  </div>
                  <div className="pro-title flex items-center">
                    <span className="text-slate-200 font-medium text-[0.6em] mr-3">{CURRENCY_SYMBOLS[displayCurrency]}</span>
                    <span>{assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    {loading && <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-slate-200 ml-4" />}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-[11px] uppercase tracking-widest mt-1">
                    <Info className="w-3.5 h-3.5" /> {t.layoutHint}
                  </div>
                </div>
                <div className="absolute bottom-6 right-6 opacity-10 pointer-events-none flex items-center justify-center">
                  <Wallet className="w-16 h-16 sm:w-20 sm:h-20 text-black" />
                </div>
              </Card>
              <div className="lg:col-span-3 flex flex-col items-center justify-center gap-2 py-0">
                <Button onClick={() => updateAllData(assets)} disabled={loading} className="w-full h-full min-h-[160px] bg-black text-white hover:bg-slate-800 font-black flex flex-col items-center justify-center gap-2 rounded-2xl shadow-xl transition-all active:scale-95 py-6">
                  <RefreshCw className={cn("w-6 h-6", loading && "animate-spin")} />
                  <span className="text-[12px] tracking-[0.3em] uppercase">{loading ? t.fetching : t.syncMarket}</span>
                </Button>
              </div>
            </section>
          </div>
        );
      case 'controls':
        return (
          <div key={id} className={commonClass} style={wrapperStyle}>
            {controls}
            <section className="bg-slate-50/80 backdrop-blur-md p-3 sm:p-4 border border-slate-100 rounded-2xl flex flex-col md:flex-row items-center gap-3 sm:gap-4 shadow-inner h-full">
              <div className="shrink-0 flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label className="pro-label text-[10px] whitespace-nowrap flex items-center gap-1.5 opacity-70">
                    <Calendar className="w-3.5 h-3.5" /> {t.baseRange}
                  </Label>
                  <Select value={trackingDays} onValueChange={setTrackingDays}>
                    <SelectTrigger className="w-24 sm:w-28 h-8 bg-white font-black text-[12px] rounded-lg border border-slate-200 shadow-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">{t.days30}</SelectItem>
                      <SelectItem value="90">{t.days90}</SelectItem>
                      <SelectItem value="180">{t.days180}</SelectItem>
                      <SelectItem value="365">{t.days365}</SelectItem>
                      <SelectItem value="max">{t.maxRange}</SelectItem>
                      <SelectItem value="custom">{t.customRange}</SelectItem>
                    </SelectContent>
                  </Select>
                  {trackingDays === 'custom' && (
                    <div className="flex items-center gap-1 animate-fade-in">
                      <Input type="date" value={customStartDate} onChange={(e) => setCustomStartDate(e.target.value)} className="w-28 h-8 font-black text-[10px] rounded-lg border border-slate-200" />
                      <Input type="date" value={customEndDate} onChange={(e) => setCustomEndDate(e.target.value)} className="w-28 h-8 font-black text-[10px] rounded-lg border border-slate-200" />
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Label className="pro-label text-[10px] whitespace-nowrap flex items-center gap-1.5 opacity-70">
                    <Clock className="w-3.5 h-3.5" /> {t.interval}
                  </Label>
                  <Select value={interval} onValueChange={setInterval}>
                    <SelectTrigger className="w-24 sm:w-28 h-8 bg-white font-black text-[12px] rounded-lg border border-slate-200 shadow-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1d">{t.int1d}</SelectItem>
                      <SelectItem value="1wk">{t.int1wk}</SelectItem>
                      <SelectItem value="1mo">{t.int1mo}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 w-full">
                <Button variant="outline" onClick={handleExport} className="flex-1 h-8 font-black text-[11px] uppercase tracking-[0.1em] gap-1.5 bg-white rounded-lg shadow-sm border border-slate-200 hover:border-black transition-all"><Download className="w-3.5 h-3.5" /> {t.exportData}</Button>
                <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="flex-1 h-8 font-black text-[11px] uppercase tracking-[0.1em] gap-1.5 bg-white rounded-lg shadow-sm border border-slate-200 hover:border-black transition-all"><Upload className="w-3.5 h-3.5" /> {t.importData}</Button>
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
            <Card className="modern-card bg-white h-full flex flex-col overflow-hidden">
              <div className="px-6 sm:px-10 py-6 border-b border-slate-50 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="pro-label">
                  <BarChart3 className="w-6 h-6" /> {t.dashboard}
                </h3>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[140px] h-9 bg-slate-50 border-slate-200 text-[12px] font-black uppercase rounded-lg">
                      <SelectValue placeholder={t.allCategories} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.allCategories}</SelectItem>
                      {allCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{t.categoryNames[cat as keyof typeof t.categoryNames] || cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <CardContent className="p-0 flex-1 overflow-hidden relative">
                <Table className="min-w-[1200px] border-separate border-spacing-0" wrapperClassName="h-full overflow-auto">
                  <TableHeader className="relative z-30">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="sticky top-0 bg-white/95 backdrop-blur-md px-6 sm:px-10 h-14 cursor-pointer select-none group border-b border-slate-100 z-30" onClick={() => requestSort('active', 'name')}>
                        <div className="flex items-center text-[14px] font-black text-slate-500 uppercase tracking-widest">
                          {t.assetName} <SortIcon config={activeSort} columnKey="name" />
                        </div>
                      </TableHead>
                      <TableHead className="sticky top-0 bg-white/95 backdrop-blur-md h-14 cursor-pointer select-none group border-b border-slate-100 z-30" onClick={() => requestSort('active', 'category')}>
                        <div className="flex items-center text-[14px] font-black text-slate-500 uppercase tracking-widest">
                          {t.category} <SortIcon config={activeSort} columnKey="category" />
                        </div>
                      </TableHead>
                      <TableHead className="sticky top-0 bg-white/95 backdrop-blur-md h-14 cursor-pointer select-none group border-b border-slate-100 z-30" onClick={() => requestSort('active', 'amount')}>
                        <div className="flex items-center text-[14px] font-black text-slate-500 uppercase tracking-widest">
                          {t.holdings} <SortIcon config={activeSort} columnKey="amount" />
                        </div>
                      </TableHead>
                      <TableHead className="sticky top-0 bg-white/95 backdrop-blur-md h-14 cursor-pointer select-none group border-b border-slate-100 z-30" onClick={() => requestSort('active', 'acquisitionDate')}>
                        <div className="flex items-center text-[14px] font-black text-slate-500 uppercase tracking-widest">
                          {t.acqDate} <SortIcon config={activeSort} columnKey="acquisitionDate" />
                        </div>
                      </TableHead>
                      <TableHead className="sticky top-0 bg-white/95 backdrop-blur-md h-14 cursor-pointer select-none group border-b border-slate-100 z-30" onClick={() => requestSort('active', 'priceInDisplay')}>
                        <div className="flex items-center text-[14px] font-black text-slate-500 uppercase tracking-widest">
                          {t.unitPrice} <SortIcon config={activeSort} columnKey="priceInDisplay" />
                        </div>
                      </TableHead>
                      <TableHead className="sticky top-0 bg-white/95 backdrop-blur-md h-14 cursor-pointer select-none group border-b border-slate-100 z-30" onClick={() => requestSort('active', 'dayChangePercent')}>
                        <div className="flex items-center text-[14px] font-black text-slate-500 uppercase tracking-widest">
                          {t.change} <SortIcon config={activeSort} columnKey="dayChangePercent" />
                        </div>
                      </TableHead>
                      <TableHead className="sticky top-0 bg-white/95 backdrop-blur-md h-14 cursor-pointer select-none group pr-6 sm:pr-10 border-b border-slate-100 z-30" onClick={() => requestSort('active', 'valueInDisplay')}>
                        <div className="flex items-center justify-end text-[14px] font-black text-slate-500 uppercase tracking-widest">
                          {t.valuation} <SortIcon config={activeSort} columnKey="valueInDisplay" />
                        </div>
                      </TableHead>
                      <TableHead className="sticky top-0 bg-white/95 backdrop-blur-md w-[80px] border-b border-slate-100 z-30"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedActiveAssets.map((asset: any) => (
                      <TableRow key={asset.id} className="group hover:bg-slate-50/50 border-slate-50 transition-colors">
                        <TableCell className="px-6 sm:px-10 py-6">
                          <div className="font-black text-[15px] text-slate-900">{asset.name}</div>
                          <div className="text-[14px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{asset.symbol || t.categoryNames[asset.category as AssetCategory] || asset.category}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[11px] font-black border-slate-200 text-slate-600 bg-slate-50 uppercase tracking-widest px-2.5 py-1">
                            {t.categoryNames[asset.category as AssetCategory] || asset.category}
                          </Badge>
                        </TableCell>
                        <TableCell><span className="text-[15px] font-black text-slate-700">{formatNumber(asset.amount)}</span></TableCell>
                        <TableCell><span className="text-[14px] font-black text-slate-500">{asset.acquisitionDate}</span></TableCell>
                        <TableCell><div className="flex items-center gap-2 sm:gap-3"><span className="text-[14px] font-black text-slate-300">{CURRENCY_SYMBOLS[displayCurrency]}</span><span className="text-[15px] font-black text-slate-700">{formatNumber(asset.priceInDisplay)}</span></div></TableCell>
                        <TableCell>
                          {asset.symbol ? (
                            <div className={cn("flex items-center gap-2 font-black text-[13px]", asset.dayChangeInDisplay >= 0 ? "text-emerald-600" : "text-rose-600")}>
                              {asset.dayChangeInDisplay >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                              <span>{asset.dayChangePercent.toFixed(1)}%</span>
                            </div>
                          ) : <span className="text-slate-200">—</span>}
                        </TableCell>
                        <TableCell className="text-right pr-6 sm:pr-10">
                          <div className="font-black text-lg">
                            <span className="text-slate-300 text-[14px] mr-1 sm:mr-2">{CURRENCY_SYMBOLS[displayCurrency]}</span>
                            {asset.valueInDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </div>
                        </TableCell>
                        <TableCell className="pr-6 sm:pr-10 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => { setEditingAsset(asset); setEditAmount(asset.amount); setEditDate(asset.acquisitionDate); setEditEndDate(asset.endDate || ''); }}><Edit2 className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-rose-300" onClick={() => { setAssets(prev => prev.filter(a => a.id !== asset.id)); }}><Trash2 className="w-4 h-4" /></Button>
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
      case 'closedList':
        return (
          <div key={id} className={commonClass} style={wrapperStyle}>
            {controls}
            <Card className="modern-card bg-white h-full flex flex-col overflow-hidden opacity-80">
              <div className="px-6 sm:px-10 py-6 border-b border-slate-50 shrink-0">
                <h3 className="pro-label">
                  <History className="w-6 h-6" /> {t.closedPositions}
                </h3>
              </div>
              <CardContent className="p-0 flex-1 overflow-hidden relative">
                <Table className="min-w-[1000px] border-separate border-spacing-0" wrapperClassName="h-full overflow-auto">
                  <TableHeader className="relative z-30">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="sticky top-0 bg-white/95 backdrop-blur-md px-6 sm:px-10 h-14 cursor-pointer select-none group border-b border-slate-100 z-30" onClick={() => requestSort('closed', 'name')}>
                        <div className="flex items-center text-[14px] font-black text-slate-500 uppercase tracking-widest">
                          {t.assetName} <SortIcon config={closedSort} columnKey="name" />
                        </div>
                      </TableHead>
                      <TableHead className="sticky top-0 bg-white/95 backdrop-blur-md h-14 cursor-pointer select-none group border-b border-slate-100 z-30" onClick={() => requestSort('closed', 'amount')}>
                        <div className="flex items-center text-[14px] font-black text-slate-500 uppercase tracking-widest">
                          {t.holdings} <SortIcon config={closedSort} columnKey="amount" />
                        </div>
                      </TableHead>
                      <TableHead className="sticky top-0 bg-white/95 backdrop-blur-md h-14 cursor-pointer select-none group border-b border-slate-100 z-30" onClick={() => requestSort('closed', 'acquisitionDate')}>
                        <div className="flex items-center text-[14px] font-black text-slate-500 uppercase tracking-widest">
                          {t.acqDate} <SortIcon config={closedSort} columnKey="acquisitionDate" />
                        </div>
                      </TableHead>
                      <TableHead className="sticky top-0 bg-white/95 backdrop-blur-md h-14 cursor-pointer select-none group pr-6 sm:pr-10 border-b border-slate-100 z-30" onClick={() => requestSort('closed', 'endDate')}>
                        <div className="flex items-center justify-end text-[14px] font-black text-slate-500 uppercase tracking-widest">
                          {t.posEndDate} <SortIcon config={closedSort} columnKey="endDate" />
                        </div>
                      </TableHead>
                      <TableHead className="sticky top-0 bg-white/95 backdrop-blur-md w-[80px] border-b border-slate-100 z-30"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedClosedAssets.map((asset: any) => (
                      <TableRow key={asset.id} className="group hover:bg-slate-50/50 border-slate-50 transition-colors">
                        <TableCell className="px-6 sm:px-10 py-6">
                          <div className="font-black text-[15px] text-slate-400 line-through decoration-2">{asset.name}</div>
                          <div className="text-[14px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1">{asset.symbol || t.categoryNames[asset.category as AssetCategory] || asset.category}</div>
                        </TableCell>
                        <TableCell><span className="text-[15px] font-black text-slate-400">{formatNumber(asset.amount)}</span></TableCell>
                        <TableCell><span className="text-[14px] font-black text-slate-400">{asset.acquisitionDate}</span></TableCell>
                        <TableCell className="text-right pr-6 sm:pr-10">
                          <div className="font-black text-[14px] text-slate-500">{asset.endDate}</div>
                        </TableCell>
                        <TableCell className="pr-6 sm:pr-10 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => { setEditingAsset(asset); setEditAmount(asset.amount); setEditDate(asset.acquisitionDate); setEditEndDate(asset.endDate || ''); }}><Edit2 className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-rose-300" onClick={() => { setAssets(prev => prev.filter(a => a.id !== asset.id)); }}><Trash2 className="w-4 h-4" /></Button>
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
            <Card className="modern-card bg-white h-full flex flex-col overflow-hidden">
              <CardHeader className="px-6 sm:px-10 py-6 border-b border-slate-50 shrink-0">
                <h3 className="pro-label">
                  <Plus className="w-6 h-6" /> {t.addAsset}
                </h3>
              </CardHeader>
              <CardContent className="p-6 sm:p-10 flex-1 overflow-auto no-scrollbar">
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
    <div className="min-h-screen bg-white text-black pb-24 overflow-x-hidden" onMouseDown={handleMouseDown}>
      <header className="fixed top-0 left-0 right-0 border-b border-slate-100 z-[120] bg-white/95 backdrop-blur-3xl h-auto py-1.5 sm:py-3 shadow-sm">
        <div className="max-w-[1900px] mx-auto px-4 sm:px-10 h-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 overflow-hidden">
          <div className="flex items-center justify-between sm:justify-start gap-3 shrink-0 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center shrink-0 shadow-lg"><Activity className="w-4 h-4 text-white" /></div>
              <h1 className="text-[13px] sm:text-[14px] font-black tracking-tighter uppercase leading-tight">{t.title}</h1>
            </div>
            <div className="flex sm:hidden items-center gap-2">
               <div className="flex bg-slate-100 p-0.5 rounded-md">
                  <Button variant={language === 'zh' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('zh')} className="h-5 px-1.5 font-black text-[11px]">繁</Button>
                  <Button variant={language === 'en' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('en')} className="h-5 px-1.5 font-black text-[11px]">EN</Button>
                </div>
                <Select value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)}>
                  <SelectTrigger className="h-6 w-16 bg-slate-100 border-none font-black text-[11px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['TWD', 'USD', 'CNY', 'SGD'] as Currency[]).map(cur => (<SelectItem key={cur} value={cur}>{cur}</SelectItem>))}
                  </SelectContent>
                </Select>
            </div>
          </div>
          
          <div className="flex-1 flex items-center gap-4 overflow-hidden w-full">
            <div className="flex items-center gap-4 sm:gap-6 px-0 sm:px-4 border-l-0 sm:border-l border-slate-100 overflow-x-auto no-scrollbar w-full sm:w-auto pb-0.5 sm:pb-0">
               <span className="text-[11px] sm:text-[13px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                 {t.exchangeRate.replace('[CUR]', displayCurrency)}
               </span>
               <div className="flex items-center gap-4 sm:gap-6">
                 {Object.entries(marketData.rates).filter(([cur]) => cur !== displayCurrency).map(([cur, rate]) => {
                   const baseRate = marketData.rates[displayCurrency] || 1;
                   const relativeRate = rate / baseRate;
                   return (
                     <div key={cur} className="flex items-center gap-1.5 whitespace-nowrap">
                       <span className="text-[12px] sm:text-[14px] font-black text-slate-900">{cur}</span>
                       <ArrowRightLeft className="w-2.5 h-2.5 text-slate-300" />
                       <span className="text-[12px] sm:text-[14px] font-black text-emerald-600">
                         {relativeRate.toFixed(4).replace(/\.?0+$/, '')}
                       </span>
                     </div>
                   );
                 })}
               </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 sm:gap-3 shrink-0">
            {isReordering ? (
              <Button onClick={() => setIsReordering(false)} className="h-7 bg-black text-white px-4 font-black text-[12px] uppercase tracking-[0.2em] gap-1 rounded-full shadow-lg"><Check className="w-4 h-4" /> {t.exitReorder}</Button>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex bg-slate-100 p-0.5 rounded-md">
                  <Button variant={language === 'zh' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('zh')} className="h-6 px-2 font-black text-[14px]">繁</Button>
                  <Button variant={language === 'en' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('en')} className="h-6 px-2 font-black text-[14px]">EN</Button>
                </div>
                <Tabs value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)}>
                  <TabsList className="h-7 bg-slate-100 p-0.5 rounded-md">
                    {(['TWD', 'USD', 'CNY', 'SGD'] as Currency[]).map(cur => (<TabsTrigger key={cur} value={cur} className="text-[14px] font-black uppercase px-2 h-6">{cur}</TabsTrigger>))}
                  </TabsList>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <main className="max-w-[1900px] mx-auto px-4 sm:px-10 pt-[105px] sm:pt-24 pb-20">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 sm:gap-10 items-start">
          {sections.map((id, index) => renderSection(id, index))}
        </div>
      </main>

      <Dialog open={!!editingAsset} onOpenChange={(open) => !open && setEditingAsset(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-[480px] bg-white rounded-3xl p-6 sm:p-10">
          <DialogHeader><DialogTitle className="text-xl sm:text-2xl font-black uppercase tracking-tight flex items-center gap-4"><Edit2 className="w-5 h-5 text-primary" /> {t.editAsset}</DialogTitle></DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-2"><Label className="pro-label ml-1 mb-1">{t.assetName}</Label><div className="p-4 bg-slate-50 rounded-xl font-black text-sm text-slate-900 border border-slate-100">{editingAsset?.name}</div></div>
            <div className="space-y-2">
              <Label htmlFor="amount" className="pro-label ml-1 mb-1">{t.holdings}</Label>
              <Input id="amount" type="number" step="any" value={editAmount} onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)} onFocus={(e) => (e.target as HTMLInputElement).select()} className="h-11 font-black text-base border-2 border-slate-300 rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="pro-label ml-1 mb-1">{t.acqDate}</Label><Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-11 font-black text-xs rounded-xl border-2 border-slate-300" /></div>
              <div className="space-y-2"><Label className="pro-label ml-1 mb-1">{t.posEndDate}</Label><Input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} className="h-11 font-black text-xs rounded-xl border-2 border-slate-300" /></div>
            </div>
          </div>
          <DialogFooter className="flex flex-row gap-3 mt-4">
            <Button variant="ghost" onClick={() => setEditingAsset(null)} className="font-black h-11 flex-1 rounded-xl text-[14px] uppercase tracking-[0.2em]">{t.cancel}</Button>
            <Button onClick={() => {
              const updated = assets.map(a => a.id === editingAsset?.id ? { ...a, amount: editAmount, acquisitionDate: editDate, endDate: editEndDate || undefined } : a);
              setAssets(updated); setEditingAsset(null); updateAllData(updated);
            }} className="bg-black text-white font-black h-11 flex-1 rounded-xl text-[14px] uppercase tracking-[0.2em] shadow-xl">{t.saveChanges}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
