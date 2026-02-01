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
  X, 
  Eye, 
  Calendar,
  Languages
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
  DialogTrigger,
} from "@/components/ui/dialog";

type Language = 'en' | 'zh';

const translations = {
  en: {
    title: 'Asset Insights',
    subtitle: 'Track your global portfolio and historical changes.',
    updateData: 'Update Data',
    takeSnapshot: 'Take Snapshot',
    totalValue: 'Total Estimated Value',
    assetCount: 'Asset Count',
    items: 'items',
    addAsset: 'Add Asset',
    snapshotHistory: 'Snapshot History',
    manageHistory: 'Manage your past asset records.',
    noSnapshots: 'No snapshots yet.',
    snapshotDetail: 'Snapshot Details',
    assetName: 'Asset Name',
    marketPrice: 'Market Price',
    holdings: 'Holdings',
    valuation: 'Valuation',
    fetching: 'Fetching...',
    stockUnit: 'shares',
    dataUpdated: 'Market data updated',
    snapshotSaved: 'Snapshot saved',
    snapshotDeleted: 'Snapshot deleted',
    invalidValue: 'Invalid value',
  },
  zh: {
    title: 'Asset Insights',
    subtitle: '追蹤全球資產組合與歷史變動。',
    updateData: '更新數據',
    takeSnapshot: '儲存快照',
    totalValue: '總資產估值',
    assetCount: '資產數量',
    items: '項',
    addAsset: '新增資產',
    snapshotHistory: '歷史快照清單',
    manageHistory: '管理您過去儲存的資產記錄。',
    noSnapshots: '尚未有任何快照。',
    snapshotDetail: '快照詳情',
    assetName: '資產名稱',
    marketPrice: '市場單價',
    holdings: '持有量',
    valuation: '估值',
    fetching: '抓取中...',
    stockUnit: '股',
    dataUpdated: '市場數據已更新',
    snapshotSaved: '快照已存檔',
    snapshotDeleted: '快照已刪除',
    invalidValue: '無效數值',
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
  const [selectedSnapshot, setSelectedSnapshot] = useState<Snapshot | null>(null);

  const t = translations[language];

  useEffect(() => {
    const savedAssets = localStorage.getItem('assets');
    const savedSnapshots = localStorage.getItem('snapshots');
    const savedLang = localStorage.getItem('language');
    
    if (savedLang) setLanguage(savedLang as Language);
    if (savedAssets) setAssets(JSON.parse(savedAssets));
    else {
      setAssets([{
        id: 'default-0050',
        name: '元大台灣50',
        symbol: '0050',
        category: 'Stock',
        amount: 1000,
        currency: 'TWD'
      }]);
    }
    if (savedSnapshots) setSnapshots(JSON.parse(savedSnapshots));
  }, []);

  useEffect(() => {
    localStorage.setItem('assets', assets.length > 0 ? JSON.stringify(assets) : '[]');
    localStorage.setItem('snapshots', JSON.stringify(snapshots));
    localStorage.setItem('language', language);
  }, [assets, snapshots, language]);

  const updateMarketData = async () => {
    setLoading(true);
    const cryptos = assets.filter(a => a.category === 'Crypto').map(a => a.symbol);
    const stocks = assets.filter(a => a.category === 'Stock').map(a => a.symbol);
    
    try {
      const data = await getMarketData({ cryptos, stocks });
      setMarketData(data);
      toast({
        title: t.dataUpdated,
        description: `1 USD = ${data.rates.TWD.toFixed(2)} TWD`
      });
    } catch (error) {
      console.error('Market update failed', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assets.length > 0) updateMarketData();
    else setLoading(false);
  }, [assets.length]);

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
      if (asset.currency === 'USD') {
        const usdValue = (asset.category === 'Stock' || asset.category === 'Crypto') ? asset.amount * currentPrice : asset.amount;
        valueInTWD = usdValue * marketData.rates.TWD;
      } else if (asset.currency === 'CNY') {
        valueInTWD = asset.amount * (marketData.rates.TWD / marketData.rates.CNY);
      } else {
        const multiplier = (asset.category === 'Stock' ? (currentPrice || 1) : 1);
        valueInTWD = asset.amount * multiplier;
      }

      totalTWD += valueInTWD;
      allocationMap[asset.category] += valueInTWD;

      let valueInDisplay = valueInTWD;
      if (displayCurrency === 'USD') valueInDisplay = valueInTWD / marketData.rates.TWD;
      else if (displayCurrency === 'CNY') valueInDisplay = valueInTWD * (marketData.rates.CNY / marketData.rates.TWD);

      return { ...asset, calculatedPrice: currentPrice, valueInTWD, valueInDisplay };
    });

    return { 
      processedAssets, totalTWD,
      totalDisplay: displayCurrency === 'USD' ? totalTWD / marketData.rates.TWD : displayCurrency === 'CNY' ? totalTWD * (marketData.rates.CNY / marketData.rates.TWD) : totalTWD,
      allocationData: Object.entries(allocationMap).filter(([_, v]) => v > 0).map(([name, value]) => ({
        name, value: displayCurrency === 'USD' ? value / marketData.rates.TWD : displayCurrency === 'CNY' ? value * (marketData.rates.CNY / marketData.rates.TWD) : value
      }))
    };
  }, [assets, marketData, displayCurrency]);

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

  const getCurrencySymbol = (cur: Currency) => cur === 'USD' ? '$' : cur === 'CNY' ? '¥' : 'NT$';
  const convertTWDToDisplay = (twdVal: number) => {
    if (displayCurrency === 'USD') return twdVal / marketData.rates.TWD;
    if (displayCurrency === 'CNY') return twdVal * (marketData.rates.CNY / marketData.rates.TWD);
    return twdVal;
  };

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
            <TrendingUp className="h-8 w-8 text-accent" />
            {t.title}
          </h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={language} onValueChange={(v) => setLanguage(v as Language)}>
            <TabsList className="bg-slate-100">
              <TabsTrigger value="en" className="flex items-center gap-1"><Languages className="h-3 w-3" /> ENG</TabsTrigger>
              <TabsTrigger value="zh" className="flex items-center gap-1"><Languages className="h-3 w-3" /> 中文</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="w-px h-6 bg-border mx-1" />
          <Tabs value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)}>
            <TabsList className="bg-slate-100">
              <TabsTrigger value="TWD">TWD</TabsTrigger>
              <TabsTrigger value="USD">USD</TabsTrigger>
              <TabsTrigger value="CNY">CNY</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" onClick={updateMarketData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t.updateData}
          </Button>
          <Button onClick={takeSnapshot} className="bg-accent hover:bg-accent/90">
            <History className="h-4 w-4 mr-2" />
            {t.takeSnapshot}
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-l-4 border-l-primary bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-primary uppercase tracking-wider">
              {t.totalValue} ({displayCurrency})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">
              {getCurrencySymbol(displayCurrency)} {assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}
            </div>
            <div className="text-xs text-muted-foreground mt-2 bg-white/50 w-fit px-2 py-1 rounded">
              1 USD = {marketData.rates.TWD.toFixed(2)} TWD / {marketData.rates.CNY.toFixed(2)} CNY
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t.assetCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-headline">{assets.length} <span className="text-sm font-normal">{t.items}</span></div>
          </CardContent>
        </Card>

        <div className="md:col-span-2">
          <AITipCard 
            language={language} 
            assets={assetCalculations.processedAssets.map(a => ({
              name: a.name,
              symbol: a.symbol,
              category: a.category,
              amount: a.amount,
              currency: a.currency,
              price: a.calculatedPrice,
              valueInTWD: a.valueInTWD
            }))}
            totalTWD={assetCalculations.totalTWD}
            marketConditions={`1 USD = ${marketData.rates.TWD.toFixed(2)} TWD`} 
          />
        </div>
      </div>

      <PortfolioCharts 
        language={language}
        allocationData={assetCalculations.allocationData} 
        historicalData={snapshots} 
        displayCurrency={displayCurrency}
        rates={marketData.rates}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1 space-y-8">
          <Card>
            <CardHeader><CardTitle className="text-lg">{t.addAsset}</CardTitle></CardHeader>
            <CardContent><AssetForm language={language} onAdd={(a) => setAssets(prev => [...prev, { ...a, id: crypto.randomUUID() }])} /></CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Calendar className="h-5 w-5" /> {t.snapshotHistory}</CardTitle>
              <CardDescription>{t.manageHistory}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {snapshots.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground text-sm">{t.noSnapshots}</div>
              ) : (
                snapshots.slice().reverse().map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="text-sm font-medium">{new Date(s.date).toLocaleDateString(language === 'en' ? 'en-US' : 'zh-TW')}</div>
                      <div className="text-xs text-muted-foreground">
                        {getCurrencySymbol(displayCurrency)} {convertTWDToDisplay(s.totalTWD).toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedSnapshot(s)}><Eye className="h-4 w-4" /></Button></DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader><DialogTitle>{t.snapshotDetail} - {new Date(s.date).toLocaleString(language === 'en' ? 'en-US' : 'zh-TW')}</DialogTitle></DialogHeader>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{t.assetName}</TableHead>
                                <TableHead>{t.marketPrice}</TableHead>
                                <TableHead>{t.holdings}</TableHead>
                                <TableHead className="text-right">{t.valuation} ({displayCurrency})</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {s.assets?.map((a, idx) => (
                                <TableRow key={idx}>
                                  <TableCell><div className="text-sm font-medium">{a.name}</div><div className="text-[10px] text-muted-foreground uppercase">{a.symbol}</div></TableCell>
                                  <TableCell className="text-sm font-mono text-muted-foreground">{a.price ? `${getCurrencySymbol(a.currency)}${a.price.toLocaleString()}` : '--'}</TableCell>
                                  <TableCell className="text-sm font-mono">{a.amount.toLocaleString(undefined, { maximumFractionDigits: 5 })}</TableCell>
                                  <TableCell className="text-right font-medium text-primary">{getCurrencySymbol(displayCurrency)} {convertTWDToDisplay(a.valueInTWD || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </DialogContent>
                      </Dialog>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setSnapshots(prev => prev.filter(snap => snap.id !== s.id)); toast({ title: t.snapshotDeleted }); }}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="xl:col-span-2">
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.assetName}</TableHead>
                  <TableHead>{t.marketPrice}</TableHead>
                  <TableHead>{t.holdings}</TableHead>
                  <TableHead className="text-right">{t.valuation} ({displayCurrency})</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assetCalculations.processedAssets.map(asset => (
                  <TableRow key={asset.id} className="group">
                    <TableCell><div className="font-medium">{asset.name}</div><div className="text-xs text-muted-foreground uppercase">{asset.symbol}</div></TableCell>
                    <TableCell>
                      <div className="text-sm font-mono text-muted-foreground">
                        {(asset.category === 'Stock' || asset.category === 'Crypto') ? (asset.calculatedPrice > 0 ? `${getCurrencySymbol(asset.currency)}${asset.calculatedPrice.toLocaleString()}` : t.fetching) : '--'}
                      </div>
                    </TableCell>
                    <TableCell>
                      {editingId === asset.id ? (
                        <div className="flex items-center gap-2">
                          <Input type="number" value={editAmount} onChange={(e) => setEditAmount(e.target.value)} className="h-8 w-24 text-sm font-mono" step="any" />
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600" onClick={() => { setAssets(prev => prev.map(a => a.id === editingId ? { ...a, amount: parseFloat(editAmount) || 0 } : a)); setEditingId(null); }}><Check className="h-4 w-4" /></Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 group/amount">
                          <div className="font-mono text-sm">{asset.amount.toLocaleString(undefined, { maximumFractionDigits: 5 })} <span className="text-[10px] text-muted-foreground">{asset.category === 'Stock' ? t.stockUnit : asset.symbol}</span></div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/amount:opacity-100" onClick={() => { setEditingId(asset.id); setEditAmount(asset.amount.toString()); }}><Edit2 className="h-3 w-3" /></Button>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">{getCurrencySymbol(displayCurrency)} {asset.valueInDisplay.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="icon" onClick={() => setAssets(prev => prev.filter(a => a.id !== asset.id))} className="text-destructive"><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </div>
    </div>
  );
}
