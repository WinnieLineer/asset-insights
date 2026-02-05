
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
  ChevronRight
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter
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
    <div className="min-h-screen bg-[#F8FAFC] pb-12 font-body">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 w-full glass-panel">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2.5 rounded-2xl shadow-lg shadow-primary/20 animate-float">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-headline font-bold text-slate-900 tracking-tight">{t.title}</h1>
              <p className="text-[10px] text-primary font-bold uppercase tracking-[0.2em] opacity-80">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex bg-slate-100/80 p-1 rounded-xl">
              <Button variant={language === 'zh' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('zh')} className="text-xs h-8 px-4 rounded-lg">繁中</Button>
              <Button variant={language === 'en' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('en')} className="text-xs h-8 px-4 rounded-lg">EN</Button>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <Tabs value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)}>
              <TabsList className="h-10 bg-slate-100/80 rounded-xl">
                <TabsTrigger value="TWD" className="text-xs px-4">TWD</TabsTrigger>
                <TabsTrigger value="USD" className="text-xs px-4">USD</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          <Card className="lg:col-span-2 hero-gradient border-none text-white p-2 overflow-hidden relative group">
             <div className="absolute -top-12 -right-12 p-8 opacity-10 transition-transform duration-700 group-hover:scale-110">
               <Wallet className="h-64 w-64" />
             </div>
             <CardHeader className="relative z-10 pt-10 px-8">
               <div className="flex items-center gap-2 text-white/60 mb-1 text-sm font-medium">
                 <LayoutDashboard className="h-4 w-4" />
                 {t.totalValue}
               </div>
               <CardTitle className="text-5xl md:text-6xl font-headline font-bold tracking-tighter">
                 {getCurrencySymbol(displayCurrency)}{assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}
               </CardTitle>
             </CardHeader>
             <CardContent className="relative z-10 px-8 pb-10">
               {lastSnapshot && (
                 <div className={cn(
                   "inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold backdrop-blur-md",
                   assetCalculations.totalDiffTWD >= 0 ? "bg-white/20 text-white" : "bg-red-500/30 text-white"
                 )}>
                   {assetCalculations.totalDiffTWD >= 0 ? <ArrowUpRight className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                   {getCurrencySymbol(displayCurrency)}{Math.abs(assetCalculations.totalDiffDisplay).toLocaleString(undefined, { maximumFractionDigits: 2 })} 
                   <span className="opacity-70 font-medium">({assetCalculations.totalDiffPercent >= 0 ? '+' : ''}{assetCalculations.totalDiffPercent.toFixed(2)}%)</span>
                 </div>
               )}
               <div className="mt-8 flex gap-6">
                 <div className="space-y-1">
                   <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">{t.assetCount}</p>
                   <p className="text-xl font-bold">{assets.length} <span className="text-xs font-normal opacity-60">{t.items}</span></p>
                 </div>
                 <div className="w-px h-10 bg-white/10" />
                 <div className="space-y-1">
                   <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold">FX Rate (USD/TWD)</p>
                   <p className="text-xl font-bold">{marketData.rates.TWD.toFixed(2)}</p>
                 </div>
               </div>
             </CardContent>
          </Card>

          <div className="flex flex-col gap-6">
            <Button onClick={takeSnapshot} className="h-full rounded-[2rem] bg-slate-900 hover:bg-slate-800 text-white flex flex-col items-center justify-center gap-4 transition-all hover:scale-[1.02] shadow-xl">
              <div className="bg-white/10 p-4 rounded-full">
                <History className="h-8 w-8" />
              </div>
              <div className="text-center">
                <span className="block text-lg font-bold">{t.takeSnapshot}</span>
                <span className="text-xs opacity-50 font-normal">Create historical benchmark</span>
              </div>
            </Button>
            <Button variant="outline" onClick={updateMarketData} disabled={loading} className="h-24 rounded-[2rem] border-slate-200 hover:bg-white hover:border-primary/30 transition-all flex items-center justify-center gap-3">
              <RefreshCw className={cn("h-5 w-5", loading && "animate-spin text-primary")} />
              <span className="font-bold">{t.updateData}</span>
            </Button>
          </div>
        </section>

        {/* Charts Section */}
        <PortfolioCharts 
          language={language}
          allocationData={assetCalculations.allocationData} 
          historicalData={snapshots} 
          displayCurrency={displayCurrency}
          rates={marketData.rates}
        />

        {/* Main Workspace */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
          {/* Left Column: Management */}
          <div className="xl:col-span-1 space-y-10">
            <Card className="neo-card overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <div className="bg-blue-50 p-2 rounded-lg"><Plus className="h-5 w-5 text-blue-600" /></div>
                    {t.addAsset}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <AssetForm language={language} onAdd={handleAddAsset} />
              </CardContent>
            </Card>

            <Card className="neo-card overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <div className="bg-purple-50 p-2 rounded-lg"><History className="h-5 w-5 text-purple-600" /></div>
                  {t.snapshotHistory}
                </CardTitle>
                <CardDescription>{t.manageHistory}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {snapshots.length === 0 ? (
                  <div className="text-center py-16 text-slate-300">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-sm font-medium">{t.noSnapshots}</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {snapshots.slice().reverse().map(s => (
                      <div key={s.id} className="flex items-center justify-between p-5 hover:bg-slate-50 transition-all group cursor-pointer">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-white rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-primary shadow-sm border border-slate-100 transition-all">
                            <Calendar className="h-6 w-6" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-slate-900">{new Date(s.date).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW')}</div>
                            <div className="text-xs text-slate-400 font-mono">
                              {getCurrencySymbol(displayCurrency)} {convertTWDToDisplay(s.totalTWD).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm"><Eye className="h-4 w-4" /></Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-2xl">
                              <DialogHeader>
                                <DialogTitle className="text-2xl font-bold">{t.snapshotDetail}</DialogTitle>
                                <DialogDescription className="text-slate-400">{t.snapshotDetailDesc} - {new Date(s.date).toLocaleString()}</DialogDescription>
                              </DialogHeader>
                              <div className="max-h-[60vh] overflow-y-auto pr-2 mt-4">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="border-none bg-slate-50/50 rounded-xl">
                                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400">{t.assetName}</TableHead>
                                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-right">{t.holdings}</TableHead>
                                      <TableHead className="font-bold text-[10px] uppercase tracking-wider text-slate-400 text-right">{t.valuation} ({displayCurrency})</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {s.assets?.map((a, idx) => (
                                      <TableRow key={idx} className="border-slate-50 hover:bg-slate-50/30">
                                        <TableCell>
                                          <div className="font-bold text-sm text-slate-900">{a.name}</div>
                                          <div className="text-[10px] text-slate-400 uppercase font-mono">{a.symbol}</div>
                                        </TableCell>
                                        <TableCell className="text-right font-mono text-sm">{a.amount.toLocaleString(undefined, { maximumFractionDigits: 5 })}</TableCell>
                                        <TableCell className="text-right font-bold text-primary">{getCurrencySymbol(displayCurrency)} {convertTWDToDisplay(a.valueInTWD || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50" onClick={() => { setSnapshots(prev => prev.filter(snap => snap.id !== s.id)); toast({ title: t.snapshotDeleted }); }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column: Dashboard */}
          <div className="xl:col-span-2">
            <Card className="neo-card overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 pb-6">
                <div>
                  <CardTitle className="text-2xl font-bold flex items-center gap-3">
                    <div className="bg-indigo-50 p-2.5 rounded-2xl"><LayoutDashboard className="h-6 w-6 text-indigo-600" /></div>
                    {t.dashboard}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="py-6 px-8 font-bold text-[10px] uppercase tracking-widest text-slate-400">{t.assetName}</TableHead>
                      <TableHead className="py-6 font-bold text-[10px] uppercase tracking-widest text-slate-400 hidden md:table-cell">{t.marketPrice}</TableHead>
                      <TableHead className="py-6 font-bold text-[10px] uppercase tracking-widest text-slate-400">{t.holdings}</TableHead>
                      <TableHead className="py-6 font-bold text-[10px] uppercase tracking-widest text-slate-400 text-right">{t.valuationChange}</TableHead>
                      <TableHead className="py-6 px-8 font-bold text-[10px] uppercase tracking-widest text-slate-400 text-right">{t.valuation} ({displayCurrency})</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assetCalculations.processedAssets.map(asset => (
                      <TableRow key={asset.id} className="group hover:bg-slate-50/50 transition-all border-slate-50">
                        <TableCell className="px-8 py-6">
                          <div className="font-bold text-base text-slate-900 group-hover:text-primary transition-colors">{asset.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{asset.symbol}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-xs font-mono font-medium text-slate-500 bg-slate-100/50 inline-block px-2 py-1 rounded-lg">
                            {(asset.category === 'Stock' || asset.category === 'Crypto') ? (asset.calculatedPrice > 0 ? `${getCurrencySymbol(asset.currency)}${asset.calculatedPrice.toLocaleString()}` : t.fetching) : '--'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {editingId === asset.id ? (
                            <div className="flex items-center gap-2">
                              <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="h-9 w-24 text-sm font-mono rounded-xl" step="any" autoFocus />
                              <Button size="icon" variant="ghost" className="h-9 w-9 text-green-600 rounded-xl" onClick={() => { setAssets(prev => prev.map(a => a.id === editingId ? { ...a, amount: parseFloat(editAmount) || 0 } : a)); setEditingId(null); }}><Check className="h-4 w-4" /></Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group/amount cursor-pointer" onClick={() => { setEditingId(asset.id); setEditAmount(asset.amount.toString()); }}>
                              <div className="font-mono text-sm font-bold text-slate-700">{asset.amount.toLocaleString(undefined, { maximumFractionDigits: 5 })}</div>
                              <Edit2 className="h-3.5 w-3.5 text-slate-300 opacity-0 group-hover/amount:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {asset.hasHistory ? (
                            <div className={cn(
                              "text-xs font-bold whitespace-nowrap px-3 py-1.5 rounded-xl inline-flex flex-col items-end",
                              asset.diffTWD >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
                            )}>
                              <span>{asset.diffTWD >= 0 ? '+' : ''}{getCurrencySymbol(displayCurrency)}{Math.abs(convertTWDToDisplay(asset.diffTWD)).toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}</span>
                              <span className="text-[10px] opacity-80 mt-0.5">({asset.diffTWD >= 0 ? '+' : ''}{asset.diffPercent.toFixed(2)}%)</span>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300">--</span>
                          )}
                        </TableCell>
                        <TableCell className="px-8 text-right font-headline font-bold text-lg text-slate-900">
                          {getCurrencySymbol(displayCurrency)}{asset.valueInDisplay.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {assets.length === 0 && (
                  <div className="py-24 text-center">
                    <div className="bg-slate-50 h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Wallet className="h-10 w-10 text-slate-200" />
                    </div>
                    <p className="text-slate-400 text-sm font-medium">Ready to track your first asset?</p>
                    <Button variant="link" className="text-primary font-bold mt-2">Get Started Below <ChevronRight className="h-4 w-4 ml-1" /></Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Analysis - Wide bottom section to prevent stretching */}
        <section className="pt-8">
           <AITipCard 
              language={language} 
              assets={assetCalculations.processedAssets.map(a => ({ name: a.name, symbol: a.symbol, category: a.category, amount: a.amount, currency: a.currency, price: a.calculatedPrice, valueInTWD: a.valueInTWD }))}
              totalTWD={assetCalculations.totalTWD}
              marketConditions={`1 USD = ${(marketData.rates.TWD || 32.5).toFixed(2)} TWD`} 
            />
        </section>
      </main>
    </div>
  );
}
