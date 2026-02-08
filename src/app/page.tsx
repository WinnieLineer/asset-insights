'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Asset, MarketData, AssetCategory, Currency } from './lib/types';
import { fetchMarketData, fetchHistoricalData } from '@/app/lib/market-api';
import { AssetForm } from '@/components/AssetForm';
import { PortfolioCharts } from '@/components/PortfolioCharts';
import { AITipCard } from '@/components/AITipCard';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  RefreshCw, 
  Trash2, 
  TrendingUp, 
  Globe, 
  Wallet, 
  BarChart3,
  Edit2,
  Loader2,
  Calendar,
  ArrowRightLeft,
  Clock
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
import { Skeleton } from '@/components/ui/skeleton';
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
    addAsset: 'Add New Asset',
    assetName: 'Asset Name',
    holdings: 'Holdings',
    valuation: 'Valuation',
    unitPrice: 'Unit Price',
    dashboard: 'Portfolio Overview',
    change: 'Change (24h)',
    editAsset: 'Edit Holdings',
    cancel: 'Cancel',
    saveChanges: 'Save',
    fetching: 'Syncing...',
    exchangeRate: 'Live Exchange Rates',
    baseDate: 'Tracking Range',
    interval: 'Interval',
    days30: 'Last 30 Days',
    days90: 'Last 90 Days',
    days180: 'Last 6 Months',
    days365: 'Last 1 Year',
    int1d: 'Daily',
    int1wk: 'Weekly',
    int1mo: 'Monthly',
    assetDeleted: 'Asset removed.',
    dataUpdated: 'Market data synced.',
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
    editAsset: '編輯持有數量',
    cancel: '取消',
    saveChanges: '儲存變更',
    fetching: '同步中...',
    exchangeRate: '即時換算匯率',
    baseDate: '資產追蹤區間',
    interval: '數據頻率',
    days30: '過去 30 天',
    days90: '過去 90 天',
    days180: '過去半年',
    days365: '過去一年',
    int1d: '日線 (Daily)',
    int1wk: '週線 (Weekly)',
    int1mo: '月線 (Monthly)',
    assetDeleted: '資產已移除',
    dataUpdated: '市場數據已更新',
  }
};

