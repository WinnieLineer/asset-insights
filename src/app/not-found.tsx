import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Compass, Home } from 'lucide-react';

export default function NotFound() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-100 shadow-xl text-center space-y-6">
        <div className="w-16 h-16 bg-slate-100 text-slate-800 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
          <Compass className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">404 Page Not Found</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">找不到此頁面</h2>
          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            您存取的頁面不存在或已被移除，請返回儀表板檢視您的資產部位。
          </p>
        </div>

        <div className="pt-2">
          <Button asChild className="w-full bg-slate-900 hover:bg-black text-white font-black text-xs uppercase h-11 rounded-xl gap-2 shadow-sm">
            <Link href={basePath || '/'}>
              <Home className="w-3.5 h-3.5" /> 返回資產儀表板
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
