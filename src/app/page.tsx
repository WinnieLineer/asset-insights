'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Asset, Snapshot, MarketData, AssetCategory, Currency } from './lib/types';
import { getMarketData } from '@/app/actions/market';
import { AssetForm } from '@/components/AssetForm';
import { PortfolioCharts } from '@/components/PortfolioCharts';
import { AITipCard } from '@/components/AITipCard';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  ArrowUpRight, 
  Layers, 
  Plus, 
  RefreshCw, 
  Clock, 
  Trash2, 
  Eye, 
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Globe,
  Wallet,
  Zap,
  BarChart3
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
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { cn } from '@/lib/utils';

type Language = 'en' | 'zh';

const translations = {
  en: {
    title: 'Asset Insights Pro',
    subtitle: 'INTELLIGENT WEALTH COMMAND',
    updateData: 'Sync Market',
    takeSnapshot: 'Log Snapshot',
    totalValue: 'Net Portfolio Value',
    assetCount: 'Total Units',
    items: 'items',
    addAsset: 'New Division',
    snapshotHistory: 'Timeline',
    manageHistory: 'Historical Evolution',
    noSnapshots: 'No historical logs available',
    snapshotDetail: 'Snapshot Intel',
    assetName: 'Asset Group',
    marketPrice: 'Price',
    holdings: 'Quantity',
    valuation: 'Valuation',
    fetching: 'Syncing...',
    dataUpdated: 'Market intelligence synchronized.',
    snapshotSaved: 'Snapshot logged to timeline.',
    snapshotDeleted: 'Entry purged.',
    dashboard: 'Intelligence Hub',
    valuationChange: 'Momentum (24h)'
  },
  zh: {
    title: 'Asset Insights Pro',
    subtitle: '智能財富管理終端',
    updateData: '同步市場',
    takeSnapshot: '建立快照',
    totalValue: '投資組合總淨值',
    assetCount: '資產項目',
    items: '個項目',
    addAsset: '新增部位',
    snapshotHistory: '歷史快照',
    manageHistory: '資產演化進程',
    noSnapshots: '尚無歷史紀錄',
    snapshotDetail: '快照詳情',
    assetName: '資產名稱',
    marketPrice: '當前市價',
    holdings: '持有數量',
    valuation: '帳面價值',
    fetching: '同步中...',
    dataUpdated: '市場情報已同步',
    snapshotSaved: '快照已存入時間線',
    snapshotDeleted: '快照已刪除',
    dashboard: '數據監控中心',
    valuationChange: '24H 動能'
  }
};

