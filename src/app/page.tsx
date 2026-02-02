
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
  Languages,
  ShieldCheck,
  CreditCard,
  Lock,
  ArrowRight,
  Info,
  QrCode,
  Smartphone,
  Loader2
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
  DialogTrigger,
  DialogFooter as DialogFooterUI,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

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
    snapshotDetailDesc: 'Detailed view of your asset allocation at this specific point in time.',
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
    licenseTitle: 'Lifetime License',
    licenseDesc: 'Unlock all pro features for life.',
    licensePrice: 'NT$ 30',
    buyNow: 'Unlock Pro (NT$ 30)',
    startTrial: 'Start Free Trial',
    licensed: 'Pro Active',
    unlicensed: 'Free Version',
    licenseRequired: 'License Required',
    licensePrompt: 'Experience the power of professional asset tracking.',
    activationSuccess: 'Activation Successful! Thank you for your support.',
    trialLimitAssets: 'Free version limited to 3 assets. Upgrade to Pro for unlimited tracking.',
    trialLimitSnapshots: 'Free version limited to 1 snapshot. Upgrade to Pro for history trends.',
    upgradeToPro: 'Upgrade to Pro',
    paymentMethod: 'Select Payment Method',
    payNow: 'Complete Purchase',
    processing: 'Processing Payment...',
    creditCard: 'Credit Card',
    linePay: 'LINE Pay',
    jkopay: 'JKOPAY',
    scanQr: 'Please scan the QR code to pay',
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
    snapshotDetailDesc: '查看此特定時間點的詳細資產配置與價值。',
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
    licenseTitle: '終身買斷授權',
    licenseDesc: '一次性付費，解鎖所有專業追蹤與 AI 功能。',
    licensePrice: 'NT$ 30',
    buyNow: '立即解鎖 Pro (NT$ 30)',
    startTrial: '先試用看看',
    licensed: 'Pro 已啟動',
    unlicensed: '試用中 (免費版)',
    licenseRequired: '需要授權',
    licensePrompt: '立即體驗專業資產追蹤與 AI 深度分析。',
    activationSuccess: '啟動成功！感謝您的支持。',
    trialLimitAssets: '免費版限新增 3 項資產，升級 Pro 以解鎖無限資產追蹤。',
    trialLimitSnapshots: '免費版限儲存 1 份快照，升級 Pro 以查看完整歷史趨勢。',
    upgradeToPro: '升級解鎖完整版',
    paymentMethod: '選擇支付方式',
    payNow: '確認支付',
    processing: '金流處理中...',
    creditCard: '信用卡 / 金融卡',
    linePay: 'LINE Pay',
    jkopay: '街口支付',
    scanQr: '請使用手機掃描下方 QR Code 完成支付',
  }
};

