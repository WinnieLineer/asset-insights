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
  ArrowRightLeft,
  History,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Info,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  Plus,
  CheckCircle2,
  TrendingUp,
  TrendingDown
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
    syncMarket: 'Sync Market',
    totalValue: 'PORTFOLIO NET VALUE',
    addAsset: 'ADD POSITION',
    assetName: 'ASSET',
    holdings: 'HOLDINGS',
    valuation: 'VALUATION',
    category: 'CATEGORY',
    dashboard: 'ASSET OVERVIEW',
    closedPositions: 'CLOSED POSITIONS',
    editAsset: 'EDIT POSITION',
    cancel: 'Cancel',
    saveChanges: 'Save',
    fetching: 'Syncing...',
    exchangeRate: 'LIVE RATES (1 [CUR])',
    baseRange: 'RANGE',
    interval: 'FREQ',
    days30: '30 Days',
    days90: '90 Days',
    days180: '180 Days',
    days365: '365 Days',
    maxRange: 'Max',
    int1d: 'Daily',
    int1wk: 'Weekly',
    int1mo: 'Monthly',
    dataUpdated: 'Market data synced.',
    acqDate: 'Starting Holding Date',
    posEndDate: 'Closed Date',
    exportData: 'Export',
    importData: 'Import',
    importSuccess: 'Data imported successfully.',
    reorderHint: 'REORDER MODE ACTIVE',
    saveLayout: 'SAVE LAYOUT CONFIG',
    layoutHint: 'Hint: Long press card to adjust layout',
    lastUpdated: 'Last Updated',
    allCategories: 'All',
    unitPrice: 'UNIT PRICE',
    priceChange: 'CHG',
    categoryNames: { Stock: 'Equity', Crypto: 'Crypto', Bank: 'Other', Savings: 'Deposit', ETF: 'ETF', Option: 'Option', Fund: 'Fund', Index: 'Index', Future: 'Future', Forex: 'Forex' }
  },
  zh: {
    title: 'ASSET INSIGHTS PRO',
    syncMarket: '同步市場數據',
    totalValue: '投資組合總淨值',
    addAsset: '新增資產部位',
    assetName: '資產名稱',
    holdings: '持有數量',
    valuation: '帳面價值',
    category: '類別',
    dashboard: '資產部位概覽',
    closedPositions: '已結清資產部位',
    editAsset: '編輯部位資訊',
    cancel: '取消',
    saveChanges: '儲存',
    fetching: '同步中',
    exchangeRate: '即時匯率 (1 [CUR])',
    baseRange: '追蹤時間區間',
    interval: '數據頻率',
    days30: '30 天',
    days90: '90 天',
    days180: '180 天',
    days365: '365 天',
    maxRange: '最長',
    int1d: '日線',
    int1wk: '週線',
    int1mo: '月線',
    dataUpdated: '市場數據已更新',
    allCategories: '全部類別',
    unitPrice: '單位價值',
    priceChange: '漲跌',
    exportData: '匯出',
    importData: '匯入',
    importSuccess: '資產資料已成功匯入。',
    reorderHint: '已進入佈局調整模式',
    saveLayout: '儲存佈局配置',
    layoutHint: '提示：長按卡片區塊可調整佈局',
    lastUpdated: '最後更新',
    acqDate: '起始持有日期',
    posEndDate: '結清日期',
    categoryNames: { Stock: '股票', Crypto: '加密貨幣', Bank: '其他資產', Savings: '存款', ETF: 'ETF', Option: '選擇權', Fund: '基金', Index: '指數', Future: '期貨', Forex: '外匯' }
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

const formatNumber = (num: any) => {
  if (num === null || num === undefined) return "0";
  const val = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(val)) return "0";
  return parseFloat(val.toFixed(5)).toString();
};