export default function ProfessionalAssetPage() {
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

  useEffect(() => {
    setMounted(true);
    const savedAssets = localStorage.getItem('assets');
    const savedSnapshots = localStorage.getItem('snapshots');
    const savedLang = localStorage.getItem('language');
    
    if (savedLang) setLanguage(savedLang as Language);
    if (savedAssets) setAssets(JSON.parse(savedAssets));
    else setAssets([{ id: 'default-1', name: 'Global Tech Index', symbol: 'QQQ', category: 'Stock', amount: 10, currency: 'USD' }]);
    
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
      console.error('Market sync failed', error);
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
        const usdValue = (asset.category === 'Stock' || asset.category === 'Crypto') ? asset.amount * (currentPrice || 1) : asset.amount;
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
    setSnapshots(prev => [...prev, newSnapshot]);
    toast({ title: t.snapshotSaved });
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 selection:bg-primary/20">
      <header className="glass-nav sticky top-0 z-50 h-20">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">{t.title}</h1>
              <p className="text-[10px] text-muted-foreground font-medium tracking-widest uppercase">{t.subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex bg-secondary p-1 rounded-lg">
              <Button 
                variant={language === 'zh' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setLanguage('zh')} 
                className="h-7 px-3 text-[11px] font-medium"
              >ZH</Button>
              <Button 
                variant={language === 'en' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setLanguage('en')} 
                className="h-7 px-3 text-[11px] font-medium"
              >EN</Button>
            </div>
            
            <Tabs value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)}>
              <TabsList className="h-9 bg-secondary">
                <TabsTrigger value="TWD" className="text-[11px] px-3">TWD</TabsTrigger>
                <TabsTrigger value="USD" className="text-[11px] px-3">USD</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Intelligence Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-8 pro-card overflow-hidden">
            <CardContent className="p-10 flex flex-col justify-between min-h-[380px]">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-semibold uppercase tracking-wider">
                  <Globe className="w-4 h-4 text-primary" />
                  {t.totalValue}
                </div>
                <div className="text-7xl font-bold tracking-tighter data-glow">
                  {getCurrencySymbol(displayCurrency)}{assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </div>
                
                {lastSnapshot && (
                  <div className={cn(
                    "inline-flex items-center gap-2 py-1 px-3 rounded-full text-xs font-bold bg-white/5 border",
                    assetCalculations.totalDiffTWD >= 0 ? "text-emerald-400 border-emerald-400/20" : "text-rose-400 border-rose-400/20"
                  )}>
                    {assetCalculations.totalDiffTWD >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {getCurrencySymbol(displayCurrency)}{Math.abs(assetCalculations.totalDiffDisplay).toLocaleString()} 
                    <span className="opacity-50 ml-1">({assetCalculations.totalDiffPercent >= 0 ? '+' : ''}{assetCalculations.totalDiffPercent.toFixed(2)}%)</span>
                  </div>
                )}
              </div>

              <div className="flex gap-12 pt-10 border-t border-border/40">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Exposure Strategy</p>
                  <p className="text-2xl font-bold">{assets.length} <span className="text-sm font-medium text-muted-foreground">{t.items}</span></p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Network Integrity</p>
                  <p className="text-2xl font-bold text-primary">Active</p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mb-1">Last Sync</p>
                  <p className="text-2xl font-bold text-muted-foreground">Real-time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-4 grid grid-rows-2 gap-6">
            <Button 
              onClick={takeSnapshot} 
              className="h-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold flex flex-col items-center justify-center gap-3 rounded-2xl group transition-all duration-500"
            >
              <Zap className="w-8 h-8 transition-transform group-hover:scale-110" />
              <div className="text-center">
                <span className="block text-lg tracking-tight">{t.takeSnapshot}</span>
                <span className="text-[10px] opacity-70 font-medium uppercase tracking-widest">Archive Current Matrix</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              onClick={updateMarketData} 
              disabled={loading} 
              className="h-full border-border/50 bg-secondary/30 hover:bg-secondary/50 font-bold flex flex-col items-center justify-center gap-3 rounded-2xl group transition-all duration-500"
            >
              <RefreshCw className={cn("w-8 h-8 text-primary", loading && "animate-spin")} />
              <div className="text-center">
                <span className="block text-lg tracking-tight">{t.updateData}</span>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Market Intel Sync</span>
              </div>
            </Button>
          </div>
        </section>

        {/* Data Matrix */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left Column: Visualizers */}
          <div className="xl:col-span-8 space-y-6">
            <Card className="pro-card">
              <CardHeader className="p-8 border-b border-border/40">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    {t.dashboard}
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] px-3 border-primary/20 text-primary uppercase font-bold tracking-widest animate-pulse-subtle">
                    Live Data Feed
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-secondary/30">
                    <TableRow className="hover:bg-transparent border-border/40">
                      <TableHead className="px-8 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.assetName}</TableHead>
                      <TableHead className="px-8 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.marketPrice}</TableHead>
                      <TableHead className="px-8 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t.valuationChange}</TableHead>
                      <TableHead className="px-8 py-5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-right">{t.valuation}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assetCalculations.processedAssets.map(asset => (
                      <TableRow key={asset.id} className="border-border/40 hover:bg-white/[0.02] group transition-colors">
                        <TableCell className="px-8 py-8">
                          <div className="font-bold text-base text-white">{asset.name}</div>
                          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">{asset.symbol}</div>
                        </TableCell>
                        <TableCell className="px-8 py-8">
                          {(asset.category === 'Stock' || asset.category === 'Crypto') ? (
                            <span className="font-bold text-sm text-muted-foreground">
                              {asset.calculatedPrice > 0 ? `${getCurrencySymbol(asset.currency)}${asset.calculatedPrice.toLocaleString()}` : t.fetching}
                            </span>
                          ) : '--'}
                        </TableCell>
                        <TableCell className="px-8 py-8">
                          {asset.hasHistory ? (
                            <div className={cn(
                              "text-[11px] font-bold inline-flex items-center gap-1.5 px-2 py-1 rounded-md",
                              asset.diffTWD >= 0 ? "text-emerald-400 bg-emerald-400/10" : "text-rose-400 bg-rose-400/10"
                            )}>
                              {asset.diffTWD >= 0 ? '+' : '-'}{asset.diffPercent.toFixed(2)}%
                            </div>
                          ) : (
                            <span className="text-[10px] text-primary/60 font-bold uppercase tracking-widest">New Entry</span>
                          )}
                        </TableCell>
                        <TableCell className="px-8 py-8 text-right">
                          <span className="font-bold text-xl tracking-tight text-white">
                            {getCurrencySymbol(displayCurrency)}{asset.valueInDisplay.toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {assets.length === 0 && (
                  <div className="py-24 text-center text-muted-foreground/30 font-bold text-2xl uppercase tracking-[0.2em]">Deploy Assets to Begin</div>
                )}
              </CardContent>
            </Card>

            <PortfolioCharts 
              language={language}
              allocationData={assetCalculations.allocationData} 
              historicalData={snapshots} 
              displayCurrency={displayCurrency}
              rates={marketData.rates}
            />
          </div>
          
          {/* Right Column: Operations */}
          <div className="xl:col-span-4 space-y-6">
            <Card className="pro-card">
              <CardHeader className="p-8 border-b border-border/40">
                <CardTitle className="text-lg font-bold flex items-center gap-3">
                  <Plus className="w-5 h-5 text-primary" />
                  {t.addAsset}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <AssetForm language={language} onAdd={(a) => setAssets(prev => [...prev, { ...a, id: crypto.randomUUID() }])} />
              </CardContent>
            </Card>

            <Card className="pro-card">
              <CardHeader className="p-8 border-b border-border/40">
                <CardTitle className="text-lg font-bold flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  {t.snapshotHistory}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {snapshots.slice().reverse().map(s => (
                    <div key={s.id} className="flex items-center justify-between p-6 hover:bg-white/[0.02] group transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{new Date(s.date).toLocaleDateString()}</div>
                          <div className="text-[10px] text-muted-foreground font-bold mt-0.5 tracking-wider uppercase">
                            VALUATION: {getCurrencySymbol(displayCurrency)}{convertTWDToDisplay(s.totalTWD).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-primary/10 hover:text-primary"><Eye className="w-4 h-4" /></Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl bg-card border-border/50 text-foreground">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-bold">{t.snapshotDetail}</DialogTitle>
                            </DialogHeader>
                            <div className="mt-4 max-h-[60vh] overflow-y-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="hover:bg-transparent border-border/40">
                                    <TableHead className="font-bold text-xs uppercase tracking-widest">{t.assetName}</TableHead>
                                    <TableHead className="text-right font-bold text-xs uppercase tracking-widest">{t.valuation}</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {s.assets?.map((a, idx) => (
                                    <TableRow key={idx} className="border-border/40">
                                      <TableCell className="py-4 font-medium text-sm text-muted-foreground">{a.name}</TableCell>
                                      <TableCell className="py-4 text-right font-bold text-white">{getCurrencySymbol(displayCurrency)} {convertTWDToDisplay(a.valueInTWD || 0).toLocaleString()}</TableCell>
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
                          className="w-8 h-8 hover:bg-rose-500/10 hover:text-rose-500" 
                          onClick={() => { setSnapshots(prev => prev.filter(snap => snap.id !== s.id)); toast({ title: t.snapshotDeleted }); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {snapshots.length === 0 && (
                    <div className="py-12 text-center text-muted-foreground/30 text-xs font-bold uppercase tracking-widest">{t.noSnapshots}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Intelligence Layer */}
        <section className="pt-10">
           <AITipCard 
              language={language} 
              assets={assetCalculations.processedAssets.map(a => ({ name: a.name, symbol: a.symbol, category: a.category, amount: a.amount, currency: a.currency, price: a.calculatedPrice, valueInTWD: a.valueInTWD }))}
              totalTWD={assetCalculations.totalTWD}
              marketConditions={`USD/TWD: ${(marketData.rates.TWD || 32.5).toFixed(2)} | NODE_STATUS: OPTIMAL`} 
            />
        </section>
      </main>

      <footer className="py-20 border-t border-border/40 text-center">
        <div className="space-y-3 opacity-40 hover:opacity-100 transition-opacity">
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-primary">Nexus Asset Core 2026</p>
          <p className="text-[9px] font-medium text-muted-foreground max-w-md mx-auto leading-relaxed uppercase tracking-widest">
            Data is encrypted and synchronized across the secure distributed ledger. 
            Automated intelligence layer active.
          </p>
        </div>
      </footer>
    </div>
  );
}