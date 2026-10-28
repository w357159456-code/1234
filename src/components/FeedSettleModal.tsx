import React, { useState } from 'react';
import { ProductionOrder, ScrapReason, OrderStatus } from '../types';
import { formatNum } from '../utils/peCalculations';
import { X, Check, AlertTriangle, Scale, CheckCircle2 } from 'lucide-react';

interface FeedSettleModalProps {
  order: ProductionOrder;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedOrder: ProductionOrder) => void;
}

export const FeedSettleModal: React.FC<FeedSettleModalProps> = ({
  order,
  isOpen,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [actualIssuedKg, setActualIssuedKg] = useState<number>(order.actualIssuedKg || order.theoreticalTotalKg * 1.03);
  const [finishedGoodKg, setFinishedGoodKg] = useState<number>(order.finishedGoodKg || (actualIssuedKg > 0 ? actualIssuedKg * 0.97 : 0));
  const [scrapKg, setScrapKg] = useState<number>(order.scrapKg || Math.max(0, actualIssuedKg - finishedGoodKg));
  const [primaryScrapReason, setPrimaryScrapReason] = useState<ScrapReason>(order.primaryScrapReason || '調機開機損耗');
  const [status, setStatus] = useState<OrderStatus>(order.status === 'pending' ? 'in_progress' : order.status);
  const [notes, setNotes] = useState<string>(order.notes || '');
  const [operator, setOperator] = useState<string>(order.operator || '');

  // Calculate live scrap rate
  const calculatedScrapKg = scrapKg > 0 ? scrapKg : Math.max(0, actualIssuedKg - finishedGoodKg);
  const scrapRate = actualIssuedKg > 0 ? Number(((calculatedScrapKg / actualIssuedKg) * 100).toFixed(2)) : 0;
  const varianceKg = Number((actualIssuedKg - order.theoreticalTotalKg).toFixed(2));
  const varianceRate = order.theoreticalTotalKg > 0 ? Number(((varianceKg / order.theoreticalTotalKg) * 100).toFixed(2)) : 0;
  const isAbnormal = scrapRate > 5.0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalStatus: OrderStatus = isAbnormal && status === 'completed' ? 'abnormal' : status;

    const updated: ProductionOrder = {
      ...order,
      actualIssuedKg: Number(actualIssuedKg),
      finishedGoodKg: Number(finishedGoodKg),
      scrapKg: Number(calculatedScrapKg),
      scrapRate,
      varianceKg,
      varianceRate,
      primaryScrapReason,
      status: finalStatus,
      operator,
      notes,
      completedAt: status === 'completed' || status === 'abnormal' ? new Date().toISOString().replace('T', ' ').slice(0, 16) : order.completedAt,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-lg shadow-lg w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              投料登記與完工結算
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              工單: {order.orderNumber} · {order.productName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Theoretical benchmark bar */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-md p-3 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block">計劃生產目標</span>
              <span className="font-semibold text-slate-900 font-mono">
                {order.targetQuantity} {order.unit}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">理論定額總量 (淨料)</span>
              <span className="font-semibold text-slate-900 font-mono">
                {formatNum(order.theoreticalTotalKg, 2)} kg
              </span>
            </div>
          </div>

          {/* Actual Weights input */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                實際領料/投料重 (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={actualIssuedKg}
                onChange={e => {
                  const val = parseFloat(e.target.value) || 0;
                  setActualIssuedKg(val);
                }}
                className="w-full text-xs font-mono font-bold border border-slate-200 rounded-md px-2.5 py-1.5 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                良品成品實重 (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={finishedGoodKg}
                onChange={e => {
                  const val = parseFloat(e.target.value) || 0;
                  setFinishedGoodKg(val);
                  setScrapKg(Math.max(0, actualIssuedKg - val));
                }}
                className="w-full text-xs font-mono border border-slate-200 rounded-md px-2.5 py-1.5 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                報廢/邊料實重 (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={scrapKg}
                onChange={e => setScrapKg(parseFloat(e.target.value) || 0)}
                className="w-full text-xs font-mono border border-slate-200 rounded-md px-2.5 py-1.5 focus:border-slate-900 focus:outline-none text-rose-600"
              />
            </div>
          </div>

          {/* Live Analysis Alert */}
          <div className={`p-3 rounded-md border text-xs flex items-center justify-between ${
            isAbnormal ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
          }`}>
            <div className="flex items-center gap-2">
              {isAbnormal ? (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              )}
              <div>
                <span className="font-semibold">
                  損耗率: {formatNum(scrapRate, 2)}%
                </span>
                <span className="text-[11px] ml-1.5 text-slate-600">
                  (理論偏差: {varianceKg > 0 ? `+${varianceKg}` : varianceKg} kg)
                </span>
              </div>
            </div>
            <span className="text-[11px] font-medium">
              {isAbnormal ? '⚠️ 超過 5% 容許標準' : '✓ 符合損耗標準 (≤5%)'}
            </span>
          </div>

          {/* Scrap reason selection */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                損耗主因歸類
              </label>
              <select
                value={primaryScrapReason}
                onChange={e => setPrimaryScrapReason(e.target.value as ScrapReason)}
                className="w-full text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-800"
              >
                <option value="調機開機損耗">調機開機損耗</option>
                <option value="邊料修邊裁切">邊料修邊裁切</option>
                <option value="厚薄不均超差">厚薄不均超差</option>
                <option value="斷膜破膜">斷膜破膜</option>
                <option value="晶點魚眼不良">晶點魚眼不良</option>
                <option value="印刷封口不良">印刷封口不良</option>
                <option value="其他異常">其他異常</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                工單狀態變更
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as OrderStatus)}
                className="w-full text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-800"
              >
                <option value="in_progress">生產中 (部分投料)</option>
                <option value="completed">已完工結算</option>
                <option value="abnormal">超耗異常列管</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                操作班長 / 紀錄人
              </label>
              <input
                type="text"
                value={operator}
                onChange={e => setOperator(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-md px-2.5 py-1.5"
                placeholder="例如: 林組長"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                工藝與秤重備註
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-md px-2.5 py-1.5"
                placeholder="記錄生產狀況或邊料回料處置"
              />
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-xs"
            >
              儲存投料與結算數據
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
