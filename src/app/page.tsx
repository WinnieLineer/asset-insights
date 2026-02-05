
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Asset, Snapshot, MarketData, AssetCategory, Currency } from './lib/types';
import { getMarketData } from '@/app/actions/market';
import { AssetForm } from '@/components/AssetForm';
import { PortfolioCharts } from '@/components/PortfolioCharts';
import { AITipCard } from '@/components/AITipCard';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  Flag, 
  Skull, 
  Map, 
  RefreshCw, 
  History, 
  Trash2, 
  Eye, 
  Check, 
  Edit2, 
  Sword,
  Mountain,
  Crosshair,
  TrendingUp,
  AlertTriangle,
  Zap
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
import Image from 'next/image';

type Language = 'en' | 'zh';

const translations = {
  en: {
    title: 'Survey Corps Tactical Hub',
    subtitle: 'SHINZOU WO SASAGEYO! RECLAIM YOUR FUTURE',
    updateData: 'Scout Surroundings',
    takeSnapshot: 'Log Expedition',
    totalValue: 'Reclaimed Territory Value',
    assetCount: 'Scout Units',
    items: 'units',
    addAsset: 'Recruit Asset',
    snapshotHistory: 'Expedition Records',
    manageHistory: 'History of the humanity\'s struggle!',
    noSnapshots: 'No territory reclaimed yet...',
    snapshotDetail: 'Battle Record',
    snapshotDetailDesc: 'Your strategic position on that day.',
    assetName: 'Unit/Territory',
    marketPrice: 'Market Intelligence',
    holdings: 'Combat Strength',
    valuation: 'Strategic Value',
    fetching: 'Searching...',
    stockUnit: 'units',
    dataUpdated: 'Intelligence gathered!',
    snapshotSaved: 'Expedition logged!',
    snapshotDeleted: 'Record burned!',
    dashboard: 'Frontline Command',
    valuationChange: 'Battle Momentum'
  },
  zh: {
    title: '調查兵團戰術總部',
    subtitle: '獻出你的心臟！奪回屬於你的財富領土',
    updateData: '壁外調查',
    takeSnapshot: '紀錄遠征',
    totalValue: '奪還領土總價值',
    assetCount: '兵團單位',
    items: '個單位',
    addAsset: '招募新資產',
    snapshotHistory: '遠征紀錄簿',
    manageHistory: '人類反擊的歷史足跡！',
    noSnapshots: '尚未發起遠征...',
    snapshotDetail: '戰況紀錄',
    snapshotDetailDesc: '那一天，人類回想起了被虧損支配的恐懼。',
    assetName: '資產單位',
    marketPrice: '目前行情情報',
    holdings: '持有戰力',
    valuation: '戰略價值',
    fetching: '偵查中...',
    stockUnit: '單位',
    dataUpdated: '情報收集完成！',
    snapshotSaved: '遠征紀錄已歸檔！',
    snapshotDeleted: '紀錄已銷毀！',
    dashboard: '前線指揮所',
    valuationChange: '戰況起伏'
  }
};

