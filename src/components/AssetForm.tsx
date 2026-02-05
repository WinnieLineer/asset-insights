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
    name: 'Snack Name',
    namePlaceholder: 'e.g., Tuna Can',
    symbol: 'Ticker / ID',
    symbolPlaceholder: 'BTC, AAPL, 2330',
    category: 'Food Type',
    currency: 'Pay with',
    amount: 'How many pieces?',
    submit: 'Add to Pile!',
    categories: {
      Stock: 'Stock Snack',
      Crypto: 'Crypto Candy',
      Savings: 'Yummy Savings',
      FixedDeposit: 'Long-term Meat',
      Bank: 'Other Treasure'
    },
    errors: {
      nameTooShort: 'Give it a cute name! (min 2 chars)',
      invalidAmount: 'Must be a positive munch!',
      required: 'Capoo needs this!'
    }
  },
  zh: {
    name: '肉肉名稱',
    namePlaceholder: '例如：鮪魚罐頭',
    symbol: '代號 (台股數字, 美股代碼)',
    symbolPlaceholder: 'BTC, AAPL, 2330',
    category: '肉肉分類',
    currency: '交易幣別',
    amount: '持有數量 / 金額',
    submit: '存入寶藏堆！',
    categories: {
      Stock: '股票肉肉',
      Crypto: '加密糖果',
      Savings: '活期肉肉',
      FixedDeposit: '定存大餐',
      Bank: '其他寶藏'
    },
    errors: {
      nameTooShort: '名稱太短了啦（至少 2 個字）',
      invalidAmount: '請輸入有效的正數肉肉',
      required: '這個要填喔！'
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
            <FormLabel className="text-sm font-black uppercase text-primary/60">{lang.name}</FormLabel>
            <FormControl>
              <Input placeholder={lang.namePlaceholder} {...field} className="bg-primary/5 border-4 border-primary/10 focus:bg-white rounded-[1.5rem] h-14 font-bold text-lg" />
            </FormControl>
            <FormMessage className="text-xs font-bold text-red-500" />
          </FormItem>
        )} />
        
        {category !== 'Savings' && (
          <FormField control={form.control} name="symbol" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-black uppercase text-primary/60">{lang.symbol}</FormLabel>
              <FormControl>
                <Input placeholder={lang.symbolPlaceholder} {...field} className="bg-primary/5 border-4 border-primary/10 focus:bg-white rounded-[1.5rem] h-14 font-black uppercase text-lg" />
              </FormControl>
              <FormMessage className="text-xs font-bold text-red-500" />
            </FormItem>
          )} />
        )}

        <div className="grid grid-cols-2 gap-6">
          <FormField control={form.control} name="category" render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-black uppercase text-primary/60">{lang.category}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger className="h-14 bg-primary/5 border-4 border-primary/10 rounded-[1.5rem] font-bold">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded-3xl border-4 border-primary/10">
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
              <FormLabel className="text-sm font-black uppercase text-primary/60">{lang.currency}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={category === 'Crypto'}>
                <FormControl>
                  <SelectTrigger className="h-14 bg-primary/5 border-4 border-primary/10 rounded-[1.5rem] font-bold">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="rounded-3xl border-4 border-primary/10">
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
            <FormLabel className="text-sm font-black uppercase text-primary/60">{lang.amount}</FormLabel>
            <FormControl>
              <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="h-14 font-black text-2xl bg-primary/5 border-4 border-primary/10 rounded-[1.5rem]" />
            </FormControl>
            <FormMessage className="text-xs font-bold text-red-500" />
          </FormItem>
        )} />
        
        <Button type="submit" className="w-full h-16 text-xl font-black rounded-[2rem] shadow-xl bouncy-button bg-primary hover:bg-primary/90">
          {lang.submit}
        </Button>
      </form>
    </Form>
  );
}
