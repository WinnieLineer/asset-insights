'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled application error:', error);
  }, [error]);

  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">系統發生非預期錯誤</h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            應用程式遇到暫時性問題，您的本機資料仍安全儲存中。
          </p>
        </div>

        {error.message && (
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-left">
            <span className="text-[10px] font-mono text-slate-400 uppercase font-black block mb-1">Error Digest</span>
            <p className="text-xs font-mono text-slate-700 break-all">{error.message}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button
            onClick={() => reset()}
            className="w-full bg-slate-900 hover:bg-black text-white font-black text-xs uppercase h-11 rounded-xl gap-2 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" /> 重新載入
          </Button>
          <Button
            variant="outline"
            onClick={() => { window.location.href = basePath || '/'; }}
            className="w-full font-black text-xs uppercase h-11 rounded-xl gap-2 border-slate-200"
          >
            <Home className="w-3.5 h-3.5" /> 返回首頁
          </Button>
        </div>
      </div>
    </div>
  );
}
