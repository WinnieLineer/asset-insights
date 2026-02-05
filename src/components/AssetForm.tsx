
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
    name: 'Unit/Territory Name',
    namePlaceholder: 'e.g., Wall Maria Outpost',
    symbol: 'Strategic ID',
    symbolPlaceholder: 'BTC, AAPL, 2330',
    category: 'Combat Division',
    currency: 'Supply Currency',
    amount: 'Combat Strength / Amount',
    submit: 'Initiate Recruitment!',
    categories: {
      Stock: 'Infantry (Stocks)',
      Crypto: 'Special Ops (Crypto)',
      Savings: 'Reserve (Savings)',
      FixedDeposit: 'Heavy Artillery (Fixed)',
      Bank: 'Other Reinforcements'
    },
    errors: {
      nameTooShort: 'Name is too short for a division! (min 2 chars)',
      invalidAmount: 'Strength must be a positive value!',
      required: 'Information is mandatory for the Corps!'
    }
  },
  zh: {
    name: '單位/領土名稱',
    namePlaceholder: '例如：瑪利亞之牆哨所',
    symbol: '戰略代號 (台股、美股或硬幣)',
    symbolPlaceholder: 'BTC, AAPL, 2330',
    category: '作戰分隊',
    currency: '物資幣別',
    amount: '持有戰力 / 數量',
    submit: '招募入伍！',
    categories: {
      Stock: '步兵分隊 (股票)',
      Crypto: '奇行種對策 (加密貨幣)',
      Savings: '預備役 (活期)',
      FixedDeposit: '重裝要塞 (定存)',
      Bank: '其他援軍'
    },
    errors: {
      nameTooShort: '分隊名稱太短了（至少 2 個字）',
      invalidAmount: '請輸入有效的正數戰力',
      required: '這是兵團要求的必填資訊！'
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
    category: z.enum(['Stock', 'Crypto', 'Bank', 'Fixed Deposit', 'Savings']),
    amount: z.number({ invalid_type_error: lang.errors.invalidAmount }).min(0, { message: lang.errors.invalidAmount }),
    currency: z.enum(['TWD', 'USD', 'CNY']),
  }), [lang]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', symbol: '', category: 'Stock', amount: 0, currency: 'TWD' },
  });

  const category = form.watch('category');
  const symbol = form.watch('symbol');
  
  useEffect(() => {
    if (category === 'Stock') {
      if (/^\d+$/.test(symbol || '')) form.setValue('currency', 'TWD');
      else if (symbol) form.setValue('currency', 'USD');
    } else if (category === 'Crypto') form.setValue('currency', 'USD');
  }, [category, symbol, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => { onAdd(v as Omit<Asset, 'id'>); form.reset(); })} className="space-y-6">
        <FormField control={form.control} name="name" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-black uppercase text-primary/60 tracking-[0.3em]">{lang.name}</FormLabel>
            <FormControl>
              <Input placeholder={lang.namePlaceholder} {...field} className="bg-black/40 border-2 border-primary/20 focus:border-primary rounded-none h-12 font-bold text-white" />
            </FormControl>
            <FormMessage className="text-xs font-bold text-red-500" />
          </FormItem>
        )} />
        
        {category !== 'Savings' && (
          <FormField control={form.control} name="symbol" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase text-primary/60 tracking-[0.3em]">{lang.symbol}</FormLabel>
              <FormControl>
                <Input placeholder={lang.symbolPlaceholder} {...field} className="bg-black/40 border-2 border-primary/20 focus:border-primary rounded-none h-12 font-black uppercase text-white" />
              </FormControl>
              <FormMessage className="text-xs font-bold text-red-500" />
            </FormItem>
          )} />
        )}

        <div className="grid grid-cols-2 gap-6">
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase text-primary/60 tracking-[0.3em]">{lang.category}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-12 bg-black/40 border-2 border-primary/20 rounded-none font-bold text-white">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-slate-900 border-2 border-primary/40 text-white rounded-none">
                  <SelectItem value="Stock">{lang.categories.Stock}</SelectItem>
                  <SelectItem value="Crypto">{lang.categories.Crypto}</SelectItem>
                  <SelectItem value="Savings">{lang.categories.Savings}</SelectItem>
                  <SelectItem value="Fixed Deposit">{lang.categories.FixedDeposit}</SelectItem>
                  <SelectItem value="Bank">{lang.categories.Bank}</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
          
          <FormField control={form.control} name="currency" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-black uppercase text-primary/60 tracking-[0.3em]">{lang.currency}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={category === 'Crypto'}>
                <FormControl>
                  <SelectTrigger className="h-12 bg-black/40 border-2 border-primary/20 rounded-none font-bold text-white">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-slate-900 border-2 border-primary/40 text-white rounded-none">
                  <SelectItem value="TWD">TWD</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="CNY">CNY</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="amount" render={({ field }) => (
          <FormItem>
            <FormLabel className="text-[10px] font-black uppercase text-primary/60 tracking-[0.3em]">{lang.amount}</FormLabel>
            <FormControl>
              <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="h-12 font-black text-xl bg-black/40 border-2 border-primary/20 rounded-none text-white" />
            </FormControl>
            <FormMessage className="text-xs font-bold text-red-500" />
          </FormItem>
        )} />
        
        <Button type="submit" className="scout-button w-full h-14">
          {lang.submit}
        </Button>
      </form>
    </Form>
  );
}

