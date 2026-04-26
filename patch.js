const fs = require('fs');

let code = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Add APP_VERSION and dnd imports
const importsToAdd = `
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal } from 'lucide-react';
`;
code = code.replace("import { 
  Card, ", importsToAdd + "\nimport { \n  Card, ");

const versionCode = `
const APP_VERSION = '1.0.3';
`;
code = code.replace("const CURRENCY_SYMBOLS: Record<Currency, string> = {", versionCode + "\nconst CURRENCY_SYMBOLS: Record<Currency, string> = {");

// 2. Add version check in useEffect
const versionCheck = `
    const savedVersion = localStorage.getItem('app_version');
    if (savedVersion !== APP_VERSION) {
      localStorage.setItem('app_version', APP_VERSION);
      localStorage.removeItem('sections');
      localStorage.removeItem('layoutConfigs');
      window.location.reload();
      return;
    }
`;
code = code.replace("const savedAssets = localStorage.getItem('assets');", versionCheck + "\n    const savedAssets = localStorage.getItem('assets');");

// 3. Update default layout config for addAsset (420 -> 500)
code = code.replace("addAsset: { width: 12, height: 420 }", "addAsset: { width: 12, height: 500 }");

// 4. Update the renderSection logic to support drag-and-drop and dynamic height
// I will create a SortableSection component inside the file and replace renderSection contents

const newComponents = `
function SortableSection({ id, index, isReordering, config, isDesktop, controls, children, currentHeight }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled: !isReordering });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 9999 : (isReordering ? 900 : 1),
    position: 'relative',
    height: isDesktop ? (currentHeight === 'auto' ? 'auto' : \`\${currentHeight}px\`) : 'auto',
    minHeight: isDesktop ? (currentHeight === 'auto' ? 'auto' : \`\${currentHeight}px\`) : (['historicalTrend', 'allocation'].includes(id) ? '280px' : 'auto'),
  };
  
  const commonClass = cn(
    "relative transition-all duration-300",
    isReordering && "ring-4 ring-black ring-offset-2 rounded-2xl shadow-2xl scale-[0.98]",
    config.width === 4 && "xl:col-span-4",
    config.width === 5 && "xl:col-span-5",
    config.width === 6 && "xl:col-span-6",
    config.width === 7 && "xl:col-span-7",
    config.width === 8 && "xl:col-span-8",
    config.width === 10 && "xl:col-span-10",
    config.width === 12 && "xl:col-span-12",
    !isDesktop && "h-auto min-h-[100px]"
  );

  return (
    <div ref={setNodeRef} style={style} className={commonClass}>
      {isReordering && (
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 z-[2000] flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-full shadow-2xl border border-white/20 scale-90 sm:scale-100 ring-4 ring-black/5" onPointerDown={e => e.stopPropagation()}>
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing hover:bg-white/20 p-2 rounded-md"><GripHorizontal className="w-5 h-5" /></div>
          <div className="w-px h-6 bg-white/20 mx-1" />
          <span className="text-[14px] font-black uppercase tracking-widest px-1 opacity-60">W</span>
          {controls.widthDec}
          {controls.widthInc}
          <div className="w-px h-6 bg-white/20 mx-1" />
          <span className="text-[14px] font-black uppercase tracking-widest px-1 opacity-60">H</span>
          {controls.heightDec}
          {controls.heightInc}
        </div>
      )}
      {children}
    </div>
  );
}
`;

code = code.replace("export default function AssetInsightsPage() {", newComponents + "\nexport default function AssetInsightsPage() {");

// 5. Replace renderSection entirely
// I'll replace from 'const renderSection = (id: string, index: number) => {' to the end of the switch statement.
// Wait, the switch ends around line 718.
// I will just use regex to replace it.

const renderSectionRegex = /const renderSection = \(id: string, index: number\) => \{[\s\S]*?default: return null;\n    \}\n  \};/;

const newRenderSection = `
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const renderSectionContent = (id: string, index: number, config: any, currentHeight: any) => {
    const wrapperStyle = { height: '100%' };
    
    switch (id) {
      case 'summary':
        return (
          <div className="xl:col-span-12 h-full" style={wrapperStyle}>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-full items-stretch">
              <Card className="md:col-span-8 lg:col-span-9 modern-card p-4 sm:p-6 relative overflow-hidden bg-white flex flex-col justify-center min-h-[140px]">
                <div className="space-y-2 z-20 relative text-left">
                  <div className="pro-label text-xs sm:text-sm"><Globe className="w-3.5 h-3.5" /> {t.totalValue}</div>
                  <div className="pro-title flex items-center text-2xl sm:text-4xl">
                    <span className="text-slate-200 font-medium text-[0.6em] mr-2">{CURRENCY_SYMBOLS[displayCurrency]}</span>
                    <span>{assetCalculations.totalDisplay.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    {loading && <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin text-slate-200 ml-3" />}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1"><Info className="w-3 h-3" /> {t.layoutHint}</div>
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
          </div>
        );
      case 'controls':
        return (
          <div className="h-full" style={wrapperStyle}>
            <section className="bg-slate-50/80 backdrop-blur-md p-4 border border-slate-100 rounded-2xl flex flex-col md:flex-row items-center gap-3 shadow-sm h-full overflow-hidden">
              <div className="w-full md:w-auto flex items-center justify-between md:justify-start gap-3 flex-wrap sm:flex-nowrap">
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
              </div>
            </section>
          </div>
        );
      case 'addAsset':
        return (
          <div className="h-full" style={wrapperStyle}>
            <Card className="modern-card bg-white h-full flex flex-col overflow-hidden">
              <CardHeader className="px-5 py-3 border-b border-slate-50 shrink-0 flex flex-row items-center justify-between">
                <h3 className="pro-label text-sm"><Plus className="w-4 h-4" /> {t.addAsset}</h3>
                <Button form="add-asset-form" type="submit" size="sm" className="bg-slate-900 hover:bg-black text-white font-black rounded-lg text-[13px] uppercase tracking-widest h-8 px-3">{t.saveChanges}</Button>
              </CardHeader>
              <CardContent className="p-5 flex-1 overflow-auto no-scrollbar">
                <AssetForm language={language} hideSubmit onAdd={(a) => { const newAsset = { ...a, id: crypto.randomUUID() }; setAssets(prev => [...prev, newAsset]); updateAllData([...assets, newAsset]); }} />
              </CardContent>
            </Card>
          </div>
        );
      case 'historicalTrend':
        return (
          <div className="h-full" style={wrapperStyle}>
            {assetCalculations.chartData.length > 0 ? <HistoricalTrendChart language={language} historicalData={assetCalculations.chartData} displayCurrency={displayCurrency} loading={loading} height={isDesktop ? currentHeight : 280} /> : <div className="h-full flex items-center justify-center text-slate-400 text-sm font-bold bg-white rounded-2xl border border-slate-100">No Data</div>}
          </div>
        );
      case 'allocation':
        return (
          <div className="h-full" style={wrapperStyle}>
            {assetCalculations.allocationData.length > 0 ? <AllocationPieChart language={language} allocationData={assetCalculations.allocationData} displayCurrency={displayCurrency} loading={loading} height={isDesktop ? currentHeight : 280} /> : <div className="h-full flex items-center justify-center text-slate-400 text-sm font-bold bg-white rounded-2xl border border-slate-100">No Data</div>}
          </div>
        );
      case 'list':
        return (
          <div className="h-full" style={wrapperStyle}>
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
                        <TableCell><Badge variant="outline" className="text-[10px] font-black uppercase px-2 py-0.5">{t.categoryNames[asset.category as AssetCategory] || asset.category}</Badge></TableCell>
                        <TableCell><span className="text-[13px] font-black text-slate-500">{asset.acquisitionDate}</span></TableCell>
                        <TableCell><span className="text-[14px] font-black text-slate-700">{formatNumber(asset.amount)}</span></TableCell>
                        <TableCell className="text-right"><div className="font-black text-[13px] text-slate-700"><span className="text-slate-300 text-[10px] mr-1">{CURRENCY_SYMBOLS[displayCurrency]}</span>{asset.priceInDisplay?.toLocaleString(undefined, { maximumFractionDigits: 4 }) || '0'}</div></TableCell>
                        <TableCell className="text-right"><div className="font-black text-base text-slate-900"><span className="text-slate-200 text-[12px] mr-1">{CURRENCY_SYMBOLS[displayCurrency]}</span>{asset.valueInDisplay?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}</div></TableCell>
                        <TableCell className="text-right"><div className={cn("inline-flex items-center gap-1 font-black text-[13px]", (asset.changePercent || 0) > 0 ? "text-emerald-500" : (asset.changePercent || 0) < 0 ? "text-rose-500" : "text-slate-400")}>{(asset.changePercent || 0) > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : (asset.changePercent || 0) < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : null}{(asset.changePercent || 0).toFixed(2)}%</div></TableCell>
                        <TableCell className="pr-6 text-right"><div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingAsset(asset); setEditName(asset.name); setEditAmount(asset.amount); setEditDate(asset.acquisitionDate); setEditEndDate(asset.endDate || ''); setEditCurrency(asset.currency); }}><Edit2 className="w-3.5 h-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-rose-300" onClick={() => { setAssets(prev => prev.filter(a => a.id !== asset.id)); }}><Trash2 className="w-3.5 h-3.5" /></Button></div></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        );
      case 'closedList':
        return (
          <div className="h-full" style={wrapperStyle}>
            <Card className="modern-card bg-white h-full flex flex-col overflow-hidden opacity-80">
              <div className="px-6 py-4 border-b border-slate-50 shrink-0"><h3 className="pro-label text-sm"><History className="w-5 h-5" /> {t.closedPositions}</h3></div>
              <CardContent className="p-0 flex-1 overflow-auto no-scrollbar relative"><Table className="min-w-[800px] border-separate border-spacing-0"><TableBody>{sortedClosedAssets.map((asset: any) => (<TableRow key={asset.id} className="group hover:bg-slate-50/50 border-slate-50"><TableCell className="px-6 py-4"><div className="font-black text-[13px] text-slate-400 line-through">{asset.name}</div><div className="text-[11px] font-black text-slate-300 uppercase tracking-[0.1em] mt-0.5">{asset.symbol || asset.category}</div></TableCell><TableCell><span className="text-[13px] font-black text-slate-400">{formatNumber(asset.amount)}</span></TableCell><TableCell className="text-right pr-6"><div className="font-black text-[12px] text-slate-500">{asset.endDate}</div></TableCell></TableRow>))}</TableBody></Table></CardContent>
            </Card>
          </div>
        );
      case 'ai':
        return (
          <div className="h-full" style={wrapperStyle}>
            {assetCalculations.activeAssets.length > 0 ? <AITipCard language={language} assets={assetCalculations.activeAssets} totalTWD={assetCalculations.totalTWD} /> : <div className="h-full flex items-center justify-center text-slate-400 text-sm font-bold bg-white rounded-2xl border border-slate-100">No Data</div>}
          </div>
        );
      default: return null;
    }
  };
`;

code = code.replace(renderSectionRegex, newRenderSection);

// 6. Update the main render area
const mainRegex = /<main className="max-w-\[1900px\] mx-auto px-4 sm:px-10 pt-\[110px\] md:pt-24 pb-20"><div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8 items-start">\{sections\.map\(\(id, index\) => renderSection\(id, index\)\)\}<\/div><\/main>/;

const newMain = `
      <main className="max-w-[1900px] mx-auto px-4 sm:px-10 pt-[110px] md:pt-24 pb-20">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-8 items-start">
              {sections.map((id, index) => {
                const config = layoutConfigs[id] || { width: 12, height: 400 };
                let currentHeight: any = config.height;
                const hasActive = assetCalculations.activeAssets.length > 0;
                const hasClosed = assetCalculations.closedAssets.length > 0;
                const hasChartData = assetCalculations.chartData.length > 0;
                const hasAllocationData = assetCalculations.allocationData.length > 0;
                
                if (!hasActive && (id === 'list' || id === 'ai')) currentHeight = 200;
                else if (id === 'list') currentHeight = Math.max(300, Math.min(config.height, 150 + assetCalculations.activeAssets.length * 60));
                else if (id === 'ai') currentHeight = 'auto'; // allow AI to take content height or auto size
                
                if (!hasClosed && id === 'closedList') currentHeight = 200;
                else if (id === 'closedList') currentHeight = Math.max(250, Math.min(config.height, 150 + assetCalculations.closedAssets.length * 60));
                
                if (!hasChartData && id === 'historicalTrend') currentHeight = 250;
                if (!hasAllocationData && id === 'allocation') currentHeight = 250;

                const controlsElements = {
                  widthDec: <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/20" onClick={() => resizeSection(id, 'x', 'dec')}><Minimize2 className="w-5 h-5" /></Button>,
                  widthInc: <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/20" onClick={() => resizeSection(id, 'x', 'inc')}><Maximize2 className="w-5 h-5" /></Button>,
                  heightDec: <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/20" onClick={() => resizeSection(id, 'y', 'dec')}><ChevronDown className="w-5 h-5" /></Button>,
                  heightInc: <Button variant="ghost" size="icon" className="h-9 w-9 text-white hover:bg-white/20" onClick={() => resizeSection(id, 'y', 'inc')}><ChevronUp className="w-5 h-5" /></Button>
                };

                return (
                  <SortableSection key={id} id={id} index={index} isReordering={isReordering} config={config} isDesktop={isDesktop} controls={controlsElements} currentHeight={currentHeight}>
                    {renderSectionContent(id, index, config, currentHeight)}
                  </SortableSection>
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </main>
`;
code = code.replace(mainRegex, newMain);

// Also need to remove the "onMouseDown={handleMouseDown}" from the root div because the old long press conflicts with dnd-kit pointer sensor?
// Actually, dnd-kit pointersensor is for drag, the old long press logic is for showing the "save layout" button!
// We can keep the old long press to enable isReordering, which shows the drag handle.
// But wait, dnd-kit will block pointer down events if we're dragging, which is fine. The user can drag only when isReordering is true.

fs.writeFileSync('src/app/page.tsx', code);
console.log('Patched page.tsx successfully!');
