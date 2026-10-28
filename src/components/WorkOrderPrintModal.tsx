import React from 'react';
import { ProductionOrder } from '../types';
import { formatNum } from '../utils/peCalculations';
import { X, Printer } from 'lucide-react';

interface WorkOrderPrintModalProps {
  order: ProductionOrder;
  isOpen: boolean;
  onClose: () => void;
}

export const WorkOrderPrintModal: React.FC<WorkOrderPrintModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white border border-slate-200 rounded-lg shadow-xl w-full max-w-3xl overflow-hidden print:border-none print:shadow-none print:w-full">
        {/* Modal Controls (Hidden in Print) */}
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-800">
              生產工單與領料單列印預覽
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {order.orderNumber}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              立即列印 / 存為 PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Sheet */}
        <div className="p-8 font-sans text-slate-900 leading-normal" id="printable-sheet">
          {/* Company & Title Header */}
          <div className="text-center border-b-2 border-slate-900 pb-3 mb-4">
            <h1 className="text-xl font-bold tracking-wider text-slate-900">
              精密塑料薄膜與包材製造部
            </h1>
            <h2 className="text-base font-semibold text-slate-700 tracking-wide mt-0.5">
              PE 生產工單 · 原料領用與投料定額單
            </h2>
            <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
              <span>製單日期：{order.createdAt}</span>
              <span className="font-mono font-bold text-slate-900">工單編號：{order.orderNumber}</span>
              <span>產線機台：{order.machineId}</span>
            </div>
          </div>

          {/* Basic Order Information Table */}
          <table className="w-full border-collapse border border-slate-400 text-xs mb-4">
            <tbody>
              <tr>
                <td className="border border-slate-300 bg-slate-100 font-semibold p-2 w-28">產品名稱</td>
                <td className="border border-slate-300 p-2 font-medium" colSpan={3}>
                  {order.productName}
                </td>
                <td className="border border-slate-300 bg-slate-100 font-semibold p-2 w-24">工單類別</td>
                <td className="border border-slate-300 p-2 font-mono">
                  {order.productType === 'bag' ? 'PE 袋體制袋' : order.productType === 'roll' ? 'PE 吹膜捲料' : '自訂混料'}
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-100 font-semibold p-2">規格尺寸</td>
                <td className="border border-slate-300 p-2 font-mono" colSpan={3}>
                  {order.productType === 'bag' ? (
                    <>寬度 {order.specs.widthMm}mm × 長度 {order.specs.lengthMm}mm × 厚度 {order.specs.thicknessMicron}μm {order.specs.gussetMm ? `(折角 ${order.specs.gussetMm}mm)` : ''}</>
                  ) : (
                    <>寬度 {order.specs.widthMm}mm × 長度 {order.specs.lengthMm ? Math.round(order.specs.lengthMm / 1000) : '-'}m × 厚度 {order.specs.thicknessMicron}μm</>
                  )}
                </td>
                <td className="border border-slate-300 bg-slate-100 font-semibold p-2">基準密度</td>
                <td className="border border-slate-300 p-2 font-mono">
                  {order.specs.density} g/cm³
                </td>
              </tr>
              <tr>
                <td className="border border-slate-300 bg-slate-100 font-semibold p-2">計劃產量</td>
                <td className="border border-slate-300 p-2 font-mono font-bold">
                  {order.targetQuantity} {order.unit}
                </td>
                <td className="border border-slate-300 bg-slate-100 font-semibold p-2 w-24">單件理論重</td>
                <td className="border border-slate-300 p-2 font-mono">
                  {order.singleTheoreticalWeightG} g
                </td>
                <td className="border border-slate-300 bg-slate-100 font-semibold p-2">理論定額總重</td>
                <td className="border border-slate-300 p-2 font-mono font-bold text-slate-900">
                  {formatNum(order.theoreticalTotalKg, 2)} kg
                </td>
              </tr>
            </tbody>
          </table>

          {/* Recipe Blending List */}
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
              <span>一、原料定額領用配比表 (按工單理論定額配料)</span>
              <span className="font-normal text-[11px] text-slate-500">標準袋裝：25.0 kg / 包</span>
            </h3>
            <table className="w-full border-collapse border border-slate-400 text-xs">
              <thead className="bg-slate-100 text-slate-800 font-semibold">
                <tr>
                  <th className="border border-slate-300 p-2 text-center w-12">項次</th>
                  <th className="border border-slate-300 p-2 text-left">原料名稱 / 規格型號</th>
                  <th className="border border-slate-300 p-2 text-center w-20">材質類別</th>
                  <th className="border border-slate-300 p-2 text-right w-20">配比 (%)</th>
                  <th className="border border-slate-300 p-2 text-right w-24">定額用量 (kg)</th>
                  <th className="border border-slate-300 p-2 text-right w-28">折合原裝 (25kg)</th>
                  <th className="border border-slate-300 p-2 text-center w-24">倉管發料簽收</th>
                </tr>
              </thead>
              <tbody>
                {order.recipe.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border border-slate-300 p-2 text-center font-mono">{idx + 1}</td>
                    <td className="border border-slate-300 p-2 font-medium">{item.materialName}</td>
                    <td className="border border-slate-300 p-2 text-center font-mono text-[11px]">{item.materialType}</td>
                    <td className="border border-slate-300 p-2 text-right font-mono">{item.ratioPercent}%</td>
                    <td className="border border-slate-300 p-2 text-right font-mono font-bold">{formatNum(item.plannedKg, 1)}</td>
                    <td className="border border-slate-300 p-2 text-right font-mono text-[11px]">
                      {Math.floor(item.plannedKg / 25)} 包 + {(item.plannedKg % 25).toFixed(1)} kg
                    </td>
                    <td className="border border-slate-300 p-2 text-center"></td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold">
                  <td className="border border-slate-300 p-2 text-center" colSpan={3}>合計定額</td>
                  <td className="border border-slate-300 p-2 text-right font-mono">100%</td>
                  <td className="border border-slate-300 p-2 text-right font-mono">{formatNum(order.theoreticalTotalKg, 1)} kg</td>
                  <td className="border border-slate-300 p-2 text-right font-mono text-[11px]">
                    約 {Math.ceil(order.theoreticalTotalKg / 25)} 包
                  </td>
                  <td className="border border-slate-300 p-2 text-center text-slate-400">倉庫覆核</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Shop Floor Actual Feeding & Weighing Sign-off Table */}
          <div className="mb-4">
            <h3 className="text-xs font-bold text-slate-800 mb-1.5">
              二、現場投料與完工過磅結算紀錄 (車間操作員如實填寫)
            </h3>
            <table className="w-full border-collapse border border-slate-400 text-xs">
              <tbody>
                <tr>
                  <td className="border border-slate-300 bg-slate-100 font-semibold p-2 w-28">實際領料投料</td>
                  <td className="border border-slate-300 p-2 font-mono">
                    {order.actualIssuedKg > 0 ? `${formatNum(order.actualIssuedKg, 1)} kg` : '____.__ kg'}
                  </td>
                  <td className="border border-slate-300 bg-slate-100 font-semibold p-2 w-28">良品成品實重</td>
                  <td className="border border-slate-300 p-2 font-mono">
                    {order.finishedGoodKg > 0 ? `${formatNum(order.finishedGoodKg, 1)} kg` : '____.__ kg'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 bg-slate-100 font-semibold p-2">廢料邊料重</td>
                  <td className="border border-slate-300 p-2 font-mono">
                    {order.scrapKg > 0 ? `${formatNum(order.scrapKg, 1)} kg` : '____.__ kg'}
                  </td>
                  <td className="border border-slate-300 bg-slate-100 font-semibold p-2">結算損耗率 (%)</td>
                  <td className="border border-slate-300 p-2 font-mono font-bold">
                    {order.scrapRate > 0 ? `${formatNum(order.scrapRate, 2)}%` : '____.__ %'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 bg-slate-100 font-semibold p-2">主要損耗原因</td>
                  <td className="border border-slate-300 p-2" colSpan={3}>
                    {order.primaryScrapReason || '□ 調機開機  □ 修邊邊料  □ 厚薄不均  □ 斷膜破膜  □ 晶點魚眼  □ 封口不良'}
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 bg-slate-100 font-semibold p-2">生產狀況說明</td>
                  <td className="border border-slate-300 p-2" colSpan={3}>
                    {order.notes || '無特殊異常'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-4 gap-4 text-xs pt-4 border-t border-slate-300 text-center">
            <div>
              <span className="block text-slate-500 mb-6">生產主管核准</span>
              <div className="border-b border-slate-400 pb-1"></div>
            </div>
            <div>
              <span className="block text-slate-500 mb-6">車間領料班長</span>
              <div className="border-b border-slate-400 pb-1 font-medium">{order.operator || ''}</div>
            </div>
            <div>
              <span className="block text-slate-500 mb-6">品質檢驗員 (QC)</span>
              <div className="border-b border-slate-400 pb-1"></div>
            </div>
            <div>
              <span className="block text-slate-500 mb-6">倉管過磅核簽</span>
              <div className="border-b border-slate-400 pb-1"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
