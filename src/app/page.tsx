'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Asset, MarketData, AssetCategory, Currency } from './lib/types';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';
import { fetchMarketData } from '@/app/lib/market-api';
import { AssetForm } from '@/components/AssetForm';
import { HistoricalTrendChart, AllocationPieChart } from '@/components/PortfolioCharts';
import { AITipCard } from '@/components/AITipCard';
import { Button } from '@/components/ui/button';
import { fetchGitHubUser, ensureRepoExists, uploadToGitHub, downloadFromGitHub } from '@/app/lib/github-api';
import { GitHubConfig, GitHubUser } from './lib/types';
import {
  Activity,
  RefreshCw,
  Trash2,
  Globe,
  Wallet,
  BarChart3,
  Edit2,
  Loader2,
  Download,
  Upload,
  History,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Info,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  Plus,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  GripHorizontal,
  Sparkles,
  Brain,
  ArrowRightLeft
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Card,
  CardContent,
  CardHeader,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';

const APP_VERSION = '1.0.5';
const GITHUB_CLIENT_ID = 'Ov23liaxNNxcPIxmCKlD';
const GAS_PROXY_URL = 'https://script.google.com/macros/s/AKfycbzuRTBnr9hPl5bhuVtAEXqiptEELSMnKS4MC-Y7sKvnuDJAta4oeP1k_dTiyYbCAnsu/exec';

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  TWD: 'NT$',
  USD: '$',
  CNY: '¥',
  SGD: 'S$',
};

const translations = {
  en: {
    title: 'ASSET INSIGHTS',
    subtitle: 'PREMIUM ASSET INTELLIGENCE',
    syncMarket: 'Sync Market',
    introTitle: 'Precision in Every Position',
    introDesc: 'Experience the next generation of asset management. Real-time data, AI intelligence, and a dynamic interface designed for modern investors.',
    startNow: 'Enter Asset Insights',
    featuresTitle: 'PLATFORM FEATURES',
    f1Title: 'Live Market Sync',
    f1Desc: 'Unified tracking for Stocks, Crypto, and Forex with real-time conversion.',
    f2Title: 'Dynamic Grid',
    f2Desc: 'iOS-style drag-and-drop layout with interactive jiggle mode.',
    f3Title: 'Gemini AI Insights',
    f3Desc: 'Strategic analysis and portfolio optimization powered by Google Gemini.',
    f4Title: 'Advanced Charts',
    f4Desc: 'Stunning visualizations of your asset evolution and allocation.',
    f5Title: 'Taiwan Specialized',
    f5Desc: 'Native support for Lots (張) and Shares (股) with automatic conversion.',
    f6Title: 'Multi-Currency',
    f6Desc: 'Global reach with support for TWD, USD, CNY, and SGD.',
    totalValue: 'PORTFOLIO NET VALUE',
    addAsset: 'ADD POSITION',
    assetName: 'ASSET',
    holdings: 'HOLDINGS',
    valuation: 'VALUATION',
    category: 'CATEGORY',
    dashboard: 'ASSET OVERVIEW',
    closedPositions: 'CLOSED POSITIONS',
    editAsset: 'EDIT POSITION',
    cancel: 'Cancel',
    saveChanges: 'Save',
    fetching: 'Syncing...',
    baseRange: 'RANGE',
    interval: 'FREQ',
    days30: '30 Days',
    days90: '90 Days',
    days180: '180 Days',
    days365: '365 Days',
    maxRange: 'Max',
    int1d: 'Daily',
    int1wk: 'Weekly',
    int1mo: 'Monthly',
    dataUpdated: 'Market data synced.',
    acqDate: 'Starting Holding Date',
    posEndDate: 'Closed Date',
    exportData: 'Export',
    importData: 'Import',
    importSuccess: 'Data imported successfully.',
    reorderHint: 'REORDER MODE ACTIVE',
    saveLayout: 'SAVE LAYOUT CONFIG',
    layoutHint: 'Hint: Long press card to adjust layout',
    lastUpdated: 'Last Updated',
    allCategories: 'All',
    unitPrice: 'UNIT PRICE',
    priceChange: 'CHG',
    currency: 'CURRENCY',
    shares: 'Shares',
    categoryNames: { Stock: 'Stock', Crypto: 'Crypto', Bank: 'Other', Savings: 'Deposit', ETF: 'ETF', Option: 'Option', Fund: 'Fund', Index: 'Index', Future: 'Future', Forex: 'Forex' }
  },
  zh: {
    title: 'ASSET INSIGHTS',
    subtitle: '',
    syncMarket: '同步市場數據',
    introTitle: '精準掌控，資産脈動',
    introDesc: '體驗次世代資產管理。即時數據同步、AI 智慧分析、以及為現代投資者打造的動態介面。',
    startNow: '即刻開啓 ASSET INSIGHTS',
    featuresTitle: '平台核心功能',
    f1Title: '即時市場同步',
    f1Desc: '統一追蹤股票、加密貨幣與外匯，並提供即時匯率換算。',
    f2Title: '動態佈局介面',
    f2Desc: 'iOS 風格的拖拽排列與「抖動模式」，隨心調整儀表板。',
    f3Title: 'Gemini AI 分析',
    f3Desc: '由 Google Gemini 驅動的戰略性分析與投資組合優化建議。',
    f4Title: '進階視覺化圖表',
    f4Desc: '精美展示資產演變走勢與各類別配置比例。',
    f5Title: '台灣市場優化',
    f5Desc: '完美支援「張」與「股」輸入，並提供自動單位換算。',
    f6Title: '多幣別全球化',
    f6Desc: '支援台幣、美金、人民幣與新幣，掌握全球資產動態。',
    totalValue: '投資組合總淨值',
    addAsset: '新增資產部位',
    assetName: '資產名稱',
    holdings: '持有數量',
    valuation: '帳面價值',
    category: '類別',
    dashboard: '資產部位概覽',
    closedPositions: '已結清資產部位',
    editAsset: '編輯部位資訊',
    cancel: '取消',
    saveChanges: '儲存',
    fetching: '同步中',
    baseRange: '追蹤時間區間',
    interval: '數據頻率',
    days30: '30 天',
    days90: '90 天',
    days180: '180 天',
    days365: '365 天',
    maxRange: '最長',
    int1d: '日線',
    int1wk: '週線',
    int1mo: '月線',
    dataUpdated: '市場數據已更新',
    allCategories: '全部類別',
    unitPrice: '單位價值',
    priceChange: '漲跌',
    exportData: '匯出',
    importData: '匯入',
    importSuccess: '資產資料已成功匯入。',
    reorderHint: '已進入佈局調整模式',
    saveLayout: '儲存佈局配置',
    layoutHint: '提示：長按卡片區塊可調整佈局',
    lastUpdated: '最後更新',
    acqDate: '起始持有日期',
    posEndDate: '結清日期',
    currency: '幣別',
    shares: '股',
    categoryNames: { Stock: '股票', Crypto: '加密貨幣', Bank: '其他資產', Savings: '存款', ETF: 'ETF', Option: '選擇權', Fund: '基金', Index: '指數', Future: '期貨', Forex: '外匯' }
  }
};

interface LayoutConfig {
  width: number;
  height: number;
}

interface SortConfig {
  key: string;
  direction: 'asc' | 'desc' | null;
}

const formatNumber = (num: any) => {
  if (num === null || num === undefined) return "0";
  const val = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(val)) return "0";
  return parseFloat(val.toFixed(5)).toString();
};

const SortIcon = ({ config, columnKey }: { config: SortConfig, columnKey: string }) => {
  if (config.key !== columnKey || !config.direction) return <ArrowUpDown className="w-3 h-3 ml-2 opacity-20" />;
  return config.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-2 text-black" /> : <ArrowDown className="w-3 h-3 ml-2 text-black" />;
};

