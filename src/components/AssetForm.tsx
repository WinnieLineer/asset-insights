'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Asset } from '@/app/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, Search, Plus, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const AUTOCOMPLETE_API = 'https://script.google.com/macros/s/AKfycbzlJZLp5_hA5eiUDZ2oSj8eWf094drGlHXmE4uYapt1oz3aTScbJm6W-AoJb6hdYhZ5UQ/exec?q=';

const t = {
  en: {
    name: 'Asset Name',
    namePlaceholder: 'e.g., Apple Inc.',
    symbol: 'Ticker / Symbol',
    symbolPlaceholder: 'BTC, AAPL, 2330...',
    category: 'Category',
    customCategory: 'Custom Category',
    currency: 'Currency',
    amount: 'Holdings',
    date: 'Starting Holding Date',
    endDate: 'Closed Date',
    submit: 'Add Position',
    searching: 'Searching...',
    searchingGlobal: 'Searching live global market data...',
    searchingHint: 'Connecting to market proxy and fetching matches',
    searchingMore: 'Searching more...',
    canClickMatch: 'You can click current match',
    noMatchTitle: 'No matching ticker (Manual entry supported)',
    noMatchDesc: 'If this is a private asset or deposit, you can directly enter the asset name and holdings to add it.',
    categories: { Stock: 'Stock', Crypto: 'Crypto', Savings: 'Deposit', Bank: 'Other', ETF: 'ETF', Option: 'Option', Fund: 'Fund', Index: 'Index', Future: 'Future', Forex: 'Forex', Custom: 'Custom...' },
    errors: { 
      nameTooShort: 'Min 2 characters', 
      invalidAmount: 'Invalid amount', 
      required: 'Required', 
      tickerRequired: 'Symbol required for market assets',
      invalidTicker: 'Invalid symbol or not found',
      invalidDateRange: 'Closed date cannot be earlier than start date'
    }
  },
  zh: {
    name: '資產名稱',
    namePlaceholder: '例如：台積電、美金存款',
    symbol: '資產代碼',
    symbolPlaceholder: '搜尋 BTC, AAPL, 2330...',
    category: '資產類別',
    customCategory: '自定義類別名稱',
    currency: '持有幣別',
    amount: '持有數量',
    date: '起始持有日期',
    endDate: '結清日期',
    submit: '新增部位',
    searching: '查詢中...',
    searchingGlobal: '正在即時查詢全球市場行情...',
    searchingHint: '正在連線市場代理並檢索最佳匹配代碼',
    searchingMore: '持續搜尋中...',
    canClickMatch: '可直接點選已匹配標的',
    noMatchTitle: '查無符合代碼（仍可手動新增）',
    noMatchDesc: '若此為私有資產、定存或特殊投資，您可直接填寫資產名稱與金額，即可順利新增部位！',
    categories: { Stock: '股票', Crypto: '加密貨幣', Savings: '存款', Bank: '其他資產', ETF: 'ETF', Option: '選擇權', Fund: '基金', Index: '指數', Future: '期貨', Forex: '外匯', Custom: '自定義...' },
    errors: { 
      nameTooShort: '至少 2 個字', 
      invalidAmount: '請輸入有效的正數', 
      required: '必填', 
      tickerRequired: '此類別必須填寫代號',
      invalidTicker: '無效的資產代碼或查無此代號',
      invalidDateRange: '結清日期不得早於起始持有日期'
    }
  }
};

interface AssetFormProps {
  onAdd: (asset: Omit<Asset, 'id'>) => void;
  language: 'en' | 'zh';
  hideSubmit?: boolean;
}

interface Suggestion {
  symbol: string;
  name: string;
  exchDisp: string;
  typeDisp: string;
}

const PREDEFINED_CATEGORIES = ['Stock', 'ETF', 'Crypto', 'Forex', 'Fund', 'Index', 'Future', 'Option', 'Savings', 'Bank'];

