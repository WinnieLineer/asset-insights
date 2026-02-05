'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Asset, Snapshot, MarketData, AssetCategory, Currency } from './lib/types';
import { getMarketData } from '@/app/actions/market';
import { AssetForm } from '@/components/AssetForm';
import { PortfolioCharts } from '@/components/PortfolioCharts';
import { AITipCard } from '@/components/AITipCard';
import { Button } from '@/components/ui/button';
import { 
  Cat, 
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
  Sparkles,
  Heart,
  Star
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
    title: 'Capoo Wealth',
    subtitle: 'MUNCHING ASSETS & SNIFFING GAINS',
    updateData: 'Sniff Market',
    takeSnapshot: 'Save Treasure',
    totalValue: 'Total Yummy Assets',
    assetCount: 'Stashed Items',
    items: 'items',
    addAsset: 'New Snack',
    snapshotHistory: 'Memory Lane',
    manageHistory: 'Your wealth journey!',
    noSnapshots: 'No memories yet...',
    snapshotDetail: 'Memory Detail',
    snapshotDetailDesc: 'What you had back then!',
    assetName: 'Asset',
    marketPrice: 'Price',
    holdings: 'Amount',
    valuation: 'Value',
    fetching: 'Sniffing...',
    stockUnit: 'sh',
    dataUpdated: 'Market sniffed!',
    snapshotSaved: 'Treasure saved!',
    snapshotDeleted: 'Memory poofed!',
    dashboard: 'My Treasure Pile',
    valuationChange: 'Mood Swing'
  },
  zh: {
    title: '咖波財富',
    subtitle: '嗅嗅行情 · 囤囤資產 · 也要吃肉肉',
    updateData: '嗅嗅行情',
    takeSnapshot: '存入寶庫',
    totalValue: '全部肉肉價值',
    assetCount: '囤積項目',
    items: '個項目',
    addAsset: '新增肉肉',
    snapshotHistory: '時光回憶',
    manageHistory: '記錄你的成長足跡！',
    noSnapshots: '還沒有回憶喔...',
    snapshotDetail: '回憶細節',
    snapshotDetailDesc: '那時候你的寶藏。',
    assetName: '資產名稱',
    marketPrice: '目前市價',
    holdings: '持有數量',
    valuation: '目前價值',
    fetching: '嗅嗅中...',
    stockUnit: '股',
    dataUpdated: '行情嗅完了！',
    snapshotSaved: '存入寶庫成功！',
    snapshotDeleted: '回憶消失了！',
    dashboard: '我的寶藏堆',
    valuationChange: '心情起伏'
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
    <div className="min-h-screen bg-[#F0F9FF] pb-20 font-body text-slate-800 selection:bg-primary/20">
      <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b-4 border-primary/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-primary p-3 rounded-full text-white shadow-lg animate-wiggle">
              <Cat className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-primary">{t.title}</h1>
              <p className="text-[10px] text-primary/40 font-bold uppercase tracking-widest">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex bg-primary/5 p-1 rounded-full">
              <Button variant={language === 'zh' ? 'default' : 'ghost'} size="sm" onClick={() => setLanguage('zh')} className="text-xs h-8 px-4 rounded-full">繁中</Button>
              <Button variant={language === 'en' ? 'default' : 'ghost'} size="sm" onClick={() => setLanguage('en')} className="text-xs h-8 px-4 rounded-full">EN</Button>
            </div>
            <Tabs value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)} className="hidden sm:block">
              <TabsList className="h-10 bg-primary/5 rounded-full border-none p-1">
                <TabsTrigger value="TWD" className="text-xs px-4 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">TWD</TabsTrigger>
                <TabsTrigger value="USD" className="text-xs px-4 rounded-full data-[state=active]:bg-primary data-[state=active]:text-white">USD</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-12">
        {/* Capoo Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Card className="lg:col-span-8 capoo-gradient border-none text-white relative overflow-hidden rounded-[3rem] shadow-2xl p-12">
             <div className="absolute -top-10 -right-10 opacity-10 pointer-events-none">
               <Cat className="h-64 w-64 rotate-12" />
             </div>
             <div className="relative z-10">
               <div className="flex items-center gap-2 text-white/60 mb-6 text-sm font-bold uppercase tracking-[0.2em]">
                 <Star className="h-5 w-5 fill-white/20" />
                 {t.totalValue}
               </div>
               <div className="text-6xl md:text-8xl font-black tracking-tighter mb-8">
                 {getCurrencySymbol(displayCurrency)}{assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}
               </div>
               
               {lastSnapshot && (
                 <div className={cn(
                   "inline-flex items-center gap-3 px-6 py-3 rounded-full text-sm font-black shadow-lg",
                   assetCalculations.totalDiffTWD >= 0 ? "bg-white text-primary" : "bg-red-400 text-white"
                 )}>
                   {assetCalculations.totalDiffTWD >= 0 ? <Sparkles className="h-5 w-5" /> : <ArrowDownRight className="h-5 w-5" />}
                   {getCurrencySymbol(displayCurrency)}{Math.abs(assetCalculations.totalDiffDisplay).toLocaleString(undefined, { maximumFractionDigits: 2 })} 
                   <span className="opacity-60 ml-1">({assetCalculations.totalDiffPercent >= 0 ? '+' : ''}{assetCalculations.totalDiffPercent.toFixed(2)}%)</span>
                 </div>
               )}

               <div className="mt-16 flex gap-12 items-center">
                 <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-md">
                   <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold mb-1">{t.assetCount}</p>
                   <p className="text-3xl font-black">{assets.length}</p>
                 </div>
                 <div className="bg-white/10 p-4 rounded-3xl backdrop-blur-md">
                   <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold mb-1">USD/TWD</p>
                   <p className="text-3xl font-black">{marketData.rates.TWD.toFixed(2)}</p>
                 </div>
               </div>
             </div>
          </Card>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <Button 
              onClick={takeSnapshot} 
              className="h-full rounded-[3rem] bg-white border-4 border-primary/20 text-primary hover:bg-primary/5 flex flex-col items-center justify-center gap-4 shadow-xl bouncy-button group"
            >
              <div className="p-6 bg-secondary rounded-full group-hover:scale-110 transition-transform">
                <Heart className="h-10 w-10 text-white fill-current" />
              </div>
              <div className="text-center">
                <span className="block text-2xl font-black">{t.takeSnapshot}</span>
                <span className="text-[10px] opacity-40 font-bold tracking-widest uppercase">Keep memories</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              onClick={updateMarketData} 
              disabled={loading} 
              className="h-24 rounded-[2rem] bg-white border-4 border-primary/10 hover:bg-primary/5 flex items-center justify-center gap-4 shadow-lg bouncy-button"
            >
              <RefreshCw className={cn("h-6 w-6 text-primary", loading && "animate-spin")} />
              <span className="font-black text-xl text-primary">{t.updateData}</span>
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
            <Card className="capoo-card overflow-hidden">
              <CardHeader className="pb-4 border-b-4 border-primary/5">
                <CardTitle className="text-xl font-black flex items-center gap-3 text-primary">
                  <Plus className="h-6 w-6" />
                  {t.addAsset}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8">
                <AssetForm language={language} onAdd={(a) => setAssets(prev => [...prev, { ...a, id: crypto.randomUUID() }])} />
              </CardContent>
            </Card>

            <Card className="capoo-card overflow-hidden">
              <CardHeader className="pb-4 border-b-4 border-primary/5">
                <CardTitle className="text-xl font-black flex items-center gap-3 text-primary">
                  <History className="h-6 w-6" />
                  {t.snapshotHistory}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {snapshots.length === 0 ? (
                  <div className="text-center py-16 text-primary/20 font-black uppercase tracking-widest">No treasure stashed!</div>
                ) : (
                  <div className="divide-y-4 divide-primary/5">
                    {snapshots.slice().reverse().map(s => (
                      <div key={s.id} className="flex items-center justify-between p-6 hover:bg-primary/5 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary/10 rounded-2xl"><Calendar className="h-5 w-5 text-primary" /></div>
                          <div>
                            <div className="text-sm font-black">{new Date(s.date).toLocaleDateString()}</div>
                            <div className="text-xs text-primary/40 font-bold mt-1">
                              {getCurrencySymbol(displayCurrency)} {convertTWDToDisplay(s.totalTWD).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-primary/10"><Eye className="h-5 w-5 text-primary" /></Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-xl rounded-[3rem] border-none shadow-2xl">
                              <DialogHeader>
                                <DialogTitle className="text-2xl font-black text-primary">{t.snapshotDetail}</DialogTitle>
                                <DialogDescription className="font-bold">{new Date(s.date).toLocaleString()}</DialogDescription>
                              </DialogHeader>
                              <div className="max-h-[60vh] overflow-y-auto pr-2">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="border-b-4 border-primary/5">
                                      <TableHead className="font-black text-primary">{t.assetName}</TableHead>
                                      <TableHead className="text-right font-black text-primary">{t.holdings}</TableHead>
                                      <TableHead className="text-right font-black text-primary">{t.valuation}</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {s.assets?.map((a, idx) => (
                                      <TableRow key={idx} className="border-none">
                                        <TableCell className="py-4 font-bold">{a.name}</TableCell>
                                        <TableCell className="text-right font-bold">{a.amount.toLocaleString()}</TableCell>
                                        <TableCell className="text-right font-black text-primary">{getCurrencySymbol(displayCurrency)} {convertTWDToDisplay(a.valueInTWD || 0).toLocaleString()}</TableCell>
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
                            className="h-10 w-10 rounded-full hover:bg-red-100 hover:text-red-500" 
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
          
          <div className="xl:col-span-8">
            <Card className="capoo-card overflow-hidden">
              <CardHeader className="border-b-4 border-primary/5 px-8 py-6">
                <CardTitle className="text-2xl font-black flex items-center gap-3 text-primary">
                  <LayoutDashboard className="h-6 w-6" />
                  {t.dashboard}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-primary/5 border-none">
                      <TableHead className="px-8 font-black text-primary">{t.assetName}</TableHead>
                      <TableHead className="font-black text-primary hidden md:table-cell">{t.marketPrice}</TableHead>
                      <TableHead className="font-black text-primary">{t.holdings}</TableHead>
                      <TableHead className="font-black text-primary text-right">{t.valuationChange}</TableHead>
                      <TableHead className="px-8 font-black text-primary text-right">{t.valuation}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assetCalculations.processedAssets.map(asset => (
                      <TableRow key={asset.id} className="border-b-4 border-primary/5 hover:bg-primary/5 transition-colors group">
                        <TableCell className="px-8 py-8">
                          <div className="font-black text-lg text-primary">{asset.name}</div>
                          <div className="text-[10px] text-primary/40 font-bold uppercase">{asset.symbol}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm font-bold text-slate-500">
                          {(asset.category === 'Stock' || asset.category === 'Crypto') ? (asset.calculatedPrice > 0 ? `${getCurrencySymbol(asset.currency)}${asset.calculatedPrice.toLocaleString()}` : t.fetching) : '--'}
                        </TableCell>
                        <TableCell>
                          {editingId === asset.id ? (
                            <div className="flex items-center gap-2">
                              <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="h-10 w-28 rounded-xl font-black" step="any" autoFocus />
                              <Button size="icon" className="h-10 w-10 bg-primary rounded-full bouncy-button" onClick={() => { setAssets(prev => prev.map(a => a.id === editingId ? { ...a, amount: parseFloat(editAmount) || 0 } : a)); setEditingId(null); }}><Check className="h-5 w-5" /></Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 cursor-pointer" onClick={() => { setEditingId(asset.id); setEditAmount(asset.amount.toString()); }}>
                              <span className="text-lg font-black text-slate-600">{asset.amount.toLocaleString(undefined, { maximumFractionDigits: 5 })}</span>
                              <Edit2 className="h-4 w-4 text-primary/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {asset.hasHistory ? (
                            <div className={cn(
                              "text-xs font-black inline-flex flex-col items-end px-4 py-2 rounded-2xl shadow-sm",
                              asset.diffTWD >= 0 ? "text-primary bg-primary/10" : "text-red-500 bg-red-50"
                            )}>
                              <span>{asset.diffTWD >= 0 ? '+' : ''}{getCurrencySymbol(displayCurrency)}{Math.abs(convertTWDToDisplay(asset.diffTWD)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                              <span className="text-[10px] opacity-60">{asset.diffTWD >= 0 ? '+' : ''}{asset.diffPercent.toFixed(2)}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-primary/20 font-black">NEW!</span>
                          )}
                        </TableCell>
                        <TableCell className="px-8 text-right">
                          <span className="font-black text-2xl text-primary tracking-tighter">
                            {getCurrencySymbol(displayCurrency)}{asset.valueInDisplay.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {assets.length === 0 && (
                  <div className="py-32 text-center text-primary/10 font-black text-3xl">WANTED: MORE SNACKS!</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Capoo AI Section */}
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
        <p className="text-primary/40 text-xs font-black uppercase tracking-[0.4em]">Capoo Wealth • Yum Yum Finance</p>
        <p className="text-xs text-primary/20 italic font-bold">Eat meat, gain wealth.</p>
      </footer>
    </div>
  );
}
