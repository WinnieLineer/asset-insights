
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Asset, Snapshot, MarketData, AssetCategory, Currency } from './lib/types';
import { fetchMarketData } from '@/app/lib/market-api';
import { AssetForm } from '@/components/AssetForm';
import { PortfolioCharts } from '@/components/PortfolioCharts';
import { AITipCard } from '@/components/AITipCard';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Plus, 
  RefreshCw, 
  Clock, 
  Trash2, 
  TrendingUp, 
  TrendingDown, 
  Globe, 
  Wallet, 
  BarChart3,
  Edit2,
  Loader2,
  DollarSign,
  History,
  Eye,
  Tag
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

type Language = 'en' | 'zh';

const translations = {
  en: {
    title: 'Asset Insights Pro',
    subtitle: 'MONOCHROME PORTFOLIO',
    updateData: 'Sync Market',
    takeSnapshot: 'Snapshot',
    totalValue: 'Total Portfolio Value',
    assetCount: 'Total Assets',
    addAsset: 'Add New Asset',
    assetName: 'Asset Name',
    marketPrice: 'Current Price',
    holdings: 'Holdings',
    valuation: 'Valuation',
    unitPrice: 'Unit Price',
    dataUpdated: 'Market data synced.',
    snapshotSaved: 'Snapshot archived.',
    dashboard: 'Portfolio Overview',
    change: 'Change',
    assetDeleted: 'Asset removed.',
    editAsset: 'Edit Holdings',
    cancel: 'Cancel',
    saveChanges: 'Save',
    fetching: 'Syncing...',
    exchangeRate: 'Real-time Rate',
    history: 'History',
    viewDetail: 'View',
    deleteSnapshot: 'Delete',
    noHistory: 'No history records.',
    snapshotDetail: 'Snapshot Details',
    snapshotDate: 'Date',
    details: 'Holdings at the time',
    historicalPrice: 'Historical Price'
  },
  zh: {
    title: 'Asset Insights Pro',
    subtitle: '專業資產追蹤系統',
    updateData: '同步最新市場數據',
    takeSnapshot: '建立當前快照',
    totalValue: '投資組合總淨值',
    assetCount: '資產總部位數',
    addAsset: '新增資產部位',
    assetName: '資產名稱',
    marketPrice: '當前市場價值',
    holdings: '持有數量',
    valuation: '帳面價值',
    unitPrice: '單位市場價值',
    dataUpdated: '市場數據已更新',
    snapshotSaved: '快照已存入紀錄',
    dashboard: '投資組合概覽與分析',
    change: '昨日漲跌',
    assetDeleted: '資產已移除',
    editAsset: '編輯持有數量',
    cancel: '取消',
    saveChanges: '儲存變更',
    fetching: '同步中...',
    exchangeRate: '即時基準匯率',
    history: '資產歷史紀錄',
    viewDetail: '檢視詳情',
    deleteSnapshot: '刪除',
    noHistory: '目前尚無快照紀錄',
    snapshotDetail: '快照詳細數據',
    snapshotDate: '快照日期',
    details: '當時持倉明細',
    historicalPrice: '當時單位市價'
  }
};