export function AssetForm({ onAdd, language, hideSubmit = false }: AssetFormProps) {
  const lang = t[language];
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [tickerFound, setTickerFound] = useState<boolean | null>(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [amountUnit, setAmountUnit] = useState<'share' | 'lot'>('share');
  const isManualTyping = useRef(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const startOfYear = `${new Date().getFullYear()}-01-01`;

  const formSchema = useMemo(() => z.object({
    name: z.string().min(2, { message: lang.errors.nameTooShort }),
    symbol: z.string().optional(),
    category: z.string().min(1, { message: lang.errors.required }),
    amount: z.number({ invalid_type_error: lang.errors.invalidAmount }).min(0, { message: lang.errors.invalidAmount }),
    currency: z.enum(['TWD', 'USD', 'CNY', 'SGD']),
    acquisitionDate: z.string().min(1, { message: lang.errors.required }),
    endDate: z.string().optional(),
  }).refine((data) => {
    const skipValidation = ['Savings', 'Bank', 'Custom'].includes(data.category) || isCustomCategory;
    if (skipValidation) return true;
    if (!data.symbol || data.symbol.trim() === '') return false;
    return true;
  }, { message: lang.errors.tickerRequired, path: ['symbol'] })
  .refine((data) => {
    if (data.endDate && data.acquisitionDate && data.endDate < data.acquisitionDate) {
      return false;
    }
    return true;
  }, { message: lang.errors.invalidDateRange, path: ['endDate'] }), [lang, isCustomCategory]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      name: '', 
      symbol: '', 
      category: 'Stock', 
      amount: 0, 
      currency: 'TWD',
      acquisitionDate: startOfYear,
      endDate: ''
    },
  });

  const symbolValue = useWatch({ control: form.control, name: 'symbol' }) || '';
  const categoryValue = useWatch({ control: form.control, name: 'category' }) || 'Stock';
  const showCurrencyField = !symbolValue || symbolValue.trim() === '';
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const searchCacheRef = useRef<Map<string, Suggestion[]>>(new Map());

  const getFastMatches = (raw: string): Suggestion[] => {
    const clean = raw.trim().toUpperCase();
    if (!clean) return [];
    const list: Suggestion[] = [];
    if (/^\d{4,6}$/.test(clean)) {
      list.push({
        symbol: `${clean}.TW`,
        name: `${clean} (${language === 'zh' ? '台股快速代碼' : 'TW Stock'})`,
        exchDisp: 'TWSE',
        typeDisp: 'Stock'
      });
    }
    const cryptoAliases: Record<string, string> = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'SOL': 'Solana',
      'BNB': 'BNB',
      'DOGE': 'Dogecoin',
      'USDT': 'Tether',
      'USDC': 'USD Coin',
      'XRP': 'Ripple'
    };
    if (cryptoAliases[clean]) {
      list.push({
        symbol: `${clean}-USD`,
        name: `${cryptoAliases[clean]} (${clean}/USD)`,
        exchDisp: 'Crypto',
        typeDisp: 'Crypto'
      });
    }
    return list;
  };

  const performSearch = async (val: string) => {
    const query = (val || '').trim();
    if (!query) {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      setSuggestions([]);
      setTickerFound(null);
      setIsSearching(false);
      return;
    }

    const cacheKey = query.toUpperCase();
    const fastMatches = getFastMatches(query);

    // 1. 若記憶體快取命中，0 毫秒即時回傳！
    if (searchCacheRef.current.has(cacheKey)) {
      const cached = searchCacheRef.current.get(cacheKey) || [];
      setSuggestions(cached);
      setTickerFound(cached.length > 0);
      setIsSearching(false);
      setShowSuggestions(true);
      return;
    }

    // 2. 若有快速本地匹配候選（如台股 4 碼或知名虛幣），先立即呈現本地結果，不讓使用者乾等
    if (fastMatches.length > 0) {
      setSuggestions(fastMatches);
      setTickerFound(true);
      setShowSuggestions(true);
    } else {
      setShowSuggestions(true);
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearching(true);
    try {
      const response = await fetch(`${AUTOCOMPLETE_API}${encodeURIComponent(query)}`, {
        signal: controller.signal
      });
      if (response.ok) {
        const data = await response.json();
        const results = data.ResultSet?.Result || [];
        const networkSuggestions: Suggestion[] = results.map((r: any) => ({
          symbol: r.symbol,
          name: r.name,
          exchDisp: r.exchDisp,
          typeDisp: r.typeDisp
        }));

        // 合併快速匹配與網路搜尋結果（避免重複 symbol）
        const combined = [...fastMatches];
        networkSuggestions.forEach(ns => {
          if (!combined.some(c => c.symbol.toUpperCase() === ns.symbol.toUpperCase())) {
            combined.push(ns);
          }
        });

        searchCacheRef.current.set(cacheKey, combined);
        setSuggestions(combined);
        setTickerFound(combined.length > 0);
        setShowSuggestions(true);
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') return;
      setTickerFound(fastMatches.length > 0 ? true : null);
    } finally {
      if (abortControllerRef.current === controller) {
        setIsSearching(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  useEffect(() => {
    if (!isManualTyping.current || !symbolValue || symbolValue.trim().length < 1) {
      if (!symbolValue || symbolValue.trim() === '') {
        setSuggestions([]);
        setTickerFound(null);
        setShowSuggestions(false);
        setIsSearching(false);
      }
      return;
    }

    const timer = setTimeout(() => {
      performSearch(symbolValue);
    }, 180);

    return () => clearTimeout(timer);
  }, [symbolValue]);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectSuggestion = (s: Suggestion) => {
    isManualTyping.current = false;
    form.setValue('symbol', s.symbol);
    form.setValue('name', s.name);
    
    const rawType = (s.typeDisp || '').trim().toUpperCase();
    let candidateCat = '';
    if (rawType.includes('ETF')) candidateCat = 'ETF';
    else if (rawType.includes('CRYPTO')) candidateCat = 'Crypto';
    else if (rawType.includes('CURRENCY') || rawType.includes('FOREX')) candidateCat = 'Forex';
    else if (rawType.includes('FUND')) candidateCat = 'Fund';
    else if (rawType.includes('INDEX')) candidateCat = 'Index';
    else if (rawType.includes('FUTURE')) candidateCat = 'Future';
    else if (rawType.includes('OPTION')) candidateCat = 'Option';
    else if (rawType.includes('EQUITY') || rawType.includes('STOCK')) candidateCat = 'Stock';
    else candidateCat = s.typeDisp || '';

    if (PREDEFINED_CATEGORIES.includes(candidateCat)) {
      setIsCustomCategory(false);
      form.setValue('category', candidateCat);
    } else {
      setIsCustomCategory(true);
      form.setValue('category', candidateCat || 'Custom');
    }
    
    setTickerFound(true);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const onSubmit = (v: z.infer<typeof formSchema>) => {
    const finalAmount = amountUnit === 'lot' ? v.amount * 1000 : v.amount;
    onAdd({ ...v, amount: finalAmount, amountUnit } as Omit<Asset, 'id'>);
    form.reset({
      ...v,
      name: '',
      symbol: '',
      amount: 0,
      endDate: ''
    });
    setTickerFound(null);
    setIsCustomCategory(false);
    isManualTyping.current = false;
    setAmountUnit('share');
  };

  return (
    <Form {...form}>
      <form id="add-asset-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <FormField control={form.control} name="category" render={({ field }) => (
          <FormItem>
            <FormLabel className="pro-label text-[10px] opacity-60">{lang.category}</FormLabel>
            {!isCustomCategory ? (
              <Select onValueChange={(val) => { 
                if (val === 'CUSTOM_ENTRY') {
                  setIsCustomCategory(true);
                  field.onChange('');
                } else {
                  field.onChange(val); 
                }
              }} value={field.value || "Stock"}>
                <FormControl>
                  <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-[13px] font-bold rounded-lg focus:border-black">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PREDEFINED_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c} className="text-[13px] font-bold">
                      {lang.categories[c as keyof typeof lang.categories] || c}
                    </SelectItem>
                  ))}
                  <SelectItem value="CUSTOM_ENTRY" className="text-[13px] font-black text-blue-600 border-t border-slate-100">
                    <div className="flex items-center gap-2"><Plus className="w-3.5 h-3.5" /> {lang.categories.Custom}</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex gap-2">
                <FormControl>
                  <Input 
                    placeholder={lang.customCategory} 
                    autoFocus 
                    value={field.value} 
                    onFocus={(e) => { const target = e.currentTarget; setTimeout(() => target.select(), 50); }}
                    onChange={(e) => field.onChange(e.target.value)} 
                    className="bg-slate-50 border-slate-200 h-9 text-[13px] font-bold rounded-lg" 
                  />
                </FormControl>
                <Button variant="ghost" type="button" className="h-9 px-3 font-black text-slate-400" onClick={() => { setIsCustomCategory(false); field.onChange('Stock'); }}>X</Button>
              </div>
            )}
            <FormMessage className="text-[10px] font-bold text-rose-500" />
          </FormItem>
        )} />

        {!(['Savings', 'Bank', 'Custom'].includes(categoryValue) || isCustomCategory) && (
          <FormField control={form.control} name="symbol" render={({ field }) => (
            <FormItem className="relative">
              <FormLabel className="pro-label text-[10px] opacity-60">{lang.symbol}</FormLabel>
              <div className="relative">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                  {isSearching ? <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" /> : <Search className="w-3.5 h-3.5 text-slate-400" />}
                </div>
                <FormControl>
                  <Input 
                    placeholder={lang.symbolPlaceholder} 
                    {...field} 
                    autoComplete="off"
                    onChange={(e) => { 
                      isManualTyping.current = true; 
                      setShowSuggestions(true);
                      field.onChange(e); 
                    }}
                    onFocus={(e) => { 
                      const target = e.currentTarget; 
                      setTimeout(() => target.select(), 50); 
                      if (field.value && field.value.trim().length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        performSearch(field.value || '');
                      } else if (e.key === 'Escape') {
                        setShowSuggestions(false);
                      }
                    }}
                    className={cn(
                      "bg-slate-50 border-slate-200 h-9 text-[13px] font-bold uppercase focus:border-black rounded-lg pl-9 pr-24 transition-colors", 
                      tickerFound === false && !isCustomCategory && !isSearching && "border-amber-300"
                    )} 
                  />
                </FormControl>
                {isSearching && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200/80 animate-pulse pointer-events-none select-none z-10">
                    <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                    <span className="text-[10px] font-black tracking-wider uppercase">{lang.searching}</span>
                  </div>
                )}
                {showSuggestions && Boolean(field.value && field.value.trim().length > 0) && (
                  <div ref={suggestionRef} className="absolute left-0 right-0 top-[calc(100%+4px)] z-[200] bg-white border border-slate-200 rounded-xl shadow-2xl max-h-[260px] overflow-auto no-scrollbar">
                    {isSearching && suggestions.length === 0 ? (
                      <div className="p-4 flex flex-col items-center justify-center gap-2 text-center bg-slate-50/70">
                        <div className="flex items-center gap-2 text-blue-600 font-black text-xs">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                          <span>{lang.searchingGlobal}</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">
                          {lang.searchingHint}
                        </span>
                      </div>
                    ) : (
                      <>
                        {isSearching && suggestions.length > 0 && (
                          <div className="px-3 py-1.5 bg-blue-50/80 border-b border-blue-100 flex items-center justify-between">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              {lang.searchingMore}
                            </span>
                            <span className="text-[9px] font-bold text-blue-400">
                              {lang.canClickMatch}
                            </span>
                          </div>
                        )}
                        {suggestions.length > 0 ? (
                          suggestions.map((s, idx) => (
                            <div 
                              key={idx} 
                              onClick={() => selectSuggestion(s)} 
                              className="p-3 hover:bg-blue-50/50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors group"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-black text-xs text-slate-900 group-hover:text-blue-600 transition-colors leading-tight truncate">
                                  {s.name}
                                </div>
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 shrink-0 uppercase border border-slate-200">
                                  {s.exchDisp || s.typeDisp}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-[11px] font-black font-mono text-blue-600 uppercase tracking-tight">{s.symbol}</span>
                                <span className="text-[10px] font-bold text-slate-400">{s.typeDisp}</span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center space-y-1.5 bg-slate-50/60">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-black border border-amber-200">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span>{lang.noMatchTitle}</span>
                            </div>
                            <p className="text-[11px] font-bold text-slate-400 leading-relaxed px-2">
                              {lang.noMatchDesc}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
              <FormMessage className="text-[10px] font-bold text-rose-500" />
            </FormItem>
          )} />
        )}

        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel className="pro-label text-[10px] opacity-60">{lang.name}</FormLabel>
            <FormControl>
              <Input 
                placeholder={lang.namePlaceholder} 
                {...field} 
                onFocus={(e) => { const target = e.currentTarget; setTimeout(() => target.select(), 50); }} 
                className="bg-slate-50 border-slate-200 h-9 text-[13px] font-bold rounded-lg" 
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {showCurrencyField ? (
            <FormField control={form.control} name="currency" render={({ field }) => (
              <FormItem>
                <FormLabel className="pro-label text-[10px] opacity-60">{lang.currency}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="h-9 bg-slate-50 border-slate-200 text-[13px] font-bold rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>{['TWD', 'USD', 'CNY', 'SGD'].map(c => <SelectItem key={c} value={c} className="text-[13px] font-bold">{c}</SelectItem>)}</SelectContent>
                </Select>
              </FormItem>
            )} />
          ) : null}
          <FormField control={form.control} name="amount" render={({ field }) => (
            <FormItem className={cn(showCurrencyField ? "" : "sm:col-span-2")}>
              <FormLabel className="pro-label text-[10px] opacity-60">{lang.amount}</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <Input 
                    type="number" 
                    step="any" 
                    {...field} 
                    onFocus={(e) => {
                      const target = e.currentTarget;
                      setTimeout(() => target.select(), 50);
                    }}
                    onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                    className="h-9 font-bold bg-slate-50 border-slate-200 text-[13px] rounded-lg flex-1" 
                  />
                </FormControl>
                <Select value={amountUnit} onValueChange={(val: any) => setAmountUnit(val)}>
                  <SelectTrigger className="w-[115px] sm:w-[120px] h-9 px-2.5 bg-slate-50 border-slate-200 text-[13px] font-bold rounded-lg shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="share">{language === 'zh' ? '股/單位' : 'Shares/Units'}</SelectItem>
                    <SelectItem value="lot">{language === 'zh' ? '張' : 'Lots'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField control={form.control} name="acquisitionDate" render={({ field }) => (
            <FormItem>
              <FormLabel className="pro-label text-[10px] opacity-60">{lang.date}</FormLabel>
              <FormControl>
                <Input type="date" {...field} className="h-9 font-bold bg-slate-50 border-slate-200 text-[13px] rounded-lg" />
              </FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="endDate" render={({ field }) => (
            <FormItem>
              <FormLabel className="pro-label text-[10px] opacity-60">{lang.endDate}</FormLabel>
              <FormControl>
                <Input type="date" {...field} value={field.value || ''} className="h-9 font-bold bg-slate-50 border-slate-200 text-[13px] rounded-lg" />
              </FormControl>
            </FormItem>
          )} />
        </div>
        
        {!hideSubmit && (
          <Button type="submit" className="w-full h-10 bg-slate-900 hover:bg-black text-white font-black rounded-lg text-[13px] uppercase tracking-widest shadow-md transition-all active:scale-[0.98] mt-2">
            {lang.submit}
          </Button>
        )}
      </form>
    </Form>
  );
}
