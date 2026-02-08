
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
    amount: 'Quantity / Balance',
    submit: 'Add to Portfolio',
    categories: {
      Stock: 'Equity (Stock)',
      Crypto: 'Crypto',
      Savings: 'Deposits',
      Bank: 'Other Assets'
    },
    errors: {
      nameTooShort: 'Min 2 characters',
      invalidAmount: 'Positive number required',
      required: 'Required',
      tickerRequired: 'Ticker symbol is required for this asset type'
    }
  },
  zh: {
    name: '資產名稱',
    namePlaceholder: '例如：台積電、DBS 定存',
    symbol: '資產代碼 (Ticker)',
    symbolPlaceholder: 'BTC, AAPL, 2330, D05.SI',
    category: '資產類別',
    currency: '持有幣別',
    amount: '持有數量 / 金額',
    submit: '新增部位',
    categories: {
      Stock: '股票資產 (Stock)',
      Crypto: '加密貨幣 (Crypto)',
      Savings: '存款 (Deposits)',
      Bank: '其他資產'
    },
    errors: {
      nameTooShort: '至少 2 個字',
      invalidAmount: '請輸入有效的正數',
      required: '必填',
      tickerRequired: '此類別必須填寫代號'
    }
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
  }).refine((data) => {
    if ((data.category === 'Stock' || data.category === 'Crypto') && (!data.symbol || data.symbol.trim() === '')) {
      return false;
    }
    return true;
  }, {
    message: lang.errors.tickerRequired,
    path: ['symbol'],
  }), [lang]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', symbol: '', category: 'Stock', amount: 0, currency: 'TWD' },
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => { onAdd(v as Omit<Asset, 'id'>); form.reset(); })} className="space-y-5">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">{lang.name}</FormLabel>
            <FormControl>
              <Input placeholder={lang.namePlaceholder} {...field} className="bg-slate-50 border-slate-200 rounded-md h-12 text-sm lg:text-base font-bold px-4" />
            </FormControl>
            <FormMessage className="text-[10px] text-rose-500 font-bold" />
          </FormItem>
        )} />
        
        {hasTicker && (
          <FormField control={form.control} name="symbol" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">{lang.symbol}</FormLabel>
              <FormControl>
                <Input placeholder={lang.symbolPlaceholder} {...field} className="bg-slate-50 border-slate-200 rounded-md h-12 text-sm lg:text-base font-black uppercase px-4 tracking-wider" />
              </FormControl>
              <FormMessage className="text-[10px] text-rose-500 font-bold" />
            </FormItem>
          )} />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">{lang.category}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-md text-xs lg:text-sm font-bold">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded-lg shadow-xl">
                  <SelectItem value="Stock" className="text-xs lg:text-sm font-bold">{lang.categories.Stock}</SelectItem>
                  <SelectItem value="Crypto" className="text-xs lg:text-sm font-bold">{lang.categories.Crypto}</SelectItem>
                  <SelectItem value="Savings" className="text-xs lg:text-sm font-bold">{lang.categories.Savings}</SelectItem>
                  <SelectItem value="Bank" className="text-xs lg:text-sm font-bold">{lang.categories.Bank}</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
          
          <FormField control={form.control} name="currency" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">{lang.currency}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={category === 'Crypto'}>
                <FormControl>
                  <SelectTrigger className="h-11 bg-slate-50 border-slate-200 rounded-md text-xs lg:text-sm font-bold">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded-lg shadow-xl">
                  <SelectItem value="TWD" className="text-xs lg:text-sm font-bold">TWD</SelectItem>
                  <SelectItem value="USD" className="text-xs lg:text-sm font-bold">USD</SelectItem>
                  <SelectItem value="CNY" className="text-xs lg:text-sm font-bold">CNY</SelectItem>
                  <SelectItem value="SGD" className="text-xs lg:text-sm font-bold">SGD</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="amount" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[11px] font-black text-slate-500 uppercase tracking-widest ml-1">{lang.amount}</FormLabel>
            <FormControl>
              <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="h-12 font-black bg-slate-50 border-slate-200 rounded-md text-base lg:text-lg px-4" />
            </FormControl>
            <FormMessage className="text-[10px] text-rose-500 font-bold" />
          </FormItem>
        )} />
        
        <Button type="submit" className="w-full h-12 bg-black hover:bg-slate-800 text-white font-black rounded-md text-[13px] uppercase tracking-[0.1em] shadow-lg transition-all active:scale-[0.97] mt-2">
          {lang.submit}
        </Button>
      </form>
    </Form>
  );
}
