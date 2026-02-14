'use client';

import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Asset, Currency } from '@/app/lib/types';
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
import { Loader2, Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const AUTOCOMPLETE_API = 'https://script.google.com/macros/s/AKfycbyQ12dBnspvRGwcNRZmZw3sXon8tnmPTttJ2b5LDw_3G1Zw7aaM6OPe9dSLhPPv-xRL/exec?q=';

const t = {
  en: {
    name: 'Asset Name',
    namePlaceholder: 'e.g., Apple Inc.',
    symbol: 'Ticker / Symbol',
    symbolPlaceholder: 'Search BTC, AAPL, 2330...',
    category: 'Category',
    customCategory: 'Enter Custom Category',
    currency: 'Base Currency',
    amount: 'Holdings',
    date: 'Acquisition Date',
    endDate: 'Closure Date',
    submit: 'Add to Portfolio',
    categories: { Stock: 'Equity', Crypto: 'Crypto', Savings: 'Deposit', Bank: 'Other', ETF: 'ETF', Option: 'Option', Fund: 'Fund', Index: 'Index', Custom: 'Custom...' },
    errors: { 
      nameTooShort: 'Min 2 characters', 
      invalidAmount: 'Positive number required', 
      required: 'Required', 
      tickerRequired: 'Ticker symbol is required for market assets',
      invalidTicker: 'Ticker not found'
    }
  },
  zh: {
    name: '資產名稱',
    namePlaceholder: '例如：台積電、美金存款',
    symbol: '資產代碼',
    symbolPlaceholder: '搜尋 BTC, AAPL, 2330...',
    category: '資產類別',
    customCategory: '輸入自定義類別名稱',
    currency: '持有幣別',
    amount: '持有數量',
    date: '持有日期',
    endDate: '結清日期 (選填)',
    submit: '新增部位',
    categories: { Stock: '股票', Crypto: '加密貨幣', Savings: '存款', Bank: '其他資產', ETF: 'ETF', Option: '選擇權', Fund: '基金', Index: '指數', Custom: '自定義類別...' },
    errors: { 
      nameTooShort: '至少 2 個字', 
      invalidAmount: '請輸入有效的正數', 
      required: '必填', 
      tickerRequired: '此類別必須填寫代號',
      invalidTicker: '查無此代碼'
    }
  }
};

interface AssetFormProps {
  onAdd: (asset: Omit<Asset, 'id'>) => void;
  language: 'en' | 'zh';
}

interface Suggestion {
  symbol: string;
  name: string;
  exchDisp: string;
  typeDisp: string;
}

const PREDEFINED_CATEGORIES = ['Stock', 'ETF', 'Crypto', 'Fund', 'Index', 'Option', 'Savings', 'Bank'];

export function AssetForm({ onAdd, language }: AssetFormProps) {
  const lang = t[language];
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [tickerFound, setTickerFound] = useState<boolean | null>(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const isManualTyping = useRef(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  const formSchema = useMemo(() => z.object({
    name: z.string().min(2, { message: lang.errors.nameTooShort }),
    symbol: z.string().optional(),
    category: z.string().min(1, { message: lang.errors.required }),
    amount: z.number({ invalid_type_error: lang.errors.invalidAmount }).min(0, { message: lang.errors.invalidAmount }),
    currency: z.enum(['TWD', 'USD', 'CNY', 'SGD']),
    acquisitionDate: z.string().min(1, { message: lang.errors.required }),
    endDate: z.string().optional(),
  }).refine((data) => {
    const noMarketCats = ['Savings', 'Bank'];
    if (noMarketCats.includes(data.category)) return true;
    if (!data.symbol || data.symbol.trim() === '') return false;
    return true;
  }, { message: lang.errors.tickerRequired, path: ['symbol'] }), [lang]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      name: '', 
      symbol: '', 
      category: 'Stock', 
      amount: 0, 
      currency: 'TWD',
      acquisitionDate: new Date().toISOString().split('T')[0],
      endDate: ''
    },
  });

  const categoryValue = form.watch('category');
  const symbolValue = form.watch('symbol');
  const showTickerField = !['Savings', 'Bank'].includes(categoryValue);
  
  useEffect(() => {
    if (!isManualTyping.current || !symbolValue || symbolValue.length < 1) {
      if (!symbolValue) {
        setSuggestions([]);
        setTickerFound(null);
      }
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await fetch(`${AUTOCOMPLETE_API}${encodeURIComponent(symbolValue)}`);
        if (response.ok) {
          const data = await response.json();
          const results = data.ResultSet?.Result || [];
          setSuggestions(results.map((r: any) => ({
            symbol: r.symbol,
            name: r.name,
            exchDisp: r.exchDisp,
            typeDisp: r.typeDisp
          })));
          setTickerFound(results.length > 0);
          setShowSuggestions(true);
        }
      } catch (error) {
        setTickerFound(false);
      } finally {
        setIsSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [symbolValue]);

  const selectSuggestion = (s: Suggestion) => {
    isManualTyping.current = false;
    form.setValue('symbol', s.symbol);
    form.setValue('name', s.name);
    
    const rawType = (s.typeDisp || '').trim().toUpperCase();
    let targetCat = 'Stock';
    
    // 智慧對應邏輯
    if (rawType.includes('ETF') || rawType.includes('交易所買賣基金')) targetCat = 'ETF';
    else if (rawType.includes('CRYPTO') || rawType.includes('加密貨幣')) targetCat = 'Crypto';
    else if (rawType.includes('FUND') || rawType.includes('基金')) targetCat = 'Fund';
    else if (rawType.includes('INDEX') || rawType.includes('指數')) targetCat = 'Index';
    else if (rawType.includes('OPTION') || rawType.includes('選擇權')) targetCat = 'Option';
    else if (rawType.includes('EQUITY') || rawType.includes('權益')) targetCat = 'Stock';
    else if (s.typeDisp) targetCat = s.typeDisp; // 自動新增為動態類別

    form.setValue('category', targetCat);
    setTickerFound(true);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const onSubmit = (v: z.infer<typeof formSchema>) => {
    onAdd(v as Omit<Asset, 'id'>);
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
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        
        <FormField control={form.control} name="category" render={({ field }) => (
          <FormItem>
            <FormLabel className="pro-label text-slate-500">{lang.category}</FormLabel>
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
                  <SelectTrigger className="h-11 bg-slate-50 border-2 border-slate-200 text-sm font-bold rounded-lg transition-all focus:border-black">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {PREDEFINED_CATEGORIES.map(c => (
                    <SelectItem key={c} value={c} className="text-sm font-bold">
                      {lang.categories[c as keyof typeof lang.categories] || c}
                    </SelectItem>
                  ))}
                  {/* 動態類別處理：確保 API 查回的類別能被渲染，解決空白問題 */}
                  {field.value && !PREDEFINED_CATEGORIES.includes(field.value) && field.value !== 'CUSTOM_ENTRY' && (
                    <SelectItem value={field.value} className="text-sm font-bold">{field.value}</SelectItem>
                  )}
                  <SelectItem value="CUSTOM_ENTRY" className="text-sm font-black text-blue-600 border-t border-slate-100">
                    <div className="flex items-center gap-2"><Plus className="w-4 h-4" /> {lang.categories.Custom}</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex gap-2">
                <Input 
                  placeholder={lang.customCategory} 
                  autoFocus 
                  value={field.value} 
                  onChange={(e) => field.onChange(e.target.value)}
                  className="bg-slate-50 border-2 border-slate-200 h-11 text-sm font-bold rounded-lg"
                />
                <Button variant="ghost" className="h-11 px-4 font-black text-slate-400" onClick={() => { setIsCustomCategory(false); field.onChange('Stock'); }}>X</Button>
              </div>
            )}
          </FormItem>
        )} />

        {showTickerField && (
          <FormField control={form.control} name="symbol" render={({ field }) => (
            <FormItem className="relative">
              <FormLabel className="pro-label text-slate-500">{lang.symbol}</FormLabel>
              <FormControl>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Search className="w-4 h-4 text-slate-400" />}
                  </div>
                  <Input 
                    placeholder={lang.symbolPlaceholder} 
                    {...field} 
                    autoComplete="off"
                    onChange={(e) => { isManualTyping.current = true; field.onChange(e); }}
                    className={cn(
                      "bg-slate-50 border-2 h-11 text-sm font-bold uppercase tracking-widest focus:ring-black focus:border-black rounded-lg pl-10 pr-4",
                      tickerFound === false && "border-rose-300"
                    )} 
                  />
                </div>
              </FormControl>
              {showSuggestions && suggestions.length > 0 && (
                <div ref={suggestionRef} className="absolute left-0 right-0 top-[calc(100%+4px)] z-[200] bg-white border-2 border-slate-200 rounded-xl shadow-2xl max-h-[280px] overflow-auto no-scrollbar">
                  {suggestions.map((s, idx) => (
                    <div key={idx} onClick={() => selectSuggestion(s)} className="p-4 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0">
                      <div className="font-black text-sm text-slate-900 leading-tight">{s.name}</div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[12px] font-black text-blue-600 tracking-wider uppercase">{s.symbol}</span>
                        <span className="text-[11px] font-bold text-slate-400">{s.typeDisp}-{s.exchDisp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <FormMessage className="text-xs font-bold text-rose-500" />
            </FormItem>
          )} />
        )}

        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel className="pro-label text-slate-500">{lang.name}</FormLabel>
            <FormControl>
              <Input placeholder={lang.namePlaceholder} {...field} className="bg-slate-50 border-2 border-slate-200 h-11 text-sm font-bold rounded-lg" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="currency" render={({ field }) => (
            <FormItem>
              <FormLabel className="pro-label text-slate-500">{lang.currency}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="h-11 bg-slate-50 border-2 border-slate-200 text-sm font-bold rounded-lg"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>{['TWD', 'USD', 'CNY', 'SGD'].map(c => <SelectItem key={c} value={c} className="text-sm font-bold">{c}</SelectItem>)}</SelectContent>
              </Select>
            </FormItem>
          )} />
          <FormField control={form.control} name="amount" render={({ field }) => (
            <FormItem>
              <FormLabel className="pro-label text-slate-500">{lang.amount}</FormLabel>
              <FormControl>
                <Input type="number" step="any" {...field} onFocus={(e) => e.target.select()} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="h-11 font-bold bg-slate-50 border-2 border-slate-200 text-sm rounded-lg" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="acquisitionDate" render={({ field }) => (
            <FormItem>
              <FormLabel className="pro-label text-slate-500">{lang.date}</FormLabel>
              <FormControl><Input type="date" {...field} className="h-11 font-bold bg-slate-50 border-2 border-slate-200 text-sm rounded-lg" /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="endDate" render={({ field }) => (
            <FormItem>
              <FormLabel className="pro-label text-slate-500">{lang.endDate}</FormLabel>
              <FormControl><Input type="date" {...field} value={field.value || ''} className="h-11 font-bold bg-slate-50 border-2 border-slate-200 text-sm rounded-lg" /></FormControl>
            </FormItem>
          )} />
        </div>
        
        <Button type="submit" className="w-full h-12 bg-black hover:bg-slate-800 text-white font-black rounded-xl text-sm uppercase tracking-widest shadow-xl transition-all active:scale-[0.98] mt-4">
          {lang.submit}
        </Button>
      </form>
    </Form>
  );
}