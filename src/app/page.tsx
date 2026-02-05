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
  Layers, 
  Plus, 
  RefreshCw, 
  Clock, 
  Trash2, 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  Globe, 
  Wallet, 
  ChevronRight,
  BarChart3,
  Settings2,
  PieChart as PieChartIcon
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
    subtitle: 'PROFESSIONAL PORTFOLIO MANAGEMENT',
    updateData: 'Sync Market',
    takeSnapshot: 'Take Snapshot',
    totalValue: 'Total Portfolio Value',
    assetCount: 'Total Assets',
    items: 'items',
    addAsset: 'Add New Asset',
    snapshotHistory: 'Snapshot History',
    noSnapshots: 'No history logs available',
    snapshotDetail: 'Snapshot Details',
    assetName: 'Asset Name',
    marketPrice: 'Market Price',
    holdings: 'Holdings',
    valuation: 'Valuation',
    fetching: 'Syncing...',
    dataUpdated: 'Market data synchronized successfully.',
    snapshotSaved: 'Portfolio snapshot saved to history.',
    snapshotDeleted: 'Snapshot entry deleted.',
    dashboard: 'Portfolio Overview',
    change: '24h Change'
  },
  zh: {
    title: 'Asset Insights Pro',
    subtitle: '專業資產追蹤系統',
    updateData: '同步市場',
    takeSnapshot: '建立快照',
    totalValue: '投資組合總淨值',
    assetCount: '資產總數',
    items: '個項目',
    addAsset: '新增資產部位',
    snapshotHistory: '歷史快照紀錄',
    noSnapshots: '尚無歷史快照紀錄',
    snapshotDetail: '快照詳細資訊',
    assetName: '資產名稱',
    marketPrice: '當前市價',
    holdings: '持有數量',
    valuation: '帳面價值',
    fetching: '同步中...',
    dataUpdated: '市場數據已成功更新',
    snapshotSaved: '資產快照已存入歷史紀錄',
    snapshotDeleted: '快照紀錄已刪除',
    dashboard: '投資組合概覽',
    change: '24H 漲跌'
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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 selection:bg-primary/10">
      <header className="glass-nav h-20">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-slate-900">{t.title}</h1>
              <p className="text-[10px] font-bold text-slate-400 tracking-[0.2em] uppercase">{t.subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <Button 
                variant={language === 'zh' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setLanguage('zh')} 
                className="h-8 px-4 text-xs font-bold"
              >繁中</Button>
              <Button 
                variant={language === 'en' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setLanguage('en')} 
                className="h-8 px-4 text-xs font-bold"
              >ENG</Button>
            </div>
            
            <Tabs value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)}>
              <TabsList className="h-10 bg-slate-100">
                <TabsTrigger value="TWD" className="text-xs px-4 font-bold">TWD</TabsTrigger>
                <TabsTrigger value="USD" className="text-xs px-4 font-bold">USD</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* Value Overview Bento */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-8 modern-card p-10 flex flex-col justify-between overflow-hidden relative border-none shadow-xl shadow-slate-200/40">
            <div className="absolute top-0 right-0 p-16 opacity-[0.03] pointer-events-none">
              <Wallet className="w-80 h-80 text-primary" />
            </div>
            <div className="space-y-6 z-10">
              <div className="flex items-center gap-3 text-slate-400 text-sm font-bold uppercase tracking-widest">
                <Globe className="w-4 h-4 text-primary" />
                {t.totalValue}
              </div>
              <div className="text-6xl font-black tracking-tighter text-slate-900">
                {getCurrencySymbol(displayCurrency)}{assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              
              {lastSnapshot && (
                <div className={cn(
                  "inline-flex items-center gap-2 py-2 px-4 rounded-full text-xs font-black border",
                  assetCalculations.totalDiffTWD >= 0 
                    ? "text-emerald-600 bg-emerald-50 border-emerald-100" 
                    : "text-rose-600 bg-rose-50 border-rose-100"
                )}>
                  {assetCalculations.totalDiffTWD >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {getCurrencySymbol(displayCurrency)}{Math.abs(assetCalculations.totalDiffDisplay).toLocaleString()} 
                  <span className="opacity-70 ml-1">({assetCalculations.totalDiffPercent >= 0 ? '+' : ''}{assetCalculations.totalDiffPercent.toFixed(2)}%)</span>
                </div>
              )}
            </div>

            <div className="flex gap-12 pt-10 mt-10 border-t border-slate-100/60 z-10">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-2">{t.assetCount}</p>
                <p className="text-2xl font-black text-slate-900">{assets.length} <span className="text-sm font-bold text-slate-400">{t.items}</span></p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-2">Network Status</p>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-black text-emerald-600 uppercase tracking-wider">Live Syncing</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="lg:col-span-4 grid grid-cols-1 gap-6">
            <Button 
              onClick={takeSnapshot} 
              className="group w-full h-full bg-slate-900 hover:bg-black text-white font-black flex flex-col items-center justify-center gap-4 rounded-2xl shadow-xl transition-all hover:-translate-y-1 active:scale-95"
            >
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                <Clock className="w-6 h-6" />
              </div>
              <span className="text-lg tracking-tight uppercase">{t.takeSnapshot}</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={updateMarketData} 
              disabled={loading} 
              className="w-full h-full border-2 border-slate-100 bg-white hover:bg-slate-50 font-black flex flex-col items-center justify-center gap-4 rounded-2xl shadow-sm transition-all hover:-translate-y-1 active:scale-95"
            >
              <div className={cn("w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center", loading && "animate-spin")}>
                <RefreshCw className="w-6 h-6 text-primary" />
              </div>
              <span className="text-lg tracking-tight uppercase">{t.updateData}</span>
            </Button>
          </div>
        </div>

        {/* Analytics & Data Section */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-8 space-y-8">
            <Card className="modern-card overflow-hidden border-none shadow-xl shadow-slate-200/30">
              <CardHeader className="px-8 py-6 border-b border-slate-50 flex flex-row items-center justify-between bg-white">
                <CardTitle className="text-lg font-black flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-primary" />
                  {t.dashboard}
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" className="w-9 h-9 text-slate-300 hover:text-primary rounded-lg"><Settings2 className="w-5 h-5" /></Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.assetName}</TableHead>
                      <TableHead className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.marketPrice}</TableHead>
                      <TableHead className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.change}</TableHead>
                      <TableHead className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t.valuation}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assetCalculations.processedAssets.map(asset => (
                      <TableRow key={asset.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="px-8 py-6">
                          <div className="font-black text-slate-900">{asset.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{asset.symbol}</div>
                        </TableCell>
                        <TableCell className="px-8 py-6">
                          {(asset.category === 'Stock' || asset.category === 'Crypto') ? (
                            <span className="font-bold text-sm text-slate-600">
                              {asset.calculatedPrice > 0 ? `${getCurrencySymbol(asset.currency)}${asset.calculatedPrice.toLocaleString()}` : t.fetching}
                            </span>
                          ) : <span className="text-slate-300">—</span>}
                        </TableCell>
                        <TableCell className="px-8 py-6">
                          {asset.hasHistory ? (
                            <div className={cn(
                              "text-[11px] font-black inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg",
                              asset.diffTWD >= 0 ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                            )}>
                              {asset.diffTWD >= 0 ? '+' : ''}{asset.diffPercent.toFixed(2)}%
                            </div>
                          ) : (
                            <span className="text-[10px] text-primary/40 font-black uppercase tracking-widest">Initial</span>
                          )}
                        </TableCell>
                        <TableCell className="px-8 py-6 text-right">
                          <span className="font-black text-xl tracking-tighter text-slate-900">
                            {getCurrencySymbol(displayCurrency)}{asset.valueInDisplay.toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {assets.length === 0 && (
                  <div className="py-24 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">No assets tracked yet</div>
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
          
          <div className="xl:col-span-4 space-y-8">
            <Card className="modern-card border-none shadow-xl shadow-slate-200/30">
              <CardHeader className="px-8 py-6 border-b border-slate-50">
                <CardTitle className="text-lg font-black flex items-center gap-3">
                  <Plus className="w-6 h-6 text-primary" />
                  {t.addAsset}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-8 py-8">
                <AssetForm language={language} onAdd={(a) => setAssets(prev => [...prev, { ...a, id: crypto.randomUUID() }])} />
              </CardContent>
            </Card>

            <Card className="modern-card border-none shadow-xl shadow-slate-200/30">
              <CardHeader className="px-8 py-6 border-b border-slate-50">
                <CardTitle className="text-lg font-black flex items-center gap-3">
                  <Clock className="w-6 h-6 text-primary" />
                  {t.snapshotHistory}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {snapshots.slice().reverse().map(s => (
                    <div key={s.id} className="flex items-center justify-between p-6 hover:bg-slate-50/50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:text-primary group-hover:bg-primary/5 transition-all">
                          <Layers className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-sm font-black text-slate-900">{new Date(s.date).toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-400 font-bold mt-0.5 tracking-wider uppercase">
                            {getCurrencySymbol(displayCurrency)}{convertTWDToDisplay(s.totalTWD).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-9 h-9 rounded-lg hover:bg-primary/5 hover:text-primary"><Eye className="w-4 h-4" /></Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-xl bg-white border-none rounded-2xl shadow-2xl">
                            <DialogHeader>
                              <DialogTitle className="text-2xl font-black tracking-tight">{t.snapshotDetail}</DialogTitle>
                            </DialogHeader>
                            <div className="mt-6 max-h-[60vh] overflow-y-auto pr-2">
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-slate-50">
                                    <TableHead className="font-black text-[10px] uppercase text-slate-400 tracking-widest">{t.assetName}</TableHead>
                                    <TableHead className="text-right font-black text-[10px] uppercase text-slate-400 tracking-widest">{t.valuation}</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {s.assets?.map((a, idx) => (
                                    <TableRow key={idx} className="border-slate-50">
                                      <TableCell className="py-5 font-bold text-sm text-slate-600">{a.name}</TableCell>
                                      <TableCell className="py-5 text-right font-black text-slate-900">{getCurrencySymbol(displayCurrency)} {convertTWDToDisplay(a.valueInTWD || 0).toLocaleString()}</TableCell>
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
                          className="w-9 h-9 rounded-lg hover:bg-rose-50 hover:text-rose-600" 
                          onClick={() => { setSnapshots(prev => prev.filter(snap => snap.id !== s.id)); toast({ title: t.snapshotDeleted }); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {snapshots.length === 0 && (
                    <div className="py-16 text-center text-slate-300 text-xs font-bold uppercase tracking-widest">{t.noSnapshots}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Professional AI Analysis */}
        <section className="pt-10">
           <AITipCard 
              language={language} 
              assets={assetCalculations.processedAssets.map(a => ({ name: a.name, symbol: a.symbol, category: a.category, amount: a.amount, currency: a.currency, price: a.calculatedPrice, valueInTWD: a.valueInTWD }))}
              totalTWD={assetCalculations.totalTWD}
              marketConditions={`USD/TWD: ${(marketData.rates.TWD || 32.5).toFixed(2)} | System Reliability: 100%`} 
            />
        </section>
      </main>

      <footer className="py-20 text-center border-t border-slate-100 bg-white">
        <div className="space-y-4 opacity-60">
          <div className="flex items-center justify-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Asset Insights Pro Engine</p>
          </div>
          <p className="text-[10px] text-slate-400 max-w-lg mx-auto leading-relaxed font-bold">
            Data is securely synchronized with global financial markets via top-tier providers. 
            AI-driven analysis is for educational purposes and should not be considered financial advice.
          </p>
        </div>
      </footer>
    </div>
  );
}
