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
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-body text-slate-900">
      <header className="sticky top-0 z-50 w-full glass-panel border-b">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-xl text-white">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold tracking-tight">{t.title}</h1>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{t.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex bg-slate-100 p-1 rounded-xl">
              <Button variant={language === 'zh' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('zh')} className="text-xs h-7 px-3 rounded-lg">繁中</Button>
              <Button variant={language === 'en' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('en')} className="text-xs h-7 px-3 rounded-lg">EN</Button>
            </div>
            <Tabs value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)} className="hidden sm:block">
              <TabsList className="h-9 bg-slate-100 rounded-xl">
                <TabsTrigger value="TWD" className="text-xs px-3 rounded-lg">TWD</TabsTrigger>
                <TabsTrigger value="USD" className="text-xs px-3 rounded-lg">USD</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-8 animate-in fade-in duration-500">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-8 hero-gradient border-none text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-5">
               <Wallet className="h-48 w-48" />
             </div>
             <CardHeader className="relative z-10 pt-8 px-8">
               <div className="flex items-center gap-2 text-white/50 mb-2 text-xs font-bold tracking-wider uppercase">
                 <LayoutDashboard className="h-3.5 w-3.5" />
                 {t.totalValue}
               </div>
               <CardTitle className="text-4xl md:text-6xl font-headline font-bold tracking-tight">
                 {getCurrencySymbol(displayCurrency)}{assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}
               </CardTitle>
             </CardHeader>
             <CardContent className="relative z-10 px-8 pb-8">
               {lastSnapshot && (
                 <div className={cn(
                   "inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-white/10",
                   assetCalculations.totalDiffTWD >= 0 ? "bg-white/10 text-white" : "bg-red-500/20 text-white"
                 )}>
                   {assetCalculations.totalDiffTWD >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                   {getCurrencySymbol(displayCurrency)}{Math.abs(assetCalculations.totalDiffDisplay).toLocaleString(undefined, { maximumFractionDigits: 2 })} 
                   <span className="opacity-60 ml-1">({assetCalculations.totalDiffPercent >= 0 ? '+' : ''}{assetCalculations.totalDiffPercent.toFixed(2)}%)</span>
                 </div>
               )}
               <div className="mt-8 flex gap-8">
                 <div className="space-y-1">
                   <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{t.assetCount}</p>
                   <p className="text-xl font-bold">{assets.length} <span className="text-xs font-normal opacity-40 ml-1">{t.items}</span></p>
                 </div>
                 <div className="w-px h-10 bg-white/10" />
                 <div className="space-y-1">
                   <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">USD/TWD</p>
                   <p className="text-xl font-bold">{marketData.rates.TWD.toFixed(2)}</p>
                 </div>
               </div>
             </CardContent>
          </Card>

          <div className="lg:col-span-4 flex flex-col gap-4">
            <Button 
              onClick={takeSnapshot} 
              className="h-full rounded-[1.5rem] bg-slate-900 hover:bg-slate-800 text-white flex flex-col items-center justify-center gap-2 transition-transform active:scale-95 shadow-lg"
            >
              <History className="h-6 w-6 mb-1" />
              <div className="text-center">
                <span className="block text-lg font-bold">{t.takeSnapshot}</span>
                <span className="text-[10px] opacity-40">Benchmark current portfolio</span>
              </div>
            </Button>
            <Button 
              variant="outline" 
              onClick={updateMarketData} 
              disabled={loading} 
              className="h-20 rounded-[1.5rem] border-slate-200 hover:border-primary/40 flex items-center justify-center gap-3 transition-colors"
            >
              <RefreshCw className={cn("h-5 w-5 text-slate-400", loading && "animate-spin")} />
              <span className="font-bold">{t.updateData}</span>
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PortfolioCharts 
            language={language}
            allocationData={assetCalculations.allocationData} 
            historicalData={snapshots} 
            displayCurrency={displayCurrency}
            rates={marketData.rates}
          />
        </section>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-4 space-y-8">
            <Card className="neo-card">
              <CardHeader className="pb-4 border-b border-slate-50">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Plus className="h-4 w-4 text-primary" />
                  {t.addAsset}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <AssetForm language={language} onAdd={handleAddAsset} />
              </CardContent>
            </Card>

            <Card className="neo-card">
              <CardHeader className="pb-4 border-b border-slate-50">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <History className="h-4 w-4 text-slate-400" />
                  {t.snapshotHistory}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {snapshots.length === 0 ? (
                  <div className="text-center py-12 text-slate-300 text-xs font-bold">{t.noSnapshots}</div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {snapshots.slice().reverse().map(s => (
                      <div key={s.id} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-4 w-4 text-slate-400" />
                          <div>
                            <div className="text-sm font-bold">{new Date(s.date).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                            <div className="text-[10px] text-slate-400 font-bold">
                              {getCurrencySymbol(displayCurrency)} {convertTWDToDisplay(s.totalTWD).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg"><Eye className="h-4 w-4" /></Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-xl rounded-[2rem]">
                              <DialogHeader>
                                <DialogTitle className="text-xl font-bold">{t.snapshotDetail}</DialogTitle>
                                <DialogDescription>{new Date(s.date).toLocaleString()}</DialogDescription>
                              </DialogHeader>
                              <div className="max-h-[40vh] overflow-y-auto mt-4 pr-2">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="border-none bg-slate-50/50">
                                      <TableHead className="text-[10px] font-bold uppercase">{t.assetName}</TableHead>
                                      <TableHead className="text-[10px] font-bold uppercase text-right">{t.holdings}</TableHead>
                                      <TableHead className="text-[10px] font-bold uppercase text-right">{t.valuation}</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {s.assets?.map((a, idx) => (
                                      <TableRow key={idx} className="border-slate-50">
                                        <TableCell className="py-3">
                                          <div className="font-bold text-xs">{a.name}</div>
                                          <div className="text-[9px] text-slate-400 font-mono uppercase">{a.symbol}</div>
                                        </TableCell>
                                        <TableCell className="text-right text-xs font-mono">{a.amount.toLocaleString(undefined, { maximumFractionDigits: 4 })}</TableCell>
                                        <TableCell className="text-right font-bold text-xs text-primary">{getCurrencySymbol(displayCurrency)} {convertTWDToDisplay(a.valueInTWD || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
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
                            className="h-8 w-8 rounded-lg text-slate-300 hover:text-red-500" 
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
              <CardHeader className="border-b border-slate-50 py-6 px-8">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <LayoutDashboard className="h-5 w-5 text-primary" />
                  {t.dashboard}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="py-4 px-8 text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.assetName}</TableHead>
                      <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 hidden md:table-cell">{t.marketPrice}</TableHead>
                      <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">{t.holdings}</TableHead>
                      <TableHead className="py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">{t.valuationChange}</TableHead>
                      <TableHead className="py-4 px-8 text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right">{t.valuation}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assetCalculations.processedAssets.map(asset => (
                      <TableRow key={asset.id} className="hover:bg-slate-50/50 border-slate-50">
                        <TableCell className="px-8 py-6">
                          <div className="font-bold text-base">{asset.name}</div>
                          <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{asset.symbol}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <span className="text-xs font-mono text-slate-500">
                            {(asset.category === 'Stock' || asset.category === 'Crypto') ? (asset.calculatedPrice > 0 ? `${getCurrencySymbol(asset.currency)}${asset.calculatedPrice.toLocaleString()}` : t.fetching) : '--'}
                          </span>
                        </TableCell>
                        <TableCell>
                          {editingId === asset.id ? (
                            <div className="flex items-center gap-2">
                              <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="h-8 w-24 text-xs font-mono" step="any" autoFocus />
                              <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700" onClick={() => { setAssets(prev => prev.map(a => a.id === editingId ? { ...a, amount: parseFloat(editAmount) || 0 } : a)); setEditingId(null); }}><Check className="h-4 w-4" /></Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => { setEditingId(asset.id); setEditAmount(asset.amount.toString()); }}>
                              <span className="font-mono text-sm font-bold text-slate-600">{asset.amount.toLocaleString(undefined, { maximumFractionDigits: 5 })}</span>
                              <Edit2 className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {asset.hasHistory ? (
                            <div className={cn(
                              "text-[10px] font-bold inline-flex flex-col items-end px-2 py-1 rounded-lg",
                              asset.diffTWD >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
                            )}>
                              <span>{asset.diffTWD >= 0 ? '+' : ''}{getCurrencySymbol(displayCurrency)}{Math.abs(convertTWDToDisplay(asset.diffTWD)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                              <span className="opacity-60">({asset.diffTWD >= 0 ? '+' : ''}{asset.diffPercent.toFixed(2)}%)</span>
                            </div>
                          ) : (
                            <span className="text-[9px] text-slate-300 font-bold uppercase">Initial</span>
                          )}
                        </TableCell>
                        <TableCell className="px-8 text-right font-bold text-lg">
                          {getCurrencySymbol(displayCurrency)}{asset.valueInDisplay.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {assets.length === 0 && (
                  <div className="py-20 text-center text-slate-300 font-bold text-sm">No assets tracked yet.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <section className="pt-8">
           <AITipCard 
              language={language} 
              assets={assetCalculations.processedAssets.map(a => ({ name: a.name, symbol: a.symbol, category: a.category, amount: a.amount, currency: a.currency, price: a.calculatedPrice, valueInTWD: a.valueInTWD }))}
              totalTWD={assetCalculations.totalTWD}
              marketConditions={`1 USD = ${(marketData.rates.TWD || 32.5).toFixed(2)} TWD`} 
            />
        </section>
      </main>

      <footer className="py-12 text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest opacity-60">
        Asset Insights • Secure Financial Analytics
      </footer>
    </div>
  );
}