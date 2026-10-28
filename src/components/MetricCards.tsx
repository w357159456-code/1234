import React from 'react';
import { ProductionOrder, Material } from '../types';
import { formatNum } from '../utils/peCalculations';
import { Scale, AlertTriangle, AlertCircle, TrendingDown, Layers } from 'lucide-react';

interface MetricCardsProps {
  orders: ProductionOrder[];
  materials: Material[];
  onFilterAbnormal?: () => void;
  onFilterLowStock?: () => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  orders,
  materials,
  onFilterAbnormal,
  onFilterLowStock,
}) => {
  // Calculations
  const completedOrProgressOrders = orders.filter(o => o.status !== 'pending');
  const totalIssuedKg = completedOrProgressOrders.reduce((sum, o) => sum + (o.actualIssuedKg || 0), 0);
  const totalFinishedKg = completedOrProgressOrders.reduce((sum, o) => sum + (o.finishedGoodKg || 0), 0);
  const totalScrapKg = completedOrProgressOrders.reduce((sum, o) => sum + (o.scrapKg || 0), 0);

  // Avg Scrap Rate %
  const avgScrapRate = totalIssuedKg > 0 ? (totalScrapKg / totalIssuedKg) * 100 : 0;
  
  // Abnormal orders (> 5% scrap rate or status == abnormal)
  const abnormalOrders = orders.filter(o => o.status === 'abnormal' || o.scrapRate > 5);
  
  // Total inventory
  const totalStockKg = materials.reduce((sum, m) => sum + m.stockKg, 0);
  const totalStockValue = materials.reduce((sum, m) => sum + (m.stockKg * m.unitPrice), 0);
  const lowStockItems = materials.filter(m => m.stockKg <= m.safetyStockKg);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
      {/* 1. 總投料量 */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">本期累計投料</span>
          <Scale className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {formatNum(totalIssuedKg, 1)}
          </span>
          <span className="text-xs text-slate-500">kg</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
          <span>良品成品重</span>
          <span className="font-mono text-slate-700">{formatNum(totalFinishedKg, 1)} kg</span>
        </div>
      </div>

      {/* 2. 平均損耗率 */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">全廠平均損耗率</span>
          <TrendingDown className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-2xl font-bold font-mono tracking-tight ${
            avgScrapRate > 4 ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {formatNum(avgScrapRate, 2)}%
          </span>
          <span className="text-xs text-slate-500">標竿值 ≤ 3.0%</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
          <span>累計報廢/邊料</span>
          <span className="font-mono font-medium text-slate-700">{formatNum(totalScrapKg, 1)} kg</span>
        </div>
      </div>

      {/* 3. 超耗警報工單 */}
      <div 
        onClick={onFilterAbnormal}
        className={`bg-white border rounded-lg p-4 shadow-xs cursor-pointer transition-all hover:border-rose-300 ${
          abnormalOrders.length > 0 ? 'border-rose-200 bg-rose-50/20' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">超耗異常工單</span>
          <AlertCircle className={`w-4 h-4 ${abnormalOrders.length > 0 ? 'text-rose-500' : 'text-slate-400'}`} />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-2xl font-bold font-mono tracking-tight ${
            abnormalOrders.length > 0 ? 'text-rose-600' : 'text-slate-900'
          }`}>
            {abnormalOrders.length}
          </span>
          <span className="text-xs text-slate-500">筆工單</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
          <span>標準損耗上限</span>
          <span className="text-rose-600 font-medium">超標 &gt; 5.0%</span>
        </div>
      </div>

      {/* 4. 原料在庫總量 */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">PE原料在線庫存</span>
          <Layers className="w-4 h-4 text-slate-400" />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
            {formatNum(totalStockKg, 0)}
          </span>
          <span className="text-xs text-slate-500">kg</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
          <span>折合標準包</span>
          <span className="font-mono text-slate-700">約 {Math.floor(totalStockKg / 25)} 包 (25kg)</span>
        </div>
      </div>

      {/* 5. 庫存警報與市值 */}
      <div 
        onClick={onFilterLowStock}
        className={`bg-white border rounded-lg p-4 shadow-xs cursor-pointer transition-all hover:border-amber-300 ${
          lowStockItems.length > 0 ? 'border-amber-200 bg-amber-50/20' : 'border-slate-200'
        }`}
      >
        <div className="flex items-center justify-between text-slate-500 mb-1">
          <span className="text-xs font-medium">安全庫存預警</span>
          <AlertTriangle className={`w-4 h-4 ${lowStockItems.length > 0 ? 'text-amber-500' : 'text-slate-400'}`} />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className={`text-2xl font-bold font-mono tracking-tight ${
            lowStockItems.length > 0 ? 'text-amber-600' : 'text-emerald-600'
          }`}>
            {lowStockItems.length}
          </span>
          <span className="text-xs text-slate-500">項原料不足</span>
        </div>
        <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
          <span>原料金額資產</span>
          <span className="font-mono text-slate-700">NT$ {formatNum(totalStockValue, 0)}</span>
        </div>
      </div>
    </div>
  );
};
