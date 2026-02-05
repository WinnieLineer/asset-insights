'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Asset, Snapshot, MarketData, AssetCategory, Currency } from './lib/types';
import { getMarketData } from '@/app/actions/market';
import { AssetForm } from '@/components/AssetForm';
import { PortfolioCharts } from '@/components/PortfolioCharts';
import { AITipCard } from '@/components/AITipCard';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  History, 
  Trash2, 
  RefreshCw, 
  Edit2, 
  Check, 
  Eye, 
  Calendar,
  Wallet,
  LayoutDashboard,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
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
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

type Language = 'en' | 'zh';

const translations = {
  en: {
    title: 'Asset Insights',
    subtitle: 'MODERN WEALTH TRACKING',
    updateData: 'Sync Market',
    takeSnapshot: 'Archive Snapshot',
    totalValue: 'Net Worth Estimate',
    assetCount: 'Holdings',
    items: 'items',
    addAsset: 'Track New Asset',
    snapshotHistory: 'Timeline',
    manageHistory: 'Historical performance records.',
    noSnapshots: 'No archives yet.',
    snapshotDetail: 'Archive Insight',
    snapshotDetailDesc: 'Full portfolio state at this timestamp.',
    assetName: 'Asset',
    marketPrice: 'Price',
    holdings: 'Amount',
    valuation: 'Value',
    fetching: 'Syncing...',
    stockUnit: 'sh',
    dataUpdated: 'Market synchronized',
    snapshotSaved: 'Snapshot archived successfully',
    snapshotDeleted: 'Archive removed',
    dashboard: 'Asset Dashboard',
    valuationChange: 'Net Gain/Loss'
  },
  zh: {
    title: 'Asset Insights',
    subtitle: '現代化資產管理專家',
    updateData: '同步市場行情',
    takeSnapshot: '儲存目前快照',
    totalValue: '總資產淨值估計',
    assetCount: '目前持有',
    items: '個項目',
    addAsset: '新增資產項目',
    snapshotHistory: '歷史時光機',
    manageHistory: '查看過去的資產配置紀錄。',
    noSnapshots: '尚無歷史紀錄。',
    snapshotDetail: '快照詳細資訊',
    snapshotDetailDesc: '此時間點的詳細資產分佈。',
    assetName: '資產名稱',
    marketPrice: '單價',
    holdings: '數量',
    valuation: '估值',
    fetching: '同步中...',
    stockUnit: '股',
    dataUpdated: '市場數據已更新',
    snapshotSaved: '已成功存檔快照',
    snapshotDeleted: '存檔已刪除',
    dashboard: '資產儀表板',
    valuationChange: '估值漲跌'
  }
};

