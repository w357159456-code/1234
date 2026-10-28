import React from 'react';
import { 
  Calculator, 
  Layers, 
  Boxes, 
  TrendingUp, 
  PlusCircle, 
  Download, 
  RotateCcw,
  Scale
} from 'lucide-react';

interface HeaderProps {
  activeTab: 'overview' | 'calculator' | 'orders' | 'inventory' | 'analytics';
  setActiveTab: (tab: 'overview' | 'calculator' | 'orders' | 'inventory' | 'analytics') => void;
  onOpenNewOrder: () => void;
  onExportCSV: () => void;
  onResetData: () => void;
  abnormalCount: number;
  lowStockCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewOrder,
  onExportCSV,
  onResetData,
  abnormalCount,
  lowStockCount,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & System Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
              <Scale className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                  PE用量管理系統
                </h1>
                <span className="text-xs text-slate-500 font-mono">v2.4</span>
              </div>
              <p className="text-xs text-slate-500">
                聚乙烯膜袋定額計算 · 工單投料追蹤 · 損耗與庫存控制
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenNewOrder}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-xs"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              建立工單
            </button>

            <button
              onClick={onExportCSV}
              title="匯出工單用量 CSV 報表"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              匯出報表
            </button>

            <button
              onClick={onResetData}
              title="重設為原廠示範數據"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">重置示範</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 border-t border-slate-100 overflow-x-auto py-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            總覽儀表板
          </button>

          <button
            onClick={() => setActiveTab('calculator')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'calculator'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            定額用量計算機
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            工單投料追蹤
            {abnormalCount > 0 && (
              <span className="text-[10px] text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded font-mono font-medium">
                {abnormalCount} 異常
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            原料庫存
            {lowStockCount > 0 && (
              <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-mono font-medium">
                {lowStockCount} 低庫存
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            損耗率分析與改善
          </button>
        </div>
      </div>
    </header>
  );
};