export default function MonochromeAssetPage() {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState<Language>('zh');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('TWD');
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  const [marketData, setMarketData] = useState<MarketData>({
    exchangeRate: 32.5,
    rates: { TWD: 32.5, CNY: 7.2, USD: 1, SGD: 1.35 },
    cryptoPrices: {},
    stockPrices: {}
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedAssets = localStorage.getItem('assets');
    const savedSnapshots = localStorage.getItem('snapshots');
    if (savedAssets) setAssets(JSON.parse(savedAssets));
    if (savedSnapshots) setSnapshots(JSON.parse(savedSnapshots));
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('assets', JSON.stringify(assets));
      localStorage.setItem('snapshots', JSON.stringify(snapshots));
    }
  }, [assets, snapshots, mounted]);

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
    } catch (error) {
      toast({ variant: 'destructive', title: 'Sync Error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && assets.length > 0) updateMarketData();
  }, [mounted, assets.length]);

  const lastSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  
  const getCurrencySymbol = (cur: Currency) => {
    switch(cur) {
      case 'USD': return '$';
      case 'CNY': return '¥';
      case 'SGD': return 'S$';
      default: return 'NT$';
    }
  };

  const convertTWDToDisplay = (twdVal: number, ratesObj = marketData.rates) => {
    const rate = ratesObj.TWD || 32.5;
    if (displayCurrency === 'USD') return twdVal / rate;
    if (displayCurrency === 'CNY') return twdVal * (ratesObj.CNY / rate);
    if (displayCurrency === 'SGD') return twdVal * (ratesObj.SGD / rate);
    return twdVal;
  };

  const assetCalculations = useMemo(() => {
    let totalTWD = 0;
    const allocationMap: Record<AssetCategory, number> = {
      'Stock': 0, 'Crypto': 0, 'Bank': 0, 'Fixed Deposit': 0, 'Savings': 0,
    };
    const processedAssets = assets.map(asset => {
      let currentPrice = 0; 
      const sym = asset.symbol.toUpperCase();
      if (asset.category === 'Crypto') currentPrice = marketData.cryptoPrices[sym] || 0;
      else if (asset.category === 'Stock') currentPrice = marketData.stockPrices[sym] || 0;
      
      let valueInTWD = 0;
      const rateTWD = marketData.rates.TWD || 32.5;
      
      if (asset.currency === 'USD') {
        const usdValue = (asset.category === 'Stock' || asset.category === 'Crypto') ? asset.amount * currentPrice : asset.amount;
        valueInTWD = usdValue * rateTWD;
      } else if (asset.currency === 'CNY') {
        valueInTWD = asset.amount * (rateTWD / (marketData.rates.CNY || 7.2));
      } else if (asset.currency === 'SGD') {
        valueInTWD = asset.amount * (rateTWD / (marketData.rates.SGD || 1.35));
      } else {
        const multiplier = (asset.category === 'Stock' || asset.category === 'Crypto' ? currentPrice : 1);
        valueInTWD = asset.amount * (multiplier || 1);
      }
      
      totalTWD += valueInTWD;
      allocationMap[asset.category] += valueInTWD;
      
      const previousAsset = lastSnapshot?.assets?.find(pa => pa.id === asset.id);
      const diffTWD = previousAsset ? valueInTWD - (previousAsset.valueInTWD || 0) : 0;
      const diffPercent = previousAsset && previousAsset.valueInTWD ? (diffTWD / previousAsset.valueInTWD) * 100 : 0;
      
      let unitPriceInDisplay = 0;
      if (asset.category === 'Stock' || asset.category === 'Crypto') {
        // unit price is in asset's native currency (USD for crypto/US stocks, TWD for TW stocks, SGD for SI stocks)
        let unitValTWD = 0;
        if (asset.category === 'Crypto' || asset.currency === 'USD') unitValTWD = currentPrice * rateTWD;
        else if (asset.currency === 'SGD') unitValTWD = currentPrice * (rateTWD / (marketData.rates.SGD || 1.35));
        else unitValTWD = currentPrice;

        unitPriceInDisplay = convertTWDToDisplay(unitValTWD);
      } else {
        let unitValTWD = 1;
        if (asset.currency === 'USD') unitValTWD = rateTWD;
        else if (asset.currency === 'CNY') unitValTWD = (rateTWD / marketData.rates.CNY);
        else if (asset.currency === 'SGD') unitValTWD = (rateTWD / marketData.rates.SGD);
        unitPriceInDisplay = convertTWDToDisplay(unitValTWD);
      }

      return { 
        ...asset, 
        calculatedPrice: currentPrice, 
        valueInTWD, 
        valueInDisplay: convertTWDToDisplay(valueInTWD), 
        priceInDisplay: unitPriceInDisplay,
        diffTWD, 
        diffPercent, 
        hasHistory: !!previousAsset 
      };
    });

    const totalDiffTWD = lastSnapshot ? totalTWD - lastSnapshot.totalTWD : 0;
    const totalDiffPercent = lastSnapshot && lastSnapshot.totalTWD ? (totalDiffTWD / lastSnapshot.totalTWD) * 100 : 0;

    return { 
      processedAssets, 
      totalTWD, 
      totalDiffTWD, 
      totalDiffPercent, 
      totalDisplay: convertTWDToDisplay(totalTWD), 
      totalDiffDisplay: convertTWDToDisplay(totalDiffTWD),
      allocationData: Object.entries(allocationMap).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value: convertTWDToDisplay(value) })) 
    };
  }, [assets, marketData, displayCurrency, lastSnapshot]);

  const takeSnapshot = () => {
    const newSnapshot: Snapshot = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      totalTWD: assetCalculations.totalTWD,
      allocations: assetCalculations.processedAssets.map(a => ({ category: a.category, value: a.valueInTWD })),
      assets: assetCalculations.processedAssets.map(a => ({ 
        ...a, 
        price: (a.category === 'Stock' || a.category === 'Crypto') ? a.priceInDisplay : undefined, 
        valueInTWD: a.valueInTWD 
      }))
    };
    setSnapshots(prev => [...prev, newSnapshot]);
    toast({ title: t.snapshotSaved });
  };

  const deleteSnapshot = (id: string) => {
    setSnapshots(prev => prev.filter(s => s.id !== id));
  };

  const startEditing = (asset: Asset) => {
    setEditingAsset(asset);
    setEditAmount(asset.amount);
  };

  const saveEdit = () => {
    if (!editingAsset) return;
    setAssets(prev => prev.map(a => a.id === editingAsset.id ? { ...a, amount: editAmount } : a));
    setEditingAsset(null);
    toast({ title: t.dataUpdated });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white text-black pb-20 font-sans overflow-x-hidden">
      <header className="glass-nav h-auto min-h-20 py-4 border-b border-slate-100">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 h-full flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 lg:w-12 bg-black rounded flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5 lg:w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight truncate">{t.title}</h1>
              <p className="text-[10px] lg:text-[11px] font-bold text-slate-400 tracking-widest uppercase truncate">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-6 w-full sm:w-auto">
            <div className="flex flex-col items-center sm:items-end">
              <span className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-widest">{t.exchangeRate}</span>
              <span className="text-xs lg:text-sm font-bold text-black flex items-center gap-1.5 whitespace-nowrap">
                <DollarSign className="w-3 h-3 lg:w-4 lg:h-4" />
                1 USD = {marketData.exchangeRate.toFixed(2)} TWD
              </span>
            </div>
            <div className="flex bg-slate-100 p-0.5 sm:p-1 rounded shrink-0">
              <Button variant={language === 'zh' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('zh')} className="h-7 lg:h-8 px-2 sm:px-3 text-[11px] lg:text-sm font-bold">繁中</Button>
              <Button variant={language === 'en' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('en')} className="h-7 lg:h-8 px-2 sm:px-3 text-[11px] lg:text-sm font-bold">EN</Button>
            </div>
            <Tabs value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)}>
              <TabsList className="h-8 sm:h-9 lg:h-10 bg-slate-100">
                <TabsTrigger value="TWD" className="text-[10px] sm:text-[11px] lg:text-xs px-2 sm:px-3 font-bold uppercase">TWD</TabsTrigger>
                <TabsTrigger value="USD" className="text-[10px] sm:text-[11px] lg:text-xs px-2 sm:px-3 font-bold uppercase">USD</TabsTrigger>
                <TabsTrigger value="SGD" className="text-[10px] sm:text-[11px] lg:text-xs px-2 sm:px-3 font-bold uppercase">SGD</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>
      
      <main className="max-w-[1440px] mx-auto px-2 sm:px-6 py-6 sm:py-8 lg:py-10 space-y-6 sm:space-y-8 lg:space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          <Card className="lg:col-span-8 xl:col-span-9 modern-card p-6 sm:p-8 lg:p-10 relative overflow-hidden">
            <div className="space-y-3 sm:space-y-4 z-20 relative">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] sm:text-[11px] lg:text-sm font-bold uppercase tracking-widest">
                <Globe className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                {t.totalValue}
              </div>
              <div className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tighter flex items-baseline flex-wrap gap-2">
                <span className="shrink-0">{getCurrencySymbol(displayCurrency)}</span>
                <span className="break-all">{assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                {loading && <Loader2 className="w-5 h-5 lg:w-8 lg:h-8 animate-spin text-slate-300 ml-2" />}
              </div>
              {lastSnapshot && !loading && (
                <div className={cn("inline-flex items-center gap-1.5 py-1 px-2.5 lg:px-4 rounded text-[11px] sm:text-xs lg:text-sm font-bold border", assetCalculations.totalDiffTWD >= 0 ? "text-emerald-600 bg-emerald-50 border-emerald-100" : "text-rose-600 bg-rose-50 border-rose-100")}>
                  {assetCalculations.totalDiffTWD >= 0 ? <TrendingUp className="w-3.5 h-3.5 lg:w-4 lg:h-4" /> : <TrendingDown className="w-3.5 h-3.5 lg:w-4 lg:h-4" />}
                  {getCurrencySymbol(displayCurrency)}{Math.abs(assetCalculations.totalDiffDisplay).toLocaleString()} 
                  <span className="opacity-70">({assetCalculations.totalDiffPercent >= 0 ? '+' : ''}{assetCalculations.totalDiffPercent.toFixed(2)}%)</span>
                </div>
              )}
            </div>
            <div className="absolute -bottom-10 -right-10 opacity-[0.03] pointer-events-none z-10">
              <Wallet className="w-48 h-48 sm:w-64 sm:h-64 lg:w-72 lg:h-72 text-black" />
            </div>
          </Card>
          
          <div className="lg:col-span-4 xl:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
            <Button 
              onClick={updateMarketData} 
              disabled={loading}
              className="w-full min-h-[60px] lg:min-h-[70px] lg:h-full bg-slate-100 text-black hover:bg-slate-200 font-bold flex flex-row sm:flex-col items-center justify-center gap-3 rounded transition-all border border-slate-200 shadow-sm px-4"
            >
              <RefreshCw className={cn("w-5 h-5 lg:w-6 lg:h-6", loading && "animate-spin")} />
              <span className="text-[11px] sm:text-xs lg:text-sm tracking-widest uppercase">{loading ? t.fetching : t.updateData}</span>
            </Button>
            <div className="grid grid-cols-2 gap-4 h-full">
              <Button onClick={takeSnapshot} className="h-full bg-black text-white hover:bg-slate-800 font-bold flex flex-col items-center justify-center gap-2 rounded transition-all min-h-[60px] lg:min-h-[70px]">
                <Clock className="w-5 h-5 lg:w-6 lg:h-6" />
                <span className="text-[10px] sm:text-[11px] lg:text-xs tracking-widest uppercase">{t.takeSnapshot}</span>
              </Button>
              <Button variant="outline" onClick={() => setShowHistory(true)} className="h-full font-bold flex flex-col items-center justify-center gap-2 rounded transition-all border-slate-200 min-h-[60px] lg:min-h-[70px]">
                <History className="w-5 h-5 lg:w-6 lg:h-6" />
                <span className="text-[10px] sm:text-[11px] lg:text-xs tracking-widest uppercase">{t.history}</span>
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8">
          <div className="xl:col-span-9 space-y-6 sm:space-y-8">
            <Card className="modern-card overflow-hidden">
              <CardHeader className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-b border-slate-50 bg-white">
                <CardTitle className="text-sm lg:text-lg font-bold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 lg:w-5 lg:h-5" />
                  {t.dashboard}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 bg-white">
                <div className="w-full overflow-x-auto">
                  <Table className="min-w-[700px] w-full">
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead className="px-4 sm:px-6 lg:px-8 text-[11px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">{t.assetName}</TableHead>
                        <TableHead className="text-[11px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">{t.holdings}</TableHead>
                        <TableHead className="text-[11px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">{t.unitPrice}</TableHead>
                        <TableHead className="text-[11px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">{t.change}</TableHead>
                        <TableHead className="text-[11px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest text-right">{t.valuation}</TableHead>
                        <TableHead className="w-[80px] sm:w-[100px] text-center"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assetCalculations.processedAssets.map(asset => (
                        <TableRow key={asset.id} className="group hover:bg-slate-50/50">
                          <TableCell className="px-4 sm:px-6 lg:px-8 py-4 lg:py-5">
                            <div className="font-bold text-sm lg:text-base truncate max-w-[150px] sm:max-w-none">{asset.name}</div>
                            <div className="text-[10px] lg:text-[11px] text-slate-400 font-bold uppercase tracking-widest truncate">{asset.symbol}</div>
                          </TableCell>
                          <TableCell><span className="text-xs sm:text-sm lg:text-base font-bold">{asset.amount.toLocaleString()}</span></TableCell>
                          <TableCell>
                            {(asset.category === 'Stock' || asset.category === 'Crypto') ? (
                              loading ? (
                                <Skeleton className="h-4 w-16 sm:w-24 lg:w-28" />
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] lg:text-xs font-medium text-slate-500">{getCurrencySymbol(displayCurrency)}</span>
                                  <span className="text-xs sm:text-sm lg:text-base font-bold">{asset.priceInDisplay.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                                </div>
                              )
                            ) : (
                              <span className="text-xs text-slate-300">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {!loading && asset.hasHistory ? (
                              <div className={cn("text-[11px] sm:text-xs lg:text-sm font-bold", asset.diffTWD >= 0 ? "text-emerald-600" : "text-rose-600")}>
                                {asset.diffTWD >= 0 ? '+' : ''}{asset.diffPercent.toFixed(2)}%
                              </div>
                            ) : <span className="text-[10px] sm:text-[11px] lg:text-xs text-slate-300 font-bold uppercase tracking-widest">{loading ? '...' : 'Initial'}</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            {loading && (asset.category === 'Stock' || asset.category === 'Crypto') ? (
                              <Skeleton className="ml-auto h-5 sm:h-7 w-24 sm:w-32" />
                            ) : (
                              <span className="font-bold text-sm sm:text-base lg:text-lg xl:text-lg whitespace-nowrap">{getCurrencySymbol(displayCurrency)}{asset.valueInDisplay.toLocaleString()}</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-center gap-1 sm:gap-2">
                              <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-slate-400 hover:text-black" onClick={() => startEditing(asset)}><Edit2 className="w-3.5 h-3.5" /></Button>
                              <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-slate-300 hover:text-rose-600" onClick={() => { setAssets(prev => prev.filter(a => a.id !== asset.id)); toast({ title: t.assetDeleted }); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            <PortfolioCharts language={language} allocationData={assetCalculations.allocationData} historicalData={snapshots} displayCurrency={displayCurrency} rates={marketData.rates} />
          </div>
          <div className="xl:col-span-3 space-y-6 sm:space-y-8">
            <Card className="modern-card">
              <CardHeader className="px-6 sm:px-8 py-4 sm:py-5 border-b border-slate-50">
                <CardTitle className="text-sm lg:text-base font-black flex items-center gap-2">
                  <Plus className="w-4 h-4 lg:w-5 lg:h-5" />
                  {t.addAsset}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <AssetForm language={language} onAdd={(a) => setAssets(prev => [...prev, { ...a, id: crypto.randomUUID() }])} />
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="w-full">
          <AITipCard 
            language={language} 
            assets={assetCalculations.processedAssets} 
            totalTWD={assetCalculations.totalTWD} 
            marketConditions={loading ? "Syncing" : "Stable"}
          />
        </div>
      </main>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl lg:max-w-3xl bg-white max-h-[90vh] flex flex-col p-0 overflow-hidden rounded-lg">
          <DialogHeader className="p-6 sm:p-8 border-b">
            <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter flex items-center gap-3">
              <History className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8" />
              {t.history}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-4 sm:p-6 bg-slate-50/50">
            <ScrollArea className="h-full pr-2 sm:pr-4">
              {snapshots.length === 0 ? (
                <div className="py-16 sm:py-24 text-center opacity-30 flex flex-col items-center gap-4">
                  <Activity className="w-10 h-10 sm:w-12 sm:h-12" />
                  <p className="text-[11px] sm:text-xs lg:text-sm font-bold uppercase tracking-widest">{t.noHistory}</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {[...snapshots].reverse().map(snapshot => (
                    <Card key={snapshot.id} className="border-slate-100 hover:border-black transition-all cursor-default group bg-white">
                      <div className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1">
                          <div className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date(snapshot.date).toLocaleString()}</div>
                          <div className="text-lg sm:text-xl lg:text-2xl font-black tracking-tight">{getCurrencySymbol(displayCurrency)}{convertTWDToDisplay(snapshot.totalTWD).toLocaleString()}</div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                          <Button variant="ghost" size="sm" className="h-8 sm:h-9 lg:h-10 px-3 sm:px-4 lg:px-6 font-bold text-[10px] lg:text-xs uppercase tracking-widest border border-slate-200" onClick={() => setSelectedSnapshot(snapshot)}>
                            <Eye className="w-3.5 h-3.5 mr-1.5 sm:mr-2" />
                            {t.viewDetail}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 lg:h-10 lg:w-10 text-slate-300 hover:text-rose-600 hover:bg-rose-50" onClick={() => deleteSnapshot(snapshot.id)}>
                            <Trash2 className="w-4 h-4 lg:w-5 lg:h-5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Snapshot Detail Dialog */}
      <Dialog open={!!selectedSnapshot} onOpenChange={(open) => !open && setSelectedSnapshot(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl lg:max-w-4xl bg-white max-h-[95vh] sm:max-h-[90vh] flex flex-col p-0 rounded-lg">
          <DialogHeader className="p-6 sm:p-8 border-b">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <DialogTitle className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tighter">{t.snapshotDetail}</DialogTitle>
                <div className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">{t.snapshotDate}: {selectedSnapshot && new Date(selectedSnapshot.date).toLocaleString()}</div>
              </div>
              {selectedSnapshot && (
                <div className="text-left sm:text-right">
                  <div className="text-[10px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest">{t.totalValue}</div>
                  <div className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tighter">{getCurrencySymbol(displayCurrency)}{convertTWDToDisplay(selectedSnapshot.totalTWD).toLocaleString()}</div>
                </div>
              )}
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-[50vh] sm:h-[60vh] lg:h-[65vh]">
              <div className="p-4 sm:p-8">
                <h4 className="text-[10px] lg:text-sm font-black text-black uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-2">
                  <div className="w-2 h-2 bg-black rounded-full" />
                  {t.details}
                </h4>
                <div className="space-y-3 lg:space-y-4">
                  {selectedSnapshot?.assets?.map(asset => (
                    <div key={asset.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 lg:p-6 bg-slate-50 border border-slate-100 rounded gap-4 group hover:bg-white hover:border-black transition-all">
                      <div className="flex items-center gap-3 sm:gap-4 lg:gap-6 w-full sm:w-auto">
                        <Badge variant="outline" className="h-5 lg:h-6 px-2 lg:px-3 bg-white text-[10px] font-black uppercase tracking-tighter shrink-0">{asset.category}</Badge>
                        <div className="min-w-0">
                          <div className="text-xs sm:text-sm lg:text-base font-bold truncate">{asset.name}</div>
                          <div className="text-[10px] lg:text-[11px] font-bold text-slate-400 uppercase tracking-widest truncate">{asset.symbol}</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-10 lg:gap-14 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                        {asset.price !== undefined && (
                          <div className="text-left sm:text-right">
                            <div className="text-[9px] lg:text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                              <Tag className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
                              {t.historicalPrice}
                            </div>
                            <div className="text-xs lg:text-sm font-bold whitespace-nowrap">
                              {getCurrencySymbol(displayCurrency)}
                              {asset.price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        )}
                        <div className="text-right min-w-[80px] sm:min-w-[100px] lg:min-w-[120px]">
                          <div className="text-xs sm:text-sm lg:text-base font-bold">{getCurrencySymbol(displayCurrency)}{convertTWDToDisplay(asset.valueInTWD || 0).toLocaleString()}</div>
                          <div className="text-[10px] lg:text-xs font-bold text-slate-400">{asset.amount} units</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollArea>
          </div>
          <DialogFooter className="p-4 sm:p-6 border-t bg-slate-50/50">
            <Button className="w-full sm:w-auto bg-black text-white hover:bg-slate-800 font-bold text-[11px] lg:text-xs uppercase tracking-widest px-8 lg:px-12 h-10 lg:h-12" onClick={() => setSelectedSnapshot(null)}>{t.cancel}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingAsset} onOpenChange={(open) => !open && setEditingAsset(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-[425px] bg-white rounded-lg">
          <DialogHeader><DialogTitle className="text-lg sm:text-xl font-bold">{t.editAsset}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest">{t.assetName}</Label>
              <div className="text-xs sm:text-sm lg:text-base font-bold p-3 bg-slate-50 rounded truncate">{editingAsset?.name} ({editingAsset?.symbol})</div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-[10px] lg:text-xs font-bold text-slate-500 uppercase tracking-widest">{t.holdings}</Label>
              <Input id="amount" type="number" value={editAmount} onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)} className="bg-slate-50 font-bold h-10 lg:h-12 lg:text-base" />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button variant="ghost" onClick={() => setEditingAsset(null)} className="font-bold text-[11px] lg:text-xs uppercase tracking-widest h-10 lg:h-12 order-2 sm:order-1">{t.cancel}</Button>
            <Button onClick={saveEdit} className="bg-black text-white hover:bg-slate-800 font-bold text-[11px] lg:text-xs uppercase tracking-widest h-10 lg:h-12 order-1 sm:order-2">{t.saveChanges}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
