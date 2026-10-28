import React from 'react';
import { ProductionOrder, ScrapReason } from '../types';
import { formatNum } from '../utils/peCalculations';
import { 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Wrench, 
  Layers, 
  Sparkles,
  PieChart,
  BarChart2
} from 'lucide-react';

interface AnalyticsViewProps {
  orders: ProductionOrder[];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ orders }) => {
  const settledOrders = orders.filter(o => o.actualIssuedKg > 0);

  // Machine Breakdown
  const machineMap: Record<string, { totalIssued: number; totalScrap: number; count: number }> = {};
  settledOrders.forEach(o => {
    if (!machineMap[o.machineId]) {
      machineMap[o.machineId] = { totalIssued: 0, totalScrap: 0, count: 0 };
    }
    machineMap[o.machineId].totalIssued += o.actualIssuedKg;
    machineMap[o.machineId].totalScrap += o.scrapKg;
    machineMap[o.machineId].count += 1;
  });

  const machineStats = Object.entries(machineMap).map(([machine, data]) => {
    const rate = data.totalIssued > 0 ? (data.totalScrap / data.totalIssued) * 100 : 0;
    return {
      machine,
      totalIssued: data.totalIssued,
      totalScrap: data.totalScrap,
      rate,
      count: data.count,
    };
  }).sort((a, b) => b.rate - a.rate);

  // Scrap Reasons Breakdown
  const reasonMap: Record<string, number> = {
    '調機開機損耗': 0,
    '邊料修邊裁切': 0,
    '厚薄不均超差': 0,
    '斷膜破膜': 0,
    '晶點魚眼不良': 0,
    '印刷封口不良': 0,
    '其他異常': 0,
  };

  settledOrders.forEach(o => {
    const reason = o.primaryScrapReason || '其他異常';
    reasonMap[reason] = (reasonMap[reason] || 0) + (o.scrapKg || 0);
  });

  const totalScrapKgAll = Object.values(reasonMap).reduce((a, b) => a + b, 0);

  const reasonList = Object.entries(reasonMap)
    .map(([reason, kg]) => ({
      reason,
      kg,
      percent: totalScrapKgAll > 0 ? (kg / totalScrapKgAll) * 100 : 0,
    }))
    .sort((a, b) => b.kg - a.kg);

  // Variance stats
  const totalVarianceKg = settledOrders.reduce((sum, o) => sum + (o.varianceKg || 0), 0);
  const totalTheoreticalKg = settledOrders.reduce((sum, o) => sum + (o.theoreticalTotalKg || 0), 0);
  const varianceRateTotal = totalTheoreticalKg > 0 ? (totalVarianceKg / totalTheoreticalKg) * 100 : 0;

  return (
    <div className="space-y-6 mb-8">
      {/* Top Banner KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block mb-1">已結算工單批數</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{settledOrders.length}</span>
            <span className="text-xs text-slate-500">/ 全廠 {orders.length} 批</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            總結算投料：{formatNum(settledOrders.reduce((s, o) => s + o.actualIssuedKg, 0), 1)} kg
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block mb-1">全廠定額用量總偏差</span>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono ${totalVarianceKg > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
              {totalVarianceKg > 0 ? `+${formatNum(totalVarianceKg, 1)}` : formatNum(totalVarianceKg, 1)}
            </span>
            <span className="text-xs text-slate-500">kg ({varianceRateTotal.toFixed(2)}%)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-2">
            超出標準定額之實際消耗總量
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <span className="text-xs text-slate-500 font-medium block mb-1">主要損耗瓶頸原因</span>
          <div className="text-base font-bold text-slate-900 mt-1">
            {reasonList[0]?.reason || '邊料修邊'}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 font-mono">
            佔整體廢料 {reasonList[0]?.percent.toFixed(1)}% ({formatNum(reasonList[0]?.kg || 0, 1)} kg)
          </div>
        </div>
      </div>

      {/* Grid: Machine Ranking & Reason Pareto */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Machine Yield Benchmark */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                各產線機台損耗率對比排行
              </h3>
              <p className="text-[11px] text-slate-500">
                依結算損耗率由高至低排列，監控需保養調校之設備
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-400">標準容許 ≤ 3.5%</span>
          </div>

          <div className="space-y-3">
            {machineStats.map((item, idx) => {
              const isHigh = item.rate > 4.5;
              const isWarning = item.rate > 3.0 && item.rate <= 4.5;

              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 flex items-center gap-1.5">
                      <span className="w-5 text-slate-400 font-mono text-[11px]">#{idx + 1}</span>
                      {item.machine}
                      <span className="text-[10px] text-slate-400 font-normal">({item.count} 批工單)</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-500 text-[11px]">
                        廢料 {formatNum(item.totalScrap, 1)} kg
                      </span>
                      <span className={`font-mono font-bold text-xs ${
                        isHigh ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {item.rate.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        isHigh ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, (item.rate / 12) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reason Distribution Pareto */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
            <div>
              <h3 className="text-xs font-bold text-slate-900">
                工藝損耗主因歸因分佈 (Scrap Pareto)
              </h3>
              <p className="text-[11px] text-slate-500">
                掌握邊料、開機調機與晶點破膜之廢料分佈
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-600 font-semibold">
              總廢料 {formatNum(totalScrapKgAll, 1)} kg
            </span>
          </div>

          <div className="space-y-2.5">
            {reasonList.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-700 font-medium">
                    {item.reason}
                  </span>
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="text-slate-500 text-[11px]">{formatNum(item.kg, 1)} kg</span>
                    <span className="font-bold text-slate-900 w-12 text-right">{item.percent.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full bg-slate-800"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Industrial Engineering Knowledge & Quality Remedies */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs p-5">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200 mb-4">
          <Wrench className="w-4 h-4 text-slate-700" />
          <h3 className="text-xs font-bold text-slate-900">
            PE 薄膜與袋體製造「降耗增效」工藝對策庫
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Card 1 */}
          <div className="border border-slate-200 rounded-md p-3.5 bg-slate-50/50 space-y-1.5">
            <div className="font-semibold text-slate-900 flex items-center justify-between">
              <span>1. 晶點、魚眼 (Fish Eye) 與再生料破膜對策</span>
              <span className="text-[11px] text-slate-500 font-mono">熔融過濾</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              再生料 (PCR) 易帶有未熔雜質與凝膠顆粒。建議將換網器過濾目數由 60 目提升至 80/100 目複合雙層濾網；適當降低進料段一區溫度 (防止過早融化打滑)，提高均化段背壓 15~20 bar，使塑化更加均勻。
            </p>
          </div>

          {/* Card 2 */}
          <div className="border border-slate-200 rounded-md p-3.5 bg-slate-50/50 space-y-1.5">
            <div className="font-semibold text-slate-900 flex items-center justify-between">
              <span>2. 膜厚不均、克重公差超標對策</span>
              <span className="text-[11px] text-slate-500 font-mono">吹脹比 BUR</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              吹膜厚薄公差若超過 ±3μm，會大幅推升原料消耗。應定期以千分尺量測模頭出料口間隙 (Die Gap)；檢查風環氣流是否偏心；最佳吹脹比 BUR (膜泡直徑/模頭直徑) 宜維持在 2.0 ~ 3.5 之間以達到最佳雙向拉伸強度。
            </p>
          </div>

          {/* Card 3 */}
          <div className="border border-slate-200 rounded-md p-3.5 bg-slate-50/50 space-y-1.5">
            <div className="font-semibold text-slate-900 flex items-center justify-between">
              <span>3. 開機引膜與換捲調機損耗壓降</span>
              <span className="text-[11px] text-slate-500 font-mono">過渡料排程</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              開機試車過度投料是超耗首因。同規格訂單應安排連續換捲；換色或換料時，依「由淺入深、由高熔指到低熔指」排程，減少清機浪費；引膜期間收集之清潔塊料應標籤分類，供降級製袋回摻使用。
            </p>
          </div>

          {/* Card 4 */}
          <div className="border border-slate-200 rounded-md p-3.5 bg-slate-50/50 space-y-1.5">
            <div className="font-semibold text-slate-900 flex items-center justify-between">
              <span>4. 制袋熱切邊料與封口強度控制</span>
              <span className="text-[11px] text-slate-500 font-mono">切邊減量</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              側封袋修邊刀距應嚴格設定在 3~5mm 最低容許值，避免多餘修邊損耗；添加 3%~5% 爽滑開口母粒降低摩擦係數 (COF 0.15~0.25)，以防止制袋牽引拉伸變形產生次品。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