export default function TitanAssetPage() {
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
    else setAssets([{ id: 'default-0050', name: '瑪利亞之牆首儲 (0050)', symbol: '0050', category: 'Stock', amount: 1000, currency: 'TWD' }]);
    
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
      console.error('Scouting failed', error);
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
    <div className="min-h-screen pb-20 font-body text-slate-200">
      {/* Heavy Steel Header */}
      <header className="sticky top-0 z-50 w-full bg-black/80 backdrop-blur-md border-b-2 border-primary/40 h-20 shadow-2xl">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 border-2 border-primary/50 rounded-sm bg-primary/10">
              <Flag className="h-8 w-8 text-primary animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black wall-header">{t.title}</h1>
              <p className="text-[10px] text-primary/60 font-bold uppercase tracking-[0.3em]">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex bg-black/40 border border-primary/20 rounded-sm p-1">
              <Button variant={language === 'zh' ? 'default' : 'ghost'} size="sm" onClick={() => setLanguage('zh')} className="text-[10px] h-7 px-3 rounded-none uppercase font-bold">ZHTW</Button>
              <Button variant={language === 'en' ? 'default' : 'ghost'} size="sm" onClick={() => setLanguage('en')} className="text-[10px] h-7 px-3 rounded-none uppercase font-bold">ENG</Button>
            </div>
            <Tabs value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)}>
              <TabsList className="h-8 bg-black/40 border border-primary/20 rounded-none p-1">
                <TabsTrigger value="TWD" className="text-[10px] px-3 font-bold data-[state=active]:bg-primary">TWD</TabsTrigger>
                <TabsTrigger value="USD" className="text-[10px] px-3 font-bold data-[state=active]:bg-primary">USD</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-12">
        {/* Battle Overview Hero */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Card className="lg:col-span-8 titan-panel border-none relative overflow-hidden p-12 shinzou-glow">
             {/* Character Background Overlay */}
             <div className="absolute top-0 right-0 w-1/3 h-full opacity-30 pointer-events-none grayscale hover:grayscale-0 transition-all duration-700">
                <Image src="https://picsum.photos/seed/eren/600/800" fill alt="Eren" className="object-cover object-center" />
             </div>
             
             <div className="relative z-10">
               <div className="flex items-center gap-3 text-primary font-black uppercase tracking-[0.2em] mb-6 text-sm">
                 <Crosshair className="h-5 w-5" />
                 {t.totalValue}
               </div>
               <div className="text-7xl md:text-9xl font-black tracking-tighter mb-8 text-white">
                 {getCurrencySymbol(displayCurrency)}{assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}
               </div>
               
               {lastSnapshot && (
                 <div className={cn(
                   "inline-flex items-center gap-4 px-8 py-4 border-l-8 font-black uppercase tracking-widest bg-black/60",
                   assetCalculations.totalDiffTWD >= 0 ? "border-primary text-primary" : "border-accent text-accent"
                 )}>
                   {assetCalculations.totalDiffTWD >= 0 ? <TrendingUp className="h-6 w-6" /> : <Skull className="h-6 w-6" />}
                   {getCurrencySymbol(displayCurrency)}{Math.abs(assetCalculations.totalDiffDisplay).toLocaleString()} 
                   <span className="opacity-60 ml-2">({assetCalculations.totalDiffPercent >= 0 ? '+' : ''}{assetCalculations.totalDiffPercent.toFixed(2)}%)</span>
                 </div>
               )}

               <div className="mt-20 flex gap-12">
                 <div className="border-l-4 border-primary/30 pl-6">
                   <p className="text-[10px] uppercase tracking-[0.3em] text-primary/60 font-black mb-2">{t.assetCount}</p>
                   <p className="text-4xl font-black text-white">{assets.length} <span className="text-sm opacity-40">{t.items}</span></p>
                 </div>
                 <div className="border-l-4 border-primary/30 pl-6">
                   <p className="text-[10px] uppercase tracking-[0.3em] text-primary/60 font-black mb-2">Wall Maria Health</p>
                   <p className="text-4xl font-black text-white">100%</p>
                 </div>
               </div>
             </div>
          </Card>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <Button 
              onClick={takeSnapshot} 
              className="h-full scout-button flex flex-col items-center justify-center gap-4 group"
            >
              <div className="p-4 border-2 border-white/20 rounded-full group-hover:rotate-12 transition-transform">
                <Map className="h-10 w-10" />
              </div>
              <div className="text-center">
                <span className="block text-xl font-black">{t.takeSnapshot}</span>
                <span className="text-[10px] opacity-60 font-bold tracking-widest uppercase">Expand Territory</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              onClick={updateMarketData} 
              disabled={loading} 
              className="h-24 scout-button bg-black/40 border-primary/20 flex items-center justify-center gap-4"
            >
              <RefreshCw className={cn("h-6 w-6 text-primary", loading && "animate-spin")} />
              <span className="font-black text-lg">{t.updateData}</span>
            </Button>
          </div>
        </section>

        {/* Tactical Intel Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <PortfolioCharts 
            language={language}
            allocationData={assetCalculations.allocationData} 
            historicalData={snapshots} 
            displayCurrency={displayCurrency}
            rates={marketData.rates}
          />
        </section>

        {/* Frontline Command Area */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          <div className="xl:col-span-4 space-y-10">
            <Card className="titan-panel overflow-hidden border-primary/10">
              <CardHeader className="bg-primary/10 border-b border-primary/20">
                <CardTitle className="text-lg font-black flex items-center gap-3 text-primary uppercase">
                  <Sword className="h-6 w-6" />
                  {t.addAsset}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-8">
                <AssetForm language={language} onAdd={(a) => setAssets(prev => [...prev, { ...a, id: crypto.randomUUID() }])} />
              </CardContent>
            </Card>

            <Card className="titan-panel overflow-hidden border-primary/10">
              <CardHeader className="bg-primary/10 border-b border-primary/20">
                <CardTitle className="text-lg font-black flex items-center gap-3 text-primary uppercase">
                  <History className="h-6 w-6" />
                  {t.snapshotHistory}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {snapshots.length === 0 ? (
                  <div className="text-center py-16 text-primary/20 font-black uppercase tracking-widest italic">No expeditions recorded...</div>
                ) : (
                  <div className="divide-y divide-primary/10">
                    {snapshots.slice().reverse().map(s => (
                      <div key={s.id} className="flex items-center justify-between p-6 hover:bg-white/5 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary/10 border border-primary/20"><Flag className="h-5 w-5 text-primary" /></div>
                          <div>
                            <div className="text-sm font-black uppercase">{new Date(s.date).toLocaleDateString()}</div>
                            <div className="text-[10px] text-primary/40 font-bold mt-1">
                              VAL: {getCurrencySymbol(displayCurrency)} {convertTWDToDisplay(s.totalTWD).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-primary/20"><Eye className="h-5 w-5 text-primary" /></Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-xl titan-panel border-primary/40 text-slate-200">
                              <DialogHeader>
                                <DialogTitle className="text-2xl font-black text-primary uppercase tracking-widest">{t.snapshotDetail}</DialogTitle>
                                <DialogDescription className="font-bold text-slate-400">EXPEDITION DATE: {new Date(s.date).toLocaleString()}</DialogDescription>
                              </DialogHeader>
                              <div className="max-h-[60vh] overflow-y-auto pr-2">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="border-primary/20">
                                      <TableHead className="font-black text-primary uppercase text-xs">{t.assetName}</TableHead>
                                      <TableHead className="text-right font-black text-primary uppercase text-xs">{t.holdings}</TableHead>
                                      <TableHead className="text-right font-black text-primary uppercase text-xs">{t.valuation}</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {s.assets?.map((a, idx) => (
                                      <TableRow key={idx} className="border-primary/5">
                                        <TableCell className="py-4 font-bold text-sm">{a.name}</TableCell>
                                        <TableCell className="text-right font-bold text-sm">{a.amount.toLocaleString()}</TableCell>
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
                            className="h-10 w-10 hover:bg-accent/20 hover:text-accent" 
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
            <Card className="titan-panel overflow-hidden border-primary/10">
              <CardHeader className="bg-primary/10 border-b border-primary/20 px-8 py-6">
                <CardTitle className="text-xl font-black flex items-center gap-3 text-primary uppercase tracking-widest">
                  <Shield className="h-6 w-6" />
                  {t.dashboard}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-black/20 border-primary/10">
                      <TableHead className="px-8 font-black text-primary uppercase text-[10px] tracking-widest">{t.assetName}</TableHead>
                      <TableHead className="font-black text-primary uppercase text-[10px] tracking-widest hidden md:table-cell">{t.marketPrice}</TableHead>
                      <TableHead className="font-black text-primary uppercase text-[10px] tracking-widest">{t.holdings}</TableHead>
                      <TableHead className="font-black text-primary uppercase text-[10px] tracking-widest text-right">{t.valuationChange}</TableHead>
                      <TableHead className="px-8 font-black text-primary uppercase text-[10px] tracking-widest text-right">{t.valuation}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assetCalculations.processedAssets.map(asset => (
                      <TableRow key={asset.id} className="border-b border-primary/5 hover:bg-primary/5 transition-colors group">
                        <TableCell className="px-8 py-8">
                          <div className="font-black text-lg text-white uppercase">{asset.name}</div>
                          <div className="text-[10px] text-primary/60 font-bold uppercase tracking-widest">{asset.symbol}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm font-bold text-slate-400">
                          {(asset.category === 'Stock' || asset.category === 'Crypto') ? (asset.calculatedPrice > 0 ? `${getCurrencySymbol(asset.currency)}${asset.calculatedPrice.toLocaleString()}` : t.fetching) : '--'}
                        </TableCell>
                        <TableCell>
                          {editingId === asset.id ? (
                            <div className="flex items-center gap-2">
                              <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="h-10 w-28 bg-black/60 border-primary/40 font-black" step="any" autoFocus />
                              <Button size="icon" className="h-10 w-10 bg-primary" onClick={() => { setAssets(prev => prev.map(a => a.id === editingId ? { ...a, amount: parseFloat(editAmount) || 0 } : a)); setEditingId(null); }}><Check className="h-5 w-5" /></Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => { setEditingId(asset.id); setEditAmount(asset.amount.toString()); }}>
                              <span className="text-lg font-black text-slate-300">{asset.amount.toLocaleString()}</span>
                              <Edit2 className="h-4 w-4 text-primary/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {asset.hasHistory ? (
                            <div className={cn(
                              "text-xs font-black inline-flex flex-col items-end px-4 py-2 border",
                              asset.diffTWD >= 0 ? "text-primary border-primary/20 bg-primary/5" : "text-accent border-accent/20 bg-accent/5"
                            )}>
                              <span>{asset.diffTWD >= 0 ? '+' : '-'}{getCurrencySymbol(displayCurrency)}{Math.abs(convertTWDToDisplay(asset.diffTWD)).toLocaleString()}</span>
                              <span className="text-[10px] opacity-60">{asset.diffTWD >= 0 ? '+' : ''}{asset.diffPercent.toFixed(2)}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-primary/30 font-black uppercase tracking-tighter">New Territory</span>
                          )}
                        </TableCell>
                        <TableCell className="px-8 text-right">
                          <span className="font-black text-2xl text-primary tracking-tighter">
                            {getCurrencySymbol(displayCurrency)}{asset.valueInDisplay.toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {assets.length === 0 && (
                  <div className="py-32 text-center text-primary/10 font-black text-4xl italic uppercase">Recruit units to fight!</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Commander AI Section */}
        <section className="pt-8">
           <AITipCard 
              language={language} 
              assets={assetCalculations.processedAssets.map(a => ({ name: a.name, symbol: a.symbol, category: a.category, amount: a.amount, currency: a.currency, price: a.calculatedPrice, valueInTWD: a.valueInTWD }))}
              totalTWD={assetCalculations.totalTWD}
              marketConditions={`USD/TWD: ${(marketData.rates.TWD || 32.5).toFixed(2)}`} 
            />
        </section>
      </main>

      <footer className="py-20 text-center space-y-4 border-t border-primary/10 bg-black/40">
        <p className="text-primary/60 text-xs font-black uppercase tracking-[0.5em]">Survey Corps Financial Division • Humanity's Last Hope</p>
        <p className="text-xs text-primary/30 italic font-bold">"If you don't fight, you can't win. If you don't invest, you can't grow."</p>
      </footer>
    </div>
  );
}