export default function AssetInsightsPage() {
  const { toast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [language, setLanguage] = useState<'en' | 'zh'>('zh');
  const [showIntro, setShowIntro] = useState(true);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [displayCurrency, setDisplayCurrency] = useState<Currency>('TWD');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editAmountUnit, setEditAmountUnit] = useState<'share' | 'lot'>('share');
  const [editDate, setEditDate] = useState<string>('');
  const [editEndDate, setEditEndDate] = useState<string>('');
  const [editCurrency, setEditCurrency] = useState<Currency>('TWD');

  const [trackingDays, setTrackingDays] = useState<string>("max");
  const [interval, setInterval] = useState<string>("1d");
  const [marketTimeline, setMarketTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(false);

  // GitHub Sync State
  const [ghConfig, setGhConfig] = useState<GitHubConfig>({
    token: null,
    user: null,
    repo: 'asset-insights-backup',
    path: 'data/backup.json'
  });
  const [isSyncing, setIsSyncing] = useState(false);

  const [activeSort, setActiveSort] = useState<SortConfig>({ key: 'name', direction: 'asc' });
  const [closedSort, setClosedSort] = useState<SortConfig>({ key: 'endDate', direction: 'desc' });

  // 初始佈局順序調整：對齊截圖
  const [sections, setSections] = useState<string[]>(['summary', 'controls', 'historicalTrend', 'allocation', 'list', 'addAsset', 'closedList', 'ai']);

  const [layoutConfigs, setLayoutConfigs] = useState<Record<string, LayoutConfig>>({
    summary: { width: 12, height: 160 },
    controls: { width: 12, height: 80 },
    historicalTrend: { width: 7, height: 450 },
    allocation: { width: 5, height: 450 },
    list: { width: 12, height: 600 },
    addAsset: { width: 12, height: 500 },
    closedList: { width: 12, height: 400 },
    ai: { width: 12, height: 650 }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollPosRef = useRef<number>(0);

  // Restore scroll position after Radix Dialog's body scroll lock kicks in
  useEffect(() => {
    if (editingAsset) {
      const savedPos = scrollPosRef.current;
      // Use multiple rAF to ensure we restore after Radix's scroll lock
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo(0, savedPos);
        });
      });
    }
  }, [editingAsset]);

  const [marketData, setMarketData] = useState<MarketData>({
    exchangeRate: 32.5,
    rates: { TWD: 32.5, CNY: 7.2, USD: 1, SGD: 1.35 },
    assetMarketPrices: {}
  });

  const t = translations[language];

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    const handleResize = () => setIsDesktop(window.innerWidth >= 1280);
    handleResize();
    window.addEventListener('resize', handleResize);

    const savedVersion = localStorage.getItem('app_version');
    if (savedVersion !== APP_VERSION) {
      localStorage.setItem('app_version', APP_VERSION);
      localStorage.removeItem('sections');
      localStorage.removeItem('layoutConfigs');
      localStorage.removeItem('has_seen_intro'); // Reset intro on version bump
      window.location.reload();
      return;
    }

    const hasSeenIntro = localStorage.getItem('has_seen_intro');
    if (hasSeenIntro) setShowIntro(false);

    const savedAssets = localStorage.getItem('assets');
    if (savedAssets) setAssets(JSON.parse(savedAssets));

    const savedSections = localStorage.getItem('sections');
    if (savedSections) setSections(JSON.parse(savedSections));

    const savedConfigs = localStorage.getItem('layoutConfigs');
    if (savedConfigs) setLayoutConfigs(JSON.parse(savedConfigs));

    const savedLang = localStorage.getItem('pref_language');
    if (savedLang) setLanguage(savedLang as 'en' | 'zh');

    const savedCurrency = localStorage.getItem('pref_currency');
    if (savedCurrency) setDisplayCurrency(savedCurrency as Currency);

    const savedTracking = localStorage.getItem('pref_trackingDays');
    if (savedTracking) setTrackingDays(savedTracking);

    const savedInterval = localStorage.getItem('pref_interval');
    if (savedInterval) setInterval(savedInterval);

    const savedUpdated = localStorage.getItem('pref_lastUpdated');
    if (savedUpdated) setLastUpdated(savedUpdated);

    // Handle GitHub Auth Callback
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('gh_token');
    if (token) {
      // Clear token from URL
      window.history.replaceState({}, document.title, window.location.pathname);
      handleGitHubLogin(token);
    } else {
      const savedToken = localStorage.getItem('gh_token');
      if (savedToken) handleGitHubLogin(savedToken);
    }

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleGitHubLogin = async (token: string) => {
    try {
      const user = await fetchGitHubUser(token);
      setGhConfig(prev => ({ ...prev, token, user }));
      localStorage.setItem('gh_token', token);
      toast({ title: language === 'zh' ? 'GitHub 已連結' : 'GitHub Connected', description: `Welcome, ${user.name || user.login}` });
    } catch (err) {
      console.error('GitHub login failed', err);
      localStorage.removeItem('gh_token');
    }
  };

  const syncToGitHub = async () => {
    if (!ghConfig.token || !ghConfig.user) return;
    setIsSyncing(true);
    try {
      await ensureRepoExists(ghConfig.token, ghConfig.user.login);
      await uploadToGitHub(ghConfig.token, ghConfig.user.login, { assets, sections, layoutConfigs });
      const now = new Date().toLocaleString();
      setGhConfig(prev => ({ ...prev, lastSync: now }));
      toast({ title: language === 'zh' ? '同步成功' : 'Sync Successful', description: language === 'zh' ? '資料已上傳至 GitHub' : 'Data uploaded to GitHub' });
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Sync Failed', description: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const syncFromGitHub = async () => {
    if (!ghConfig.token || !ghConfig.user) return;
    setIsSyncing(true);
    try {
      const data = await downloadFromGitHub(ghConfig.token, ghConfig.user.login);
      if (data) {
        if (data.assets) setAssets(data.assets);
        if (data.sections) setSections(data.sections);
        if (data.layoutConfigs) setLayoutConfigs(data.layoutConfigs);
        toast({ title: language === 'zh' ? '匯入成功' : 'Import Successful', description: language === 'zh' ? '已從 GitHub 抓取最新資料' : 'Latest data fetched from GitHub' });
        if (data.assets) updateAllData(data.assets);
      } else {
        toast({ title: language === 'zh' ? '找不到備份' : 'No Backup Found' });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Import Failed', description: err.message });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGitHubConnect = () => {
    const scope = 'repo';
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=${scope}&redirect_uri=${encodeURIComponent(GAS_PROXY_URL)}`;
  };

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('assets', JSON.stringify(assets));
      localStorage.setItem('sections', JSON.stringify(sections));
      localStorage.setItem('layoutConfigs', JSON.stringify(layoutConfigs));
      localStorage.setItem('pref_language', language);
      localStorage.setItem('pref_currency', displayCurrency);
      localStorage.setItem('pref_trackingDays', trackingDays);
      localStorage.setItem('pref_interval', interval);
      if (lastUpdated) localStorage.setItem('pref_lastUpdated', lastUpdated);
    }
  }, [assets, sections, layoutConfigs, language, displayCurrency, trackingDays, interval, lastUpdated, mounted]);

  const updateAllData = useCallback(async (currentAssets: Asset[]) => {
    if (!mounted || loading) return;
    setLoading(true);
    try {
      let p2 = Math.floor(Date.now() / 1000);
      let p1: number;
      if (trackingDays === 'max') {
        if (currentAssets.length > 0) {
          const dates = currentAssets.map(a => new Date(a.acquisitionDate).getTime());
          p1 = Math.floor(Math.min(...dates) / 1000);
        } else {
          p1 = p2 - (365 * 24 * 60 * 60);
        }
      } else {
        p1 = p2 - (parseInt(trackingDays) * 24 * 60 * 60);
      }
      const result = await fetchMarketData(currentAssets, p1, p2, interval);
      setMarketData(result.marketData);
      setMarketTimeline(result.historicalTimeline);
      const now = new Date();
      const timestamp = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      setLastUpdated(timestamp);
      if (typeof window !== 'undefined' && window.innerWidth > 1024) {
        toast({ title: t.dataUpdated });
      }
    } catch (error) {
      console.warn('Market sync failed - continuing with cached data:', error);
    } finally {
      setLoading(false);
    }
  }, [mounted, trackingDays, interval, t.dataUpdated, loading, toast]);

  useEffect(() => {
    if (mounted && assets.length > 0) {
      updateAllData(assets);
    }
  }, [mounted, trackingDays, interval, assets.length]);

  const assetCalculations = useMemo(() => {
    let totalTWD = 0;
    const allocationMap: Record<string, number> = {};
    const rateTWD = marketData.rates?.TWD || 32.5;
    const displayRate = marketData.rates?.[displayCurrency] || 1;
    const todayStr = new Date().toISOString().split('T')[0];
    const lastKnownPrices: Record<string, number> = {};
    // DO NOT pre-seed with current prices — let timeline data fill in historical prices
    // as we walk through each day. This ensures historical chart values reflect actual
    // prices at each point in time, not today's price.
    const dayAggregator: Record<string, any> = {};
    const sortedTimeline = [...marketTimeline].sort((a, b) => a.timestamp - b.timestamp);

    const processedAssets = assets.map(asset => {
      const marketInfo = marketData.assetMarketPrices?.[asset.id];
      const nativePrice = marketInfo?.price || 0;
      const apiCurrency = marketInfo?.currency || asset.currency || 'TWD';
      const apiCurrencyRate = (marketData.rates?.[apiCurrency as Currency] || 1);
      let valueInTWD = 0;
      const isClosed = asset.endDate ? asset.endDate < todayStr : false;
      if (!isClosed) {
        if (asset.symbol && asset.symbol.trim() !== '') {
          const priceInTWD = nativePrice * (rateTWD / apiCurrencyRate);
          valueInTWD = (asset.amount || 0) * priceInTWD;
        } else {
          const assetCurrencyRate = marketData.rates?.[asset.currency] || 1;
          valueInTWD = (asset.amount || 0) * (rateTWD / assetCurrencyRate);
        }
        totalTWD += valueInTWD;
        allocationMap[asset.category] = (allocationMap[asset.category] || 0) + valueInTWD;
      }
      const valueInDisplay = valueInTWD * (displayRate / rateTWD);
      const unitPriceInDisplay = (asset.symbol && asset.symbol.trim() !== '')
        ? (nativePrice * (rateTWD / apiCurrencyRate)) * (displayRate / rateTWD)
        : (rateTWD / (marketData.rates?.[asset.currency] || 1)) * (displayRate / rateTWD);
      let changePercent = 0;
      const timelineForAsset = sortedTimeline.filter(p => p.assets?.[asset.id] !== undefined);
      if (timelineForAsset.length >= 2) {
        const last = timelineForAsset[timelineForAsset.length - 1].assets[asset.id];
        const prev = timelineForAsset[timelineForAsset.length - 2].assets[asset.id];
        if (last && prev) changePercent = ((last - prev) / prev) * 100;
      }
      return { ...asset, isClosed, valueInDisplay, priceInDisplay: unitPriceInDisplay, changePercent, valueInTWD };
    });

    // 第二部分：歷史走勢計算 (Chart Data)
    // 確保即使沒有 symbol (只有現金) 也能產生走勢圖
    let timelineToUse = [...sortedTimeline];
    if (timelineToUse.length === 0 && assets.length > 0) {
      // 如果沒有 symbol 數據，產生至少兩個點（起始日期或 30 天前，以及今天）
      const p1 = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60);
      const p2 = Math.floor(Date.now() / 1000);
      timelineToUse = [{ timestamp: p1, assets: {} }, { timestamp: p2, assets: {} }];
    } else if (timelineToUse.length > 0) {
      // 確保最後一個點是「今天」，以符合目前的總體資產顯示
      const lastPoint = timelineToUse[timelineToUse.length - 1];
      const todayUnix = Math.floor(Date.now() / 1000);
      const lastPointDate = new Date(lastPoint.timestamp * 1000).toISOString().split('T')[0];
      const todayStrLocal = new Date().toISOString().split('T')[0];

      if (lastPointDate !== todayStrLocal) {
        timelineToUse.push({
          timestamp: todayUnix,
          assets: Object.fromEntries(
            assets
              .filter(a => a.symbol && marketData.assetMarketPrices?.[a.id])
              .map(a => [a.id, marketData.assetMarketPrices?.[a.id]?.price])
          )
        });
      }
    }

    const displayScale = displayRate / rateTWD;
    const dateFormatter = new Intl.DateTimeFormat(language === 'zh' ? 'zh-TW' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const shortDateFormatter = new Intl.DateTimeFormat(language === 'zh' ? 'zh-TW' : 'en-US', { month: 'short', day: 'numeric' });

    if (timelineToUse.length > 0) {
      const apiByDay: Record<string, any[]> = {};
      timelineToUse.forEach(p => {
        const d = new Date(p.timestamp * 1000).toISOString().split('T')[0];
        if (!apiByDay[d]) apiByDay[d] = [];
        apiByDay[d].push(p);
      });

      const allDays = Object.keys(apiByDay).sort();
      const firstDay = allDays[0];
      const lastDay = allDays[allDays.length - 1];

      let currentD = new Date(firstDay);
      const endD = new Date(lastDay);

      while (currentD <= endD) {
        const dateKey = currentD.toISOString().split('T')[0];
        const currentUnix = Math.floor(currentD.getTime() / 1000);

        if (apiByDay[dateKey]) {
          // Merge ALL data points for this day — different assets may have
          // different close timestamps (e.g. 0050.TW vs VTI on different exchanges)
          apiByDay[dateKey].forEach((point: any) => {
            Object.entries(point.assets || {}).forEach(([id, price]) => {
              lastKnownPrices[id] = price as number;
            });
          });
        }

        let pointTotalTWD = 0;
        const categoriesTWD: Record<string, number> = {};
        const assetDetails: Record<string, { name: string; category: string; symbol: string; value: number }> = {};

        const currentT = currentD.getTime();
        for (const asset of processedAssets) {
          const acqTime = new Date(asset.acquisitionDate).getTime();
          if (currentT < acqTime || (asset.endDate && dateKey > asset.endDate)) continue;

          let valInTWD = 0;
          if (asset.symbol && asset.symbol.trim() !== '') {
            let priceAtT = lastKnownPrices[asset.id];
            if (priceAtT !== undefined) {
              const apiCurrency = marketData.assetMarketPrices?.[asset.id]?.currency || asset.currency || 'TWD';
              const apiCurrencyRate = marketData.rates?.[apiCurrency as Currency] || 1;
              valInTWD = (asset.amount || 0) * priceAtT * (rateTWD / apiCurrencyRate);
            }
          } else {
            const assetCurrencyRate = marketData.rates?.[asset.currency] || 1;
            valInTWD = (asset.amount || 0) * (rateTWD / assetCurrencyRate);
          }

          if (valInTWD > 0) {
            pointTotalTWD += valInTWD;
            categoriesTWD[asset.category] = (categoriesTWD[asset.category] || 0) + valInTWD;
            assetDetails[asset.id] = {
              name: asset.name,
              category: asset.category,
              symbol: asset.symbol || '',
              value: valInTWD * displayScale
            };
          }
        }

        if (pointTotalTWD > 0) {
          const categoryEntries = {};
          for (const [c, v] of Object.entries(categoriesTWD)) {
            (categoryEntries as any)[c] = v * displayScale;
          }

          dayAggregator[dateKey] = {
            timestamp: currentUnix,
            displayDate: dateFormatter.format(currentD),
            shortDate: shortDateFormatter.format(currentD),
            totalValue: pointTotalTWD * displayScale,
            _assetDetails: assetDetails,
            ...categoryEntries
          };
        }
        currentD.setDate(currentD.getDate() + 1);
      }
    }

    const historyData = Object.keys(dayAggregator).sort().map(key => dayAggregator[key]);
    return {
      processedAssets,
      activeAssets: processedAssets.filter(a => !a.isClosed),
      closedAssets: processedAssets.filter(a => a.isClosed),
      totalTWD,
      totalDisplay: totalTWD * displayScale,
      allocationData: Object.entries(allocationMap).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value: value * displayScale })),
      chartData: historyData
    };
  }, [assets, marketData, displayCurrency, marketTimeline]);

  const getSortedItems = useCallback((items: any[], config: SortConfig) => {
    if (!config.direction) return items;
    return [...items].sort((a, b) => {
      let aVal = a[config.key];
      let bVal = b[config.key];
      if (typeof aVal === 'string') { aVal = aVal.toLowerCase(); bVal = bVal.toLowerCase(); }
      if (aVal < bVal) return config.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return config.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, []);

  const sortedActiveAssets = useMemo(() => {
    let filtered = assetCalculations.activeAssets;
    if (categoryFilter !== 'all') filtered = filtered.filter(a => a.category === categoryFilter);
    return getSortedItems(filtered, activeSort);
  }, [assetCalculations.activeAssets, activeSort, getSortedItems, categoryFilter]);

  const sortedClosedAssets = useMemo(() => getSortedItems(assetCalculations.closedAssets, closedSort), [assetCalculations.closedAssets, closedSort, getSortedItems]);

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    assets.forEach(a => cats.add(a.category));
    return Array.from(cats);
  }, [assets]);

  const requestSort = (list: 'active' | 'closed', key: string) => {
    const setter = list === 'active' ? setActiveSort : setClosedSort;
    const current = list === 'active' ? activeSort : closedSort;
    let direction: 'asc' | 'desc' | null = 'asc';
    if (current.key === key && current.direction === 'asc') direction = 'desc';
    else if (current.key === key && current.direction === 'desc') direction = null;
    setter({ key, direction });
  };

  const resizeSection = (id: string, axis: 'x' | 'y', direction: 'inc' | 'dec') => {
    setLayoutConfigs(prev => {
      const existing = prev[id] || { width: 12, height: 400 };
      const config = { ...existing };
      if (axis === 'x') {
        const steps = [4, 6, 8, 10, 12];
        const currentIdx = steps.indexOf(config.width);
        if (direction === 'inc' && currentIdx < steps.length - 1) config.width = steps[currentIdx + 1];
        if (direction === 'dec' && currentIdx > 0) config.width = steps[currentIdx - 1];
      } else {
        if (direction === 'inc') config.height = Math.min(1500, config.height + 50);
        if (direction === 'dec') config.height = Math.max(80, config.height - 50);
      }
      return { ...prev, [id]: config };
    });
  };

  const handleExport = () => {
    const dataStr = JSON.stringify({ assets, sections, layoutConfigs }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `assets-insights-pro-backup.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const [activeId, setActiveId] = useState<string | null>(null);
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  if (!mounted) return null;

  if (showIntro) {
    return (
      <div className="fixed inset-0 z-[5000] bg-white overflow-y-auto no-scrollbar">
        <div className="min-h-full w-full bg-slate-50 flex flex-col items-center justify-start sm:justify-center p-4 sm:p-10 relative overflow-hidden font-['Zen_Maru_Gothic']">
          <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-50/50 to-transparent pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-slate-200/30 rounded-full blur-3xl" />

          <div className="relative z-10 w-full max-w-4xl space-y-12 sm:space-y-20 py-10 sm:py-0">
            <div className="text-center space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000 px-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-slate-100 mb-4">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.2em] text-slate-500">Asset Insights v{APP_VERSION}</span>
              </div>
              <h1 className="text-5xl sm:text-8xl font-black text-slate-900 tracking-tighter leading-[0.95] drop-shadow-sm">
                NEXT GEN<br />PORTFOLIO.
              </h1>
              <p className="text-sm sm:text-xl font-bold text-slate-500 max-w-2xl mx-auto leading-relaxed">
                {language === 'zh' ? '全方位的個人資產管理與 AI 智慧財務決策系統。' : 'Next-generation personal asset management and AI-powered financial decision system.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-8 px-2 sm:px-0">
              {[
                { icon: <Activity className="w-6 h-6 text-white" />, title: language === 'zh' ? '即時市場數據' : 'Real-time Data', desc: language === 'zh' ? '整合全球市場 API，提供毫秒級價格更新與匯率換算。' : 'Global market API integration with millisecond updates.' },
                { icon: <Globe className="w-6 h-6 text-white" />, title: language === 'zh' ? '多幣別全球化' : 'Global Support', desc: language === 'zh' ? '支援台幣、美金、人民幣與新幣，掌握全球資產動態。' : 'Support for TWD, USD, CNY, and SGD assets.' },
                { icon: <Brain className="w-6 h-6 text-white" />, title: language === 'zh' ? 'AI 策略審計' : 'AI Auditing', desc: language === 'zh' ? 'Gemini 2.5 驅動，為您的投資部位提供專業級優化建議。' : 'Professional optimization powered by Gemini 2.5.' }
              ].map((item, i) => (
                <div key={i} className="bg-white/80 backdrop-blur-xl p-8 rounded-[32px] border border-white shadow-xl shadow-slate-200/50 space-y-4 hover:-translate-y-2 transition-all duration-500 group animate-in fade-in slide-in-from-bottom-10" style={{ animationDelay: `${i * 200 + 400}ms` }}>
                  <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">{item.icon}</div>
                  <h3 className="text-lg font-black text-slate-900">{item.title}</h3>
                  <p className="text-xs font-bold text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-center pt-8 sm:pt-10">
              <Button
                onClick={() => { setShowIntro(false); localStorage.setItem('has_seen_intro', 'true'); }}
                className="group relative h-16 sm:h-24 px-8 sm:px-20 bg-slate-900 hover:bg-black text-white rounded-full transition-all duration-500 hover:scale-105 active:scale-95 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-10"
                style={{ animationDelay: '1000ms' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-center gap-3 sm:gap-6">
                  <span className="text-sm sm:text-2xl font-black tracking-[0.05em] sm:tracking-[0.2em] uppercase font-['Zen_Maru_Gothic','Noto_Sans_TC']">
                    {language === 'zh' ? '即刻開啟 ASSET INSIGHTS' : 'LAUNCH EXPERIENCE'}
                  </span>
                  <ArrowRightLeft className="w-5 h-5 sm:w-8 sm:h-8 group-hover:translate-x-2 transition-transform" />
                </div>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/30 text-black pb-32 overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 z-[2000] bg-white/80 backdrop-blur-xl border-b border-slate-100 h-16 sm:h-20 flex items-center transition-all duration-300 shadow-sm">
        <div className="max-w-[1900px] w-full mx-auto px-4 sm:px-10">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="p-1.5 sm:p-2 bg-black rounded-lg sm:rounded-xl shadow-lg rotate-[-5deg] hover:rotate-0 transition-transform shrink-0">
                <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-sm sm:text-xl tracking-tighter leading-none">ASSET INSIGHTS</span>
                <span className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-0.5 hidden xs:block">Portfolio Engine</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { localStorage.removeItem('has_seen_intro'); setShowIntro(true); }}
                  className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-black transition-colors hidden xs:flex"
                >
                  <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
                <Button
                  variant={isReordering ? "default" : "outline"}
                  size="sm"
                  onClick={() => setIsReordering(!isReordering)}
                  className={cn(
                    "h-8 sm:h-10 px-3 sm:px-5 font-black text-[10px] sm:text-[12px] uppercase gap-2 transition-all rounded-full",
                    isReordering ? "bg-black text-white ring-4 ring-black/10 shadow-lg" : "hover:border-black"
                  )}
                >
                  <GripHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden md:inline">{isReordering ? 'EXIT LAYOUT' : 'LAYOUT'}</span>
                </Button>

                <div className="flex bg-slate-100 p-1 rounded-full items-center">
                  <Button variant={language === 'zh' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('zh')} className="h-6 sm:h-8 px-2.5 sm:px-4 font-black text-[10px] sm:text-[11px] rounded-full transition-all">繁</Button>
                  <Button variant={language === 'en' ? 'secondary' : 'ghost'} size="sm" onClick={() => setLanguage('en')} className="h-6 sm:h-8 px-2.5 sm:px-4 font-black text-[10px] sm:text-[11px] rounded-full transition-all">EN</Button>
                </div>

                <Select value={displayCurrency} onValueChange={(v) => setDisplayCurrency(v as Currency)}>
                  <SelectTrigger className="h-8 sm:h-10 w-16 sm:w-24 bg-slate-100 border-none font-black text-[11px] sm:text-[13px] rounded-full hover:bg-slate-200 transition-colors focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end" className="min-w-[100px] font-black text-[12px] rounded-2xl border-slate-100 shadow-2xl p-1">
                    {(['TWD', 'USD', 'CNY', 'SGD'] as Currency[]).map(cur => (
                      <SelectItem key={cur} value={cur} className="rounded-xl focus:bg-slate-100 cursor-pointer py-2 px-3">{cur}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {ghConfig.user ? (
                  <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-slate-100 ml-0.5 sm:ml-1 shrink-0">
                    <div className="flex flex-col items-end">
                      <span className="text-[8px] sm:text-[10px] font-black leading-none truncate max-w-[60px] sm:max-w-none">{ghConfig.user.name || ghConfig.user.login}</span>
                      <span className="text-[7px] sm:text-[8px] font-bold text-emerald-500 uppercase tracking-tighter">Synced</span>
                    </div>
                    <img src={ghConfig.user.avatar_url} alt="GitHub" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-white shadow-sm hover:scale-110 transition-transform cursor-pointer object-cover shrink-0" title="GitHub Connected" />
                  </div>
                ) : (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleGitHubConnect}
                    className="h-8 w-8 rounded-full hover:bg-slate-100 text-slate-400 hover:text-black transition-colors"
                  >
                    <Globe className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-[1900px] mx-auto px-3 sm:px-10 pt-[115px] sm:pt-24 pb-20">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <SortableContext items={sections} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8 items-start">
              {sections.map((id) => (
                <SortableSection
                  key={id}
                  id={id}
                  isReordering={isReordering}
                  layoutConfigs={layoutConfigs}
                  assetCalculations={assetCalculations}
                  loading={loading}
                  displayCurrency={displayCurrency}
                  t={t}
                  language={language}
                  isDesktop={isDesktop}
                  assets={assets}
                  setAssets={setAssets}
                  updateAllData={updateAllData}
                  setEditingAsset={setEditingAsset}
                  setEditName={setEditName}
                  setEditAmount={setEditAmount}
                  setEditAmountUnit={setEditAmountUnit}
                  setEditDate={setEditDate}
                  setEditEndDate={setEditEndDate}
                  setEditCurrency={setEditCurrency}
                  scrollPosRef={scrollPosRef}
                  categoryFilter={categoryFilter}
                  setCategoryFilter={setCategoryFilter}
                  allCategories={allCategories}
                  activeSort={activeSort}
                  closedSort={closedSort}
                  requestSort={requestSort}
                  sortedActiveAssets={sortedActiveAssets}
                  sortedClosedAssets={sortedClosedAssets}
                  trackingDays={trackingDays}
                  setTrackingDays={setTrackingDays}
                  interval={interval}
                  setInterval={setInterval}
                  handleExport={handleExport}
                  fileInputRef={fileInputRef}
                  lastUpdated={lastUpdated}
                  resizeSection={resizeSection}
                  toast={toast}
                  ghConfig={ghConfig}
                  isSyncing={isSyncing}
                  syncToGitHub={syncToGitHub}
                  syncFromGitHub={syncFromGitHub}
                  handleGitHubConnect={handleGitHubConnect}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </main>

      <Dialog open={!!editingAsset} onOpenChange={(open) => !open && setEditingAsset(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-[480px] bg-white rounded-3xl p-6" onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader><DialogTitle className="text-xl font-black uppercase flex items-center gap-3"><Edit2 className="w-5 h-5 text-primary" /> {t.editAsset}</DialogTitle></DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-1"><Label htmlFor="edit-name" className="pro-label text-[10px]">{t.assetName}</Label><Input id="edit-name" value={editName} onFocus={(e) => { const target = e.currentTarget; setTimeout(() => target.select(), 50); }} onChange={(e) => setEditName(e.target.value)} className="h-9 font-black text-sm rounded-lg" /></div>
            <div className="space-y-1">
              <Label htmlFor="edit-amount" className="pro-label text-[10px]">{t.holdings}</Label>
              <div className="flex gap-2">
                <Input id="edit-amount" type="number" step="any" value={editAmount} onFocus={(e) => { const target = e.currentTarget; setTimeout(() => target.select(), 50); }} onChange={(e) => setEditAmount(parseFloat(e.target.value) || 0)} className="h-9 font-black text-sm rounded-lg flex-1" />
                {(editingAsset?.category === 'Stock' || editingAsset?.category === 'ETF') && (
                  <Select value={editAmountUnit} onValueChange={(val: any) => setEditAmountUnit(val)}>
                    <SelectTrigger className="w-20 h-9 bg-slate-50 border-slate-200 text-[13px] font-bold rounded-lg shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="share">{language === 'zh' ? '股' : 'Shares'}</SelectItem>
                      <SelectItem value="lot">{language === 'zh' ? '張' : 'Lots'}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            {editingAsset && (!editingAsset.symbol || editingAsset.symbol.trim() === '') && (<div className="space-y-1"><Label className="pro-label text-[10px]">{t.currency}</Label><Select value={editCurrency} onValueChange={(v) => setEditCurrency(v as Currency)}><SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-[13px] font-bold rounded-lg"><SelectValue /></SelectTrigger><SelectContent>{['TWD', 'USD', 'CNY', 'SGD'].map(c => <SelectItem key={c} value={c} className="text-[13px] font-bold">{c}</SelectItem>)}</SelectContent></Select></div>)}
            <div className="grid grid-cols-2 gap-3"><div className="space-y-1"><Label className="pro-label text-[10px]">{t.acqDate}</Label><Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="h-9 font-black text-xs rounded-lg" /></div><div className="space-y-1"><Label className="pro-label text-[10px]">{t.posEndDate}</Label><Input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)} className="h-9 font-black text-xs rounded-lg" /></div></div>
          </div>
          <DialogFooter className="flex flex-row gap-3"><Button variant="ghost" onClick={() => { setEditingAsset(null); }} className="h-10 flex-1 font-black uppercase text-xs">{t.cancel}</Button><Button onClick={() => { const finalAmount = (editingAsset?.category === 'Stock' || editingAsset?.category === 'ETF') && editAmountUnit === 'lot' ? editAmount * 1000 : editAmount; const updated = assets.map(a => a.id === editingAsset?.id ? { ...a, name: editName, amount: finalAmount, amountUnit: editAmountUnit as any, acquisitionDate: editDate, endDate: editEndDate || undefined, currency: editCurrency } : a); setAssets(updated); setEditingAsset(null); updateAllData(updated); }} className="bg-black text-white h-10 flex-1 font-black uppercase text-[13px] px-3 shadow-md">{t.saveChanges}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface SortableSectionProps {
  id: string;
  isReordering: boolean;
  layoutConfigs: Record<string, LayoutConfig>;
  assetCalculations: any;
  loading: boolean;
  displayCurrency: Currency;
  t: any;
  language: 'zh' | 'en';
  isDesktop: boolean;
  assets: Asset[];
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  updateAllData: (assets: Asset[]) => void;
  setEditingAsset: (asset: Asset | null) => void;
  setEditName: (val: string) => void;
  setEditAmount: (val: number) => void;
  setEditAmountUnit: (val: string) => void;
  setEditDate: (val: string) => void;
  setEditEndDate: (val: string) => void;
  setEditCurrency: (val: Currency) => void;
  scrollPosRef: React.MutableRefObject<number>;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  allCategories: string[];
  activeSort: SortConfig;
  closedSort: SortConfig;
  requestSort: (list: 'active' | 'closed', key: string) => void;
  sortedActiveAssets: any[];
  sortedClosedAssets: any[];
  trackingDays: string;
  setTrackingDays: (val: string) => void;
  interval: string;
  setInterval: (val: string) => void;
  handleExport: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  lastUpdated: string | null;
  resizeSection: (id: string, axis: 'x' | 'y', direction: 'inc' | 'dec') => void;
  toast: any;
  ghConfig: GitHubConfig;
  isSyncing: boolean;
  syncToGitHub: () => void;
  syncFromGitHub: () => void;
  handleGitHubConnect: () => void;
}

const SortableSection = ({
  id, isReordering, layoutConfigs, assetCalculations, loading, displayCurrency, t, language, isDesktop,
  assets, setAssets, updateAllData, setEditingAsset, setEditName, setEditAmount, setEditAmountUnit,
  setEditDate, setEditEndDate, setEditCurrency, scrollPosRef, categoryFilter, setCategoryFilter,
  allCategories, activeSort, closedSort, requestSort, sortedActiveAssets, sortedClosedAssets,
  trackingDays, setTrackingDays, interval, setInterval, handleExport, fileInputRef, lastUpdated, resizeSection, toast,
  ghConfig, isSyncing, syncToGitHub, syncFromGitHub, handleGitHubConnect
}: SortableSectionProps) => {
  if (id === 'closedList' && assetCalculations.closedAssets.length === 0) return null;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !isReordering });

  const config = layoutConfigs[id] || { width: 12, height: 400 };

  let currentHeight: any = 'auto';
  const hasActive = assetCalculations.activeAssets.length > 0;
  const hasClosed = assetCalculations.closedAssets.length > 0;
  const hasChartData = assetCalculations.chartData.length > 0;
  const hasAllocationData = assetCalculations.allocationData.length > 0;

  if (id === 'list' || id === 'closedList' || id === 'ai' || id === 'addAsset' || id === 'summary' || id === 'controls') {
    currentHeight = 'auto';
  }
  else if (id === 'historicalTrend') {
    currentHeight = (!hasChartData) ? 180 : config.height;
  }
  else if (id === 'allocation') {
    currentHeight = (!hasAllocationData) ? 180 : config.height;
  }
  else {
    currentHeight = config.height;
  }

  const commonClass = cn(
    "relative transition-all duration-500 ease-in-out",
    isReordering && "z-[900]",
    config.width === 4 && "xl:col-span-4",
    config.width === 5 && "xl:col-span-5",
    config.width === 6 && "xl:col-span-6",
    config.width === 7 && "xl:col-span-7",
    config.width === 8 && "xl:col-span-8",
    config.width === 10 && "xl:col-span-10",
    config.width === 12 && "xl:col-span-12"
  );

  const wrapperStyle = {
    minHeight: currentHeight === 'auto' ? 'auto' : `${currentHeight}px`,
    height: currentHeight === 'auto' ? 'auto' : undefined,
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? 'none' : transition,
    zIndex: isDragging ? 9999 : (isReordering ? 900 : 1),
    opacity: isDragging ? 0.4 : 1,
  };

  let content = null;
  switch (id) {
    case 'summary':
      content = (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full items-stretch">
          <Card className="md:col-span-8 lg:col-span-9 modern-card p-4 sm:p-6 relative overflow-hidden bg-white flex flex-col justify-center min-h-[140px]">
            <div className="space-y-2 z-20 relative text-left">
              <div className="pro-label text-xs sm:text-sm"><Globe className="w-3.5 h-3.5" /> {t.totalValue}</div>
              <div className="pro-title flex items-center text-2xl sm:text-4xl">
                <span className="text-slate-200 font-medium text-[0.6em] mr-2">{CURRENCY_SYMBOLS[displayCurrency]}</span>
                <span>{assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                {loading && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-slate-200 ml-3" />}
              </div>
            </div>
            <div className="absolute bottom-4 right-4 opacity-5 pointer-events-none"><Wallet className="w-12 h-12 sm:w-20 sm:h-20 text-black" /></div>
          </Card>
          <div className="md:col-span-4 lg:col-span-3 flex items-stretch">
            <Button onClick={() => updateAllData(assets)} disabled={loading} className="w-full h-full bg-slate-900 text-white hover:bg-black font-black flex flex-col items-center justify-center gap-1 rounded-2xl shadow-lg transition-all active:scale-95 py-4 px-6">
              <div className="flex items-center gap-3"><RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /><span className="text-[13px] tracking-[0.2em] uppercase font-black">{loading ? t.fetching : t.syncMarket}</span></div>
              {lastUpdated && !loading && (<span className="text-[10px] opacity-60 font-bold uppercase tracking-widest mt-1">{lastUpdated}</span>)}
            </Button>
          </div>
        </div>
      ); break;
    case 'controls':
      content = (
        <section className="bg-slate-50/80 backdrop-blur-md p-4 border border-slate-100 rounded-2xl flex flex-col xl:flex-row items-center gap-4 shadow-sm h-full overflow-hidden">
          <div className="w-full xl:w-auto grid grid-cols-2 sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
              <Label className="pro-label text-[10px] whitespace-nowrap opacity-60 flex items-center gap-1 shrink-0">{t.baseRange}</Label>
              <Select value={trackingDays} onValueChange={setTrackingDays}>
                <SelectTrigger className="w-full sm:w-28 h-8 bg-white font-black text-[11px] rounded-lg border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">{t.days30}</SelectItem>
                  <SelectItem value="90">{t.days90}</SelectItem>
                  <SelectItem value="180">{t.days180}</SelectItem>
                  <SelectItem value="365">{t.days365}</SelectItem>
                  <SelectItem value="max">{t.maxRange}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1.5 flex-1 sm:flex-none">
              <Label className="pro-label text-[10px] whitespace-nowrap opacity-60 flex items-center gap-1 shrink-0">{t.interval}</Label>
              <Select value={interval} onValueChange={setInterval}>
                <SelectTrigger className="w-full sm:w-24 h-8 bg-white font-black text-[11px] rounded-lg border-slate-200"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">{t.int1d}</SelectItem>
                  <SelectItem value="1wk">{t.int1wk}</SelectItem>
                  <SelectItem value="1mo">{t.int1mo}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-2 w-full">
            <Button variant="outline" size="sm" onClick={handleExport} className="flex-1 h-8 font-black text-[10px] uppercase gap-1 bg-white border-slate-200 rounded-lg"><Download className="w-3 h-3" /> {t.exportData}</Button>
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="flex-1 h-8 font-black text-[10px] uppercase gap-1 bg-white border-slate-200 rounded-lg"><Upload className="w-3 h-3" /> {t.importData}</Button>
            <input type="file" ref={fileInputRef} onChange={(e) => {
              const file = e.target.files?.[0]; if (!file) return;
              const reader = new FileReader(); reader.onload = (event) => {
                try { const data = JSON.parse(event.target?.result as string); if (data.assets) setAssets(data.assets); toast({ title: t.importSuccess }); } catch (err) { toast({ variant: 'destructive', title: '匯入失敗' }); }
              }; reader.readAsText(file);
            }} accept=".json" className="hidden" />
          </div>
          {ghConfig.token ? (
            <div className="w-full flex items-center gap-2 border-t border-slate-100 pt-3 xl:border-t-0 xl:pt-0 xl:w-auto">
              <Button variant="default" size="sm" disabled={isSyncing} onClick={syncToGitHub} className="flex-1 xl:flex-none h-8 font-black text-[10px] uppercase gap-1 bg-slate-900 text-white rounded-lg">
                {isSyncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />} Sync Cloud
              </Button>
              <Button variant="outline" size="sm" disabled={isSyncing} onClick={syncFromGitHub} className="flex-1 xl:flex-none h-8 font-black text-[10px] uppercase gap-1 bg-white border-slate-200 rounded-lg">
                Pull Cloud
              </Button>
            </div>
          ) : (
            <div className="w-full xl:w-auto border-t border-slate-100 pt-3 xl:border-t-0 xl:pt-0">
              <Button variant="outline" size="sm" onClick={handleGitHubConnect} className="w-full h-8 font-black text-[10px] uppercase gap-2 bg-white border-slate-200 rounded-lg">
                <Globe className="w-3 h-3" /> Connect GitHub
              </Button>
            </div>
          )}
        </section>
      ); break;
    case 'addAsset':
      content = (
        <Card className="modern-card bg-white h-full flex flex-col overflow-hidden">
          <CardHeader className="px-5 py-3 border-b border-slate-50 shrink-0 flex flex-row items-center justify-between">
            <h3 className="pro-label text-sm"><Plus className="w-4 h-4" /> {t.addAsset}</h3>
            <Button form="add-asset-form" type="submit" size="sm" className="bg-slate-900 hover:bg-black text-white font-black rounded-lg text-[13px] uppercase tracking-widest h-8 px-3">{t.saveChanges}</Button>
          </CardHeader>
          <CardContent className="p-5 flex-1 overflow-auto no-scrollbar">
            <AssetForm language={language} hideSubmit onAdd={(a) => { const newAsset = { ...a, id: crypto.randomUUID() }; setAssets(prev => [...prev, newAsset]); updateAllData([...assets, newAsset]); }} />
          </CardContent>
        </Card>
      ); break;
    case 'historicalTrend':
      content = <HistoricalTrendChart language={language} historicalData={assetCalculations.chartData} displayCurrency={displayCurrency} loading={loading} height={currentHeight === 'auto' ? 280 : currentHeight} activeAssets={assetCalculations.activeAssets} />;
      break;
    case 'allocation':
      content = <AllocationPieChart language={language} allocationData={assetCalculations.allocationData} displayCurrency={displayCurrency} loading={loading} height={currentHeight === 'auto' ? 280 : currentHeight} />;
      break;
    case 'list':
      content = (
        <Card className="modern-card bg-white h-full flex flex-col overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h3 className="pro-label text-sm"><BarChart3 className="w-5 h-5" /> {t.dashboard}</h3>
            <div className="flex items-center gap-2"><Filter className="w-3.5 h-3.5 text-slate-400" /><Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger className="w-[120px] h-8 bg-slate-50 border-slate-200 text-[11px] font-black uppercase rounded-lg"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{t.allCategories}</SelectItem>{allCategories.map(cat => (<SelectItem key={cat} value={cat}>{t.categoryNames[cat as keyof typeof t.categoryNames] || cat}</SelectItem>))}</SelectContent></Select></div>
          </div>
          <CardContent className="p-0 flex-1 overflow-hidden relative">
            <Table className="min-w-[1200px] border-separate border-spacing-0" wrapperClassName="h-full overflow-auto no-scrollbar">
              <TableHeader className="relative z-30">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="sticky top-0 bg-white/95 backdrop-blur-md px-6 h-12 cursor-pointer border-b border-slate-100 z-30" onClick={() => requestSort('active', 'name')}><div className="flex items-center text-[12px] font-black text-slate-500 uppercase tracking-widest">{t.assetName} <SortIcon config={activeSort} columnKey="name" /></div></TableHead>
                  <TableHead className="sticky top-0 bg-white/95 h-12 cursor-pointer border-b border-slate-100 z-30" onClick={() => requestSort('active', 'category')}><div className="flex items-center text-[12px] font-black text-slate-500 uppercase tracking-widest">{t.category} <SortIcon config={activeSort} columnKey="category" /></div></TableHead>
                  <TableHead className="sticky top-0 bg-white/95 h-12 cursor-pointer border-b border-slate-100 z-30" onClick={() => requestSort('active', 'acquisitionDate')}><div className="flex items-center text-[12px] font-black text-slate-500 uppercase tracking-widest">{t.acqDate} <SortIcon config={activeSort} columnKey="acquisitionDate" /></div></TableHead>
                  <TableHead className="sticky top-0 bg-white/95 h-12 cursor-pointer border-b border-slate-100 z-30" onClick={() => requestSort('active', 'amount')}><div className="flex items-center text-[12px] font-black text-slate-500 uppercase tracking-widest">{t.holdings} <SortIcon config={activeSort} columnKey="amount" /></div></TableHead>
                  <TableHead className="sticky top-0 bg-white/95 h-12 cursor-pointer border-b border-slate-100 z-30 text-right" onClick={() => requestSort('active', 'priceInDisplay')}><div className="flex items-center justify-end text-[12px] font-black text-slate-500 uppercase tracking-widest">{t.unitPrice} <SortIcon config={activeSort} columnKey="priceInDisplay" /></div></TableHead>
                  <TableHead className="sticky top-0 bg-white/95 h-12 cursor-pointer border-b border-slate-100 z-30 text-right" onClick={() => requestSort('active', 'valueInDisplay')}><div className="flex items-center justify-end text-[12px] font-black text-slate-500 uppercase tracking-widest">{t.valuation} <SortIcon config={activeSort} columnKey="valueInDisplay" /></div></TableHead>
                  <TableHead className="sticky top-0 bg-white/95 h-12 cursor-pointer border-b border-slate-100 z-30 text-right" onClick={() => requestSort('active', 'changePercent')}><div className="flex items-center justify-end text-[12px] font-black text-slate-500 uppercase tracking-widest">{t.priceChange} <SortIcon config={activeSort} columnKey="changePercent" /></div></TableHead>
                  <TableHead className="sticky top-0 bg-white/95 w-[60px] border-b border-slate-100 z-30"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedActiveAssets.map((asset: any) => (
                  <TableRow key={asset.id} className="group hover:bg-slate-50/50 border-slate-50">
                    <TableCell className="px-6 py-4">
                      <div className="font-black text-[14px] text-slate-900">{asset.name}</div>
                      <div className="text-[12px] font-black text-slate-400 uppercase tracking-[0.1em] mt-0.5">{asset.symbol || asset.category}</div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] font-black uppercase px-2 py-0.5">{t.categoryNames[asset.category as keyof typeof t.categoryNames] || asset.category}</Badge></TableCell>
                    <TableCell><span className="text-[13px] font-black text-slate-500">{asset.acquisitionDate}</span></TableCell>
                    <TableCell><span className="text-[14px] font-black text-slate-700">{formatNumber(asset.amount)}<span className="text-[10px] text-slate-400 ml-1 font-bold">{(['Stock', 'ETF'].includes(asset.category)) ? t.shares : ''}</span></span></TableCell>
                    <TableCell className="text-right"><div className="font-black text-[13px] text-slate-700"><span className="text-slate-300 text-[10px] mr-1">{CURRENCY_SYMBOLS[displayCurrency]}</span>{asset.priceInDisplay?.toLocaleString(undefined, { maximumFractionDigits: 4 }) || '0'}</div></TableCell>
                    <TableCell className="text-right"><div className="font-black text-base text-slate-900"><span className="text-slate-200 text-[12px] mr-1">{CURRENCY_SYMBOLS[displayCurrency]}</span>{asset.valueInDisplay?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}</div></TableCell>
                    <TableCell className="text-right"><div className={cn("inline-flex items-center gap-1 font-black text-[13px]", (asset.changePercent || 0) > 0 ? "text-emerald-500" : (asset.changePercent || 0) < 0 ? "text-rose-500" : "text-slate-400")}>{(asset.changePercent || 0) > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : (asset.changePercent || 0) < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : null}{(asset.changePercent || 0).toFixed(2)}%</div></TableCell>
                    <TableCell className="pr-6 text-right"><div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                      scrollPosRef.current = window.scrollY;
                      setEditingAsset(asset);
                      setEditName(asset.name);
                      if (asset.amountUnit) {
                        setEditAmount(asset.amountUnit === 'lot' ? asset.amount / 1000 : asset.amount);
                        setEditAmountUnit(asset.amountUnit);
                      } else if ((asset.category === 'Stock' || asset.category === 'ETF') && asset.amount >= 1000 && asset.amount % 1000 === 0) {
                        setEditAmount(asset.amount / 1000);
                        setEditAmountUnit('lot');
                      } else {
                        setEditAmount(asset.amount);
                        setEditAmountUnit('share');
                      }
                      setEditDate(asset.acquisitionDate);
                      setEditEndDate(asset.endDate || '');
                      setEditCurrency(asset.currency);
                    }}><Edit2 className="w-3.5 h-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-rose-300" onClick={() => { setAssets(prev => prev.filter(a => a.id !== asset.id)); }}><Trash2 className="w-3.5 h-3.5" /></Button></div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ); break;
    case 'closedList':
      content = (
        <Card className="modern-card bg-white h-full flex flex-col overflow-hidden opacity-80">
          <div className="px-6 py-4 border-b border-slate-50 shrink-0"><h3 className="pro-label text-sm"><History className="w-5 h-5" /> {t.closedPositions}</h3></div>
          <CardContent className="p-0 flex-1 overflow-auto no-scrollbar relative"><Table className="min-w-[800px] border-separate border-spacing-0"><TableBody>{sortedClosedAssets.map((asset: any) => (<TableRow key={asset.id} className="group hover:bg-slate-50/50 border-slate-50"><TableCell className="px-6 py-4"><div className="font-black text-[13px] text-slate-700 line-through">{asset.name}</div><div className="text-[11px] font-black text-slate-500 uppercase tracking-[0.1em] mt-0.5">{asset.symbol || asset.category}</div></TableCell><TableCell><span className="text-[13px] font-black text-slate-700">{formatNumber(asset.amount)}<span className="text-[10px] text-slate-500 ml-1 font-bold">{(['Stock', 'ETF'].includes(asset.category)) ? t.shares : ''}</span></span></TableCell><TableCell><span className="text-[12px] font-black text-slate-700">{asset.acquisitionDate}</span></TableCell><TableCell className="text-right"><div className="font-black text-[12px] text-slate-700">{asset.endDate}</div></TableCell><TableCell className="pr-6 text-right"><div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
            scrollPosRef.current = window.scrollY;
            setEditingAsset(asset);
            setEditName(asset.name);
            if (asset.amountUnit) {
              setEditAmount(asset.amountUnit === 'lot' ? asset.amount / 1000 : asset.amount);
              setEditAmountUnit(asset.amountUnit);
            } else if ((asset.category === 'Stock' || asset.category === 'ETF') && asset.amount >= 1000 && asset.amount % 1000 === 0) {
              setEditAmount(asset.amount / 1000);
              setEditAmountUnit('lot');
            } else {
              setEditAmount(asset.amount);
              setEditAmountUnit('share');
            }
            setEditDate(asset.acquisitionDate);
            setEditEndDate(asset.endDate || '');
            setEditCurrency(asset.currency);
          }}><Edit2 className="w-3.5 h-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-rose-300" onClick={() => { setAssets(prev => prev.filter(a => a.id !== asset.id)); }}><Trash2 className="w-3.5 h-3.5" /></Button></div></TableCell></TableRow>))}</TableBody></Table></CardContent>
        </Card>
      ); break;
    case 'ai':
      content = <AITipCard language={language} assets={assetCalculations.activeAssets} totalTWD={assetCalculations.totalTWD} />;
      break;
    default: return null;
  }

  return (
    <div
      ref={setNodeRef}
      style={wrapperStyle}
      className={cn(commonClass, id === 'summary' && "xl:col-span-12")}
      {...(isReordering ? { ...attributes, ...listeners } : {})}
    >
      {isDragging && <div className="absolute inset-0 bg-slate-100/30 rounded-2xl border-2 border-dashed border-slate-300 z-0" />}
      <div className={cn("h-full w-full transition-all duration-300", isReordering && "pointer-events-none", isDragging && "scale-[1.05] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] z-[1000] rotate-[1deg]")}>
        <div className={cn("h-full w-full rounded-2xl overflow-hidden", isReordering && !isDragging && "ring-2 ring-slate-200 shadow-sm")}>
          {content}
        </div>
      </div>
      {isReordering && (
        <div
          className="absolute bottom-2 right-2 z-[2100] flex flex-col gap-1 bg-black/90 backdrop-blur-xl p-1.5 rounded-xl border border-white/20 shadow-2xl scale-90 sm:scale-100"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-1 border-b border-white/10 pb-1 mb-1">
            <span className="text-[9px] font-black text-white/40 w-3 text-center">W</span>
            <button type="button" tabIndex={-1} className="h-6 w-6 text-white hover:bg-white/20 rounded-md flex items-center justify-center transition-colors" onClick={(e) => { e.preventDefault(); e.stopPropagation(); resizeSection(id, 'x', 'dec'); }}><Minimize2 className="w-3 h-3" /></button>
            <button type="button" tabIndex={-1} className="h-6 w-6 text-white hover:bg-white/20 rounded-md flex items-center justify-center transition-colors" onClick={(e) => { e.preventDefault(); e.stopPropagation(); resizeSection(id, 'x', 'inc'); }}><Maximize2 className="w-3 h-3" /></button>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-black text-white/40 w-3 text-center">H</span>
            <button type="button" tabIndex={-1} className="h-6 w-6 text-white hover:bg-white/20 rounded-md flex items-center justify-center transition-colors" onClick={(e) => { e.preventDefault(); e.stopPropagation(); resizeSection(id, 'y', 'dec'); }}><Minimize2 className="w-3 h-3" /></button>
            <button type="button" tabIndex={-1} className="h-6 w-6 text-white hover:bg-white/20 rounded-md flex items-center justify-center transition-colors" onClick={(e) => { e.preventDefault(); e.stopPropagation(); resizeSection(id, 'y', 'inc'); }}><Maximize2 className="w-3 h-3" /></button>
          </div>
        </div>
      )}
    </div>
  );
};
