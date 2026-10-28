import React, { useState, useEffect } from 'react';
import { Material, ProductionOrder, InventoryLog, OrderStatus } from './types';
import { INITIAL_MATERIALS, INITIAL_ORDERS, INITIAL_LOGS } from './utils/initialData';
import { formatNum } from './utils/peCalculations';

import { Header } from './components/Header';
import { MetricCards } from './components/MetricCards';
import { Calculator } from './components/Calculator';
import { OrderManagement } from './components/OrderManagement';
import { InventoryManagement } from './components/InventoryManagement';
import { AnalyticsView } from './components/AnalyticsView';
import { OrderModal } from './components/OrderModal';
import { PlusCircle, Layers, ArrowRight, ShieldCheck, Scale, AlertTriangle } from 'lucide-react';

const STORAGE_KEYS = {
  MATERIALS: 'pe_sys_materials_v1',
  ORDERS: 'pe_sys_orders_v1',
  LOGS: 'pe_sys_logs_v1',
};

export default function App() {
  // Load state from localStorage or initial dataset
  const [materials, setMaterials] = useState<Material[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MATERIALS);
      return saved ? JSON.parse(saved) : INITIAL_MATERIALS;
    } catch {
      return INITIAL_MATERIALS;
    }
  });

  const [orders, setOrders] = useState<ProductionOrder[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [logs, setLogs] = useState<InventoryLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      return saved ? JSON.parse(saved) : INITIAL_LOGS;
    } catch {
      return INITIAL_LOGS;
    }
  });

  // Active view tab
  const [activeTab, setActiveTab] = useState<'overview' | 'calculator' | 'orders' | 'inventory' | 'analytics'>('overview');

  // Modal triggers
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [prefilledOrderData, setPrefilledOrderData] = useState<Partial<ProductionOrder> | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
  }, [materials]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  }, [logs]);

  // Handler: Save (Create/Update) Order
  const handleSaveOrder = (savedOrder: ProductionOrder) => {
    setOrders(prev => {
      const exists = prev.some(o => o.id === savedOrder.id);
      if (exists) {
        return prev.map(o => (o.id === savedOrder.id ? savedOrder : o));
      } else {
        return [savedOrder, ...prev];
      }
    });
  };

  // Handler: Delete Order
  const handleDeleteOrder = (orderId: string) => {
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  // Handler: Save Material
  const handleSaveMaterial = (savedMat: Material) => {
    setMaterials(prev => {
      const exists = prev.some(m => m.id === savedMat.id);
      if (exists) {
        return prev.map(m => (m.id === savedMat.id ? savedMat : m));
      } else {
        return [...prev, savedMat];
      }
    });
  };

  // Handler: Add Log
  const handleAddLog = (newLog: InventoryLog) => {
    setLogs(prev => [newLog, ...prev]);
  };

  // Handler: Convert Calculator output into a Work Order
  const handleConvertCalculatorToOrder = (calcData: any) => {
    setPrefilledOrderData({
      productName: calcData.productName,
      productType: calcData.productType,
      specs: calcData.specs,
      targetQuantity: calcData.targetQuantity,
      theoreticalTotalKg: calcData.theoreticalTotalKg,
      recipe: calcData.recipe,
    });
    setIsOrderModalOpen(true);
  };

  // Handler: Export CSV
  const handleExportCSV = () => {
    const headers = [
      '工單編號',
      '產品品名',
      '類別',
      '機台',
      '規格(寬x長x厚)',
      '訂單數量',
      '單位',
      '理論定額(kg)',
      '實際投料(kg)',
      '良品重量(kg)',
      '損耗重量(kg)',
      '損耗率(%)',
      '用量偏差(kg)',
      '損耗原因',
      '工單狀態',
      '負責人',
      '建立時間',
    ];

    const rows = orders.map(o => [
      `"${o.orderNumber}"`,
      `"${o.productName.replace(/"/g, '""')}"`,
      `"${o.productType}"`,
      `"${o.machineId}"`,
      `"${o.specs.widthMm}x${o.specs.lengthMm}x${o.specs.thicknessMicron}μm"`,
      o.targetQuantity,
      `"${o.unit}"`,
      o.theoreticalTotalKg,
      o.actualIssuedKg,
      o.finishedGoodKg,
      o.scrapKg,
      o.scrapRate,
      o.varianceKg,
      `"${o.primaryScrapReason || ''}"`,
      `"${o.status}"`,
      `"${o.operator}"`,
      `"${o.createdAt}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `PE用量工單報表_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handler: Reset Data to Demo Defaults
  const handleResetData = () => {
    if (window.confirm('確定要將工單與原料庫存重置為示範數據嗎？現有自訂資料將被覆蓋。')) {
      setMaterials(INITIAL_MATERIALS);
      setOrders(INITIAL_ORDERS);
      setLogs(INITIAL_LOGS);
      localStorage.removeItem(STORAGE_KEYS.MATERIALS);
      localStorage.removeItem(STORAGE_KEYS.ORDERS);
      localStorage.removeItem(STORAGE_KEYS.LOGS);
    }
  };

  // Counts
  const abnormalCount = orders.filter(o => o.status === 'abnormal' || o.scrapRate > 5).length;
  const lowStockCount = materials.filter(m => m.stockKg <= m.safetyStockKg).length;

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewOrder={() => {
          setPrefilledOrderData(null);
          setIsOrderModalOpen(true);
        }}
        onExportCSV={handleExportCSV}
        onResetData={handleResetData}
        abnormalCount={abnormalCount}
        lowStockCount={lowStockCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Metric Cards (visible across all views for constant situational awareness) */}
        <MetricCards
          orders={orders}
          materials={materials}
          onFilterAbnormal={() => setActiveTab('orders')}
          onFilterLowStock={() => setActiveTab('inventory')}
        />

        {/* VIEW 1: OVERVIEW DASHBOARD */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Action / Entry Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div 
                onClick={() => setActiveTab('calculator')}
                className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs hover:border-slate-400 cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    定額用量試算機
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    平口袋/折邊袋、捲膜米數與混料配比換算
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>

              <div 
                onClick={() => {
                  setPrefilledOrderData(null);
                  setIsOrderModalOpen(true);
                }}
                className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs hover:border-slate-400 cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    建立新批次工單
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    自動排定定額投料與機台配方
                  </p>
                </div>
                <PlusCircle className="w-4 h-4 text-emerald-600" />
              </div>

              <div 
                onClick={() => setActiveTab('analytics')}
                className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs hover:border-slate-400 cursor-pointer transition-all flex items-center justify-between"
              >
                <div>
                  <h3 className="text-xs font-bold text-slate-900">
                    損耗率對比與改善
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    查看機台排行與工藝降耗對策
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Quick Active Orders View */}
            <OrderManagement
              orders={orders}
              materials={materials}
              onSaveOrder={handleSaveOrder}
              onDeleteOrder={handleDeleteOrder}
              onOpenNewOrder={() => {
                setPrefilledOrderData(null);
                setIsOrderModalOpen(true);
              }}
            />

            {/* Inline Inventory Snapshot */}
            <InventoryManagement
              materials={materials}
              logs={logs}
              onSaveMaterial={handleSaveMaterial}
              onAddLog={handleAddLog}
            />
          </div>
        )}

        {/* VIEW 2: FORMULA CALCULATOR */}
        {activeTab === 'calculator' && (
          <div>
            <Calculator
              materials={materials}
              onConvertToOrder={handleConvertCalculatorToOrder}
            />
          </div>
        )}

        {/* VIEW 3: PRODUCTION ORDERS */}
        {activeTab === 'orders' && (
          <div>
            <OrderManagement
              orders={orders}
              materials={materials}
              onSaveOrder={handleSaveOrder}
              onDeleteOrder={handleDeleteOrder}
              onOpenNewOrder={() => {
                setPrefilledOrderData(null);
                setIsOrderModalOpen(true);
              }}
            />
          </div>
        )}

        {/* VIEW 4: RAW MATERIALS INVENTORY */}
        {activeTab === 'inventory' && (
          <div>
            <InventoryManagement
              materials={materials}
              logs={logs}
              onSaveMaterial={handleSaveMaterial}
              onAddLog={handleAddLog}
              initialLowStockFilter={lowStockCount > 0}
            />
          </div>
        )}

        {/* VIEW 5: ANALYTICS & IMPROVEMENTS */}
        {activeTab === 'analytics' && (
          <div>
            <AnalyticsView orders={orders} />
          </div>
        )}
      </main>

      {/* Global New/Edit Order Modal */}
      {isOrderModalOpen && (
        <OrderModal
          isOpen={isOrderModalOpen}
          onClose={() => {
            setIsOrderModalOpen(false);
            setPrefilledOrderData(null);
          }}
          onSave={handleSaveOrder}
          materials={materials}
          initialData={prefilledOrderData}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500 print:hidden">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-700">PE用量管理系統</span>
            <span aria-hidden="true">·</span>
            <span>聚乙烯吹膜與制袋工藝定額標準化系統</span>
          </div>
          <div className="text-[11px] text-slate-400">
            支援平口袋、摺角袋、吹膜捲料、混料配比及標準 25kg 原裝拆解換算
          </div>
        </div>
      </footer>
    </div>
  );
}
