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
  Menu
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
    subtitle: 'WABI-SABI WEALTH INTELLIGENCE',
    updateData: 'Sync Market',
    takeSnapshot: 'Archive',
    totalValue: 'Total Portfolio Estimate',
    assetCount: 'Holdings',
    items: 'items',
    addAsset: 'New Asset',
    snapshotHistory: 'Timeline',
    manageHistory: 'Historical records.',
    noSnapshots: 'Empty archive.',
    snapshotDetail: 'Archive Insight',
    snapshotDetailDesc: 'Full portfolio state.',
    assetName: 'Asset',
    marketPrice: 'Price',
    holdings: 'Amount',
    valuation: 'Value',
    fetching: 'Syncing...',
    stockUnit: 'sh',
    dataUpdated: 'Market updated',
    snapshotSaved: 'Success',
    snapshotDeleted: 'Removed',
    dashboard: 'Asset Board',
    valuationChange: 'Change'
  },
  zh: {
    title: 'Asset Insights',
    subtitle: '寂靜美學 · 智慧財富管理',
    updateData: '行情同步',
    takeSnapshot: '存檔',
    totalValue: '總資產估值',
    assetCount: '持有項目',
    items: '個項目',
    addAsset: '新增項目',
    snapshotHistory: '歷史軌跡',
    manageHistory: '資產配置變動。',
    noSnapshots: '尚無存檔。',
    snapshotDetail: '存檔明細',
    snapshotDetailDesc: '此時間點的資產分佈。',
    assetName: '資產名稱',
    marketPrice: '市價',
    holdings: '持有數量',
    valuation: '目前估值',
    fetching: '同步中...',
    stockUnit: '股',
    dataUpdated: '數據已同步',
    snapshotSaved: '存檔成功',
    snapshotDeleted: '存檔已刪除',
    dashboard: '資產儀表板',
    valuationChange: '漲跌幅度'
  }
};

