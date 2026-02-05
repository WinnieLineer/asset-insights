
'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
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
  Languages,
  ArrowRight,
  Info,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  LayoutDashboard,
  Plus
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type Language = 'en' | 'zh';

const translations = {
  en: {
    title: 'Asset Insights',
    subtitle: 'Professional Grade Asset Tracking & Analysis',
    updateData: 'Refresh Market',
    takeSnapshot: 'Snapshot',
    totalValue: 'Net Worth',
    assetCount: 'Assets',
    items: 'items',
    addAsset: 'New Asset',
    snapshotHistory: 'Snapshots',
    manageHistory: 'Historical portfolio data.',
    noSnapshots: 'No data yet.',
    snapshotDetail: 'Snapshot Detail',
    snapshotDetailDesc: 'Portfolio breakdown at this specific time.',
    assetName: 'Asset',
    marketPrice: 'Price',
    holdings: 'Amount',
    valuation: 'Value',
    fetching: 'Syncing...',
    stockUnit: 'sh',
    dataUpdated: 'Market data synced',
    snapshotSaved: 'Snapshot archived',
    snapshotDeleted: 'Snapshot removed',
    vsLast: 'vs. Previous',
    valuationChange: 'Change',
    dashboard: 'Dashboard',
    history: 'History'
  },
  zh: {
    title: 'Asset Insights',
    subtitle: '專業級個人資產配置與深度分析',
    updateData: '更新市場數據',
    takeSnapshot: '儲存快照',
    totalValue: '資產淨值估計',
    assetCount: '持有項目',
    items: '個項目',
    addAsset: '新增資產項目',
    snapshotHistory: '歷史數據快照',
    manageHistory: '查看過去儲存的配置紀錄。',
    noSnapshots: '尚無歷史快照。',
    snapshotDetail: '快照詳細資訊',
    snapshotDetailDesc: '查看此時間點的詳細資產價值。',
    assetName: '資產名稱',
    marketPrice: '市場單價',
    holdings: '持有數量',
    valuation: '估值',
    fetching: '同步中...',
    stockUnit: '股',
    dataUpdated: '市場數據已更新',
    snapshotSaved: '已儲存歷史快照',
    snapshotDeleted: '快照已刪除',
    vsLast: '較前次快照',
    valuationChange: '估值漲跌',
    dashboard: '資產儀表板',
    history: '歷史紀錄'
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
      toast({ title: t.dataUpdated, description: `1 USD = ${data.rates.TWD.toFixed(2)} TWD` });
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

      let valueInDisplay = convertTWDToDisplay(valueInTWD);

      const previousAsset = lastSnapshot?.assets?.find(pa => pa.id === asset.id);
      const diffTWD = previousAsset ? valueInTWD - (previousAsset.valueInTWD || 0) : 0;
      const diffPercent = previousAsset && previousAsset.valueInTWD ? (diffTWD / previousAsset.valueInTWD) * 100 : 0;

      return { 
        ...asset, 
        calculatedPrice: currentPrice, 
        valueInTWD, 
        valueInDisplay,
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
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-30 w-full bg-white/80 backdrop-blur-xl border-b">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-headline font-bold text-foreground">{t.title}</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest hidden md:block">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <Tabs value={language} onValueChange={(v) => setLanguage(v as Language)} className="hidden sm:block">
              <TabsList className="h-8 bg-slate-100">
                <TabsTrigger value="en" className="text-xs">EN</TabsTrigger>
                <TabsTrigger value="zh" className="text-xs">中</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="h-8 w-px bg-border hidden sm:block" />
            <Tabs value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)}>
              <TabsList className="h-8 bg-slate-100">
                <TabsTrigger value="TWD" className="text-xs">TWD</TabsTrigger>
                <TabsTrigger value="USD" className="text-xs">USD</TabsTrigger>
                <TabsTrigger value="CNY" className="text-xs">CNY</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button size="sm" onClick={takeSnapshot} className="hidden md:flex shadow-md shadow-primary/20">
              <History className="h-4 w-4 mr-2" />
              {t.takeSnapshot}
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/50 bg-gradient-to-br from-primary via-blue-600 to-indigo-700 text-white overflow-hidden relative">
             <div className="absolute top-0 right-0 p-8 opacity-10">
               <Wallet className="h-32 w-32" />
             </div>
             <CardHeader className="pb-0">
               <CardDescription className="text-white/70 font-medium">{t.totalValue}</CardDescription>
               <CardTitle className="text-4xl md:text-5xl font-headline font-bold tracking-tight">
                 {getCurrencySymbol(displayCurrency)} {assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}
               </CardTitle>
             </CardHeader>
             <CardContent className="pt-4">
               {lastSnapshot && (
                 <div className={cn(
                   "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold",
                   assetCalculations.totalDiffTWD >= 0 ? "bg-white/20 text-white" : "bg-red-500/30 text-white"
                 )}>
                   {assetCalculations.totalDiffTWD >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                   {getCurrencySymbol(displayCurrency)}{Math.abs(assetCalculations.totalDiffDisplay).toLocaleString(undefined, { maximumFractionDigits: 2 })} 
                   ({assetCalculations.totalDiffPercent >= 0 ? '+' : ''}{assetCalculations.totalDiffPercent.toFixed(2)}%)
                   <span className="opacity-70 font-normal ml-1">since last</span>
                 </div>
               )}
             </CardContent>
             <CardFooter className="pt-0 flex gap-4">
                <div className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                  <div className="text-[10px] uppercase opacity-70">Total Assets</div>
                  <div className="text-sm font-bold">{assets.length} {t.items}</div>
                </div>
                <div className="bg-white/10 px-3 py-1.5 rounded-lg backdrop-blur-sm">
                  <div className="text-[10px] uppercase opacity-70">FX Rate</div>
                  <div className="text-sm font-bold">1:{marketData.rates.TWD.toFixed(2)}</div>
                </div>
             </CardFooter>
          </Card>

          <div className="lg:col-span-2 h-full">
            <AITipCard 
              language={language} 
              assets={assetCalculations.processedAssets.map(a => ({ name: a.name, symbol: a.symbol, category: a.category, amount: a.amount, currency: a.currency, price: a.calculatedPrice, valueInTWD: a.valueInTWD }))}
              totalTWD={assetCalculations.totalTWD}
              marketConditions={`1 USD = ${(marketData.rates.TWD || 32.5).toFixed(2)} TWD`} 
            />
          </div>
        </section>

        <PortfolioCharts 
          language={language}
          allocationData={assetCalculations.allocationData} 
          historicalData={snapshots} 
          displayCurrency={displayCurrency}
          rates={marketData.rates}
        />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-1 space-y-8">
            <Card className="border-none shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{t.addAsset}</CardTitle>
                  <CardDescription>Track new items in your portfolio</CardDescription>
                </div>
                <div className="bg-primary/10 p-2 rounded-full">
                  <Plus className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <AssetForm language={language} onAdd={handleAddAsset} />
              </CardContent>
            </Card>

            <Card className="border-none shadow-lg overflow-hidden">
              <CardHeader className="bg-slate-50/50">
                <CardTitle className="text-lg flex items-center gap-2"><History className="h-5 w-5 text-primary" /> {t.snapshotHistory}</CardTitle>
                <CardDescription>{t.manageHistory}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {snapshots.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <History className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    {t.noSnapshots}
                  </div>
                ) : (
                  <div className="divide-y">
                    {snapshots.slice().reverse().map(s => (
                      <div key={s.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-primary/5 rounded-full flex items-center justify-center text-primary">
                            <Calendar className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-sm font-bold">{new Date(s.date).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW')}</div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {getCurrencySymbol(displayCurrency)} {convertTWDToDisplay(s.totalTWD).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white"><Eye className="h-4 w-4" /></Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>{t.snapshotDetail} - {new Date(s.date).toLocaleString(language === 'en' ? 'en-US' : 'zh-TW')}</DialogTitle>
                                <DialogDescription>{t.snapshotDetailDesc}</DialogDescription>
                              </DialogHeader>
                              <div className="max-h-[60vh] overflow-y-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="bg-slate-50">
                                      <TableHead className="font-bold text-xs uppercase">{t.assetName}</TableHead>
                                      <TableHead className="font-bold text-xs uppercase text-right">{t.holdings}</TableHead>
                                      <TableHead className="font-bold text-xs uppercase text-right">{t.valuation} ({displayCurrency})</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {s.assets?.map((a, idx) => (
                                      <TableRow key={idx}>
                                        <TableCell>
                                          <div className="font-bold text-sm">{a.name}</div>
                                          <div className="text-[10px] text-muted-foreground uppercase">{a.symbol}</div>
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
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/50 hover:text-destructive hover:bg-white" onClick={() => { setSnapshots(prev => prev.filter(snap => snap.id !== s.id)); toast({ title: t.snapshotDeleted }); }}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          <div className="xl:col-span-2">
            <Card className="border-none shadow-lg overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2"><LayoutDashboard className="h-5 w-5 text-primary" /> {t.dashboard}</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={updateMarketData} disabled={loading} className="bg-white h-8 text-xs">
                  <RefreshCw className={cn("h-3 w-3 mr-2", loading && "animate-spin")} />
                  {t.updateData}
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/30">
                      <TableHead className="font-bold text-xs uppercase py-4">{t.assetName}</TableHead>
                      <TableHead className="font-bold text-xs uppercase hidden md:table-cell">{t.marketPrice}</TableHead>
                      <TableHead className="font-bold text-xs uppercase">{t.holdings}</TableHead>
                      <TableHead className="font-bold text-xs uppercase text-right">{t.valuationChange}</TableHead>
                      <TableHead className="font-bold text-xs uppercase text-right">{t.valuation} ({displayCurrency})</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assetCalculations.processedAssets.map(asset => (
                      <TableRow key={asset.id} className="group hover:bg-blue-50/30 transition-colors">
                        <TableCell>
                          <div className="font-bold text-sm">{asset.name}</div>
                          <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">{asset.symbol}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div className="text-xs font-mono text-muted-foreground">
                            {(asset.category === 'Stock' || asset.category === 'Crypto') ? (asset.calculatedPrice > 0 ? `${getCurrencySymbol(asset.currency)}${asset.calculatedPrice.toLocaleString()}` : t.fetching) : '--'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {editingId === asset.id ? (
                            <div className="flex items-center gap-1">
                              <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="h-8 w-20 text-xs font-mono" step="any" autoFocus />
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => { setAssets(prev => prev.map(a => a.id === editingId ? { ...a, amount: parseFloat(editAmount) || 0 } : a)); setEditingId(null); }}><Check className="h-3 w-3" /></Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group/amount cursor-pointer" onClick={() => { setEditingId(asset.id); setEditAmount(asset.amount.toString()); }}>
                              <div className="font-mono text-sm font-semibold">{asset.amount.toLocaleString(undefined, { maximumFractionDigits: 5 })}</div>
                              <Edit2 className="h-3 w-3 text-muted-foreground opacity-0 group-hover/amount:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {asset.hasHistory ? (
                            <div className={cn(
                              "text-[11px] font-bold whitespace-nowrap px-2 py-0.5 rounded-md inline-block",
                              asset.diffTWD >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            )}>
                              {asset.diffTWD >= 0 ? '+' : ''}{getCurrencySymbol(displayCurrency)}{Math.abs(convertTWDToDisplay(asset.diffTWD)).toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}
                              <span className="ml-1 opacity-80">
                                ({asset.diffTWD >= 0 ? '+' : ''}{asset.diffPercent.toFixed(2)}%)
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground opacity-30">--</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-bold text-slate-900">
                          {getCurrencySymbol(displayCurrency)} {asset.valueInDisplay.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => setAssets(prev => prev.filter(a => a.id !== asset.id))} className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {assets.length === 0 && (
                  <div className="py-20 text-center">
                    <Wallet className="h-12 w-12 mx-auto mb-4 opacity-10 text-primary" />
                    <p className="text-muted-foreground text-sm font-medium">No assets tracked yet. Start by adding one!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