export default function AssetTrackerPage() {
  const { toast } = useToast();
  const [language, setLanguage] = useState<Language>('zh');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('TWD');
  const [isLicensed, setIsLicensed] = useState<boolean>(false);
  const [hasStartedTrial, setHasStartedTrial] = useState<boolean>(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'selection' | 'processing' | 'success'>('selection');
  const [selectedMethod, setSelectedMethod] = useState('credit');
  
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
    const savedLicense = localStorage.getItem('app_license_v1');
    const savedTrial = localStorage.getItem('app_trial_started');
    
    if (savedLicense === 'true') setIsLicensed(true);
    if (savedTrial === 'true') setHasStartedTrial(true);
    if (savedLang) setLanguage(savedLang as Language);
    
    if (savedAssets) {
      setAssets(JSON.parse(savedAssets));
    } else {
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
  }, [assets.length]);

  const handleProcessPayment = () => {
    setPaymentStep('processing');
    setTimeout(() => {
      localStorage.setItem('app_license_v1', 'true');
      setIsLicensed(true);
      setPaymentStep('success');
      toast({
        title: t.activationSuccess,
        description: t.licenseTitle,
      });
      setTimeout(() => {
        setShowPaymentDialog(false);
      }, 1500);
    }, 2000);
  };

  const handleStartTrial = () => {
    localStorage.setItem('app_trial_started', 'true');
    setHasStartedTrial(true);
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
    if (!isLicensed && snapshots.length >= 1) {
      toast({ variant: "destructive", title: t.trialLimitSnapshots });
      return;
    }
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
    if (!isLicensed && assets.length >= 3) {
      toast({ variant: "destructive", title: t.trialLimitAssets });
      return;
    }
    setAssets(prev => [...prev, { ...a, id: crypto.randomUUID() }]);
  };

  const getCurrencySymbol = (cur: Currency) => cur === 'USD' ? '$' : cur === 'CNY' ? '¥' : 'NT$';
  const convertTWDToDisplay = (twdVal: number) => {
    if (displayCurrency === 'USD') return twdVal / marketData.rates.TWD;
    if (displayCurrency === 'CNY') return twdVal * (marketData.rates.CNY / marketData.rates.TWD);
    return twdVal;
  };

  if (!isLicensed && !hasStartedTrial && !loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full shadow-2xl border-t-4 border-t-primary">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-2xl font-headline font-bold">{t.licenseTitle}</CardTitle>
              <CardDescription>{t.licensePrompt}</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-slate-100 p-6 rounded-xl text-center">
              <div className="text-sm text-muted-foreground mb-1 uppercase tracking-widest">{language === 'en' ? 'ONE TIME PAYMENT' : '一次性買斷價格'}</div>
              <div className="text-4xl font-bold font-headline text-primary">{t.licensePrice}</div>
            </div>
            <ul className="space-y-3">
              {[
                language === 'zh' ? '無限制資產追蹤' : 'Unlimited Asset Tracking',
                language === 'zh' ? '全球即時匯率與股市抓取' : 'Global Market Data Sync',
                language === 'zh' ? 'AI 財務顧問對話' : 'Interactive AI Advisor',
                language === 'zh' ? '完整歷史趨勢分析' : 'Full Historical Trends'
              ].map((text, i) => (
                <li key={i} className="flex items-center gap-3 text-sm text-slate-600">
                  <ShieldCheck className="h-5 w-5 text-green-500" />
                  {text}
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Dialog open={showPaymentDialog} onOpenChange={(open) => { setShowPaymentDialog(open); if(!open) setPaymentStep('selection'); }}>
              <DialogTrigger asChild>
                <Button className="w-full h-12 text-lg font-semibold">
                  <CreditCard className="mr-2 h-5 w-5" />
                  {t.buyNow}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    {t.licenseTitle} - {t.licensePrice}
                  </DialogTitle>
                  <DialogDescription>
                    {t.licenseDesc}
                  </DialogDescription>
                </DialogHeader>

                {paymentStep === 'selection' && (
                  <div className="py-4 space-y-6">
                    <RadioGroup defaultValue="credit" onValueChange={setSelectedMethod} className="space-y-3">
                      <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                        <RadioGroupItem value="credit" id="credit" />
                        <Label htmlFor="credit" className="flex flex-1 items-center justify-between cursor-pointer">
                          <span className="font-medium">{t.creditCard}</span>
                          <CreditCard className="h-5 w-5 text-slate-400" />
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                        <RadioGroupItem value="linepay" id="linepay" />
                        <Label htmlFor="linepay" className="flex flex-1 items-center justify-between cursor-pointer">
                          <span className="font-medium">{t.linePay}</span>
                          <Smartphone className="h-5 w-5 text-green-500" />
                        </Label>
                      </div>
                      <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                        <RadioGroupItem value="jkopay" id="jkopay" />
                        <Label htmlFor="jkopay" className="flex flex-1 items-center justify-between cursor-pointer">
                          <span className="font-medium">{t.jkopay}</span>
                          <div className="bg-red-500 text-white text-[10px] px-1 rounded font-bold">JKO</div>
                        </Label>
                      </div>
                    </RadioGroup>
                    <Button onClick={handleProcessPayment} className="w-full h-11 bg-primary">
                      {t.payNow}
                    </Button>
                  </div>
                )}

                {paymentStep === 'processing' && (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <Loader2 className="h-10 w-10 text-primary animate-spin" />
                    <p className="text-sm font-medium animate-pulse">{t.processing}</p>
                    {selectedMethod !== 'credit' && (
                      <div className="mt-4 p-4 bg-slate-50 rounded-lg flex flex-col items-center">
                        <QrCode className="h-32 w-32 text-slate-800" />
                        <p className="text-[10px] text-muted-foreground mt-2">{t.scanQr}</p>
                      </div>
                    )}
                  </div>
                )}

                {paymentStep === 'success' && (
                  <div className="py-12 flex flex-col items-center justify-center space-y-4">
                    <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="h-10 w-10 text-green-600" />
                    </div>
                    <p className="text-lg font-bold text-green-600">{t.activationSuccess}</p>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            <Button variant="outline" className="w-full h-12 text-lg" onClick={handleStartTrial}>
              {t.startTrial}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="ghost" className="w-full text-xs text-muted-foreground" onClick={() => setLanguage(language === 'en' ? 'zh' : 'en')}>
              <Languages className="mr-2 h-3 w-3" />
              Switch to {language === 'en' ? '中文' : 'English'}
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border shadow-sm">
        <div className="flex items-start gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold text-primary flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-accent" />
              {t.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-muted-foreground">{t.subtitle}</p>
              {isLicensed ? (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  <ShieldCheck className="h-3 w-3 mr-1" />
                  {t.licensed}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 cursor-pointer" onClick={() => { setHasStartedTrial(false); setPaymentStep('selection'); }}>
                  <Info className="h-3 w-3 mr-1" />
                  {t.unlicensed}
                </Badge>
              )}
            </div>
          </div>
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

      {!isLicensed && (
        <Alert className="bg-primary/5 border-primary/20">
          <Info className="h-4 w-4 text-primary" />
          <AlertTitle className="text-primary font-bold">{t.upgradeToPro}</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>{assets.length >= 3 ? t.trialLimitAssets : snapshots.length >= 1 ? t.trialLimitSnapshots : t.licensePrompt}</span>
            <Button size="sm" className="ml-4" onClick={() => { setHasStartedTrial(false); setPaymentStep('selection'); }}>{t.buyNow}</Button>
          </AlertDescription>
        </Alert>
      )}

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
            <CardContent><AssetForm language={language} onAdd={handleAddAsset} /></CardContent>
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
                          <DialogHeader>
                            <DialogTitle>{t.snapshotDetail} - {new Date(s.date).toLocaleString(language === 'en' ? 'en-US' : 'zh-TW')}</DialogTitle>
                            <DialogDescription>{t.snapshotDetailDesc}</DialogDescription>
                          </DialogHeader>
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
                                  <TableCell className="text-sm font-mono text-muted-foreground">
                                    {(a.category === 'Stock' || a.category === 'Crypto') ? (a.price ? `${getCurrencySymbol(a.currency)}${a.price.toLocaleString()}` : '--') : '--'}
                                  </TableCell>
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
                    <TableCell className="text-right font-bold text-primary">{asset.valueInDisplay.toLocaleString(undefined, { maximumFractionDigits: displayCurrency === 'TWD' ? 0 : 2 })}</TableCell>
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