export default function AssetTrackerPage() {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
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

  useEffect(() => {
    setMounted(true);
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
    if (mounted) {
      localStorage.setItem('assets', JSON.stringify(assets));
      localStorage.setItem('snapshots', JSON.stringify(snapshots));
      localStorage.setItem('language', language);
    }
  }, [assets, snapshots, language, mounted]);

  const t = translations[language];

  const updateMarketData = async () => {
    if (!mounted) return;
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
    if (mounted && assets.length > 0) updateMarketData();
  }, [mounted, assets.length]);

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
      let currentPrice = 0; 
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

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#F8F5F2] pb-20 font-body text-slate-800 selection:bg-primary/20">
      <header className="sticky top-0 z-50 w-full glass-panel border-b border-slate-200/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary p-2 rounded-2xl text-white shadow-sm">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight font-headline">{t.title}</h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.1em]">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex bg-slate-200/50 p-1 rounded-xl">
              <Button variant={language === 'zh' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('zh')} className="text-xs h-7 px-3 rounded-lg">繁中</Button>
              <Button variant={language === 'en' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('en')} className="text-xs h-7 px-3 rounded-lg">EN</Button>
            </div>
            <Tabs value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)} className="hidden sm:block">
              <TabsList className="h-9 bg-slate-200/50 rounded-xl">
                <TabsTrigger value="TWD" className="text-xs px-3 rounded-lg">TWD</TabsTrigger>
                <TabsTrigger value="USD" className="text-xs px-3 rounded-lg">USD</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-12 animate-in fade-in duration-1000">
        {/* Zen Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Card className="lg:col-span-8 hero-zen-gradient border-none text-white relative overflow-hidden rounded-[2.5rem] shadow-lg">
             <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
               <Wallet className="h-64 w-64 rotate-12" />
             </div>
             <CardHeader className="relative z-10 pt-12 px-12">
               <div className="flex items-center gap-2 text-white/50 mb-4 text-xs font-bold uppercase tracking-[0.2em]">
                 <LayoutDashboard className="h-4 w-4" />
                 {t.totalValue}
               </div>
               <CardTitle className="text-5xl md:text-7xl font-headline font-bold tracking-tighter">
                 {getCurrencySymbol(displayCurrency)}{assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}
               </CardTitle>
             </CardHeader>
             <CardContent className="relative z-10 px-12 pb-12">
               {lastSnapshot && (
                 <div className={cn(
                   "inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold",
                   assetCalculations.totalDiffTWD >= 0 ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"
                 )}>
                   {assetCalculations.totalDiffTWD >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                   {getCurrencySymbol(displayCurrency)}{Math.abs(assetCalculations.totalDiffDisplay).toLocaleString(undefined, { maximumFractionDigits: 2 })} 
                   <span className="opacity-40 ml-1">({assetCalculations.totalDiffPercent >= 0 ? '+' : ''}{assetCalculations.totalDiffPercent.toFixed(2)}%)</span>
                 </div>
               )}
               <div className="mt-12 flex gap-12 items-center opacity-80">
                 <div className="space-y-1">
                   <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">{t.assetCount}</p>
                   <p className="text-2xl font-bold">{assets.length} <span className="text-xs font-normal opacity-50 ml-1">{t.items}</span></p>
                 </div>
                 <div className="w-px h-10 bg-white/10" />
                 <div className="space-y-1">
                   <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">EXCHANGE USD/TWD</p>
                   <p className="text-2xl font-bold">{marketData.rates.TWD.toFixed(2)}</p>
                 </div>
               </div>
             </CardContent>
          </Card>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <Button 
              onClick={takeSnapshot} 
              className="h-full rounded-[2.5rem] bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 flex flex-col items-center justify-center gap-4 shadow-sm transition-all group"
            >
              <div className="p-4 bg-slate-50 rounded-full group-hover:scale-110 transition-transform">
                <History className="h-8 w-8 text-primary" />
              </div>
              <div className="text-center">
                <span className="block text-xl font-bold">{t.takeSnapshot}</span>
                <span className="text-[10px] opacity-40 font-bold tracking-widest uppercase mt-1">Archive State</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              onClick={updateMarketData} 
              disabled={loading} 
              className="h-20 rounded-[1.5rem] bg-white border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-4 shadow-sm"
            >
              <RefreshCw className={cn("h-5 w-5 text-slate-400", loading && "animate-spin")} />
              <span className="font-bold text-lg">{t.updateData}</span>
            </Button>
          </div>
        </section>

        {/* Dynamic Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <PortfolioCharts 
            language={language}
            allocationData={assetCalculations.allocationData} 
            historicalData={snapshots} 
            displayCurrency={displayCurrency}
            rates={marketData.rates}
          />
        </section>

        {/* Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-4 space-y-10">
            <Card className="wabi-card overflow-hidden">
              <CardHeader className="pb-4 border-b border-slate-50">
                <CardTitle className="text-lg font-bold flex items-center gap-3">
                  <Plus className="h-4 w-4 text-primary" />
                  {t.addAsset}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8">
                <AssetForm language={language} onAdd={(a) => setAssets(prev => [...prev, { ...a, id: crypto.randomUUID() }])} />
              </CardContent>
            </Card>

            <Card className="wabi-card overflow-hidden">
              <CardHeader className="pb-4 border-b border-slate-50">
                <CardTitle className="text-lg font-bold flex items-center gap-3">
                  <History className="h-4 w-4 text-slate-300" />
                  {t.snapshotHistory}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {snapshots.length === 0 ? (
                  <div className="text-center py-16 text-slate-300 text-[10px] font-bold uppercase tracking-widest">{t.noSnapshots}</div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {snapshots.slice().reverse().map(s => (
                      <div key={s.id} className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-slate-100 rounded-xl"><Calendar className="h-4 w-4 text-slate-400" /></div>
                          <div>
                            <div className="text-sm font-bold">{new Date(s.date).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                              {getCurrencySymbol(displayCurrency)} {convertTWDToDisplay(s.totalTWD).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl"><Eye className="h-4 w-4 text-slate-400" /></Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-xl rounded-[2rem]">
                              <DialogHeader>
                                <DialogTitle>{t.snapshotDetail}</DialogTitle>
                                <DialogDescription>{new Date(s.date).toLocaleString()}</DialogDescription>
                              </DialogHeader>
                              <div className="max-h-[60vh] overflow-y-auto pr-2">
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead className="text-[10px] font-bold uppercase tracking-wider">{t.assetName}</TableHead>
                                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right">{t.holdings}</TableHead>
                                      <TableHead className="text-[10px] font-bold uppercase tracking-wider text-right">{t.valuation}</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {s.assets?.map((a, idx) => (
                                      <TableRow key={idx}>
                                        <TableCell className="py-4 text-xs font-bold">{a.name} <span className="opacity-40 ml-1 text-[9px] uppercase">{a.symbol}</span></TableCell>
                                        <TableCell className="text-right text-xs font-mono">{a.amount.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-bold text-xs text-primary">{getCurrencySymbol(displayCurrency)} {convertTWDToDisplay(a.valueInTWD || 0).toLocaleString()}</TableCell>
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
                            className="h-9 w-9 rounded-xl hover:text-red-500" 
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
            <Card className="wabi-card overflow-hidden">
              <CardHeader className="border-b border-slate-50 px-8 py-6">
                <CardTitle className="text-xl font-bold flex items-center gap-3">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  {t.dashboard}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/30 hover:bg-transparent">
                      <TableHead className="px-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.assetName}</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden md:table-cell">{t.marketPrice}</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.holdings}</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">{t.valuationChange}</TableHead>
                      <TableHead className="px-8 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">{t.valuation}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assetCalculations.processedAssets.map(asset => (
                      <TableRow key={asset.id} className="hover:bg-slate-50/30 transition-colors group">
                        <TableCell className="px-8 py-6">
                          <div className="font-bold text-base leading-tight">{asset.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">{asset.symbol}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs font-medium text-slate-500">
                          {(asset.category === 'Stock' || asset.category === 'Crypto') ? (asset.calculatedPrice > 0 ? `${getCurrencySymbol(asset.currency)}${asset.calculatedPrice.toLocaleString()}` : t.fetching) : '--'}
                        </TableCell>
                        <TableCell>
                          {editingId === asset.id ? (
                            <div className="flex items-center gap-2">
                              <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="h-9 w-24 text-xs font-bold" step="any" autoFocus />
                              <Button size="icon" className="h-9 w-9 bg-primary" onClick={() => { setAssets(prev => prev.map(a => a.id === editingId ? { ...a, amount: parseFloat(editAmount) || 0 } : a)); setEditingId(null); }}><Check className="h-4 w-4" /></Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 cursor-pointer group/item" onClick={() => { setEditingId(asset.id); setEditAmount(asset.amount.toString()); }}>
                              <span className="text-sm font-bold text-slate-600 font-mono">{asset.amount.toLocaleString(undefined, { maximumFractionDigits: 5 })}</span>
                              <Edit2 className="h-3 w-3 text-slate-300 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {asset.hasHistory ? (
                            <div className={cn(
                              "text-[10px] font-bold inline-flex flex-col items-end px-3 py-1.5 rounded-xl",
                              asset.diffTWD >= 0 ? "text-emerald-700 bg-emerald-50" : "text-red-700 bg-red-50"
                            )}>
                              <span>{asset.diffTWD >= 0 ? '+' : ''}{getCurrencySymbol(displayCurrency)}{Math.abs(convertTWDToDisplay(asset.diffTWD)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                              <span className="opacity-60">{asset.diffTWD >= 0 ? '+' : ''}{asset.diffPercent.toFixed(2)}%</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 font-bold uppercase">--</span>
                          )}
                        </TableCell>
                        <TableCell className="px-8 text-right">
                          <span className="font-headline font-bold text-xl text-slate-900 tracking-tight">
                            {getCurrencySymbol(displayCurrency)}{asset.valueInDisplay.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {assets.length === 0 && (
                  <div className="py-32 text-center text-slate-300 font-bold text-[10px] uppercase tracking-widest">Quietly waiting for your first asset.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Calm AI Section */}
        <section className="pt-8">
           <AITipCard 
              language={language} 
              assets={assetCalculations.processedAssets.map(a => ({ name: a.name, symbol: a.symbol, category: a.category, amount: a.amount, currency: a.currency, price: a.calculatedPrice, valueInTWD: a.valueInTWD }))}
              totalTWD={assetCalculations.totalTWD}
              marketConditions={`USD/TWD: ${(marketData.rates.TWD || 32.5).toFixed(2)}`} 
            />
        </section>
      </main>

      <footer className="py-20 text-center space-y-4">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.4em] opacity-40">Asset Insights • Zen Wealth Management</p>
        <p className="text-[10px] text-slate-300 italic">Embracing the flow of market change.</p>
      </footer>
    </div>
  );
}