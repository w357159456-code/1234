import React, { useState, useEffect } from 'react';
import { ProductionOrder, Material, RecipeItem, MaterialType } from '../types';
import { STANDARD_DENSITIES, calculateBagUsage, calculateRollUsage } from '../utils/peCalculations';
import { X, Plus, Trash2 } from 'lucide-react';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (order: ProductionOrder) => void;
  materials: Material[];
  initialData?: Partial<ProductionOrder> | null;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  materials,
  initialData,
}) => {
  if (!isOpen) return null;

  const defaultMat = materials[0];

  const [orderNumber, setOrderNumber] = useState<string>(
    initialData?.orderNumber || `PO-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(10 + Math.random() * 90)}`
  );
  const [productName, setProductName] = useState<string>(initialData?.productName || 'PE 透明平口袋 400x600x0.05mm');
  const [productType, setProductType] = useState<'bag' | 'roll' | 'custom'>(initialData?.productType || 'bag');
  const [machineId, setMachineId] = useState<string>(initialData?.machineId || '吹膜 1 號機');
  const [targetQuantity, setTargetQuantity] = useState<number>(initialData?.targetQuantity || 10000);
  const [unit, setUnit] = useState<'pcs' | 'rolls' | 'kg'>(initialData?.unit || 'pcs');

  // Specs
  const [widthMm, setWidthMm] = useState<number>(initialData?.specs?.widthMm ?? 400);
  const [lengthMm, setLengthMm] = useState<number>(initialData?.specs?.lengthMm ?? 600);
  const [thicknessMicron, setThicknessMicron] = useState<number>(initialData?.specs?.thicknessMicron ?? 50);
  const [gussetMm, setGussetMm] = useState<number>(initialData?.specs?.gussetMm ?? 0);
  const [density, setDensity] = useState<number>(initialData?.specs?.density ?? 0.920);

  // Recipe
  const [recipe, setRecipe] = useState<RecipeItem[]>(
    initialData?.recipe || [
      {
        materialId: defaultMat?.id || 'mat-1',
        materialName: defaultMat?.name || 'LDPE 吹膜級原料',
        materialType: defaultMat?.type || 'LDPE',
        ratioPercent: 100,
        plannedKg: 0,
      },
    ]
  );

  const [operator, setOperator] = useState<string>(initialData?.operator || '林組長');
  const [notes, setNotes] = useState<string>(initialData?.notes || '');

  // Calculate single theoretical weight
  let singleWeightG = 0;
  let theoreticalTotalKg = 0;

  if (productType === 'bag') {
    const bagCalc = calculateBagUsage({
      bagType: gussetMm > 0 ? 'gusset' : 'flat',
      widthMm,
      lengthMm,
      gussetMm,
      thicknessMicron,
      isDoubleLayer: true,
      materialType: 'LDPE',
      customDensity: density,
      quantity: targetQuantity,
      expectedLossRatePercent: 0,
    });
    singleWeightG = bagCalc.singleWeightG;
    theoreticalTotalKg = bagCalc.theoreticalTotalKg;
  } else if (productType === 'roll') {
    const rollCalc = calculateRollUsage({
      widthMm,
      thicknessMicron,
      materialType: 'LDPE',
      customDensity: density,
      calcMode: 'by_length',
      lengthM: lengthMm > 0 ? lengthMm / 1000 : 1000,
      targetWeightKg: 0,
      rollsCount: targetQuantity,
      expectedLossRatePercent: 0,
    });
    singleWeightG = rollCalc.singleRollWeightKg * 1000;
    theoreticalTotalKg = rollCalc.totalTheoreticalKg;
  } else {
    // Custom
    theoreticalTotalKg = initialData?.theoreticalTotalKg || targetQuantity;
    singleWeightG = targetQuantity > 0 ? (theoreticalTotalKg * 1000) / targetQuantity : 0;
  }

  // Update plannedKg for recipe items
  const updatedRecipe = recipe.map(item => ({
    ...item,
    plannedKg: Number(((theoreticalTotalKg * (item.ratioPercent || 0)) / 100).toFixed(2)),
  }));

  const handleRecipeMaterialChange = (index: number, matId: string) => {
    const mat = materials.find(m => m.id === matId);
    if (!mat) return;
    const newRecipe = [...recipe];
    newRecipe[index] = {
      ...newRecipe[index],
      materialId: mat.id,
      materialName: mat.name,
      materialType: mat.type,
    };
    setRecipe(newRecipe);
  };

  const handleRatioChange = (index: number, ratio: number) => {
    const newRecipe = [...recipe];
    newRecipe[index].ratioPercent = ratio;
    setRecipe(newRecipe);
  };

  const addRecipeRow = () => {
    setRecipe([
      ...recipe,
      {
        materialId: defaultMat?.id || '',
        materialName: defaultMat?.name || '',
        materialType: defaultMat?.type || 'LDPE',
        ratioPercent: 0,
        plannedKg: 0,
      },
    ]);
  };

  const removeRecipeRow = (index: number) => {
    if (recipe.length <= 1) return;
    setRecipe(recipe.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newOrder: ProductionOrder = {
      id: initialData?.id || `order-${Date.now()}`,
      orderNumber,
      productName,
      productType,
      machineId,
      targetQuantity,
      unit: productType === 'bag' ? 'pcs' : productType === 'roll' ? 'rolls' : unit,
      specs: {
        widthMm,
        lengthMm,
        thicknessMicron,
        gussetMm,
        density,
      },
      recipe: updatedRecipe,
      singleTheoreticalWeightG: Number(singleWeightG.toFixed(2)),
      theoreticalTotalKg: Number(theoreticalTotalKg.toFixed(2)),
      actualIssuedKg: initialData?.actualIssuedKg || 0,
      finishedGoodKg: initialData?.finishedGoodKg || 0,
      scrapKg: initialData?.scrapKg || 0,
      scrapRate: initialData?.scrapRate || 0,
      varianceKg: initialData?.varianceKg || 0,
      varianceRate: initialData?.varianceRate || 0,
      status: initialData?.status || 'pending',
      operator,
      createdAt: initialData?.createdAt || new Date().toISOString().slice(0, 16).replace('T', ' '),
      notes,
    };

    onSave(newOrder);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-lg shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {initialData?.id ? '編輯生產工單' : '建立新 PE 生產工單'}
            </h3>
            <p className="text-xs text-slate-500">
              輸入產品規格，系統自動計算單件克重、理論定額用量與配比
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Row 1: Order Number & Machine */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                工單編號 *
              </label>
              <input
                type="text"
                required
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value)}
                className="w-full text-xs font-mono font-medium border border-slate-200 rounded-md px-2.5 py-1.5 focus:border-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                產線 / 機台 *
              </label>
              <select
                value={machineId}
                onChange={e => setMachineId(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-800"
              >
                <option value="吹膜 1 號機">吹膜 1 號機 (三層共擠)</option>
                <option value="吹膜 2 號機">吹膜 2 號機 (單層高速)</option>
                <option value="吹膜 3 號機">吹膜 3 號機 (重載再生)</option>
                <option value="制袋 1 號機">制袋 1 號機 (底封熱切)</option>
                <option value="制袋 2 號機">制袋 2 號機 (夾鏈側封)</option>
                <option value="制袋 3 號機">制袋 3 號機 (防靜電平口)</option>
                <option value="流延纏繞機組">流延纏繞膜機組</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                工單類別
              </label>
              <select
                value={productType}
                onChange={e => {
                  const pt = e.target.value as any;
                  setProductType(pt);
                  setUnit(pt === 'bag' ? 'pcs' : pt === 'roll' ? 'rolls' : 'kg');
                }}
                className="w-full text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-800"
              >
                <option value="bag">PE 袋 (平口袋/立體袋)</option>
                <option value="roll">PE 膜捲 (吹膜/收縮膜)</option>
                <option value="custom">自訂批次/混料</option>
              </select>
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              產品品名與規格描述 *
            </label>
            <input
              type="text"
              required
              value={productName}
              onChange={e => setProductName(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-md px-2.5 py-1.5 focus:border-slate-900 focus:outline-none"
              placeholder="例如: 重包裝防潮立體袋 800x1200x0.08mm"
            />
          </div>

          {/* Specifications Grid */}
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-md space-y-2">
            <span className="text-xs font-semibold text-slate-800 block">
              物理規格與目標數量
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">
                  寬度 (mm)
                </label>
                <input
                  type="number"
                  value={widthMm}
                  onChange={e => setWidthMm(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono border border-slate-200 rounded px-2 py-1 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">
                  {productType === 'bag' ? '長度 (mm)' : '膜長 (mm, 1000m=1e6)'}
                </label>
                <input
                  type="number"
                  value={lengthMm}
                  onChange={e => setLengthMm(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono border border-slate-200 rounded px-2 py-1 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">
                  厚度 (μm)
                </label>
                <input
                  type="number"
                  value={thicknessMicron}
                  onChange={e => setThicknessMicron(parseFloat(e.target.value) || 0)}
                  className="w-full text-xs font-mono border border-slate-200 rounded px-2 py-1 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">
                  密度 (g/cm³)
                </label>
                <input
                  type="number"
                  step="0.001"
                  value={density}
                  onChange={e => setDensity(parseFloat(e.target.value) || 0.920)}
                  className="w-full text-xs font-mono border border-slate-200 rounded px-2 py-1 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">
                  計劃生產量 ({unit}) *
                </label>
                <input
                  type="number"
                  required
                  value={targetQuantity}
                  onChange={e => setTargetQuantity(parseInt(e.target.value) || 0)}
                  className="w-full text-xs font-mono font-bold border border-slate-200 rounded px-2 py-1 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">
                  單件理論淨重
                </label>
                <div className="text-xs font-mono font-medium py-1 text-slate-800">
                  {singleWeightG.toFixed(2)} g / {unit === 'rolls' ? '捲' : '個'}
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-slate-600 mb-1">
                  理論定額總需求
                </label>
                <div className="text-xs font-mono font-bold py-1 text-emerald-600">
                  {theoreticalTotalKg.toFixed(2)} kg
                </div>
              </div>
            </div>
          </div>

          {/* Recipe Allocation */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-800">
                投料原料配比設定 (Recipe)
              </label>
              <button
                type="button"
                onClick={addRecipeRow}
                className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900 font-medium px-2 py-1 border border-slate-200 rounded"
              >
                <Plus className="w-3 h-3" />
                新增原料
              </button>
            </div>

            <div className="border border-slate-200 rounded-md overflow-hidden text-xs">
              <table className="w-full">
                <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <tr>
                    <th className="py-1.5 px-3 text-left font-medium">原料規格</th>
                    <th className="py-1.5 px-3 text-right font-medium w-24">比例 (%)</th>
                    <th className="py-1.5 px-3 text-right font-medium w-28">定額重量</th>
                    <th className="py-1.5 px-2 text-center w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recipe.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-1.5 px-3">
                        <select
                          value={item.materialId}
                          onChange={e => handleRecipeMaterialChange(idx, e.target.value)}
                          className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-white"
                        >
                          {materials.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} ({m.grade})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-1.5 px-3 text-right">
                        <input
                          type="number"
                          step="0.5"
                          value={item.ratioPercent}
                          onChange={e => handleRatioChange(idx, parseFloat(e.target.value) || 0)}
                          className="w-16 text-right font-mono text-xs border border-slate-200 rounded px-1.5 py-1"
                        />
                      </td>
                      <td className="py-1.5 px-3 text-right font-mono text-slate-700">
                        {((theoreticalTotalKg * (item.ratioPercent || 0)) / 100).toFixed(1)} kg
                      </td>
                      <td className="py-1.5 px-2 text-center">
                        {recipe.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeRecipeRow(idx)}
                            className="text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operator and Notes */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                開單責任人 / 班長
              </label>
              <input
                type="text"
                value={operator}
                onChange={e => setOperator(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                備註說明
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded px-2.5 py-1.5"
                placeholder="特殊配方要求或包裝指示"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-md"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs"
            >
              確認發布工單
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
