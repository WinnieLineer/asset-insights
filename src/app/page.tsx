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
    subtitle: 'PROFESSIONAL WEALTH TRACKING',
    updateData: 'Sync Market',
    takeSnapshot: 'Archive Snapshot',
    totalValue: 'Net Worth Estimate',
    assetCount: 'Holdings',
    items: 'items',
    addAsset: 'Track New Asset',
    snapshotHistory: 'Timeline',
    manageHistory: 'Historical records.',
    noSnapshots: 'No archives yet.',
    snapshotDetail: 'Archive Insight',
    snapshotDetailDesc: 'Full portfolio state.',
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
    valuationChange: 'Valuation Change'
  },
  zh: {
    title: 'Asset Insights',
    subtitle: '專業資產管理專家',
    updateData: '同步市場行情',
    takeSnapshot: '儲存目前快照',
    totalValue: '總資產淨值估計',
    assetCount: '目前持有',
    items: '個項目',
    addAsset: '新增資產項目',
    snapshotHistory: '歷史紀錄',
    manageHistory: '資產配置紀錄。',
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
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-body text-slate-900 selection:bg-primary selection:text-white">
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl text-white shadow-lg shadow-primary/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight font-headline">{t.title}</h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-[0.2em]">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex bg-slate-100 p-1 rounded-xl">
              <Button variant={language === 'zh' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('zh')} className="text-xs h-7 px-3 rounded-lg font-bold">繁中</Button>
              <Button variant={language === 'en' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('en')} className="text-xs h-7 px-3 rounded-lg font-bold">EN</Button>
            </div>
            <Tabs value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)} className="hidden sm:block">
              <TabsList className="h-9 bg-slate-100 rounded-xl">
                <TabsTrigger value="TWD" className="text-xs px-3 rounded-lg font-bold">TWD</TabsTrigger>
                <TabsTrigger value="USD" className="text-xs px-3 rounded-lg font-bold">USD</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-10 animate-in fade-in slide-in-from-top-4 duration-700">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Card className="lg:col-span-8 hero-gradient border-none text-white relative overflow-hidden rounded-[2.5rem]">
             <div className="absolute top-0 right-0 p-10 opacity-5">
               <Wallet className="h-56 w-56" />
             </div>
             <CardHeader className="relative z-10 pt-10 px-10">
               <div className="flex items-center gap-2 text-white/50 mb-3 text-xs font-bold tracking-[0.15em] uppercase">
                 <LayoutDashboard className="h-3.5 w-3.5" />
                 {t.totalValue}
               </div>
               <CardTitle className="text-5xl md:text-7xl font-headline font-bold tracking-tighter">
                 {getCurrencySymbol(displayCurrency)}{assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}
               </CardTitle>
             </CardHeader>
             <CardContent className="relative z-10 px-10 pb-10">
               {lastSnapshot && (
                 <div className={cn(
                   "inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold border border-white/10 shadow-lg",
                   assetCalculations.totalDiffTWD >= 0 ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                 )}>
                   {assetCalculations.totalDiffTWD >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                   {getCurrencySymbol(displayCurrency)}{Math.abs(assetCalculations.totalDiffDisplay).toLocaleString(undefined, { maximumFractionDigits: 2 })} 
                   <span className="opacity-60 ml-1">({assetCalculations.totalDiffPercent >= 0 ? '+' : ''}{assetCalculations.totalDiffPercent.toFixed(2)}%)</span>
                 </div>
               )}
               <div className="mt-10 flex gap-10">
                 <div className="space-y-1">
                   <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">{t.assetCount}</p>
                   <p className="text-2xl font-bold font-headline">{assets.length} <span className="text-xs font-normal opacity-40 ml-1 lowercase tracking-normal">{t.items}</span></p>
                 </div>
                 <div className="w-px h-12 bg-white/10" />
                 <div className="space-y-1">
                   <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">USD/TWD</p>
                   <p className="text-2xl font-bold font-headline">{marketData.rates.TWD.toFixed(2)}</p>
                 </div>
               </div>
             </CardContent>
          </Card>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <Button 
              onClick={takeSnapshot} 
              className="h-full rounded-[2.5rem] bg-slate-900 hover:bg-slate-800 text-white flex flex-col items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-slate-200/50 group"
            >
              <History className="h-8 w-8 mb-1 group-hover:rotate-[-10deg] transition-transform" />
              <div className="text-center">
                <span className="block text-xl font-bold">{t.takeSnapshot}</span>
                <span className="text-[10px] opacity-40 font-bold tracking-widest uppercase mt-1">Snapshot archive</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              onClick={updateMarketData} 
              disabled={loading} 
              className="h-24 rounded-[2rem] border-slate-200 hover:border-primary/40 hover:bg-primary/5 flex items-center justify-center gap-4 transition-all shadow-sm group"
            >
              <RefreshCw className={cn("h-6 w-6 text-slate-400 group-hover:text-primary transition-colors", loading && "animate-spin")} />
              <span className="font-bold text-lg tracking-tight">{t.updateData}</span>
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <PortfolioCharts 
            language={language}
            allocationData={assetCalculations.allocationData} 
            historicalData={snapshots} 
            displayCurrency={displayCurrency}
            rates={marketData.rates}
          />
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-4 space-y-10">
            <Card className="neo-card">
              <CardHeader className="pb-4 border-b border-slate-50">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <div className="bg-primary/10 p-1.5 rounded-lg"><Plus className="h-4 w-4 text-primary" /></div>
                  {t.addAsset}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8">
                <AssetForm language={language} onAdd={handleAddAsset} />
              </CardContent>
            </Card>

            <Card className="neo-card">
              <CardHeader className="pb-4 border-b border-slate-50">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <div className="bg-slate-100 p-1.5 rounded-lg"><History className="h-4 w-4 text-slate-400" /></div>
                  {t.snapshotHistory}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {snapshots.length === 0 ? (
                  <div className="text-center py-16 text-slate-300 text-[10px] font-bold uppercase tracking-widest">{t.noSnapshots}</div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {snapshots.slice().reverse().map(s => (
                      <div key={s.id} className="flex items-center justify-between p-5 hover:bg-slate-50/80 transition-colors group">
                        <div className="flex items-center gap-4">
                          <div className="bg-white shadow-sm p-2 rounded-xl group-hover:bg-primary/5 transition-colors">
                            <Calendar className="h-4 w-4 text-slate-400 group-hover:text-primary" />
                          </div>
                          <div>
                            <div className="text-sm font-bold tracking-tight">{new Date(s.date).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            <div className="text-[10px] text-slate-400 font-bold tracking-wider mt-0.5">
                              {getCurrencySymbol(displayCurrency)} {convertTWDToDisplay(s.totalTWD).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white hover:shadow-sm"><Eye className="h-4 w-4" /></Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-xl rounded-[2.5rem] border-none shadow-2xl overflow-hidden p-0">
                              <DialogHeader className="p-8 bg-slate-900 text-white">
                                <DialogTitle className="text-2xl font-bold font-headline">{t.snapshotDetail}</DialogTitle>
                                <DialogDescription className="text-white/50">{new Date(s.date).toLocaleString()}</DialogDescription>
                              </DialogHeader>
                              <div className="max-h-[45vh] overflow-y-auto p-8 pt-4">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="border-none hover:bg-transparent">
                                      <TableHead className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">{t.assetName}</TableHead>
                                      <TableHead className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 text-right">{t.holdings}</TableHead>
                                      <TableHead className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 text-right">{t.valuation}</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {s.assets?.map((a, idx) => (
                                      <TableRow key={idx} className="border-slate-50 hover:bg-slate-50/50">
                                        <TableCell className="py-4">
                                          <div className="font-bold text-xs tracking-tight">{a.name}</div>
                                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{a.symbol}</div>
                                        </TableCell>
                                        <TableCell className="text-right text-xs font-bold text-slate-600">{a.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}</TableCell>
                                        <TableCell className="text-right font-bold text-sm text-primary">{getCurrencySymbol(displayCurrency)} {convertTWDToDisplay(a.valueInTWD || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
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
                            className="h-9 w-9 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50" 
                            onClick={() => { setSnapshots(prev => prev.filter(snap => snap.id !== s.id)); toast({ title: t.snapshotDeleted }); }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="xl:col-span-8">
            <Card className="neo-card overflow-hidden">
              <CardHeader className="border-b border-slate-50 py-8 px-10">
                <CardTitle className="text-xl font-bold flex items-center gap-3 font-headline">
                  <div className="bg-primary/10 p-2 rounded-xl"><LayoutDashboard className="h-5 w-5 text-primary" /></div>
                  {t.dashboard}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-none hover:bg-transparent bg-slate-50/30">
                      <TableHead className="py-5 px-10 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">{t.assetName}</TableHead>
                      <TableHead className="py-5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 hidden md:table-cell">{t.marketPrice}</TableHead>
                      <TableHead className="py-5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">{t.holdings}</TableHead>
                      <TableHead className="py-5 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 text-right">{t.valuationChange}</TableHead>
                      <TableHead className="py-5 px-10 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 text-right">{t.valuation}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assetCalculations.processedAssets.map(asset => (
                      <TableRow key={asset.id} className="hover:bg-slate-50/80 border-slate-50 group">
                        <TableCell className="px-10 py-7">
                          <div className="font-bold text-lg tracking-tight group-hover:text-primary transition-colors">{asset.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{asset.symbol}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                            {(asset.category === 'Stock' || asset.category === 'Crypto') ? (asset.calculatedPrice > 0 ? `${getCurrencySymbol(asset.currency)}${asset.calculatedPrice.toLocaleString()}` : t.fetching) : '--'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {editingId === asset.id ? (
                            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                              <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="h-9 w-28 text-sm font-bold rounded-xl" step="any" autoFocus />
                              <Button size="icon" className="h-9 w-9 rounded-xl bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-100" onClick={() => { setAssets(prev => prev.map(a => a.id === editingId ? { ...a, amount: parseFloat(editAmount) || 0 } : a)); setEditingId(null); }}><Check className="h-4 w-4" /></Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group/edit cursor-pointer" onClick={() => { setEditingId(asset.id); setEditAmount(asset.amount.toString()); }}>
                              <span className="text-base font-bold text-slate-600 tracking-tight">{asset.amount.toLocaleString(undefined, { maximumFractionDigits: 5 })}</span>
                              <Edit2 className="h-3 w-3 text-slate-300 opacity-0 group-hover/edit:opacity-100 transition-all" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {asset.hasHistory ? (
                            <div className={cn(
                              "text-[10px] font-bold inline-flex flex-col items-end px-3 py-1.5 rounded-xl shadow-sm",
                              asset.diffTWD >= 0 ? "text-emerald-700 bg-emerald-50 border border-emerald-100" : "text-red-700 bg-red-50 border border-red-100"
                            )}>
                              <span>{asset.diffTWD >= 0 ? '+' : ''}{getCurrencySymbol(displayCurrency)}{Math.abs(convertTWDToDisplay(asset.diffTWD)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                              <span className="opacity-60 text-[9px]">{asset.diffTWD >= 0 ? '+' : ''}{asset.diffPercent.toFixed(2)}%</span>
                            </div>
                          ) : (
                            <span className="text-[9px] text-slate-300 font-bold uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-lg">Initial</span>
                          )}
                        </TableCell>
                        <TableCell className="px-10 text-right">
                          <span className="font-headline font-bold text-2xl tracking-tighter text-slate-900">
                            {getCurrencySymbol(displayCurrency)}{asset.valueInDisplay.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {assets.length === 0 && (
                  <div className="py-24 text-center text-slate-300 font-bold text-[10px] uppercase tracking-[0.3em]">No assets tracked yet</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Section at Bottom */}
        <section className="pt-10 w-full animate-in fade-in slide-in-from-bottom-6 duration-1000">
           <AITipCard 
              language={language} 
              assets={assetCalculations.processedAssets.map(a => ({ name: a.name, symbol: a.symbol, category: a.category, amount: a.amount, currency: a.currency, price: a.calculatedPrice, valueInTWD: a.valueInTWD }))}
              totalTWD={assetCalculations.totalTWD}
              marketConditions={`1 USD = ${(marketData.rates.TWD || 32.5).toFixed(2)} TWD`} 
            />
        </section>
      </main>

      <footer className="py-16 text-center">
        <div className="text-slate-300 text-[9px] font-bold uppercase tracking-[0.5em] opacity-40">
          Asset Insights • Secure Financial Intelligence • 2024
        </div>
      </footer>
    </div>
  );
}
