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
  Target,
  TrendingUp,
  AlertTriangle,
  Zap,
  ChevronRight,
  Crosshair
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
    title: 'Survey Corps Command',
    subtitle: 'SHINZOU WO SASAGEYO! RECLAIM THE FUTURE',
    updateData: 'Scout Territory',
    takeSnapshot: 'Log Expedition',
    totalValue: 'Reclaimed Strategic Assets',
    assetCount: 'Scout Regiments',
    items: 'units',
    addAsset: 'Recruit Division',
    snapshotHistory: 'Expedition Records',
    manageHistory: 'Chronicles of the Struggle',
    noSnapshots: 'No territory reclaimed yet...',
    snapshotDetail: 'Battle After-Action Report',
    snapshotDetailDesc: 'Your tactical position on that day.',
    assetName: 'Regiment/Division',
    marketPrice: 'Battlefield Intel',
    holdings: 'Unit Strength',
    valuation: 'Strategic Worth',
    fetching: 'Scouting...',
    stockUnit: 'units',
    dataUpdated: 'Intel Gathered!',
    snapshotSaved: 'Expedition Logged!',
    snapshotDeleted: 'Records Purged!',
    dashboard: 'Frontline Command Center',
    valuationChange: 'Momentum'
  },
  zh: {
    title: '調查兵團戰術本部',
    subtitle: '獻出你的心臟！奪回屬於人類的財富領土',
    updateData: '壁外調查',
    takeSnapshot: '紀錄遠征',
    totalValue: '人類奪還領土總額',
    assetCount: '兵團分隊數',
    items: '個單位',
    addAsset: '招募新分隊',
    snapshotHistory: '遠征紀錄簿',
    manageHistory: '人類反擊的歷史足跡',
    noSnapshots: '尚未發起任何遠征...',
    snapshotDetail: '戰況紀錄檔案',
    snapshotDetailDesc: '那一天，人類回想起了被虧損支配的恐懼。',
    assetName: '分隊/領土名稱',
    marketPrice: '當前情報價值',
    holdings: '持有兵力',
    valuation: '戰略價值',
    fetching: '偵查中...',
    stockUnit: '單位',
    dataUpdated: '牆外情報已更新！',
    snapshotSaved: '遠征成果已歸檔！',
    snapshotDeleted: '機密檔案已銷毀！',
    dashboard: '前線指揮作戰中心',
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
    <div className="min-h-screen pb-24 text-slate-200">
      {/* Heavy Steel Commander Header */}
      <header className="sticky top-0 z-50 w-full bg-black/90 backdrop-blur-lg border-b-2 border-primary/40 h-24 shadow-2xl">
        <div className="max-w-7xl mx-auto px-8 h-full flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="p-3 border-2 border-primary/60 rounded-sm bg-primary/10 shadow-[0_0_15px_rgba(134,239,172,0.2)]">
              <Shield className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-black wall-header italic tracking-tight">{t.title}</h1>
              <p className="text-[10px] text-primary/70 font-black uppercase tracking-[0.4em]">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-8">
            <div className="flex bg-black/60 border border-primary/30 rounded-none p-1">
              <Button variant={language === 'zh' ? 'default' : 'ghost'} size="sm" onClick={() => setLanguage('zh')} className="text-[10px] h-8 px-4 rounded-none font-black">ZHTW</Button>
              <Button variant={language === 'en' ? 'default' : 'ghost'} size="sm" onClick={() => setLanguage('en')} className="text-[10px] h-8 px-4 rounded-none font-black">ENG</Button>
            </div>
            <Tabs value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)}>
              <TabsList className="h-10 bg-black/60 border border-primary/30 rounded-none p-1">
                <TabsTrigger value="TWD" className="text-[10px] px-4 font-black data-[state=active]:bg-primary">TWD</TabsTrigger>
                <TabsTrigger value="USD" className="text-[10px] px-4 font-black data-[state=active]:bg-primary">USD</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-12 space-y-16">
        {/* Main Strategic Dashboard */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <Card className="lg:col-span-8 titan-panel p-16 border-none shinzou-glow min-h-[500px] flex flex-col justify-center">
             {/* Character Background: Eren determined gaze */}
             <div className="absolute top-0 right-0 w-1/2 h-full opacity-30 pointer-events-none grayscale hover:grayscale-0 transition-all duration-1000">
                <Image src="https://picsum.photos/seed/eren/800/1000" fill alt="Eren Yeager" className="object-cover object-center" data-ai-hint="eren anime" />
             </div>
             
             <div className="relative z-10 space-y-8">
               <div className="flex items-center gap-4 text-primary font-black uppercase tracking-[0.4em] text-xs">
                 <Target className="h-6 w-6" />
                 {t.totalValue}
               </div>
               <div className="text-8xl md:text-[10rem] font-black tracking-tighter leading-none text-white drop-shadow-[0_5px_15px_rgba(0,0,0,1)]">
                 {getCurrencySymbol(displayCurrency)}{assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}
               </div>
               
               {lastSnapshot && (
                 <div className={cn(
                   "inline-flex items-center gap-6 px-10 py-5 border-l-8 font-black uppercase tracking-widest bg-black/80 shadow-xl",
                   assetCalculations.totalDiffTWD >= 0 ? "border-primary text-primary" : "border-accent text-accent"
                 )}>
                   {assetCalculations.totalDiffTWD >= 0 ? <TrendingUp className="h-8 w-8" /> : <Skull className="h-8 w-8" />}
                   <span className="text-2xl">
                    {getCurrencySymbol(displayCurrency)}{Math.abs(assetCalculations.totalDiffDisplay).toLocaleString()} 
                    <span className="opacity-60 ml-3">({assetCalculations.totalDiffPercent >= 0 ? '+' : ''}{assetCalculations.totalDiffPercent.toFixed(2)}%)</span>
                   </span>
                 </div>
               )}

               <div className="pt-16 flex gap-16">
                 <div className="border-l-4 border-primary/30 pl-8">
                   <p className="text-[10px] uppercase tracking-[0.4em] text-primary/60 font-black mb-2">{t.assetCount}</p>
                   <p className="text-5xl font-black text-white">{assets.length} <span className="text-sm opacity-40">{t.items}</span></p>
                 </div>
                 <div className="border-l-4 border-primary/30 pl-8">
                   <p className="text-[10px] uppercase tracking-[0.4em] text-primary/60 font-black mb-2">Humanity Strength</p>
                   <p className="text-5xl font-black text-white">98%</p>
                 </div>
               </div>
             </div>
          </Card>

          <div className="lg:col-span-4 flex flex-col gap-8">
            <Button 
              onClick={takeSnapshot} 
              className="h-full scout-button flex flex-col items-center justify-center gap-6 group rounded-none"
            >
              <div className="p-6 border-2 border-white/20 rounded-full group-hover:rotate-[360deg] transition-all duration-700 bg-white/5">
                <Map className="h-12 w-12" />
              </div>
              <div className="text-center">
                <span className="block text-2xl font-black tracking-tighter">{t.takeSnapshot}</span>
                <span className="text-[10px] opacity-60 font-black tracking-[0.3em] uppercase mt-2">Log Battle Progress</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              onClick={updateMarketData} 
              disabled={loading} 
              className="h-28 scout-button bg-black/60 border-primary/30 flex items-center justify-center gap-5 rounded-none"
            >
              <RefreshCw className={cn("h-8 w-8 text-primary", loading && "animate-spin")} />
              <span className="font-black text-xl tracking-tighter">{t.updateData}</span>
            </Button>
          </div>
        </section>

        {/* Tactical Intel Visualization */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <PortfolioCharts 
            language={language}
            allocationData={assetCalculations.allocationData} 
            historicalData={snapshots} 
            displayCurrency={displayCurrency}
            rates={marketData.rates}
          />
        </section>

        {/* Frontline Operations Area */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
          {/* Left Column: Input & Logs */}
          <div className="xl:col-span-4 space-y-12">
            <Card className="titan-panel border-primary/10 rounded-none">
              <CardHeader className="bg-primary/10 border-b border-primary/20 p-8">
                <CardTitle className="text-xl font-black flex items-center gap-4 text-primary uppercase tracking-widest">
                  <Sword className="h-7 w-7" />
                  {t.addAsset}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <AssetForm language={language} onAdd={(a) => setAssets(prev => [...prev, { ...a, id: crypto.randomUUID() }])} />
              </CardContent>
            </Card>

            <Card className="titan-panel border-primary/10 rounded-none">
              <CardHeader className="bg-primary/10 border-b border-primary/20 p-8">
                <CardTitle className="text-xl font-black flex items-center gap-4 text-primary uppercase tracking-widest">
                  <History className="h-7 w-7" />
                  {t.snapshotHistory}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {snapshots.length === 0 ? (
                  <div className="text-center py-24 text-primary/10 font-black uppercase tracking-[0.5em] italic text-2xl">No expeditions recorded</div>
                ) : (
                  <div className="divide-y divide-primary/10">
                    {snapshots.slice().reverse().map(s => (
                      <div key={s.id} className="flex items-center justify-between p-8 hover:bg-primary/5 transition-all group cursor-default">
                        <div className="flex items-center gap-6">
                          <div className="p-4 bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors">
                            <Flag className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <div className="text-lg font-black uppercase tracking-tighter text-white">{new Date(s.date).toLocaleDateString()}</div>
                            <div className="text-[10px] text-primary/50 font-black mt-2 tracking-widest">
                              TOTAL VALUE: {getCurrencySymbol(displayCurrency)} {convertTWDToDisplay(s.totalTWD).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-4">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-12 w-12 hover:bg-primary/20 rounded-none border border-transparent hover:border-primary/30"><Eye className="h-6 w-6 text-primary" /></Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl titan-panel border-primary/40 rounded-none text-slate-200">
                              <DialogHeader className="p-8 bg-primary/5 border-b border-primary/10">
                                <DialogTitle className="text-3xl font-black text-primary uppercase tracking-[0.3em] italic">{t.snapshotDetail}</DialogTitle>
                                <DialogDescription className="font-black text-slate-400 mt-2 uppercase tracking-widest">LOG DATE: {new Date(s.date).toLocaleString()}</DialogDescription>
                              </DialogHeader>
                              <div className="p-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="border-primary/20 bg-black/40">
                                      <TableHead className="font-black text-primary uppercase text-xs p-6 tracking-widest">{t.assetName}</TableHead>
                                      <TableHead className="text-right font-black text-primary uppercase text-xs p-6 tracking-widest">{t.holdings}</TableHead>
                                      <TableHead className="text-right font-black text-primary uppercase text-xs p-6 tracking-widest">{t.valuation}</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {s.assets?.map((a, idx) => (
                                      <TableRow key={idx} className="border-primary/10 hover:bg-white/5 transition-colors">
                                        <TableCell className="p-6 font-black text-sm uppercase text-slate-300">{a.name}</TableCell>
                                        <TableCell className="p-6 text-right font-black text-sm">{a.amount.toLocaleString()}</TableCell>
                                        <TableCell className="p-6 text-right font-black text-primary text-lg tracking-tighter">{getCurrencySymbol(displayCurrency)} {convertTWDToDisplay(a.valueInTWD || 0).toLocaleString()}</TableCell>
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
                            className="h-12 w-12 hover:bg-accent/20 hover:text-accent rounded-none border border-transparent hover:border-accent/30" 
                            onClick={() => { setSnapshots(prev => prev.filter(snap => snap.id !== s.id)); toast({ title: t.snapshotDeleted }); }}
                          >
                            <Trash2 className="h-6 w-6" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Right Column: Asset Table */}
          <div className="xl:col-span-8">
            <Card className="titan-panel border-primary/10 rounded-none h-full">
              <CardHeader className="bg-primary/10 border-b border-primary/20 p-8">
                <CardTitle className="text-2xl font-black flex items-center gap-5 text-primary uppercase tracking-[0.3em] italic">
                  <Crosshair className="h-8 w-8" />
                  {t.dashboard}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-black/40 border-primary/10">
                      <TableHead className="p-8 font-black text-primary uppercase text-[10px] tracking-[0.4em]">{t.assetName}</TableHead>
                      <TableHead className="p-8 font-black text-primary uppercase text-[10px] tracking-[0.4em] hidden md:table-cell">{t.marketPrice}</TableHead>
                      <TableHead className="p-8 font-black text-primary uppercase text-[10px] tracking-[0.4em]">{t.holdings}</TableHead>
                      <TableHead className="p-8 font-black text-primary uppercase text-[10px] tracking-[0.4em] text-right">{t.valuationChange}</TableHead>
                      <TableHead className="p-8 font-black text-primary uppercase text-[10px] tracking-[0.4em] text-right">{t.valuation}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assetCalculations.processedAssets.map(asset => (
                      <TableRow key={asset.id} className="border-b border-primary/5 hover:bg-primary/5 transition-all group">
                        <TableCell className="p-10">
                          <div className="font-black text-xl text-white uppercase tracking-tighter mb-1">{asset.name}</div>
                          <div className="text-[10px] text-primary/60 font-black uppercase tracking-widest">{asset.symbol}</div>
                        </TableCell>
                        <TableCell className="p-10 hidden md:table-cell text-sm font-black text-slate-400">
                          {(asset.category === 'Stock' || asset.category === 'Crypto') ? (asset.calculatedPrice > 0 ? `${getCurrencySymbol(asset.currency)}${asset.calculatedPrice.toLocaleString()}` : t.fetching) : '--'}
                        </TableCell>
                        <TableCell className="p-10">
                          {editingId === asset.id ? (
                            <div className="flex items-center gap-3">
                              <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="h-12 w-32 bg-black/60 border-primary/40 rounded-none font-black text-lg" step="any" autoFocus />
                              <Button size="icon" className="h-12 w-12 bg-primary rounded-none" onClick={() => { setAssets(prev => prev.map(a => a.id === editingId ? { ...a, amount: parseFloat(editAmount) || 0 } : a)); setEditingId(null); }}><Check className="h-6 w-6" /></Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 cursor-pointer group/item" onClick={() => { setEditingId(asset.id); setEditAmount(asset.amount.toString()); }}>
                              <span className="text-xl font-black text-slate-300 tracking-tighter">{asset.amount.toLocaleString()}</span>
                              <Edit2 className="h-5 w-5 text-primary/30 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="p-10 text-right">
                          {asset.hasHistory ? (
                            <div className={cn(
                              "text-xs font-black inline-flex flex-col items-end px-5 py-3 border-l-4",
                              asset.diffTWD >= 0 ? "text-primary border-primary/30 bg-primary/5" : "text-accent border-accent/30 bg-accent/5"
                            )}>
                              <span className="text-sm">{asset.diffTWD >= 0 ? '+' : '-'}{getCurrencySymbol(displayCurrency)}{Math.abs(convertTWDToDisplay(asset.diffTWD)).toLocaleString()}</span>
                              <span className="text-[10px] opacity-60 mt-1">{asset.diffTWD >= 0 ? '+' : ''}{asset.diffPercent.toFixed(2)}%</span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-primary/40 font-black uppercase tracking-widest border border-primary/20 px-4 py-2 bg-primary/5">New Unit</span>
                          )}
                        </TableCell>
                        <TableCell className="p-10 text-right">
                          <span className="font-black text-3xl text-primary tracking-tighter drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]">
                            {getCurrencySymbol(displayCurrency)}{asset.valueInDisplay.toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {assets.length === 0 && (
                  <div className="py-48 text-center text-primary/10 font-black text-5xl italic uppercase tracking-[0.3em]">Recruit units to battle</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Strategic Commander Intel Section */}
        <section className="pt-12">
           <AITipCard 
              language={language} 
              assets={assetCalculations.processedAssets.map(a => ({ name: a.name, symbol: a.symbol, category: a.category, amount: a.amount, currency: a.currency, price: a.calculatedPrice, valueInTWD: a.valueInTWD }))}
              totalTWD={assetCalculations.totalTWD}
              marketConditions={`USD/TWD: ${(marketData.rates.TWD || 32.5).toFixed(2)} | Wall Status: ACTIVE`} 
            />
        </section>
      </main>

      <footer className="py-32 text-center space-y-6 border-t border-primary/20 bg-black/60 relative overflow-hidden">
        {/* Subtle Steam Effect */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/4 h-32 w-32 bg-white/5 rounded-full blur-3xl animate-steam" />
          <div className="absolute bottom-0 right-1/4 h-32 w-32 bg-white/5 rounded-full blur-3xl animate-steam delay-700" />
        </div>
        
        <div className="relative z-10 space-y-4">
          <p className="text-primary/70 text-sm font-black uppercase tracking-[0.8em]">Survey Corps Strategic Planning Division</p>
          <p className="text-[10px] text-primary/40 italic font-black uppercase tracking-widest max-w-xl mx-auto leading-loose">
            "If you don't fight, you can't win. This world is cruel, but it's also very beautiful. Reclaim your future with tactical precision."
          </p>
        </div>
      </footer>
    </div>
  );
}