export default function MonochromeAssetPage() {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState<'en' | 'zh'>('zh');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('TWD');
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [trackingDays, setTrackingDays] = useState<string>("30");
  const [interval, setInterval] = useState<string>("1d");
  const [historicalTimeline, setHistoricalTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  
  const [marketData, setMarketData] = useState<MarketData>({
    exchangeRate: 32.5,
    rates: { TWD: 32.5, CNY: 7.2, USD: 1, SGD: 1.35 },
    cryptoPrices: {},
    stockPrices: {}
  });

  useEffect(() => {
    setMounted(true);
    const savedAssets = localStorage.getItem('assets');
    if (savedAssets) setAssets(JSON.parse(savedAssets));
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('assets', JSON.stringify(assets));
    }
  }, [assets, mounted]);

  const t = translations[language];

  const updateMarketData = async () => {
    if (!mounted || loading) return;
    setLoading(true);
    const cryptos = assets.filter(a => a.category === 'Crypto').map(a => a.symbol);
    const stocks = assets.filter(a => a.category === 'Stock').map(a => a.symbol);
    try {
      const data = await fetchMarketData({ cryptos, stocks });
      setMarketData(data);
      toast({ title: t.dataUpdated });
      fetchHistory();
    } catch (error) {
      toast({ variant: 'destructive', title: 'Sync Error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    if (assets.length === 0) return;
    setHistoryLoading(true);
    try {
      const history = await fetchHistoricalData(assets, parseInt(trackingDays), interval);
      setHistoricalTimeline(history);
    } catch (e) {
      console.error(e);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && assets.length > 0) {
      updateMarketData();
    }
  }, [mounted, assets.length]);

  useEffect(() => {
    if (mounted && assets.length > 0) {
      fetchHistory();
    }
  }, [trackingDays, interval]);

  const getCurrencySymbol = (cur: Currency) => CURRENCY_SYMBOLS[cur] || 'NT$';

  const assetCalculations = useMemo(() => {
    let totalTWD = 0;
    const allocationMap: Record<AssetCategory, number> = {
      'Stock': 0, 'Crypto': 0, 'Bank': 0, 'Savings': 0,
    };
    
    const rateTWD = marketData.rates.TWD || 32.5;

    const processedAssets = assets.map(asset => {
      let currentPrice = 0; 
      const sym = asset.symbol.toUpperCase();
      if (asset.category === 'Crypto') currentPrice = marketData.cryptoPrices[sym] || 0;
      else if (asset.category === 'Stock') currentPrice = marketData.stockPrices[sym] || 0;
      
      const assetCurrencyRate = marketData.rates[asset.currency] || 1;
      let valueInBaseCurrency = asset.amount;
      if (asset.category === 'Stock' || asset.category === 'Crypto') {
        valueInBaseCurrency = asset.amount * (currentPrice || 0);
      }
      
      const valueInTWD = valueInBaseCurrency * (rateTWD / (asset.category === 'Stock' || asset.category === 'Crypto' ? 1 : assetCurrencyRate));
      totalTWD += valueInTWD;
      allocationMap[asset.category] += valueInTWD;
      
      const displayRate = marketData.rates[displayCurrency] || 1;
      let unitPriceInDisplay = 0;
      if (asset.category === 'Stock' || asset.category === 'Crypto') {
        unitPriceInDisplay = currentPrice * (displayRate / 1);
      } else {
        unitPriceInDisplay = 1 * (displayRate / assetCurrencyRate);
      }

      return { 
        ...asset, 
        calculatedPrice: currentPrice, 
        valueInTWD, 
        valueInDisplay: valueInTWD * (displayRate / rateTWD), 
        priceInDisplay: unitPriceInDisplay,
      };
    });

    const chartData = historicalTimeline.map((point: any) => {
      const item: any = {
        date: new Date(point.timestamp * 1000).toISOString(),
        displayDate: new Date(point.timestamp * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      };
      
      let pointTotalTWD = 0;
      const categories: Record<AssetCategory, number> = { 'Stock': 0, 'Crypto': 0, 'Bank': 0, 'Savings': 0 };

      processedAssets.forEach(asset => {
        let priceAtT = point.assets[asset.id];
        if (asset.category === 'Bank' || asset.category === 'Savings') {
          priceAtT = 1;
        }

        if (priceAtT !== undefined) {
          const assetCurrencyRate = marketData.rates[asset.currency] || 1;
          const valueInTWD = (asset.amount * priceAtT) * (rateTWD / (asset.category === 'Bank' || asset.category === 'Savings' ? assetCurrencyRate : 1));
          pointTotalTWD += valueInTWD;
          categories[asset.category] += valueInTWD;
        }
      });

      const displayRate = marketData.rates[displayCurrency] || 1;
      item.totalValue = pointTotalTWD * (displayRate / rateTWD);
      Object.entries(categories).forEach(([cat, val]) => {
        item[cat] = val * (displayRate / rateTWD);
      });

      return item;
    });

    return { 
      processedAssets, 
      totalTWD, 
      totalDisplay: totalTWD * ((marketData.rates[displayCurrency] || 1) / rateTWD), 
      allocationData: Object.entries(allocationMap).filter(([_, v]) => v > 0).map(([name, value]) => ({ 
        name, 
        value: value * ((marketData.rates[displayCurrency] || 1) / rateTWD) 
      })),
      chartData
    };
  }, [assets, marketData, displayCurrency, historicalTimeline]);

  const saveEdit = () => {
    if (!editingAsset) return;
    setAssets(prev => prev.map(a => a.id === editingAsset.id ? { ...a, amount: editAmount } : a));
    setEditingAsset(null);
    toast({ title: t.dataUpdated });
  };

  const dynamicRates = useMemo(() => {
    const base = marketData.rates[displayCurrency] || 1;
    return (['TWD', 'USD', 'CNY', 'SGD'] as Currency[])
      .filter(c => c !== displayCurrency)
      .map(c => ({ 
        code: c, 
        symbol: getCurrencySymbol(c),
        rate: (marketData.rates[c] / base).toFixed(displayCurrency === 'TWD' ? 3 : 2) 
      }));
  }, [displayCurrency, marketData.rates]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white text-black pb-20 font-sans overflow-x-hidden">
      <header className="glass-nav h-auto min-h-20 py-4 border-b border-slate-100">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 lg:w-12 bg-black rounded flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 lg:w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight uppercase">{t.title}</h1>
              <p className="text-[10px] lg:text-[11px] font-bold text-slate-400 tracking-widest uppercase">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto">
            <div className="flex flex-col items-center sm:items-end">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t.exchangeRate}</span>
              <span className="text-[10px] lg:text-xs font-bold text-black flex items-center gap-1.5 whitespace-nowrap bg-slate-50 px-2.5 py-1 rounded border border-slate-100 shadow-sm">
                <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                1 {getCurrencySymbol(displayCurrency)}{displayCurrency} = {dynamicRates.map(r => `${r.symbol}${r.rate} ${r.code}`).join(' | ')}
              </span>
            </div>
            <div className="flex bg-slate-100 p-0.5 rounded">
              <Button variant={language === 'zh' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('zh')} className="h-7 px-2 font-black text-[11px]">繁中</Button>
              <Button variant={language === 'en' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('en')} className="h-7 px-2 font-black text-[11px]">EN</Button>
            </div>
            <Tabs value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)}>
              <TabsList className="h-9 bg-slate-100">
                {(['TWD', 'USD', 'CNY', 'SGD'] as Currency[]).map(cur => (
                  <TabsTrigger key={cur} value={cur} className="text-[10px] font-black uppercase">{cur}</TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>
      
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          <Card className="lg:col-span-8 modern-card p-6 sm:p-10 relative overflow-hidden bg-white shadow-xl">
            <div className="space-y-4 z-20 relative">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-widest">
                <Globe className="w-3.5 h-3.5" />
                {t.totalValue}
              </div>
              <div className="text-4xl sm:text-6xl lg:text-6xl xl:text-7xl font-black tracking-tighter flex items-baseline flex-wrap gap-2">
                <span className="text-slate-300">{getCurrencySymbol(displayCurrency)}</span>
                <span className="break-all">{assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                {loading && <Loader2 className="w-6 h-6 lg:w-8 animate-spin text-slate-200 ml-3" />}
              </div>
            </div>
            <div className="absolute -bottom-10 -right-10 opacity-[0.03] pointer-events-none">
              <Wallet className="w-48 h-48 lg:w-72 lg:h-72 text-black" />
            </div>
          </Card>
          
          <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <Button 
              onClick={updateMarketData} 
              disabled={loading}
              className="w-full h-full min-h-[70px] bg-black text-white hover:bg-slate-800 font-black flex flex-col items-center justify-center gap-2 rounded transition-all shadow-lg active:scale-95"
            >
              <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
              <span className="text-[10px] lg:text-xs tracking-widest uppercase">{loading ? t.fetching : t.syncMarket}</span>
            </Button>
            <div className="bg-slate-50 p-4 border border-slate-100 rounded grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  {t.baseDate}
                </Label>
                <Select value={trackingDays} onValueChange={setTrackingDays}>
                  <SelectTrigger className="h-9 bg-white border-slate-200 font-black text-[11px] uppercase tracking-wider">
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
              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  {t.interval}
                </Label>
                <Select value={interval} onValueChange={setInterval}>
                  <SelectTrigger className="h-9 bg-white border-slate-200 font-black text-[11px] uppercase tracking-wider">
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

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-10">
          <div className="xl:col-span-9 space-y-8">
            <Card className="modern-card overflow-hidden bg-white shadow-lg border-slate-100">
              <CardHeader className="px-6 py-4 border-b border-slate-50">
                <CardTitle className="text-sm lg:text-lg font-black flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 lg:w-5" />
                  {t.dashboard}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="w-full overflow-x-auto">
                  <Table className="min-w-[700px]">
                    <TableHeader className="bg-slate-50/50">
                      <TableRow>
                        <TableHead className="px-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.assetName}</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.holdings}</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.unitPrice}</TableHead>
                        <TableHead className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.valuation}</TableHead>
                        <TableHead className="w-[100px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assetCalculations.processedAssets.map(asset => (
                        <TableRow key={asset.id} className="group hover:bg-slate-50/50 transition-colors border-slate-50">
                          <TableCell className="px-6 py-4">
                            <div className="font-black text-sm lg:text-base">{asset.name}</div>
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{asset.symbol || asset.category}</div>
                          </TableCell>
                          <TableCell><span className="text-xs lg:text-sm font-black">{asset.amount.toLocaleString()}</span></TableCell>
                          <TableCell>
                            {(asset.category === 'Stock' || asset.category === 'Crypto') ? (
                              loading ? <Skeleton className="h-4 w-20" /> : (
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-medium text-slate-400">{getCurrencySymbol(displayCurrency)}</span>
                                  <span className="text-xs lg:text-sm font-black">{asset.priceInDisplay.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                </div>
                              )
                            ) : <span className="text-slate-200">—</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-black text-sm lg:text-lg whitespace-nowrap">
                              <span className="text-slate-300 text-xs mr-1">{getCurrencySymbol(displayCurrency)}</span>
                              {asset.valueInDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-black" onClick={() => { setEditingAsset(asset); setEditAmount(asset.amount); }}><Edit2 className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-rose-600" onClick={() => { setAssets(prev => prev.filter(a => a.id !== asset.id)); toast({ title: t.assetDeleted }); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            <PortfolioCharts 
              language={language} 
              allocationData={assetCalculations.allocationData} 
              historicalData={assetCalculations.chartData} 
              displayCurrency={displayCurrency} 
              rates={marketData.rates} 
              loading={historyLoading}
            />
          </div>
          
          <div className="xl:col-span-3">
            <Card className="modern-card bg-white shadow-lg border-slate-100">
              <CardHeader className="px-6 py-4 border-b border-slate-50">
                <CardTitle className="text-xs lg:text-sm font-black uppercase tracking-widest">{t.addAsset}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <AssetForm language={language} onAdd={(a) => setAssets(prev => [...prev, { ...a, id: crypto.randomUUID() }])} />
              </CardContent>
            </Card>
          </div>
        </div>
        
        <AITipCard 
          language={language} 
          assets={assetCalculations.processedAssets} 
          totalTWD={assetCalculations.totalTWD} 
          marketConditions={loading ? "Syncing" : "Stable"}
        />
      </main>

      <Dialog open={!!editingAsset} onOpenChange={(open) => !open && setEditingAsset(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-[425px] bg-white rounded-lg p-6">
          <DialogHeader><DialogTitle className="text-lg font-black uppercase tracking-tight">{t.editAsset}</DialogTitle></DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.assetName}</Label>
              <div className="p-3 bg-slate-50 rounded font-black text-sm">{editingAsset?.name} ({editingAsset?.symbol || '—'})</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.holdings}</Label>
              <Input id="amount" type="number" value={editAmount} onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)} className="h-12 font-black bg-slate-50 border-slate-100" />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3">
            <Button variant="ghost" onClick={() => setEditingAsset(null)} className="font-black text-[11px] uppercase tracking-widest h-11 flex-1">{t.cancel}</Button>
            <Button onClick={saveEdit} className="bg-black text-white hover:bg-slate-800 font-black text-[11px] uppercase tracking-widest h-11 flex-1 shadow-md">{t.saveChanges}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