export default function AssetInsightsPage() {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState<'en' | 'zh'>('zh');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('TWD');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editDate, setEditDate] = useState<string>('');
  const [editEndDate, setEditEndDate] = useState<string>('');
  const [editCurrency, setEditCurrency] = useState<Currency>('TWD');

  const [trackingDays, setTrackingDays] = useState<string>("max");
  const [interval, setInterval] = useState<string>("1d");
  const [marketTimeline, setMarketTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  
  const [activeSort, setActiveSort] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [closedSort, setClosedSort] = useState<SortConfig>({ key: 'endDate', direction: 'desc' });
  
  const [sections, setSections] = useState<string[]>(['summary', 'controls', 'historicalTrend', 'allocation', 'list', 'addAsset', 'closedList', 'ai']);
  
  const [layoutConfigs, setLayoutConfigs] = useState<Record<string, LayoutConfig>>({
    summary: { width: 12, height: 160 },
    controls: { width: 12, height: 80 },
    historicalTrend: { width: 7, height: 450 },
    allocation: { width: 5, height: 450 },
    list: { width: 12, height: 600 },
    addAsset: { width: 12, height: 420 },
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
    const handleResize = () => setIsDesktop(window.innerWidth >= 1280);
    handleResize();
    window.addEventListener('resize', handleResize);

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

    return () => window.removeEventListener('resize', handleResize);
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
          p1 = p2 - (365 * 24 * 60 * 60);
        }
      } else {
        p1 = p2 - (parseInt(trackingDays) * 24 * 60 * 60);
      }
      const result = await fetchMarketData(currentAssets, p1, p2, interval);
      setMarketData(result.marketData);
      setMarketTimeline(result.historicalTimeline);
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${(now.getMonth()+1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      setLastUpdated(timestamp);
      if (typeof window !== 'undefined' && window.innerWidth > 1024) {
        toast({ title: t.dataUpdated });
      }
    } catch (error) {
      console.error('Market update error:', error);
      toast({ variant: 'destructive', title: '市場數據同步失敗' });
    } finally {
      setLoading(false);
    }
  }, [mounted, trackingDays, interval, t.dataUpdated, loading, toast]);

  useEffect(() => {
    if (mounted && assets.length > 0) {
      updateAllData(assets);
    }
  }, [mounted, trackingDays, interval, assets.length]);

  const assetCalculations = useMemo(() => {
    let totalTWD = 0;
    const allocationMap: Record<string, number> = {};
    const rateTWD = marketData.rates?.TWD || 32.5;
    const displayRate = marketData.rates?.[displayCurrency] || 1;
    const todayStr = new Date().toISOString().split('T')[0];
    const lastKnownPrices: Record<string, number> = {};
    const dayAggregator: Record<string, any> = {};
    const sortedTimeline = [...marketTimeline].sort((a, b) => a.timestamp - b.timestamp);

    const processedAssets = assets.map(asset => {
      const marketInfo = marketData.assetMarketPrices?.[asset.id];
      const nativePrice = marketInfo?.price || 0;
      const apiCurrency = marketInfo?.currency || asset.currency || 'TWD';
      const apiCurrencyRate = (marketData.rates?.[apiCurrency as Currency] || 1);
      let valueInTWD = 0;
      const isClosed = asset.endDate ? asset.endDate <= todayStr : false;
      if (!isClosed) {
        if (asset.symbol && asset.symbol.trim() !== '') {
          const priceInTWD = nativePrice * (rateTWD / apiCurrencyRate);
          valueInTWD = asset.amount * priceInTWD;
        } else {
          const assetCurrencyRate = marketData.rates?.[asset.currency] || 1;
          valueInTWD = asset.amount * (rateTWD / assetCurrencyRate);
        }
        totalTWD += valueInTWD;
        allocationMap[asset.category] = (allocationMap[asset.category] || 0) + valueInTWD;
      }
      const valueInDisplay = valueInTWD * (displayRate / rateTWD);
      const unitPriceInDisplay = (asset.symbol && asset.symbol.trim() !== '') 
        ? (nativePrice * (rateTWD / apiCurrencyRate)) * (displayRate / rateTWD)
        : (rateTWD / (marketData.rates?.[asset.currency] || 1)) * (displayRate / rateTWD);
      let changePercent = 0;
      const timelineForAsset = sortedTimeline.filter(p => p.assets?.[asset.id] !== undefined);
      if (timelineForAsset.length >= 2) {
        const last = timelineForAsset[timelineForAsset.length - 1].assets[asset.id];
        const prev = timelineForAsset[timelineForAsset.length - 2].assets[asset.id];
        if (last && prev) changePercent = ((last - prev) / prev) * 100;
      }
      return { ...asset, isClosed, valueInDisplay, priceInDisplay: unitPriceInDisplay, changePercent };
    });

    if (sortedTimeline.length > 0) {
      const firstTs = sortedTimeline[0].timestamp;
      const lastTs = Math.floor(Date.now() / 1000);
      const apiByDay: Record<string, any[]> = {};
      sortedTimeline.forEach(p => {
        const d = new Date(p.timestamp * 1000).toISOString().split('T')[0];
        if (!apiByDay[d]) apiByDay[d] = [];
        apiByDay[d].push(p);
      });
      let currentD = new Date(firstTs * 1000);
      const endD = new Date(lastTs * 1000);
      while (currentD <= endD) {
        const dateKey = currentD.toISOString().split('T')[0];
        if (apiByDay[dateKey]) {
          const lastPointOfDay = apiByDay[dateKey][apiByDay[dateKey].length - 1];
          Object.entries(lastPointOfDay.assets || {}).forEach(([id, price]) => {
            lastKnownPrices[id] = price as number;
          });
        }
        let pointTotalTWD = 0;
        const categories: Record<string, number> = {};
        processedAssets.forEach(asset => {
          const acqTime = new Date(asset.acquisitionDate).getTime();
          const endTimeStr = asset.endDate || '9999-12-31';
          const currentT = currentD.getTime();
          if (currentT < acqTime || dateKey > endTimeStr) return; 
          let priceAtT = lastKnownPrices[asset.id];
          if (priceAtT === undefined) {
            if (!asset.symbol || asset.symbol.trim() === '') priceAtT = 1;
            else return; 
          }
          const apiCurrency = marketData.assetMarketPrices?.[asset.id]?.currency || asset.currency || 'TWD';
          const apiCurrencyRate = marketData.rates?.[apiCurrency as Currency] || 1;
          const priceInTWDAtT = priceAtT * (rateTWD / apiCurrencyRate);
          let valInTWD = asset.amount * priceInTWDAtT;
          if (!asset.symbol || asset.symbol.trim() === '') {
            valInTWD = asset.amount * (rateTWD / (marketData.rates?.[asset.currency] || 1));
          }
          pointTotalTWD += valInTWD;
          categories[asset.category] = (categories[asset.category] || 0) + valInTWD;
        });
        if (pointTotalTWD > 0) {
          dayAggregator[dateKey] = { 
            timestamp: currentD.getTime() / 1000, 
            displayDate: currentD.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
            shortDate: currentD.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            totalValue: pointTotalTWD * (displayRate / rateTWD),
            ...Object.fromEntries(Object.entries(categories).map(([c, v]) => [c, v * (displayRate / rateTWD)]))
          };
        }
        currentD.setDate(currentD.getDate() + 1);
      }
    }
    const historyData = Object.keys(dayAggregator).sort().map(key => dayAggregator[key]);
    return { processedAssets, activeAssets: processedAssets.filter(a => !a.isClosed), closedAssets: processedAssets.filter(a => a.isClosed), totalTWD, totalDisplay: totalTWD * (displayRate / rateTWD), allocationData: Object.entries(allocationMap).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value: value * (displayRate / rateTWD) })), chartData: historyData };
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
    if (categoryFilter !== 'all') filtered = filtered.filter(a => a.category === categoryFilter);
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
        if (direction === 'dec') config.height = Math.max(80, config.height - 50);
      }
      return { ...prev, [id]: config };
    });
  };

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('button, input, select, [role="combobox"], textarea, th, td, a, label, h1, h2, h3, h4, p, span')) return;
    const startX = 'clientX' in e ? e.clientX : e.touches[0].clientX;
    const startY = 'clientY' in e ? e.clientY : e.touches[0].clientY;
    const onMove = (me: MouseEvent | TouchEvent) => {
      const curX = 'clientX' in me ? me.clientX : (me as TouchEvent).touches[0].clientX;
      const curY = 'clientY' in me ? me.clientY : (me as TouchEvent).touches[0].clientY;
      if (Math.abs(curX - startX) > 8 || Math.abs(curY - startY) > 8) cleanup();
    };
    const cleanup = () => {
      if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null; }
      window.removeEventListener('mouseup', cleanup);
      window.removeEventListener('touchend', cleanup);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
    };
    window.addEventListener('mouseup', cleanup);
    window.addEventListener('touchend', cleanup);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove);
    longPressTimer.current = setTimeout(() => { 
      const finalSelection = window.getSelection();
      if (finalSelection && finalSelection.toString().length > 0) { cleanup(); return; }
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
      <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-[2000] flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full shadow-2xl border border-white/20 scale-90 sm:scale-100 ring-4 ring-black/5">
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
    const commonClass = cn(
      "relative transition-all duration-300",
      isReordering && "ring-4 ring-black ring-offset-2 rounded-2xl z-[900] shadow-2xl scale-[0.98]",
      config.width === 4 && "xl:col-span-4",
      config.width === 5 && "xl:col-span-5",
      config.width === 6 && "xl:col-span-6",
      config.width === 7 && "xl:col-span-7",
      config.width === 8 && "xl:col-span-8",
      config.width === 10 && "xl:col-span-10",
      config.width === 12 && "xl:col-span-12",
      !isDesktop && "h-auto min-h-[100px]"
    );
    const wrapperStyle = { 
      minHeight: isDesktop ? `${config.height}px` : (['historicalTrend', 'allocation'].includes(id) ? '280px' : 'auto'), 
      height: isDesktop ? `${config.height}px` : 'auto' 
    };

    switch (id) {
      case 'summary':
        return (
          <div key={id} className={cn(commonClass, "xl:col-span-12")} style={wrapperStyle}>
            {controls}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full items-stretch">
              <Card className="md:col-span-8 lg:col-span-9 modern-card p-4 sm:p-6 relative overflow-hidden bg-white flex flex-col justify-center min-h-[140px]">
                <div className="space-y-2 z-20 relative text-left">
                  <div className="pro-label text-xs sm:text-sm"><Globe className="w-3.5 h-3.5" /> {t.totalValue}</div>
                  <div className="pro-title flex items-center text-2xl sm:text-4xl">
                    <span className="text-slate-200 font-medium text-[0.6em] mr-2">{CURRENCY_SYMBOLS[displayCurrency]}</span>
                    <span>{assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    {loading && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-slate-200 ml-3" />}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1"><Info className="w-3 h-3" /> {t.layoutHint}</div>
                </div>
                <div className="absolute bottom-4 right-4 opacity-5 pointer-events-none"><Wallet className="w-12 h-12 sm:w-20 sm:h-20 text-black" /></div>
              </Card>
              <div className="md:col-span-4 lg:col-span-3 flex items-stretch">
                <Button onClick={() => updateAllData(assets)} disabled={loading} className="w-full h-full bg-slate-900 text-white hover:bg-black font-black flex flex-col items-center justify-center gap-1 rounded-2xl shadow-lg transition-all active:scale-95 py-4 px-6">
                  <div className="flex items-center gap-3"><RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /><span className="text-[12px] tracking-[0.2em] uppercase font-black">{loading ? t.fetching : t.syncMarket}</span></div>
                  {lastUpdated && !loading && (<span className="text-[10px] opacity-60 font-bold uppercase tracking-widest mt-1">{lastUpdated}</span>)}
                </Button>
              </div>
            </div>
          </div>
        );
      case 'controls':
        return (
          <div key={id} className={cn(commonClass, isReordering && "z-[950]")} style={wrapperStyle}>
            {controls}
            <section className="bg-slate-50/80 backdrop-blur-md p-4 border border-slate-100 rounded-2xl flex flex-col md:flex-row items-center gap-3 shadow-sm h-full overflow-hidden">
              <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-3 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                  <Label className="pro-label text-[10px] whitespace-nowrap opacity-60 flex items-center gap-1 shrink-0">{t.baseRange}</Label>
                  <Select value={trackingDays} onValueChange={setTrackingDays}>
                    <SelectTrigger className="w-full sm:w-28 h-8 bg-white font-black text-[11px] rounded-lg border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">{t.days30}</SelectItem>
                      <SelectItem value="90">{t.days90}</SelectItem>
                      <SelectItem value="180">{t.days180}</SelectItem>
                      <SelectItem value="365">{t.days365}</SelectItem>
                      <SelectItem value="max">{t.maxRange}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
                  <Label className="pro-label text-[10px] whitespace-nowrap opacity-60 flex items-center gap-1 shrink-0">{t.interval}</Label>
                  <Select value={interval} onValueChange={setInterval}>
                    <SelectTrigger className="w-full sm:w-24 h-8 bg-white font-black text-[11px] rounded-lg border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1d">{t.int1d}</SelectItem>
                      <SelectItem value="1wk">{t.int1wk}</SelectItem>
                      <SelectItem value="1mo">{t.int1mo}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex-1 flex items-center gap-2 w-full">
                <Button variant="outline" size="sm" onClick={handleExport} className="flex-1 h-8 font-black text-[10px] uppercase gap-1 bg-white border-slate-200 rounded-lg"><Download className="w-3 h-3" /> {t.exportData}</Button>
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="flex-1 h-8 font-black text-[10px] uppercase gap-1 bg-white border-slate-200 rounded-lg"><Upload className="w-3 h-3" /> {t.importData}</Button>
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
      case 'addAsset':
        return (
          <div key={id} className={commonClass} style={wrapperStyle}>
            {controls}
            <Card className="modern-card bg-white h-full flex flex-col overflow-hidden">
              <CardHeader className="px-5 py-3 border-b border-slate-50 shrink-0 flex flex-row items-center justify-between">
                <h3 className="pro-label text-sm"><Plus className="w-4 h-4" /> {t.addAsset}</h3>
                <Button form="add-asset-form" type="submit" size="sm" className="bg-slate-900 hover:bg-black text-white font-black rounded-lg text-[13px] uppercase tracking-widest h-8 px-3">{t.saveChanges}</Button>
              </CardHeader>
              <CardContent className="p-5 flex-1 overflow-auto no-scrollbar">
                <AssetForm language={language} hideSubmit onAdd={(a) => { const newAsset = { ...a, id: crypto.randomUUID() }; setAssets(prev => [...prev, newAsset]); updateAllData([...assets, newAsset]); }} />
              </CardContent>
            </Card>
          </div>
        );
      case 'historicalTrend':
        return (
          <div key={id} className={commonClass} style={wrapperStyle}>
            {controls}
            <HistoricalTrendChart language={language} historicalData={assetCalculations.chartData} displayCurrency={displayCurrency} loading={loading} height={isDesktop ? config.height : 280} />
          </div>
        );
      case 'allocation':
        return (
          <div key={id} className={commonClass} style={wrapperStyle}>
            {controls}
            <AllocationPieChart language={language} allocationData={assetCalculations.allocationData} displayCurrency={displayCurrency} loading={loading} height={isDesktop ? config.height : 280} />
          </div>
        );
      case 'list':
        return (
          <div key={id} className={commonClass} style={wrapperStyle}>
            {controls}
            <Card className="modern-card bg-white h-full flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-50 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <h3 className="pro-label text-sm"><BarChart3 className="w-5 h-5" /> {t.dashboard}</h3>
                <div className="flex items-center gap-2"><Filter className="w-3.5 h-3.5 text-slate-400" /><Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger className="w-[120px] h-8 bg-slate-50 border-slate-200 text-[11px] font-black uppercase rounded-lg"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t.allCategories}</SelectItem>{allCategories.map(cat => (<SelectItem key={cat} value={cat}>{t.categoryNames[cat as keyof typeof t.categoryNames] || cat}</SelectItem>))}</SelectContent></Select></div>
              </div>
              <CardContent className="p-0 flex-1 overflow-hidden relative">
                <Table className="min-w-[1200px] border-separate border-spacing-0" wrapperClassName="h-full overflow-auto no-scrollbar">
                  <TableHeader className="relative z-30">
                    <TableRow className="hover:bg-transparent border-none">
                      <TableHead className="sticky top-0 bg-white/95 backdrop-blur-md px-6 h-12 cursor-pointer border-b border-slate-100 z-30" onClick={() => requestSort('active', 'name')}><div className="flex items-center text-[12px] font-black text-slate-500 uppercase tracking-widest">{t.assetName} <SortIcon config={activeSort} columnKey="name" /></div></TableHead>
                      <TableHead className="sticky top-0 bg-white/95 h-12 cursor-pointer border-b border-slate-100 z-30" onClick={() => requestSort('active', 'category')}><div className="flex items-center text-[12px] font-black text-slate-500 uppercase tracking-widest">{t.category} <SortIcon config={activeSort} columnKey="category" /></div></TableHead>
                      <TableHead className="sticky top-0 bg-white/95 h-12 cursor-pointer border-b border-slate-100 z-30" onClick={() => requestSort('active', 'acquisitionDate')}><div className="flex items-center text-[12px] font-black text-slate-500 uppercase tracking-widest">{t.acqDate} <SortIcon config={activeSort} columnKey="acquisitionDate" /></div></TableHead>
                      <TableHead className="sticky top-0 bg-white/95 h-12 cursor-pointer border-b border-slate-100 z-30" onClick={() => requestSort('active', 'amount')}><div className="flex items-center text-[12px] font-black text-slate-500 uppercase tracking-widest">{t.holdings} <SortIcon config={activeSort} columnKey="amount" /></div></TableHead>
                      <TableHead className="sticky top-0 bg-white/95 h-12 cursor-pointer border-b border-slate-100 z-30 text-right" onClick={() => requestSort('active', 'priceInDisplay')}><div className="flex items-center justify-end text-[12px] font-black text-slate-500 uppercase tracking-widest">{t.unitPrice} <SortIcon config={activeSort} columnKey="priceInDisplay" /></div></TableHead>
                      <TableHead className="sticky top-0 bg-white/95 h-12 cursor-pointer border-b border-slate-100 z-30 text-right" onClick={() => requestSort('active', 'valueInDisplay')}><div className="flex items-center justify-end text-[12px] font-black text-slate-500 uppercase tracking-widest">{t.valuation} <SortIcon config={activeSort} columnKey="valueInDisplay" /></div></TableHead>
                      <TableHead className="sticky top-0 bg-white/95 h-12 cursor-pointer border-b border-slate-100 z-30 text-right" onClick={() => requestSort('active', 'changePercent')}><div className="flex items-center justify-end text-[12px] font-black text-slate-500 uppercase tracking-widest">{t.priceChange} <SortIcon config={activeSort} columnKey="changePercent" /></div></TableHead>
                      <TableHead className="sticky top-0 bg-white/95 w-[60px] border-b border-slate-100 z-30"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedActiveAssets.map((asset: any) => (
                      <TableRow key={asset.id} className="group hover:bg-slate-50/50 border-slate-50">
                        <TableCell className="px-6 py-4">
                          <div className="font-black text-[14px] text-slate-900">{asset.name}</div>
                          <div className="text-[12px] font-black text-slate-400 uppercase tracking-[0.1em] mt-0.5">{asset.symbol || asset.category}</div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] font-black uppercase px-2 py-0.5">{t.categoryNames[asset.category as AssetCategory] || asset.category}</Badge></TableCell>
                        <TableCell><span className="text-[13px] font-black text-slate-500">{asset.acquisitionDate}</span></TableCell>
                        <TableCell><span className="text-[14px] font-black text-slate-700">{formatNumber(asset.amount)}</span></TableCell>
                        <TableCell className="text-right"><div className="font-black text-[13px] text-slate-700"><span className="text-slate-300 text-[10px] mr-1">{CURRENCY_SYMBOLS[displayCurrency]}</span>{asset.priceInDisplay?.toLocaleString(undefined, { maximumFractionDigits: 4 }) || '0'}</div></TableCell>
                        <TableCell className="text-right"><div className="font-black text-base text-slate-900"><span className="text-slate-200 text-[12px] mr-1">{CURRENCY_SYMBOLS[displayCurrency]}</span>{asset.valueInDisplay?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}</div></TableCell>
                        <TableCell className="text-right"><div className={cn("inline-flex items-center gap-1 font-black text-[13px]", (asset.changePercent || 0) > 0 ? "text-emerald-500" : (asset.changePercent || 0) < 0 ? "text-rose-500" : "text-slate-400")}>{(asset.changePercent || 0) > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : (asset.changePercent || 0) < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : null}{(asset.changePercent || 0).toFixed(2)}%</div></TableCell>
                        <TableCell className="pr-6 text-right"><div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingAsset(asset); setEditName(asset.name); setEditAmount(asset.amount); setEditDate(asset.acquisitionDate); setEditEndDate(asset.endDate || ''); setEditCurrency(asset.currency); }}><Edit2 className="w-3.5 h-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-rose-300" onClick={() => { setAssets(prev => prev.filter(a => a.id !== asset.id)); }}><Trash2 className="w-3.5 h-3.5" /></Button></div></TableCell>
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
          <div key={id} className={cn(commonClass, isReordering && "z-[950]")} style={wrapperStyle}>
            {controls}
            <Card className="modern-card bg-white h-full flex flex-col overflow-hidden opacity-80">
              <div className="px-6 py-4 border-b border-slate-50 shrink-0"><h3 className="pro-label text-sm"><History className="w-5 h-5" /> {t.closedPositions}</h3></div>
              <CardContent className="p-0 flex-1 overflow-auto no-scrollbar relative"><Table className="min-w-[800px] border-separate border-spacing-0"><TableBody>{sortedClosedAssets.map((asset: any) => (<TableRow key={asset.id} className="group hover:bg-slate-50/50 border-slate-50"><TableCell className="px-6 py-4"><div className="font-black text-[13px] text-slate-400 line-through">{asset.name}</div><div className="text-[11px] font-black text-slate-300 uppercase tracking-[0.1em] mt-0.5">{asset.symbol || asset.category}</div></TableCell><TableCell><span className="text-[13px] font-black text-slate-400">{formatNumber(asset.amount)}</span></TableCell><TableCell className="text-right pr-6"><div className="font-black text-[12px] text-slate-500">{asset.endDate}</div></TableCell></TableRow>))}</TableBody></Table></CardContent>
            </Card>
          </div>
        );
      case 'ai':
        return (
          <div key={id} className={cn(commonClass, isReordering && "z-[950]")} style={wrapperStyle}>{controls}<AITipCard language={language} assets={assetCalculations.processedAssets} totalTWD={assetCalculations.totalTWD} /></div>
        );
      default: return null;
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-50/30 text-black pb-32 overflow-x-hidden" onMouseDown={handleMouseDown}>
      <header className="fixed top-0 left-0 right-0 border-b border-slate-100 z-[120] bg-white/95 backdrop-blur-3xl shadow-sm h-auto flex flex-col justify-center">
        <div className="max-w-[1900px] mx-auto w-full px-4 sm:px-10 py-2 sm:py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-6">
            <div className="flex items-center gap-6 overflow-hidden">
              <div className="flex items-center gap-2 shrink-0"><div className="w-6 h-6 sm:w-7 sm:h-7 bg-black rounded-lg flex items-center justify-center shrink-0 shadow-md"><Activity className="w-3.5 h-3.5 sm:w-4 h-4 text-white" /></div><h1 className="text-[12px] sm:text-[14px] font-black tracking-tighter uppercase leading-tight whitespace-nowrap">{t.title}</h1></div>
              <div className="hidden md:flex items-center gap-4 overflow-hidden border-l border-slate-100 pl-6 h-6"><div className="flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth">{Object.entries(marketData.rates || {}).map(([cur, rate]) => { const baseRate = marketData.rates?.[displayCurrency] || 1; const relativeRate = (rate as number) / baseRate; return (<div key={cur} className="flex items-center gap-1.5 whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-md"><span className="text-[10px] font-black text-slate-500">{cur}</span><span className="text-[11px] font-black text-emerald-600">{relativeRate.toFixed(3)}</span></div>); })}</div></div>
            </div>
            <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-4"><div className="flex items-center gap-2 shrink-0"><div className="flex bg-slate-100 p-0.5 rounded-md"><Button variant={language === 'zh' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('zh')} className="h-5 sm:h-6 px-1.5 sm:px-2 font-black text-[10px] sm:text-[11px]">繁</Button><Button variant={language === 'en' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('en')} className="h-5 sm:h-6 px-1.5 sm:px-2 font-black text-[10px] sm:text-[11px]">EN</Button></div><Select value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)}><SelectTrigger className="h-6 sm:h-7 w-16 sm:w-20 bg-slate-100 border-none font-black text-[10px] sm:text-[11px]"><SelectValue /></SelectTrigger><SelectContent>{(['TWD', 'USD', 'CNY', 'SGD'] as Currency[]).map(cur => (<SelectItem key={cur} value={cur}>{cur}</SelectItem>))}</SelectContent></Select></div></div>
          </div>
        </div>
      </header>
      <main className="max-w-[1900px] mx-auto px-4 sm:px-10 pt-[110px] md:pt-24 pb-20"><div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8 items-start">{sections.map((id, index) => renderSection(id, index))}</div></main>
      {isReordering && (<div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[2000] animate-fade-in pointer-events-auto"><Button onClick={() => setIsReordering(false)} className="bg-black text-white hover:bg-slate-800 h-14 px-10 rounded-full font-black text-[15px] flex items-center gap-3 shadow-[0_20px_60px_rgba(0,0,0,0.4)] ring-4 ring-white/10 border border-white/20 transition-all active:scale-95"><CheckCircle2 className="w-5 h-5" /> {t.saveLayout}</Button></div>)}
      <Dialog open={!!editingAsset} onOpenChange={(open) => !open && setEditingAsset(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-[480px] bg-white rounded-3xl p-6">
          <DialogHeader><DialogTitle className="text-xl font-black uppercase flex items-center gap-3"><Edit2 className="w-5 h-5 text-primary" /> {t.editAsset}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1"><Label htmlFor="edit-name" className="pro-label text-[10px]">{t.assetName}</Label><Input id="edit-name" value={editName} onFocus={(e) => { const target = e.currentTarget; setTimeout(() => target.select(), 50); }} onChange={(e) => setEditName(e.target.value)} className="h-9 font-black text-sm rounded-lg" /></div>
            <div className="space-y-1"><Label htmlFor="edit-amount" className="pro-label text-[10px]">{t.holdings}</Label><Input id="edit-amount" type="number" step="any" value={editAmount} onFocus={(e) => { const target = e.currentTarget; setTimeout(() => target.select(), 50); }} onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)} className="h-9 font-black text-sm rounded-lg" /></div>
            {editingAsset && (!editingAsset.symbol || editingAsset.symbol.trim() === '') && (<div className="space-y-1"><Label className="pro-label text-[10px]">{t.currency}</Label><Select value={editCurrency} onValueChange={(v) => setEditCurrency(v as Currency)}><SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-[13px] font-bold rounded-lg"><SelectValue /></SelectTrigger><SelectContent>{['TWD', 'USD', 'CNY', 'SGD'].map(c => <SelectItem key={c} value={c} className="text-[13px] font-bold">{c}</SelectItem>)}</SelectContent></Select></div>)}
            <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label className="pro-label text-[10px]">{t.acqDate}</Label><Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-9 font-black text-xs rounded-lg" /></div><div className="space-y-1"><Label className="pro-label text-[10px]">{t.posEndDate}</Label><Input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} className="h-9 font-black text-xs rounded-lg" /></div></div>
          </div>
          <DialogFooter className="flex flex-row gap-3"><Button variant="ghost" onClick={() => { setEditingAsset(null); }} className="h-10 flex-1 font-black uppercase text-xs">{t.cancel}</Button><Button onClick={() => { const updated = assets.map(a => a.id === editingAsset?.id ? { ...a, name: editName, amount: editAmount, acquisitionDate: editDate, endDate: editEndDate || undefined, currency: editCurrency } : a); setAssets(updated); setEditingAsset(null); updateAllData(updated); }} className="bg-black text-white h-10 flex-1 font-black uppercase text-[13px] px-3 shadow-md">{t.saveChanges}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
