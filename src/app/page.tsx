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
  Settings2
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
    dashboard: 'Asset Dashboard',
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
    dashboard: '資產監控儀表板',
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
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20 selection:bg-indigo-100">
      <header className="glass-nav sticky top-0 z-50 h-16">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-900">{t.title}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex bg-slate-100 p-1 rounded-md">
              <Button 
                variant={language === 'zh' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setLanguage('zh')} 
                className="h-7 px-3 text-xs font-semibold"
              >ZH</Button>
              <Button 
                variant={language === 'en' ? 'secondary' : 'ghost'} 
                size="sm" 
                onClick={() => setLanguage('en')} 
                className="h-7 px-3 text-xs font-semibold"
              >EN</Button>
            </div>
            
            <Tabs value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)}>
              <TabsList className="h-9 bg-slate-100">
                <TabsTrigger value="TWD" className="text-xs px-3">TWD</TabsTrigger>
                <TabsTrigger value="USD" className="text-xs px-3">USD</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Value Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 modern-card p-8 flex flex-col justify-between overflow-hidden relative">
            <div className="absolute top-0 right-0 p-12 opacity-[0.03] pointer-events-none">
              <Wallet className="w-64 h-64 text-slate-900" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-500 text-sm font-medium">
                <Globe className="w-4 h-4" />
                {t.totalValue}
              </div>
              <div className="text-5xl font-extrabold tracking-tight text-slate-900">
                {getCurrencySymbol(displayCurrency)}{assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </div>
              
              {lastSnapshot && (
                <div className={cn(
                  "inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-bold border",
                  assetCalculations.totalDiffTWD >= 0 
                    ? "text-emerald-600 bg-emerald-50 border-emerald-200" 
                    : "text-rose-600 bg-rose-50 border-rose-200"
                )}>
                  {assetCalculations.totalDiffTWD >= 0 ? <TrendingUp className="w-3.3 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {getCurrencySymbol(displayCurrency)}{Math.abs(assetCalculations.totalDiffDisplay).toLocaleString()} 
                  <span className="opacity-70 ml-1">({assetCalculations.totalDiffPercent >= 0 ? '+' : ''}{assetCalculations.totalDiffPercent.toFixed(2)}%)</span>
                </div>
              )}
            </div>

            <div className="flex gap-8 pt-8 mt-8 border-t border-slate-100">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">{t.assetCount}</p>
                <p className="text-xl font-bold text-slate-900">{assets.length} <span className="text-sm font-medium text-slate-500">{t.items}</span></p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Status</p>
                <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50 text-[10px] font-bold">Online</Badge>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <Button 
              onClick={takeSnapshot} 
              className="w-full h-24 bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex flex-col items-center justify-center gap-2 rounded-xl shadow-lg shadow-indigo-200 transition-all hover:-translate-y-1"
            >
              <Clock className="w-6 h-6" />
              <span className="text-base tracking-tight">{t.takeSnapshot}</span>
            </Button>
            <Button 
              variant="outline" 
              onClick={updateMarketData} 
              disabled={loading} 
              className="w-full h-24 border-slate-200 bg-white hover:bg-slate-50 font-bold flex flex-col items-center justify-center gap-2 rounded-xl shadow-sm transition-all hover:-translate-y-1"
            >
              <RefreshCw className={cn("w-6 h-6 text-indigo-600", loading && "animate-spin")} />
              <span className="text-base tracking-tight">{t.updateData}</span>
            </Button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8 space-y-8">
            <Card className="modern-card overflow-hidden">
              <CardHeader className="px-8 py-6 border-b border-slate-100 flex flex-row items-center justify-between bg-white">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-600" />
                  {t.dashboard}
                </CardTitle>
                <Settings2 className="w-5 h-5 text-slate-300 cursor-pointer hover:text-indigo-600 transition-colors" />
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.assetName}</TableHead>
                      <TableHead className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.marketPrice}</TableHead>
                      <TableHead className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.change}</TableHead>
                      <TableHead className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">{t.valuation}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assetCalculations.processedAssets.map(asset => (
                      <TableRow key={asset.id} className="border-slate-100 hover:bg-slate-50/30 transition-colors">
                        <TableCell className="px-8 py-6">
                          <div className="font-bold text-slate-900">{asset.name}</div>
                          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{asset.symbol}</div>
                        </TableCell>
                        <TableCell className="px-8 py-6">
                          {(asset.category === 'Stock' || asset.category === 'Crypto') ? (
                            <span className="font-semibold text-sm text-slate-600">
                              {asset.calculatedPrice > 0 ? `${getCurrencySymbol(asset.currency)}${asset.calculatedPrice.toLocaleString()}` : t.fetching}
                            </span>
                          ) : <span className="text-slate-300">—</span>}
                        </TableCell>
                        <TableCell className="px-8 py-6">
                          {asset.hasHistory ? (
                            <div className={cn(
                              "text-[11px] font-bold inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md",
                              asset.diffTWD >= 0 ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
                            )}>
                              {asset.diffTWD >= 0 ? '+' : ''}{asset.diffPercent.toFixed(2)}%
                            </div>
                          ) : (
                            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Initial</span>
                          )}
                        </TableCell>
                        <TableCell className="px-8 py-6 text-right">
                          <span className="font-bold text-lg tracking-tight text-slate-900">
                            {getCurrencySymbol(displayCurrency)}{asset.valueInDisplay.toLocaleString()}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {assets.length === 0 && (
                  <div className="py-20 text-center text-slate-300 font-medium">請點擊上方按鈕新增資產部位</div>
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
            <Card className="modern-card">
              <CardHeader className="px-8 py-6 border-b border-slate-100">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Plus className="w-5 h-5 text-indigo-600" />
                  {t.addAsset}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-8 py-6">
                <AssetForm language={language} onAdd={(a) => setAssets(prev => [...prev, { ...a, id: crypto.randomUUID() }])} />
              </CardContent>
            </Card>

            <Card className="modern-card">
              <CardHeader className="px-8 py-6 border-b border-slate-100">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  {t.snapshotHistory}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  {snapshots.slice().reverse().map(s => (
                    <div key={s.id} className="flex items-center justify-between p-6 hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-all">
                          <Layers className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-900">{new Date(s.date).toLocaleDateString()}</div>
                          <div className="text-[10px] text-slate-500 font-bold mt-0.5 tracking-wider uppercase">
                            {getCurrencySymbol(displayCurrency)}{convertTWDToDisplay(s.totalTWD).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="w-8 h-8 hover:bg-indigo-50 hover:text-indigo-600"><Eye className="w-4 h-4" /></Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-xl bg-white rounded-2xl">
                            <DialogHeader>
                              <DialogTitle className="text-xl font-bold">{t.snapshotDetail}</DialogTitle>
                            </DialogHeader>
                            <div className="mt-4 max-h-[60vh] overflow-y-auto pr-2">
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-slate-100">
                                    <TableHead className="font-bold text-xs uppercase text-slate-400">{t.assetName}</TableHead>
                                    <TableHead className="text-right font-bold text-xs uppercase text-slate-400">{t.valuation}</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {s.assets?.map((a, idx) => (
                                    <TableRow key={idx} className="border-slate-100">
                                      <TableCell className="py-4 font-medium text-sm text-slate-600">{a.name}</TableCell>
                                      <TableCell className="py-4 text-right font-bold text-slate-900">{getCurrencySymbol(displayCurrency)} {convertTWDToDisplay(a.valueInTWD || 0).toLocaleString()}</TableCell>
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
                          className="w-8 h-8 hover:bg-rose-50 hover:text-rose-600" 
                          onClick={() => { setSnapshots(prev => prev.filter(snap => snap.id !== s.id)); toast({ title: t.snapshotDeleted }); }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {snapshots.length === 0 && (
                    <div className="py-12 text-center text-slate-300 text-xs font-medium">{t.noSnapshots}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Analysis Layer at Bottom */}
        <section className="pt-12">
           <AITipCard 
              language={language} 
              assets={assetCalculations.processedAssets.map(a => ({ name: a.name, symbol: a.symbol, category: a.category, amount: a.amount, currency: a.currency, price: a.calculatedPrice, valueInTWD: a.valueInTWD }))}
              totalTWD={assetCalculations.totalTWD}
              marketConditions={`USD/TWD: ${(marketData.rates.TWD || 32.5).toFixed(2)} | System Status: Optimal`} 
            />
        </section>
      </main>

      <footer className="py-16 text-center">
        <div className="space-y-2 opacity-50">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Asset Insights Pro v2.5</p>
          <p className="text-[10px] text-slate-400 max-w-md mx-auto leading-relaxed">
            Data is securely synchronized with global financial markets. 
            AI-driven analysis for educational purposes only.
          </p>
        </div>
      </footer>
    </div>
  );
}