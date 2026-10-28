import React, { useState } from 'react';
import { Material, InventoryLog, MaterialType } from '../types';
import { formatNum, STANDARD_DENSITIES } from '../utils/peCalculations';
import { 
  Boxes, 
  Plus, 
  ArrowDownRight, 
  ArrowUpRight, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Layers, 
  X,
  FileSpreadsheet
} from 'lucide-react';

interface InventoryManagementProps {
  materials: Material[];
  logs: InventoryLog[];
  onSaveMaterial: (material: Material) => void;
  onAddLog: (log: InventoryLog) => void;
  initialLowStockFilter?: boolean;
}

export const InventoryManagement: React.FC<InventoryManagementProps> = ({
  materials,
  logs,
  onSaveMaterial,
  onAddLog,
  initialLowStockFilter = false,
}) => {
  const [filterLowStock, setFilterLowStock] = useState<boolean>(initialLowStockFilter);
  const [selectedMaterialForAction, setSelectedMaterialForAction] = useState<Material | null>(null);
  const [actionMode, setActionMode] = useState<'in' | 'out' | 'adjust'>('in');
  
  // New Material Modal
  const [isNewMatOpen, setIsNewMatOpen] = useState(false);
  const [newMatForm, setNewMatForm] = useState<Partial<Material>>({
    code: `M-PE-${Math.floor(1000 + Math.random() * 9000)}`,
    name: '',
    type: 'LDPE',
    grade: '',
    density: 0.920,
    stockKg: 1000,
    safetyStockKg: 500,
    unitPrice: 42.0,
    supplier: '',
    lotNumber: '',
  });

  // Action form
  const [actionKg, setActionKg] = useState<number>(250);
  const [actionOperator, setActionOperator] = useState<string>('倉管員');
  const [actionRemark, setActionRemark] = useState<string>('原裝 10 包');
  const [actionOrderNo, setActionOrderNo] = useState<string>('');

  const filteredMaterials = filterLowStock
    ? materials.filter(m => m.stockKg <= m.safetyStockKg)
    : materials;

  const handleExecuteAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMaterialForAction) return;

    let updatedStock = selectedMaterialForAction.stockKg;
    if (actionMode === 'in') {
      updatedStock += actionKg;
    } else if (actionMode === 'out') {
      updatedStock = Math.max(0, updatedStock - actionKg);
    } else {
      updatedStock = actionKg; // adjust directly
    }

    const updatedMat: Material = {
      ...selectedMaterialForAction,
      stockKg: Number(updatedStock.toFixed(2)),
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };

    onSaveMaterial(updatedMat);

    // Add transaction log
    const newLog: InventoryLog = {
      id: `log-${Date.now()}`,
      materialId: selectedMaterialForAction.id,
      materialName: selectedMaterialForAction.name,
      type: actionMode,
      quantityKg: actionKg,
      orderNumber: actionOrderNo,
      operator: actionOperator,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      remark: actionRemark,
    };
    onAddLog(newLog);

    setSelectedMaterialForAction(null);
  };

  const handleCreateNewMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Material = {
      id: `mat-${Date.now()}`,
      code: newMatForm.code || `M-PE-${Date.now().toString().slice(-4)}`,
      name: newMatForm.name || 'PE 塑料原料',
      type: newMatForm.type || 'LDPE',
      grade: newMatForm.grade || '一般吹膜級',
      density: newMatForm.density || 0.920,
      stockKg: Number(newMatForm.stockKg || 0),
      safetyStockKg: Number(newMatForm.safetyStockKg || 500),
      unitPrice: Number(newMatForm.unitPrice || 40),
      supplier: newMatForm.supplier || '石化供應商',
      lotNumber: newMatForm.lotNumber || 'LOT-2026',
      updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    onSaveMaterial(created);
    setIsNewMatOpen(false);
  };

  return (
    <div className="space-y-6 mb-8">
      {/* Top Card: Materials Stock Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/50 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              PE 原料庫存與安全警報管理
            </h2>
            <p className="text-xs text-slate-500">
              監控 LDPE / HDPE / LLDPE / PCR / 色母粒子即時在庫重量與安全庫存水位
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterLowStock(!filterLowStock)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                filterLowStock
                  ? 'bg-amber-50 border-amber-300 text-amber-800 font-semibold'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-amber-500" />
              只看低庫存預警 ({materials.filter(m => m.stockKg <= m.safetyStockKg).length})
            </button>

            <button
              onClick={() => setIsNewMatOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              新增原料規格
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-medium">料號 / 原料名稱</th>
                <th className="py-2.5 px-3 font-medium">牌號規格</th>
                <th className="py-2.5 px-3 font-medium">材質</th>
                <th className="py-2.5 px-3 font-medium text-right">密度 (g/cm³)</th>
                <th className="py-2.5 px-3 font-medium text-right">在庫庫存量</th>
                <th className="py-2.5 px-3 font-medium text-right">折合包數 (25kg)</th>
                <th className="py-2.5 px-3 font-medium text-right">安全警戒線</th>
                <th className="py-2.5 px-3 font-medium text-right">單價 / 庫存總值</th>
                <th className="py-2.5 px-3 font-medium text-center">庫存狀態</th>
                <th className="py-2.5 px-3 font-medium text-center">快速異動</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMaterials.map(mat => {
                const isLow = mat.stockKg <= mat.safetyStockKg;
                const bagsCount = Math.floor(mat.stockKg / 25);
                const totalVal = mat.stockKg * mat.unitPrice;

                return (
                  <tr key={mat.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{mat.name}</div>
                      <div className="text-[11px] font-mono text-slate-500">{mat.code} · 批號 {mat.lotNumber}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700">{mat.grade}</td>
                    <td className="py-3 px-3 font-mono text-slate-600">{mat.type}</td>
                    <td className="py-3 px-3 text-right font-mono text-slate-700">{mat.density.toFixed(3)}</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {formatNum(mat.stockKg, 1)} kg
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-600">
                      {bagsCount} 包
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-slate-500">
                      {formatNum(mat.safetyStockKg, 0)} kg
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      <div className="text-slate-900 font-medium">NT$ {formatNum(totalVal, 0)}</div>
                      <div className="text-[10px] text-slate-500">NT$ {mat.unitPrice}/kg</div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {isLow ? (
                        <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center justify-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          需採購補料
                        </span>
                      ) : (
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[11px] font-medium flex items-center justify-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          正常充足
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedMaterialForAction(mat);
                            setActionMode('in');
                            setActionKg(500);
                            setActionRemark('採購進貨入庫');
                          }}
                          className="px-2 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded transition-colors"
                          title="進貨入庫"
                        >
                          + 入庫
                        </button>
                        <button
                          onClick={() => {
                            setSelectedMaterialForAction(mat);
                            setActionMode('out');
                            setActionKg(100);
                            setActionRemark('車間領料投料');
                          }}
                          className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                          title="領料出庫"
                        >
                          - 領料
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Section: Transaction Logs */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              原料出入庫與領料異動日誌 (Audit Logs)
            </h3>
            <p className="text-[11px] text-slate-500">
              記錄每一筆工單領料、採購進貨與盤點差異
            </p>
          </div>
          <span className="text-xs text-slate-500 font-mono">共 {logs.length} 筆歷程</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="py-2 px-3 font-medium">時間</th>
                <th className="py-2 px-3 font-medium">原料名稱</th>
                <th className="py-2 px-3 font-medium">異動類別</th>
                <th className="py-2 px-3 font-medium text-right">數量 (kg)</th>
                <th className="py-2 px-3 font-medium">關聯工單</th>
                <th className="py-2 px-3 font-medium">經手人員</th>
                <th className="py-2 px-3 font-medium">備註說明</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50">
                  <td className="py-2 px-3 font-mono text-slate-500 text-[11px]">{log.date}</td>
                  <td className="py-2 px-3 font-medium text-slate-900">{log.materialName}</td>
                  <td className="py-2 px-3">
                    {log.type === 'in' && (
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                        採購進貨
                      </span>
                    )}
                    {log.type === 'out' && (
                      <span className="text-slate-700 font-medium flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5 text-blue-600" />
                        工單領料
                      </span>
                    )}
                    {log.type === 'adjust' && (
                      <span className="text-amber-700 font-medium">盤點微調</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                    {log.type === 'in' ? `+${formatNum(log.quantityKg, 1)}` : `-${formatNum(log.quantityKg, 1)}`} kg
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-600">{log.orderNumber || '-'}</td>
                  <td className="py-2 px-3 text-slate-700">{log.operator}</td>
                  <td className="py-2 px-3 text-slate-500 text-[11px]">{log.remark}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Quick In/Out Action */}
      {selectedMaterialForAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">
                {actionMode === 'in' ? '原料進貨入庫' : actionMode === 'out' ? '車間工單領料' : '庫存盤點調整'}
              </h3>
              <button
                onClick={() => setSelectedMaterialForAction(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleExecuteAction} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-md border text-xs">
                <span className="text-slate-500 block">目前目標原料</span>
                <span className="font-semibold text-slate-900 block mt-0.5">
                  {selectedMaterialForAction.name} ({selectedMaterialForAction.grade})
                </span>
                <span className="text-slate-600 font-mono block mt-1">
                  現有在庫：{formatNum(selectedMaterialForAction.stockKg, 1)} kg (約 {Math.floor(selectedMaterialForAction.stockKg / 25)} 包)
                </span>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  異動數量 (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={actionKg}
                  onChange={e => setActionKg(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono font-bold border border-slate-200 rounded-md px-2.5 py-1.5 focus:border-slate-900 focus:outline-none"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  折合約 {(actionKg / 25).toFixed(1)} 包 (25kg 標準袋裝)
                </span>
              </div>

              {actionMode === 'out' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    關聯生產工單號 (選填)
                  </label>
                  <input
                    type="text"
                    value={actionOrderNo}
                    onChange={e => setActionOrderNo(e.target.value)}
                    className="w-full text-xs font-mono border border-slate-200 rounded-md px-2.5 py-1.5"
                    placeholder="例: PO-20261012-01"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    操作人員
                  </label>
                  <input
                    type="text"
                    value={actionOperator}
                    onChange={e => setActionOperator(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-md px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    事由備註
                  </label>
                  <input
                    type="text"
                    value={actionRemark}
                    onChange={e => setActionRemark(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-md px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMaterialForAction(null)}
                  className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-md"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs"
                >
                  確認異動並登記
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add New Material */}
      {isNewMatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl w-full max-w-lg overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900">新增 PE 塑料原料規格</h3>
              <button onClick={() => setIsNewMatOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewMaterial} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">料號代碼 *</label>
                  <input
                    type="text"
                    required
                    value={newMatForm.code}
                    onChange={e => setNewMatForm({ ...newMatForm, code: e.target.value })}
                    className="w-full text-xs font-mono border border-slate-200 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">材質類別</label>
                  <select
                    value={newMatForm.type}
                    onChange={e => {
                      const t = e.target.value as MaterialType;
                      setNewMatForm({
                        ...newMatForm,
                        type: t,
                        density: STANDARD_DENSITIES[t] || 0.920,
                      });
                    }}
                    className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white"
                  >
                    <option value="LDPE">LDPE 低密度聚乙烯</option>
                    <option value="HDPE">HDPE 高密度聚乙烯</option>
                    <option value="LLDPE">LLDPE 線性低密度聚乙烯</option>
                    <option value="PCR_PE">PCR 再生料聚乙烯</option>
                    <option value="MASTERBATCH">色母粒</option>
                    <option value="ADDITIVE">助劑母粒</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">原料名稱 *</label>
                  <input
                    type="text"
                    required
                    placeholder="例: LDPE 吹膜級 2426H"
                    value={newMatForm.name}
                    onChange={e => setNewMatForm({ ...newMatForm, name: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">規格牌號 / 廠牌</label>
                  <input
                    type="text"
                    placeholder="例: 台塑石化 2426H"
                    value={newMatForm.grade}
                    onChange={e => setNewMatForm({ ...newMatForm, grade: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">基準密度 (g/cm³)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={newMatForm.density}
                    onChange={e => setNewMatForm({ ...newMatForm, density: parseFloat(e.target.value) || 0.920 })}
                    className="w-full text-xs font-mono border border-slate-200 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">初期在庫 (kg)</label>
                  <input
                    type="number"
                    value={newMatForm.stockKg}
                    onChange={e => setNewMatForm({ ...newMatForm, stockKg: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-mono border border-slate-200 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">安全庫存線 (kg)</label>
                  <input
                    type="number"
                    value={newMatForm.safetyStockKg}
                    onChange={e => setNewMatForm({ ...newMatForm, safetyStockKg: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-mono border border-slate-200 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">單價 (NT$/kg)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={newMatForm.unitPrice}
                    onChange={e => setNewMatForm({ ...newMatForm, unitPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-mono border border-slate-200 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">供應商</label>
                  <input
                    type="text"
                    value={newMatForm.supplier}
                    onChange={e => setNewMatForm({ ...newMatForm, supplier: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">入庫批號</label>
                  <input
                    type="text"
                    value={newMatForm.lotNumber}
                    onChange={e => setNewMatForm({ ...newMatForm, lotNumber: e.target.value })}
                    className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewMatOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 rounded-md"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs"
                >
                  確認新增原料
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
