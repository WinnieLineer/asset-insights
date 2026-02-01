
'use client';

import React, { useEffect } from 'react';
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

const formSchema = z.object({
  name: z.string().min(2, '名稱太短'),
  symbol: z.string().optional(),
  category: z.enum(['Stock', 'Crypto', 'Bank', 'Fixed Deposit', 'Savings']),
  amount: z.number().min(0, '金額不能小於 0'),
  currency: z.enum(['TWD', 'USD', 'CNY']),
  interestRate: z.number().optional(),
});

interface AssetFormProps {
  onAdd: (asset: Omit<Asset, 'id'>) => void;
}

export function AssetForm({ onAdd }: AssetFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      symbol: '',
      category: 'Stock',
      amount: 0,
      currency: 'TWD',
      interestRate: 0,
    },
  });

  const category = form.watch('category');
  const symbol = form.watch('symbol');
  
  const isNumericSymbol = /^\d+$/.test(symbol || '');
  const isTWStock = category === 'Stock' && isNumericSymbol && symbol !== '';
  const isUSStock = category === 'Stock' && symbol && !isNumericSymbol;
  const isCrypto = category === 'Crypto';
  const isSavings = category === 'Savings';

  useEffect(() => {
    if (isTWStock) {
      form.setValue('currency', 'TWD');
    } else if (isUSStock || isCrypto) {
      form.setValue('currency', 'USD');
    }
  }, [isTWStock, isUSStock, isCrypto, form]);

  useEffect(() => {
    if (isSavings) {
      form.setValue('symbol', 'CASH');
    } else if (symbol === 'CASH') {
      form.setValue('symbol', '');
    }
  }, [isSavings, form]);

  const shouldHideCurrency = category === 'Stock' || category === 'Crypto';

  function onSubmit(values: z.infer<typeof formSchema>) {
    const assetData = {
      ...values,
      symbol: values.symbol || (values.category === 'Savings' ? 'CASH' : 'N/A')
    };
    onAdd(assetData as Omit<Asset, 'id'>);
    form.reset({
      name: '',
      symbol: '',
      category: 'Stock',
      amount: 0,
      currency: 'TWD',
      interestRate: 0,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>資產名稱</FormLabel>
              <FormControl><Input placeholder="例如：薪資戶" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {!isSavings && (
          <FormField
            control={form.control}
            name="symbol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>代號 (台股數字, 美股代碼)</FormLabel>
                <FormControl><Input placeholder="BTC, AAPL, 2330" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>分類</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="Stock">股票</SelectItem>
                    <SelectItem value="Crypto">加密貨幣</SelectItem>
                    <SelectItem value="Savings">活期存款</SelectItem>
                    <SelectItem value="Fixed Deposit">定期存款</SelectItem>
                    <SelectItem value="Bank">其他銀行資產</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          {!shouldHideCurrency && (
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>幣別</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="TWD">TWD (台幣)</SelectItem>
                      <SelectItem value="USD">USD (美金)</SelectItem>
                      <SelectItem value="CNY">CNY (人民幣)</SelectItem>
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
          )}
        </div>

        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>持有數量 / 金額</FormLabel>
              <FormControl>
                <Input type="number" step="any" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full">新增資產</Button>
      </form>
    </Form>
  );
}