export default function AssetTrackerPage() {
  const { toast } = useToast();
  const [language, setLanguage] = useState<Language>('zh');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('TWD');
  
  const [marketData, setMarketData] = useState<MarketData>({
    exchangeRate: 32.5,
    rates: { TWD: 32.5, CNY: 7.2, USD: 1 },
    cryptoPrices: {},
    stockPrices: {}
  });
  const [loading, setLoading] = useState(true);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>('');

  const t = translations[language];

  useEffect(() => {
    const savedAssets = localStorage.getItem('assets');
    const savedSnapshots = localStorage.getItem('snapshots');
    const savedLang = localStorage.getItem('language');
    
    if (savedLang) setLanguage(savedLang as Language);
    
    if (savedAssets) setAssets(JSON.parse(savedAssets));
    else setAssets([{ id: 'default-0050', name: '元大台灣50', symbol: '0050', category: 'Stock', amount: 1000, currency: 'TWD' }]);
    
    if (savedSnapshots) setSnapshots(JSON.parse(savedSnapshots));
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('assets', JSON.stringify(assets));
      localStorage.setItem('snapshots', JSON.stringify(snapshots));
      localStorage.setItem('language', language);
    }
  }, [assets, snapshots, language, loading]);

  const updateMarketData = async () => {
    setLoading(true);
    const cryptos = assets.filter(a => a.category === 'Crypto').map(a => a.symbol);
    const stocks = assets.filter(a => a.category === 'Stock').map(a => a.symbol);
    
    try {
      const data = await getMarketData({ cryptos, stocks });
      setMarketData(data);
      toast({ title: t.dataUpdated });
    } catch (error) {
      console.error('Market update failed', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assets.length > 0) updateMarketData();
  }, [assets.length]);

  const lastSnapshot = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
  const getCurrencySymbol = (cur: Currency) => cur === 'USD' ? '$' : cur === 'CNY' ? '¥' : 'NT$';

  const convertTWDToDisplay = (twdVal: number) => {
    const rate = marketData.rates.TWD || 32.5;
    if (displayCurrency === 'USD') return twdVal / rate;
    if (displayCurrency === 'CNY') return twdVal * (marketData.rates.CNY / rate);
    return twdVal;
  };

  const assetCalculations = useMemo(() => {
    let totalTWD = 0;
    const allocationMap: Record<AssetCategory, number> = {
      'Stock': 0, 'Crypto': 0, 'Bank': 0, 'Fixed Deposit': 0, 'Savings': 0,
    };

    const processedAssets = assets.map(asset => {
      let currentPrice = 1; 
      if (asset.category === 'Crypto') currentPrice = marketData.cryptoPrices[asset.symbol.toUpperCase()] || 0;
      else if (asset.category === 'Stock') currentPrice = marketData.stockPrices[asset.symbol.toUpperCase()] || 0;

      let valueInTWD = 0;
      const rate = marketData.rates.TWD || 32.5;
      if (asset.currency === 'USD') {
        const usdValue = (asset.category === 'Stock' || asset.category === 'Crypto') ? asset.amount * currentPrice : asset.amount;
        valueInTWD = usdValue * rate;
      } else if (asset.currency === 'CNY') {
        valueInTWD = asset.amount * (rate / (marketData.rates.CNY || 7.2));
      } else {
        const multiplier = (asset.category === 'Stock' ? (currentPrice || 1) : 1);
        valueInTWD = asset.amount * multiplier;
      }

      totalTWD += valueInTWD;
      allocationMap[asset.category] += valueInTWD;

      const previousAsset = lastSnapshot?.assets?.find(pa => pa.id === asset.id);
      const diffTWD = previousAsset ? valueInTWD - (previousAsset.valueInTWD || 0) : 0;
      const diffPercent = previousAsset && previousAsset.valueInTWD ? (diffTWD / previousAsset.valueInTWD) * 100 : 0;

      return { 
        ...asset, 
        calculatedPrice: currentPrice, 
        valueInTWD, 
        valueInDisplay: convertTWDToDisplay(valueInTWD),
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
      allocationData: Object.entries(allocationMap).filter(([_, v]) => v > 0).map(([name, value]) => ({
        name, value: convertTWDToDisplay(value)
      }))
    };
  }, [assets, marketData, displayCurrency, lastSnapshot]);

  const takeSnapshot = () => {
    const newSnapshot: Snapshot = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      totalTWD: assetCalculations.totalTWD,
      allocations: assetCalculations.processedAssets.map(a => ({ category: a.category, value: a.valueInTWD })),
      assets: assetCalculations.processedAssets.map(a => ({ ...a, price: a.calculatedPrice, valueInTWD: a.valueInTWD }))
    };
    setSnapshots(prev => [...prev, newSnapshot].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    toast({ title: t.snapshotSaved });
  };

  const handleAddAsset = (a: Omit<Asset, 'id'>) => {
    setAssets(prev => [...prev, { ...a, id: crypto.randomUUID() }]);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-body selection:bg-primary/20 animate-in fade-in duration-1000">
      {/* 類 App 毛玻璃導航欄 */}
      <header className="sticky top-0 z-50 w-full glass-panel transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2.5 rounded-2xl shadow-lg shadow-primary/30 animate-float hover:scale-110 transition-transform cursor-pointer">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-headline font-bold text-slate-900 tracking-tight leading-none">{t.title}</h1>
              <p className="text-[9px] text-primary font-bold uppercase tracking-[0.2em] opacity-80 mt-1">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex bg-slate-100/50 p-1 rounded-2xl border border-slate-200">
              <Button variant={language === 'zh' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('zh')} className="text-xs h-8 px-4 rounded-xl font-bold">繁中</Button>
              <Button variant={language === 'en' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('en')} className="text-xs h-8 px-4 rounded-xl font-bold">EN</Button>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <Tabs value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)} className="hidden sm:block">
              <TabsList className="h-10 bg-slate-100/50 rounded-2xl border border-slate-200">
                <TabsTrigger value="TWD" className="text-xs px-4 font-bold rounded-xl data-[state=active]:shadow-md">TWD</TabsTrigger>
                <TabsTrigger value="USD" className="text-xs px-4 font-bold rounded-xl data-[state=active]:shadow-md">USD</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-10 space-y-10">
        {/* 英雄區塊：資產淨值 */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-bottom-10 duration-700">
          <Card className="lg:col-span-8 hero-gradient border-none text-white p-2 overflow-hidden relative group glow-effect">
             <div className="absolute -top-12 -right-12 p-8 opacity-10 transition-transform duration-1000 group-hover:scale-125 group-hover:rotate-12">
               <Sparkles className="h-64 w-64" />
             </div>
             <CardHeader className="relative z-10 pt-10 px-8">
               <div className="flex items-center gap-2 text-white/70 mb-2 text-sm font-bold tracking-wide">
                 <LayoutDashboard className="h-4 w-4" />
                 {t.totalValue}
               </div>
               <CardTitle className="text-5xl md:text-7xl font-headline font-bold tracking-tighter drop-shadow-md">
                 {getCurrencySymbol(displayCurrency)}{assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}
               </CardTitle>
             </CardHeader>
             <CardContent className="relative z-10 px-8 pb-10">
               {lastSnapshot && (
                 <div className={cn(
                   "inline-flex items-center gap-2 px-5 py-2.5 rounded-[1.25rem] text-sm font-bold backdrop-blur-xl border border-white/20 shadow-2xl transition-all hover:scale-105",
                   assetCalculations.totalDiffTWD >= 0 ? "bg-white/20 text-white" : "bg-red-500/30 text-white"
                 )}>
                   {assetCalculations.totalDiffTWD >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                   {getCurrencySymbol(displayCurrency)}{Math.abs(assetCalculations.totalDiffDisplay).toLocaleString(undefined, { maximumFractionDigits: 2 })} 
                   <span className="opacity-80 font-medium ml-1">({assetCalculations.totalDiffPercent >= 0 ? '+' : ''}{assetCalculations.totalDiffPercent.toFixed(2)}%)</span>
                 </div>
               )}
               <div className="mt-10 flex gap-10">
                 <div className="space-y-1">
                   <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">{t.assetCount}</p>
                   <p className="text-2xl font-bold">{assets.length} <span className="text-xs font-normal opacity-60 ml-1">{t.items}</span></p>
                 </div>
                 <div className="w-px h-12 bg-white/10" />
                 <div className="space-y-1">
                   <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold">USD/TWD FX</p>
                   <p className="text-2xl font-bold">{marketData.rates.TWD.toFixed(2)}</p>
                 </div>
               </div>
             </CardContent>
          </Card>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <Button 
              onClick={takeSnapshot} 
              className="h-full rounded-[2.5rem] bg-slate-900 hover:bg-slate-800 text-white flex flex-col items-center justify-center gap-4 transition-all hover:scale-[1.03] active:scale-95 shadow-2xl group"
            >
              <div className="bg-white/10 p-5 rounded-3xl group-hover:bg-primary transition-colors">
                <History className="h-8 w-8 text-white" />
              </div>
              <div className="text-center">
                <span className="block text-xl font-bold">{t.takeSnapshot}</span>
                <span className="text-xs opacity-50 font-medium">Capture current benchmark</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              onClick={updateMarketData} 
              disabled={loading} 
              className="h-28 rounded-[2.5rem] border-slate-200 hover:bg-white hover:border-primary/40 transition-all flex items-center justify-center gap-4 active:scale-95 group"
            >
              <div className={cn("p-3 rounded-2xl bg-slate-50 group-hover:bg-primary/5 transition-colors")}>
                <RefreshCw className={cn("h-6 w-6 text-slate-400 group-hover:text-primary transition-colors", loading && "animate-spin")} />
              </div>
              <span className="font-bold text-lg">{t.updateData}</span>
            </Button>
          </div>
        </section>

        {/* 圖表區塊 */}
        <section className="animate-in slide-in-from-bottom-10 delay-150 duration-700">
          <PortfolioCharts 
            language={language}
            allocationData={assetCalculations.allocationData} 
            historicalData={snapshots} 
            displayCurrency={displayCurrency}
            rates={marketData.rates}
          />
        </section>

        {/* 工作區：管理與儀表板 */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* 左側管理欄 */}
          <div className="xl:col-span-4 space-y-10 animate-in slide-in-from-left-10 duration-700">
            <Card className="neo-card overflow-hidden group">
              <CardHeader className="pb-6 border-b border-slate-50">
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="bg-blue-600/10 p-2.5 rounded-2xl group-hover:bg-blue-600 transition-colors">
                    <Plus className="h-5 w-5 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  {t.addAsset}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8">
                <AssetForm language={language} onAdd={handleAddAsset} />
              </CardContent>
            </Card>

            <Card className="neo-card overflow-hidden group">
              <CardHeader className="pb-4 border-b border-slate-50">
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <div className="bg-purple-600/10 p-2.5 rounded-2xl group-hover:bg-purple-600 transition-colors">
                    <History className="h-5 w-5 text-purple-600 group-hover:text-white transition-colors" />
                  </div>
                  {t.snapshotHistory}
                </CardTitle>
                <CardDescription className="font-medium">{t.manageHistory}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {snapshots.length === 0 ? (
                  <div className="text-center py-20 text-slate-300">
                    <History className="h-16 w-16 mx-auto mb-6 opacity-20 animate-pulse" />
                    <p className="text-sm font-bold tracking-wide">{t.noSnapshots}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {snapshots.slice().reverse().map(s => (
                      <div key={s.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-all group/item cursor-pointer">
                        <div className="flex items-center gap-5">
                          <div className="h-14 w-14 bg-white rounded-[1.5rem] flex items-center justify-center text-slate-400 group-hover/item:text-primary shadow-sm border border-slate-100 transition-all duration-300 group-hover/item:shadow-lg group-hover/item:border-primary/20">
                            <Calendar className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="text-base font-bold text-slate-900">{new Date(s.date).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                            <div className="text-xs text-slate-400 font-mono font-bold mt-0.5">
                              {getCurrencySymbol(displayCurrency)} {convertTWDToDisplay(s.totalTWD).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl hover:bg-white hover:shadow-md transition-all"><Eye className="h-5 w-5" /></Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl rounded-[3rem] border-none shadow-[0_32px_128px_rgba(0,0,0,0.1)] p-8">
                              <DialogHeader>
                                <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                                  <div className="bg-primary/10 p-2.5 rounded-2xl"><Sparkles className="h-6 w-6 text-primary" /></div>
                                  {t.snapshotDetail}
                                </DialogTitle>
                                <DialogDescription className="text-slate-500 font-medium">
                                  {t.snapshotDetailDesc} • {new Date(s.date).toLocaleString()}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="max-h-[50vh] overflow-y-auto pr-4 mt-6 custom-scrollbar">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="border-none bg-slate-50/80 rounded-2xl">
                                      <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400 py-4 px-6">{t.assetName}</TableHead>
                                      <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400 text-right">{t.holdings}</TableHead>
                                      <TableHead className="font-bold text-[10px] uppercase tracking-widest text-slate-400 text-right pr-6">{t.valuation}</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {s.assets?.map((a, idx) => (
                                      <TableRow key={idx} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="px-6 py-5">
                                          <div className="font-bold text-sm text-slate-900">{a.name}</div>
                                          <div className="text-[10px] text-slate-400 uppercase font-mono tracking-widest">{a.symbol}</div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm font-bold text-slate-600">{a.amount.toLocaleString(undefined, { maximumFractionDigits: 5 })}</TableCell>
                                        <TableCell className="text-right font-bold text-primary pr-6">{getCurrencySymbol(displayCurrency)} {convertTWDToDisplay(a.valueInTWD || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-11 w-11 rounded-2xl text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all" 
                            onClick={() => { setSnapshots(prev => prev.filter(snap => snap.id !== s.id)); toast({ title: t.snapshotDeleted }); }}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* 右側儀表板 */}
          <div className="xl:col-span-8 animate-in slide-in-from-right-10 duration-700">
            <Card className="neo-card overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-8 px-8 pt-8">
                <CardTitle className="text-2xl font-bold flex items-center gap-4">
                  <div className="bg-indigo-600/10 p-3 rounded-3xl"><LayoutDashboard className="h-7 w-7 text-indigo-600" /></div>
                  {t.dashboard}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="py-6 px-10 font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400">{t.assetName}</TableHead>
                      <TableHead className="py-6 font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 hidden md:table-cell">{t.marketPrice}</TableHead>
                      <TableHead className="py-6 font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400">{t.holdings}</TableHead>
                      <TableHead className="py-6 font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 text-right">{t.valuationChange}</TableHead>
                      <TableHead className="py-6 px-10 font-bold text-[10px] uppercase tracking-[0.2em] text-slate-400 text-right">{t.valuation} ({displayCurrency})</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assetCalculations.processedAssets.map(asset => (
                      <TableRow key={asset.id} className="group hover:bg-slate-50/60 transition-all border-slate-50 duration-300">
                        <TableCell className="px-10 py-8">
                          <div className="font-bold text-lg text-slate-900 group-hover:text-primary transition-colors duration-300">{asset.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">{asset.symbol}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-xs font-mono font-bold text-slate-500 bg-slate-100/80 px-3 py-1.5 rounded-xl border border-slate-200/50">
                            {(asset.category === 'Stock' || asset.category === 'Crypto') ? (asset.calculatedPrice > 0 ? `${getCurrencySymbol(asset.currency)}${asset.calculatedPrice.toLocaleString()}` : t.fetching) : '--'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {editingId === asset.id ? (
                            <div className="flex items-center gap-3">
                              <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="h-10 w-28 text-sm font-mono font-bold rounded-xl border-primary" step="any" autoFocus />
                              <Button size="icon" className="h-10 w-10 text-white rounded-xl shadow-lg shadow-green-600/20 bg-green-600 hover:bg-green-700" onClick={() => { setAssets(prev => prev.map(a => a.id === editingId ? { ...a, amount: parseFloat(editAmount) || 0 } : a)); setEditingId(null); }}><Check className="h-5 w-5" /></Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 group/amount cursor-pointer" onClick={() => { setEditingId(asset.id); setEditAmount(asset.amount.toString()); }}>
                              <div className="font-mono text-base font-bold text-slate-700 group-hover/amount:text-primary transition-colors">{asset.amount.toLocaleString(undefined, { maximumFractionDigits: 5 })}</div>
                              <div className="p-1.5 rounded-lg bg-slate-50 opacity-0 group-hover/amount:opacity-100 transition-all hover:bg-primary/10">
                                <Edit2 className="h-4 w-4 text-primary" />
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {asset.hasHistory ? (
                            <div className={cn(
                              "text-xs font-bold whitespace-nowrap px-4 py-2 rounded-2xl inline-flex flex-col items-end shadow-sm",
                              asset.diffTWD >= 0 ? "text-green-700 bg-green-50 border border-green-100" : "text-red-700 bg-red-50 border border-red-100"
                            )}>
                              <span className="font-mono">{asset.diffTWD >= 0 ? '+' : ''}{getCurrencySymbol(displayCurrency)}{Math.abs(convertTWDToDisplay(asset.diffTWD)).toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}</span>
                              <span className="text-[10px] opacity-70 mt-1">({asset.diffTWD >= 0 ? '+' : ''}{asset.diffPercent.toFixed(2)}%)</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Initial Data</span>
                          )}
                        </TableCell>
                        <TableCell className="px-10 text-right font-headline font-bold text-xl text-slate-900 group-hover:scale-105 transition-transform origin-right">
                          {getCurrencySymbol(displayCurrency)}{asset.valueInDisplay.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {assets.length === 0 && (
                  <div className="py-32 text-center animate-in zoom-in-95 duration-700">
                    <div className="bg-slate-50 h-28 w-28 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                      <Wallet className="h-12 w-12 text-slate-300" />
                    </div>
                    <p className="text-slate-400 text-lg font-bold">Ready to track your first asset?</p>
                    <Button variant="link" className="text-primary font-bold mt-4 text-base hover:no-underline hover:text-primary/80">Get Started with the form on the left <ChevronRight className="h-5 w-5 ml-1" /></Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI 分析區：寬幅底部佈局 */}
        <section className="pt-12 animate-in slide-in-from-bottom-10 duration-1000">
           <AITipCard 
              language={language} 
              assets={assetCalculations.processedAssets.map(a => ({ name: a.name, symbol: a.symbol, category: a.category, amount: a.amount, currency: a.currency, price: a.calculatedPrice, valueInTWD: a.valueInTWD }))}
              totalTWD={assetCalculations.totalTWD}
              marketConditions={`1 USD = ${(marketData.rates.TWD || 32.5).toFixed(2)} TWD`} 
            />
        </section>
      </main>

      {/* 類 App 底部空間補強 */}
      <footer className="h-20 flex items-center justify-center text-slate-300 text-[10px] font-bold uppercase tracking-[0.3em] opacity-50">
        Asset Insights • Professional Portfolio Advisor
      </footer>
    </div>
  );
}