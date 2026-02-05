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
  Plus, 
  RefreshCw, 
  Clock, 
  Trash2, 
  Eye, 
  TrendingUp, 
  TrendingDown, 
  Globe, 
  Wallet, 
  BarChart3,
  Settings2,
  Layers
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
    subtitle: 'MONOCHROME PORTFOLIO TRACKER',
    updateData: 'Sync Market',
    takeSnapshot: 'Take Snapshot',
    totalValue: 'Total Portfolio Value',
    assetCount: 'Total Assets',
    items: 'items',
    addAsset: 'Add New Asset',
    snapshotHistory: 'Snapshot History',
    noSnapshots: 'No history logs',
    snapshotDetail: 'Snapshot Details',
    assetName: 'Asset Name',
    marketPrice: 'Price',
    holdings: 'Holdings',
    valuation: 'Valuation',
    fetching: 'Syncing...',
    dataUpdated: 'Market data updated.',
    snapshotSaved: 'Snapshot saved.',
    snapshotDeleted: 'Snapshot deleted.',
    dashboard: 'Portfolio Overview',
    change: '24h Change'
  },
  zh: {
    title: 'Asset Insights Pro',
    subtitle: '極簡黑白資產追蹤',
    updateData: '同步市場',
    takeSnapshot: '建立快照',
    totalValue: '投資組合總淨值',
    assetCount: '資產總數',
    items: '個項目',
    addAsset: '新增資產部位',
    snapshotHistory: '歷史快照紀錄',
    noSnapshots: '尚無快照紀錄',
    snapshotDetail: '快照詳細資訊',
    assetName: '資產名稱',
    marketPrice: '當前市價',
    holdings: '持有數量',
    valuation: '帳面價值',
    fetching: '同步中...',
    dataUpdated: '市場數據已更新',
    snapshotSaved: '快照已存入紀錄',
    snapshotDeleted: '紀錄已刪除',
    dashboard: '投資組合概覽',
    change: '24H 漲跌'
  }
};

