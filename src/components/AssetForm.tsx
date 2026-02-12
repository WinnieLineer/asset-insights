
'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Asset, AssetCategory, Currency } from '@/app/lib/types';
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

const t = {
  en: {
    name: 'Asset Name',
    namePlaceholder: 'e.g., DBS Global Fund',
    symbol: 'Ticker / Symbol',
    symbolPlaceholder: 'BTC, AAPL, 2330, D05.SI',
    category: 'Category',
    currency: 'Base Currency',
    amount: 'Quantity',
    date: 'Acquisition Date',
    endDate: 'Closure Date',
    submit: 'Add to Portfolio',
    categories: { Stock: 'Equity', Crypto: 'Crypto', Savings: 'Deposit', Bank: 'Other' },
    errors: { nameTooShort: 'Min 2 characters', invalidAmount: 'Positive number required', required: 'Required', tickerRequired: 'Ticker symbol is required' }
  },
  zh: {
    name: '資產名稱',
    namePlaceholder: '例如：台積電、美金存款',
    symbol: '資產代碼',
    symbolPlaceholder: 'BTC, AAPL, 2330, D05.SI',
    category: '資產類別',
    currency: '持有幣別',
    amount: '持有數量',
    date: '買入日期',
    endDate: '結清日期 (選填)',
    submit: '新增部位',
    categories: { Stock: '股票', Crypto: '加密貨幣', Savings: '存款', Bank: '其他資產' },
    errors: { nameTooShort: '至少 2 個字', invalidAmount: '請輸入有效的正數', required: '必填', tickerRequired: '此類別必須填寫代號' }
  }
};

interface AssetFormProps {
  onAdd: (asset: Omit<Asset, 'id'>) => void;
  language: 'en' | 'zh';
}

export function AssetForm({ onAdd, language }: AssetFormProps) {
  const lang = t[language];

  const formSchema = useMemo(() => z.object({
    name: z.string().min(2, { message: lang.errors.nameTooShort }),
    symbol: z.string().optional(),
    category: z.enum(['Stock', 'Crypto', 'Bank', 'Savings']),
    amount: z.number({ invalid_type_error: lang.errors.invalidAmount }).min(0, { message: lang.errors.invalidAmount }),
    currency: z.enum(['TWD', 'USD', 'CNY', 'SGD']),
    acquisitionDate: z.string().min(1, { message: lang.errors.required }),
    endDate: z.string().optional(),
  }).refine((data) => {
    if ((data.category === 'Stock' || data.category === 'Crypto') && (!data.symbol || data.symbol.trim() === '')) return false;
    return true;
  }, { message: lang.errors.tickerRequired, path: ['symbol'] }), [lang]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { 
      name: '', symbol: '', category: 'Stock', amount: 0, currency: 'TWD',
      acquisitionDate: new Date().toISOString().split('T')[0],
      endDate: ''
    },
  });

  const category = form.watch('category');
  const symbol = form.watch('symbol');
  const hasTicker = category === 'Stock' || category === 'Crypto';

  useEffect(() => {
    if (category === 'Stock') {
      const sym = (symbol || '').toUpperCase();
      if (/^\d+$/.test(sym)) form.setValue('currency', 'TWD');
      else if (sym.endsWith('.SI')) form.setValue('currency', 'SGD');
      else if (sym) form.setValue('currency', 'USD');
    } else if (category === 'Crypto') {
      form.setValue('currency', 'USD');
    }
  }, [category, symbol, form]);

  const handleAmountFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (parseFloat(e.target.value) === 0) {
      form.setValue('amount', undefined as any);
    }
    e.target.select();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => { onAdd(v as Omit<Asset, 'id'>); form.reset({ ...form.getValues(), name: '', symbol: '', amount: 0 }); })} className="space-y-4">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel className="pro-label text-slate-500">{lang.name}</FormLabel>
            <FormControl>
              <Input placeholder={lang.namePlaceholder} {...field} className="bg-slate-50 border-2 border-slate-200 h-11 text-sm font-bold focus:ring-black focus:border-black rounded-lg" />
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )} />
        
        {hasTicker && (
          <FormField control={form.control} name="symbol" render={({ field }) => (
            <FormItem>
              <FormLabel className="pro-label text-slate-500">{lang.symbol}</FormLabel>
              <FormControl>
                <Input placeholder={lang.symbolPlaceholder} {...field} className="bg-slate-50 border-2 border-slate-200 h-11 text-sm font-bold uppercase tracking-widest focus:ring-black focus:border-black rounded-lg" />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )} />
        )}

        <div className={`grid ${hasTicker ? 'grid-cols-1' : 'grid-cols-2'} gap-3`}>
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel className="pro-label text-slate-500">{lang.category}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl><SelectTrigger className="h-11 bg-slate-50 border-2 border-slate-200 text-sm font-bold rounded-lg"><SelectValue /></SelectTrigger></FormControl>
                <SelectContent>
                  {['Stock', 'Crypto', 'Savings', 'Bank'].map(c => <SelectItem key={c} value={c} className="text-sm font-bold">{lang.categories[c as keyof typeof lang.categories]}</SelectItem>)}
                </SelectContent>
              </Select>
            </FormItem>
          )} />
          
          {!hasTicker && (
            <FormField control={form.control} name="currency" render={({ field }) => (
              <FormItem>
                <FormLabel className="pro-label text-slate-500">{lang.currency}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger className="h-11 bg-slate-50 border-2 border-slate-200 text-sm font-bold rounded-lg"><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>{['TWD', 'USD', 'CNY', 'SGD'].map(c => <SelectItem key={c} value={c} className="text-sm font-bold">{c}</SelectItem>)}</SelectContent>
                </Select>
              </FormItem>
            )} />
          )}
        </div>

        <FormField control={form.control} name="amount" render={({ field }) => (
          <FormItem>
            <FormLabel className="pro-label text-slate-500">{lang.amount}</FormLabel>
            <FormControl>
              <Input 
                type="number" 
                step="any" 
                {...field} 
                onFocus={handleAmountFocus}
                onChange={e => field.onChange(parseFloat(e.target.value) || 0)} 
                className="h-11 font-bold bg-slate-50 border-2 border-slate-200 text-sm rounded-lg" 
              />
            </FormControl>
            <FormMessage className="text-xs" />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-3">
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
        <Button type="submit" className="w-full h-11 bg-black hover:bg-slate-800 text-white font-bold rounded-lg text-sm uppercase tracking-widest shadow-md transition-all active:scale-[0.98] mt-2">{lang.submit}</Button>
      </form>
    </Form>
  );
}
