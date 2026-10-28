import React, { useState } from 'react';
import { ProductionOrder, OrderStatus, Material } from '../types';
import { formatNum } from '../utils/peCalculations';
import { 
  Search, 
  Filter, 
  Plus, 
  Scale, 
  Printer, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText 
} from 'lucide-react';
import { FeedSettleModal } from './FeedSettleModal';
import { WorkOrderPrintModal } from './WorkOrderPrintModal';
import { OrderModal } from './OrderModal';

interface OrderManagementProps {
  orders: ProductionOrder[];
  materials: Material[];
  onSaveOrder: (order: ProductionOrder) => void;
  onDeleteOrder: (id: string) => void;
  onOpenNewOrder: () => void;
  initialFilter?: OrderStatus | 'all' | 'abnormal_only';
}

export const OrderManagement: React.FC<OrderManagementProps> = ({
  orders,
  materials,
  onSaveOrder,
  onDeleteOrder,
  onOpenNewOrder,
  initialFilter = 'all',
}) => {
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [machineFilter, setMachineFilter] = useState<string>('all');

  // Modal states
  const [selectedFeedOrder, setSelectedFeedOrder] = useState<ProductionOrder | null>(null);
  const [selectedPrintOrder, setSelectedPrintOrder] = useState<ProductionOrder | null>(null);
  const [editingOrder, setEditingOrder] = useState<ProductionOrder | null>(null);

  // Extract unique machines
  const machines = Array.from(new Set(orders.map(o => o.machineId)));

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    // Status filter
    if (statusFilter === 'abnormal_only') {
      if (o.status !== 'abnormal' && o.scrapRate <= 5) return false;
    } else if (statusFilter !== 'all') {
      if (o.status !== statusFilter) return false;
    }

    // Machine filter
    if (machineFilter !== 'all' && o.machineId !== machineFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        o.orderNumber.toLowerCase().includes(q) ||
        o.productName.toLowerCase().includes(q) ||
        o.machineId.toLowerCase().includes(q) ||
        o.operator.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden mb-8">
      {/* Header & Filter Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              生產工單與 PE 用量投料追蹤
            </h2>
            <p className="text-xs text-slate-500">
              實時記錄每批工單定額、實際投料過磅、良品產出與工藝損耗率分析
            </p>
          </div>

          <button
            onClick={onOpenNewOrder}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            建立新工單
          </button>
        </div>

        {/* Filter bars */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {/* Status Tabs */}
          <div className="flex items-center p-1 bg-slate-100 rounded-md text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs font-medium' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              全部 ({orders.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'pending' ? 'bg-white text-slate-900 shadow-xs font-medium' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              待投料 ({orders.filter(o => o.status === 'pending').length})
            </button>
            <button
              onClick={() => setStatusFilter('in_progress')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'in_progress' ? 'bg-white text-slate-900 shadow-xs font-medium' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              生產中 ({orders.filter(o => o.status === 'in_progress').length})
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'completed' ? 'bg-white text-slate-900 shadow-xs font-medium' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              已完工 ({orders.filter(o => o.status === 'completed').length})
            </button>
            <button
              onClick={() => setStatusFilter('abnormal_only')}
              className={`px-2.5 py-1 rounded transition-colors ${
                statusFilter === 'abnormal_only' ? 'bg-white text-rose-700 shadow-xs font-semibold' : 'text-rose-600 hover:text-rose-800'
              }`}
            >
              超耗列管 ({orders.filter(o => o.status === 'abnormal' || o.scrapRate > 5).length})
            </button>
          </div>

          {/* Machine dropdown */}
          <div className="flex items-center gap-1.5 ml-auto">
            <select
              value={machineFilter}
              onChange={e => setMachineFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-md px-2.5 py-1 bg-white text-slate-700"
            >
              <option value="all">全部產線機台</option>
              {machines.map(m => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="搜尋工單號、產品品名..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-48 sm:w-60 text-xs border border-slate-200 rounded-md pl-7 pr-2.5 py-1 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-900"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
            <tr>
              <th className="py-2.5 px-3 font-medium">工單編號 / 狀態</th>
              <th className="py-2.5 px-3 font-medium">產品名稱與規格</th>
              <th className="py-2.5 px-3 font-medium">產線機台</th>
              <th className="py-2.5 px-3 font-medium text-right">計劃產量</th>
              <th className="py-2.5 px-3 font-medium text-right">理論定額</th>
              <th className="py-2.5 px-3 font-medium text-right">實際投料</th>
              <th className="py-2.5 px-3 font-medium text-right">良品重 / 損耗重</th>
              <th className="py-2.5 px-3 font-medium text-right">損耗率</th>
              <th className="py-2.5 px-3 font-medium text-right">偏差</th>
              <th className="py-2.5 px-3 font-medium text-center">操作管理</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={10} className="py-8 text-center text-slate-400 text-xs">
                  查無符合條件的工單紀錄
                </td>
              </tr>
            ) : (
              filteredOrders.map(order => {
                const isOverLoss = order.scrapRate > 5.0;
                const isPending = order.status === 'pending';

                return (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Order # and Status */}
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-slate-900">
                        {order.orderNumber}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[11px]">
                        {order.status === 'pending' && (
                          <span className="text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            待投料
                          </span>
                        )}
                        {order.status === 'in_progress' && (
                          <span className="text-blue-600 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                            生產中
                          </span>
                        )}
                        {order.status === 'completed' && (
                          <span className="text-emerald-700 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            已結算完工
                          </span>
                        )}
                        {order.status === 'abnormal' && (
                          <span className="text-rose-700 font-bold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-rose-500" />
                            超耗異常
                          </span>
                        )}
                        <span className="text-slate-300">·</span>
                        <span className="text-slate-500">{order.operator}</span>
                      </div>
                    </td>

                    {/* Product & Spec */}
                    <td className="py-3 px-3">
                      <div className="font-medium text-slate-900 max-w-[220px] truncate" title={order.productName}>
                        {order.productName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        {order.productType === 'bag' ? (
                          <>{order.specs.widthMm}x{order.specs.lengthMm}mm · {order.specs.thicknessMicron}μm</>
                        ) : order.productType === 'roll' ? (
                          <>寬{order.specs.widthMm}mm · {order.specs.thicknessMicron}μm</>
                        ) : (
                          <>自訂配方</>
                        )}
                      </div>
                    </td>

                    {/* Machine */}
                    <td className="py-3 px-3">
                      <span className="text-slate-700 font-medium">{order.machineId}</span>
                    </td>

                    {/* Target Quantity */}
                    <td className="py-3 px-3 text-right font-mono font-medium text-slate-800">
                      {formatNum(order.targetQuantity, 0)} {order.unit}
                    </td>

                    {/* Theoretical Kg */}
                    <td className="py-3 px-3 text-right font-mono text-slate-700">
                      {formatNum(order.theoreticalTotalKg, 1)} kg
                    </td>

                    {/* Actual Issued Kg */}
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                      {order.actualIssuedKg > 0 ? `${formatNum(order.actualIssuedKg, 1)} kg` : '-'}
                    </td>

                    {/* Finished vs Scrap */}
                    <td className="py-3 px-3 text-right font-mono text-[11px]">
                      {order.actualIssuedKg > 0 ? (
                        <>
                          <div className="text-emerald-700 font-medium">
                            良品 {formatNum(order.finishedGoodKg, 1)} kg
                          </div>
                          <div className="text-slate-500">
                            廢料 {formatNum(order.scrapKg, 1)} kg
                          </div>
                        </>
                      ) : (
                        <span className="text-slate-400">尚未過磅</span>
                      )}
                    </td>

                    {/* Scrap Rate */}
                    <td className="py-3 px-3 text-right font-mono">
                      {order.actualIssuedKg > 0 ? (
                        <div>
                          <span
                            className={`font-bold ${
                              isOverLoss
                                ? 'text-rose-600'
                                : order.scrapRate > 3.0
                                ? 'text-amber-600'
                                : 'text-emerald-600'
                            }`}
                          >
                            {formatNum(order.scrapRate, 2)}%
                          </span>
                          {order.primaryScrapReason && (
                            <div className="text-[10px] text-slate-400 truncate max-w-[90px] ml-auto">
                              {order.primaryScrapReason}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Variance */}
                    <td className="py-3 px-3 text-right font-mono text-[11px]">
                      {order.actualIssuedKg > 0 ? (
                        <span className={order.varianceKg > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                          {order.varianceKg > 0 ? `+${formatNum(order.varianceKg, 1)}` : formatNum(order.varianceKg, 1)} kg
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {/* Feed / Settle Modal Button */}
                        <button
                          onClick={() => setSelectedFeedOrder(order)}
                          title="投料過磅與結算"
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        >
                          <Scale className="w-3.5 h-3.5 text-emerald-600" />
                        </button>

                        {/* Print Sheet */}
                        <button
                          onClick={() => setSelectedPrintOrder(order)}
                          title="列印生產領料單"
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5 text-slate-500" />
                        </button>

                        {/* Edit Order */}
                        <button
                          onClick={() => setEditingOrder(order)}
                          title="編輯工單規格"
                          className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Order */}
                        <button
                          onClick={() => {
                            if (window.confirm(`確定刪除工單 ${order.orderNumber} 嗎？`)) {
                              onDeleteOrder(order.id);
                            }
                          }}
                          title="刪除工單"
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-slate-100 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Feed & Settle Modal */}
      {selectedFeedOrder && (
        <FeedSettleModal
          order={selectedFeedOrder}
          isOpen={!!selectedFeedOrder}
          onClose={() => setSelectedFeedOrder(null)}
          onSave={onSaveOrder}
        />
      )}

      {/* Print Sheet Modal */}
      {selectedPrintOrder && (
        <WorkOrderPrintModal
          order={selectedPrintOrder}
          isOpen={!!selectedPrintOrder}
          onClose={() => setSelectedPrintOrder(null)}
        />
      )}

      {/* Edit Order Modal */}
      {editingOrder && (
        <OrderModal
          isOpen={!!editingOrder}
          onClose={() => setEditingOrder(null)}
          onSave={onSaveOrder}
          materials={materials}
          initialData={editingOrder}
        />
      )}
    </div>
  );
};