export default function MonochromeAssetPage() {
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
    <div className="min-h-screen bg-white text-black pb-20 selection:bg-black selection:text-white font-sans">
      <header className="glass-nav h-20 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-black rounded flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-black">{t.title}</h1>
              <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">{t.subtitle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded">
              <Button 
                variant={language === 'zh' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setLanguage('zh')} 
                className="h-7 px-3 text-xs font-bold"
              >繁中</Button>
              <Button 
                variant={language === 'en' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setLanguage('en')} 
                className="h-7 px-3 text-xs font-bold"
              >EN</Button>
            </div>
            
            <Tabs value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)}>
              <TabsList className="h-9 bg-slate-100">
                <TabsTrigger value="TWD" className="text-[10px] px-3 font-bold uppercase">TWD</TabsTrigger>
                <TabsTrigger value="USD" className="text-[10px] px-3 font-bold uppercase">USD</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Card className="lg:col-span-8 modern-card p-10 flex flex-col justify-between overflow-hidden relative border-slate-200">
            {/* Wallet Icon - Enlarged and placed on top layer (z-30) to overlap the divider */}
            <div className="absolute -bottom-10 -right-10 opacity-[0.08] pointer-events-none z-30">
              <Wallet className="w-80 h-80 text-black" />
            </div>

            <div className="space-y-4 z-20 relative">
              <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                <Globe className="w-3.5 h-3.5" />
                {t.totalValue}
              </div>
              <div className="text-5xl font-black tracking-tighter">
                {getCurrencySymbol(displayCurrency)}{assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              
              {lastSnapshot && (
                <div className={cn(
                  "inline-flex items-center gap-1.5 py-1.5 px-3 rounded text-[11px] font-bold border",
                  assetCalculations.totalDiffTWD >= 0 
                    ? "text-emerald-600 bg-emerald-50 border-emerald-100" 
                    : "text-rose-600 bg-rose-50 border-rose-100"
                )}>
                  {assetCalculations.totalDiffTWD >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {getCurrencySymbol(displayCurrency)}{Math.abs(assetCalculations.totalDiffDisplay).toLocaleString()} 
                  <span className="opacity-70">({assetCalculations.totalDiffPercent >= 0 ? '+' : ''}{assetCalculations.totalDiffPercent.toFixed(2)}%)</span>
                </div>
              )}
            </div>

            <div className="flex gap-10 pt-10 mt-10 border-t border-slate-100 z-10 relative bg-white/40 backdrop-blur-[2px]">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">{t.assetCount}</p>
                <p className="text-xl font-bold">{assets.length} <span className="text-xs font-medium text-slate-400">{t.items}</span></p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Status</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Connected</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="lg:col-span-4 grid grid-cols-1 gap-6">
            <Button 
              onClick={takeSnapshot} 
              className="w-full h-full bg-black hover:bg-slate-800 text-white font-bold flex flex-col items-center justify-center gap-3 rounded transition-all"
            >
              <Clock className="w-5 h-5" />
              <span className="text-sm tracking-widest uppercase">{t.takeSnapshot}</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={updateMarketData} 
              disabled={loading} 
              className="w-full h-full border-slate-200 bg-white hover:bg-slate-50 font-bold flex flex-col items-center justify-center gap-3 rounded transition-all"
            >
              <RefreshCw className={cn("w-5 h-5", loading && "animate-spin")} />
              <span className="text-sm tracking-widest uppercase">{t.updateData}</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-8 space-y-8">
            <Card className="modern-card overflow-hidden border-slate-200">
              <CardHeader className="px-8 py-5 border-b border-slate-50 flex flex-row items-center justify-between bg-white">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  {t.dashboard}
                </CardTitle>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400"><Settings2 className="w-4 h-4" /></Button>
              </CardHeader>
              <CardContent className="p-0 bg-white">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="px-8 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.assetName}</TableHead>
                      <TableHead className="px-8 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.marketPrice}</TableHead>
                      <TableHead className="px-8 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.change}</TableHead>
                      <TableHead className="px-8 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">{t.valuation}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assetCalculations.processedAssets.map(asset => (
                      <TableRow key={asset.id} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                        <TableCell className="px-8 py-5">
                          <div className="font-bold text-black">{asset.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{asset.symbol}</div>
                        </TableCell>
                        <TableCell className="px-8 py-5">
                          {(asset.category === 'Stock' || asset.category === 'Crypto') ? (
                            <span className="text-sm font-medium text-slate-600">
                              {asset.calculatedPrice > 0 ? `${getCurrencySymbol(asset.currency)}${asset.calculatedPrice.toLocaleString()}` : t.fetching}
                            </span>
                          ) : <span className="text-slate-300">—</span>}
                        </TableCell>
                        <TableCell className="px-8 py-5">
                          {asset.hasHistory ? (
                            <div className={cn(
                              "text-[11px] font-bold px-2 py-0.5 rounded",
                              asset.diffTWD >= 0 ? "text-emerald-600" : "text-rose-600"
                            )}>
                              {asset.diffTWD >= 0 ? '+' : ''}{asset.diffPercent.toFixed(2)}%
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">Initial</span>
                          )}
                        </TableCell>
                        <TableCell className="px-8 py-5 text-right">
                          <span className="font-bold text-lg tracking-tight">
                            {getCurrencySymbol(displayCurrency)}{asset.valueInDisplay.toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {assets.length === 0 && (
                  <div className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">No assets tracked</div>
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
            <Card className="modern-card border-slate-200 bg-white">
              <CardHeader className="px-8 py-5 border-b border-slate-50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  {t.addAsset}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-8 py-8">
                <AssetForm language={language} onAdd={(a) => setAssets(prev => [...prev, { ...a, id: crypto.randomUUID() }])} />
              </CardContent>
            </Card>

            <Card className="modern-card border-slate-200 bg-white">
              <CardHeader className="px-8 py-5 border-b border-slate-50">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {t.snapshotHistory}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-50">
                  {snapshots.slice().reverse().map(s => (
                    <div key={s.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-9 h-9 rounded bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-black transition-all">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-black">{new Date(s.date).toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
                            {getCurrencySymbol(displayCurrency)}{convertTWDToDisplay(s.totalTWD).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8 rounded hover:bg-slate-100"><Eye className="w-3.5 h-3.5" /></Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md bg-white border-slate-200">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-bold">{t.snapshotDetail}</DialogTitle>
                            </DialogHeader>
                            <div className="mt-4 max-h-[50vh] overflow-y-auto pr-2">
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-slate-100">
                                    <TableHead className="font-bold text-[10px] uppercase text-slate-400">{t.assetName}</TableHead>
                                    <TableHead className="text-right font-bold text-[10px] uppercase text-slate-400">{t.valuation}</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {s.assets?.map((a, idx) => (
                                    <TableRow key={idx} className="border-slate-50">
                                      <TableCell className="py-4 text-xs font-bold text-slate-600">{a.name}</TableCell>
                                      <TableCell className="py-4 text-right text-xs font-bold text-black">{getCurrencySymbol(displayCurrency)} {convertTWDToDisplay(a.valueInTWD || 0).toLocaleString()}</TableCell>
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
                          className="w-8 h-8 rounded hover:bg-rose-50 hover:text-rose-600" 
                          onClick={() => { setSnapshots(prev => prev.filter(snap => snap.id !== s.id)); toast({ title: t.snapshotDeleted }); }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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

        <section className="pt-10">
           <AITipCard 
              language={language} 
              assets={assetCalculations.processedAssets.map(a => ({ name: a.name, symbol: a.symbol, category: a.category, amount: a.amount, currency: a.currency, price: a.calculatedPrice, valueInTWD: a.valueInTWD }))}
              totalTWD={assetCalculations.totalTWD}
              marketConditions={`USD/TWD: ${(marketData.rates.TWD || 32.5).toFixed(2)} | System Status: Optimal`} 
            />
        </section>
      </main>

      <footer className="py-20 text-center border-t border-slate-100">
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2 opacity-40">
            <Activity className="w-3.5 h-3.5 text-black" />
            <p className="text-[10px] font-bold uppercase tracking-widest">Asset Insights Engine</p>
          </div>
          <p className="text-[10px] text-slate-400 max-w-md mx-auto leading-relaxed font-medium">
            Professional analytics based on market synchronization. 
            All reports are for informational purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
}
