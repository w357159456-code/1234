import React, { useState, useMemo } from 'react';
import { 
  BagCalcInput, 
  RollCalcInput, 
  MaterialType, 
  Material 
} from '../types';
import { 
  STANDARD_DENSITIES, 
  MATERIAL_LABELS, 
  calculateBagUsage, 
  calculateRollUsage, 
  formatNum 
} from '../utils/peCalculations';
import { 
  Calculator as CalcIcon, 
  ArrowRight, 
  Scale, 
  Sparkles, 
  Layers, 
  Package, 
  Plus, 
  Trash2,
  Copy,
  Check
} from 'lucide-react';

interface CalculatorProps {
  materials: Material[];
  onConvertToOrder: (orderData: {
    productName: string;
    productType: 'bag' | 'roll' | 'custom';
    specs: any;
    targetQuantity: number;
    theoreticalTotalKg: number;
    recommendedFeedKg: number;
    recipe: Array<{ materialId: string; materialName: string; materialType: MaterialType; ratioPercent: number; plannedKg: number }>;
  }) => void;
}

export const Calculator: React.FC<CalculatorProps> = ({ materials, onConvertToOrder }) => {
  const [calcTab, setCalcTab] = useState<'bag' | 'roll' | 'recipe'>('bag');
  const [copied, setCopied] = useState(false);

  // --- BAG STATE ---
  const [bagInput, setBagInput] = useState<BagCalcInput>({
    bagType: 'flat',
    widthMm: 800,
    lengthMm: 1200,
    gussetMm: 150,
    thicknessMicron: 80,
    isDoubleLayer: true,
    materialType: 'LDPE',
    customDensity: 0.920,
    quantity: 5000,
    expectedLossRatePercent: 3.0,
  });

  // Thickness unit helper
  const [thicknessUnit, setThicknessUnit] = useState<'micron' | 'mm' | 'wire'>('micron'); // 1 wire (絲) = 10 micron = 0.01mm

  // --- ROLL STATE ---
  const [rollInput, setRollInput] = useState<RollCalcInput>({
    widthMm: 500,
    thicknessMicron: 40,
    materialType: 'LDPE',
    customDensity: 0.920,
    calcMode: 'by_length',
    lengthM: 1000,
    targetWeightKg: 18.4,
    rollsCount: 20,
    expectedLossRatePercent: 3.5,
  });

  // --- RECIPE BLEND STATE ---
  const [recipeTargetTotalKg, setRecipeTargetTotalKg] = useState<number>(1000);
  const [recipeRows, setRecipeRows] = useState<Array<{ materialId: string; ratioPercent: number }>>([
    { materialId: materials[2]?.id || 'mat-3', ratioPercent: 70 }, // LLDPE
    { materialId: materials[0]?.id || 'mat-1', ratioPercent: 25 }, // LDPE
    { materialId: materials[5]?.id || 'mat-6', ratioPercent: 5 },  // Additive
  ]);

  // Handle bag thickness change
  const handleThicknessChange = (val: number, unit: 'micron' | 'mm' | 'wire') => {
    let micron = val;
    if (unit === 'mm') micron = val * 1000;
    if (unit === 'wire') micron = val * 10;
    setBagInput(prev => ({ ...prev, thicknessMicron: micron }));
  };

  // Bag Results
  const bagResult = useMemo(() => {
    return calculateBagUsage(bagInput);
  }, [bagInput]);

  // Roll Results
  const rollResult = useMemo(() => {
    return calculateRollUsage(rollInput);
  }, [rollInput]);

  // Recipe Calculations
  const totalRatio = recipeRows.reduce((sum, r) => sum + (Number(r.ratioPercent) || 0), 0);
  const recipeCalculatedItems = useMemo(() => {
    return recipeRows.map(row => {
      const mat = materials.find(m => m.id === row.materialId);
      const plannedKg = Number(((recipeTargetTotalKg * (row.ratioPercent || 0)) / 100).toFixed(2));
      const bags25kg = Math.floor(plannedKg / 25);
      const remainderKg = Number((plannedKg % 25).toFixed(2));
      return {
        ...row,
        material: mat,
        plannedKg,
        bags25kg,
        remainderKg,
      };
    });
  }, [recipeRows, recipeTargetTotalKg, materials]);

  // Copy result summary
  const handleCopySummary = () => {
    let text = '';
    if (calcTab === 'bag') {
      text = `【PE袋用量計算】規格: ${bagInput.widthMm}x${bagInput.lengthMm}mm, 厚度: ${bagInput.thicknessMicron}μm, 數量: ${bagInput.quantity}個
單件淨重: ${bagResult.singleWeightG}g | 定額需求: ${bagResult.theoreticalTotalKg}kg | 建議投料(+${bagInput.expectedLossRatePercent}%): ${bagResult.recommendedFeedKg}kg (${Math.ceil(bagResult.recommendedFeedKg / 25)}包)`;
    } else if (calcTab === 'roll') {
      text = `【PE膜捲用量計算】規格: 寬${rollInput.widthMm}mm, 厚${rollInput.thicknessMicron}μm, 數量: ${rollInput.rollsCount}捲
單捲重: ${rollResult.singleRollWeightKg}kg, 長度: ${rollResult.resultLengthM}m | 總定額: ${rollResult.totalTheoreticalKg}kg | 建議投料: ${rollResult.recommendedFeedKg}kg`;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Trigger converting into work order
  const handleConvert = () => {
    if (calcTab === 'bag') {
      const selectedMat = materials.find(m => m.type === bagInput.materialType) || materials[0];
      onConvertToOrder({
        productName: `PE ${bagInput.bagType === 'flat' ? '平口袋' : '摺角袋'} ${bagInput.widthMm}x${bagInput.lengthMm}x${bagInput.thicknessMicron}μm`,
        productType: 'bag',
        specs: {
          widthMm: bagInput.widthMm,
          lengthMm: bagInput.lengthMm,
          thicknessMicron: bagInput.thicknessMicron,
          gussetMm: bagInput.gussetMm,
          density: bagResult.density,
        },
        targetQuantity: bagInput.quantity,
        theoreticalTotalKg: bagResult.theoreticalTotalKg,
        recommendedFeedKg: bagResult.recommendedFeedKg,
        recipe: [
          {
            materialId: selectedMat?.id || 'mat-1',
            materialName: selectedMat?.name || 'LDPE 原料',
            materialType: bagInput.materialType,
            ratioPercent: 100,
            plannedKg: bagResult.theoreticalTotalKg,
          }
        ],
      });
    } else if (calcTab === 'roll') {
      const selectedMat = materials.find(m => m.type === rollInput.materialType) || materials[0];
      onConvertToOrder({
        productName: `PE 膜捲 寬${rollInput.widthMm}mm x ${rollInput.thicknessMicron}μm x ${rollResult.resultLengthM}m`,
        productType: 'roll',
        specs: {
          widthMm: rollInput.widthMm,
          lengthMm: rollResult.resultLengthM * 1000,
          thicknessMicron: rollInput.thicknessMicron,
          density: rollResult.density,
        },
        targetQuantity: rollInput.rollsCount,
        theoreticalTotalKg: rollResult.totalTheoreticalKg,
        recommendedFeedKg: rollResult.recommendedFeedKg,
        recipe: [
          {
            materialId: selectedMat?.id || 'mat-1',
            materialName: selectedMat?.name || 'PE 原料',
            materialType: rollInput.materialType,
            ratioPercent: 100,
            plannedKg: rollResult.totalTheoreticalKg,
          }
        ],
      });
    } else {
      // Recipe mode
      onConvertToOrder({
        productName: `自訂配方混料批次 (${recipeTargetTotalKg}kg)`,
        productType: 'custom',
        specs: {
          widthMm: 0,
          lengthMm: 0,
          thicknessMicron: 0,
          density: 0.922,
        },
        targetQuantity: 1,
        theoreticalTotalKg: recipeTargetTotalKg,
        recommendedFeedKg: recipeTargetTotalKg * 1.03,
        recipe: recipeCalculatedItems.map(item => ({
          materialId: item.materialId,
          materialName: item.material?.name || 'PE原料',
          materialType: item.material?.type || 'LDPE',
          ratioPercent: item.ratioPercent,
          plannedKg: item.plannedKg,
        })),
      });
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden mb-8">
      {/* Header bar */}
      <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center">
            <CalcIcon className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              PE 定額用量與配方工程計算機
            </h2>
            <p className="text-xs text-slate-500">
              支援國際塑料標準體積密度換算、多層風琴展開、膜捲米數反算與配料批次拆解
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex items-center p-1 bg-slate-100 rounded-md">
          <button
            onClick={() => setCalcTab('bag')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              calcTab === 'bag'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            平口袋 / 摺邊袋
          </button>
          <button
            onClick={() => setCalcTab('roll')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              calcTab === 'roll'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            捲膜 / 吹膜捲料
          </button>
          <button
            onClick={() => setCalcTab('recipe')}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
              calcTab === 'recipe'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            配方混料配比
          </button>
        </div>
      </div>

      <div className="p-5 lg:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Input Area */}
        <div className="lg:col-span-7 space-y-4">
          {/* TAB 1: BAG FORM */}
          {calcTab === 'bag' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    袋型結構
                  </label>
                  <select
                    value={bagInput.bagType}
                    onChange={e => setBagInput({ ...bagInput, bagType: e.target.value as any })}
                    className="w-full text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:border-slate-900"
                  >
                    <option value="flat">平口袋 (二邊封/底封)</option>
                    <option value="gusset">側風琴摺邊袋 (立體袋)</option>
                    <option value="zipper">夾鏈密封袋</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    塑料材質 / 規格
                  </label>
                  <select
                    value={bagInput.materialType}
                    onChange={e => {
                      const type = e.target.value as MaterialType;
                      setBagInput({
                        ...bagInput,
                        materialType: type,
                        customDensity: STANDARD_DENSITIES[type] || 0.920,
                      });
                    }}
                    className="w-full text-xs border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:border-slate-900"
                  >
                    <option value="LDPE">LDPE 低密度 (0.920 g/cm³)</option>
                    <option value="HDPE">HDPE 高密度 (0.950 g/cm³)</option>
                    <option value="LLDPE">LLDPE 線性低密度 (0.922 g/cm³)</option>
                    <option value="PCR_PE">PCR 再生料 (0.928 g/cm³)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    基準密度 (g/cm³)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={bagInput.customDensity}
                    onChange={e => setBagInput({ ...bagInput, customDensity: parseFloat(e.target.value) || 0.920 })}
                    className="w-full text-xs font-mono border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-800 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Dimensions */}
              <div className="border border-slate-100 rounded-lg p-3.5 bg-slate-50/50 space-y-3">
                <div className="text-xs font-semibold text-slate-800 flex items-center justify-between">
                  <span>規格尺寸 (毫米 mm)</span>
                  <span className="text-[11px] text-slate-500 font-normal">以實體開口與長度計</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      袋寬 (Width mm)
                    </label>
                    <input
                      type="number"
                      value={bagInput.widthMm}
                      onChange={e => setBagInput({ ...bagInput, widthMm: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs font-mono border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-900 focus:outline-none focus:border-slate-900"
                      placeholder="例: 800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      袋長 (Length mm)
                    </label>
                    <input
                      type="number"
                      value={bagInput.lengthMm}
                      onChange={e => setBagInput({ ...bagInput, lengthMm: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs font-mono border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-900 focus:outline-none focus:border-slate-900"
                      placeholder="例: 1200"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      摺邊/風琴展開 (mm)
                    </label>
                    <input
                      type="number"
                      value={bagInput.gussetMm}
                      onChange={e => setBagInput({ ...bagInput, gussetMm: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs font-mono border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-900 focus:outline-none focus:border-slate-900"
                      placeholder="無則填 0"
                    />
                  </div>
                </div>

                {/* Thickness switch */}
                <div className="pt-2 border-t border-slate-200/60">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] text-slate-600 font-medium">
                      膜層厚度 (單層規格)
                    </label>
                    <div className="flex items-center gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setThicknessUnit('micron')}
                        className={`px-1.5 py-0.5 rounded ${thicknessUnit === 'micron' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        μm (微米)
                      </button>
                      <button
                        type="button"
                        onClick={() => setThicknessUnit('wire')}
                        className={`px-1.5 py-0.5 rounded ${thicknessUnit === 'wire' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        絲 / 條 (C)
                      </button>
                      <button
                        type="button"
                        onClick={() => setThicknessUnit('mm')}
                        className={`px-1.5 py-0.5 rounded ${thicknessUnit === 'mm' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        mm (毫米)
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="relative">
                      <input
                        type="number"
                        step={thicknessUnit === 'mm' ? '0.001' : '1'}
                        value={
                          thicknessUnit === 'micron' 
                            ? bagInput.thicknessMicron 
                            : thicknessUnit === 'wire' 
                              ? bagInput.thicknessMicron / 10 
                              : bagInput.thicknessMicron / 1000
                        }
                        onChange={e => handleThicknessChange(parseFloat(e.target.value) || 0, thicknessUnit)}
                        className="w-full text-xs font-mono border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-900 focus:outline-none focus:border-slate-900"
                      />
                      <span className="absolute right-2.5 top-2 text-[11px] text-slate-400">
                        {thicknessUnit === 'micron' ? 'μm' : thicknessUnit === 'wire' ? '絲 (C)' : 'mm'}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center">
                      換算：{bagInput.thicknessMicron} μm = {(bagInput.thicknessMicron / 1000).toFixed(3)} mm = {(bagInput.thicknessMicron / 10).toFixed(1)} 絲
                    </div>
                  </div>
                </div>
              </div>

              {/* Order quantity & Loss rate */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    計劃生產數量 (只/個 pcs)
                  </label>
                  <input
                    type="number"
                    value={bagInput.quantity}
                    onChange={e => setBagInput({ ...bagInput, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs font-mono border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-900 focus:outline-none focus:border-slate-900 font-semibold"
                    placeholder="例: 5000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    預期製程損耗率 (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={bagInput.expectedLossRatePercent}
                    onChange={e => setBagInput({ ...bagInput, expectedLossRatePercent: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-mono border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-900 focus:outline-none focus:border-slate-900"
                    placeholder="例: 3.0"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    業界經驗：平口袋 2~3%、立體/印字袋 3~5%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ROLL FORM */}
          {calcTab === 'roll' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    膜捲寬度 (mm)
                  </label>
                  <input
                    type="number"
                    value={rollInput.widthMm}
                    onChange={e => setRollInput({ ...rollInput, widthMm: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-mono border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-900 focus:outline-none focus:border-slate-900"
                    placeholder="例: 500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    膜厚 (μm 微米)
                  </label>
                  <input
                    type="number"
                    value={rollInput.thicknessMicron}
                    onChange={e => setRollInput({ ...rollInput, thicknessMicron: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-mono border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-900 focus:outline-none focus:border-slate-900"
                    placeholder="例: 40"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    塑料密度 (g/cm³)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={rollInput.customDensity}
                    onChange={e => setRollInput({ ...rollInput, customDensity: parseFloat(e.target.value) || 0.920 })}
                    className="w-full text-xs font-mono border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Mode switch */}
              <div className="border border-slate-100 rounded-lg p-3.5 bg-slate-50/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800">
                    計算模式
                  </span>
                  <div className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded">
                    <button
                      type="button"
                      onClick={() => setRollInput({ ...rollInput, calcMode: 'by_length' })}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${
                        rollInput.calcMode === 'by_length' ? 'bg-white text-slate-900 shadow-xs font-medium' : 'text-slate-600'
                      }`}
                    >
                      依長度 (米數) 求重量
                    </button>
                    <button
                      type="button"
                      onClick={() => setRollInput({ ...rollInput, calcMode: 'by_weight' })}
                      className={`px-2.5 py-1 text-xs rounded transition-colors ${
                        rollInput.calcMode === 'by_weight' ? 'bg-white text-slate-900 shadow-xs font-medium' : 'text-slate-600'
                      }`}
                    >
                      依重量 (kg) 反算米數
                    </button>
                  </div>
                </div>

                {rollInput.calcMode === 'by_length' ? (
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      單捲設定長度 (米 m)
                    </label>
                    <input
                      type="number"
                      value={rollInput.lengthM}
                      onChange={e => setRollInput({ ...rollInput, lengthM: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs font-mono border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-900 focus:outline-none focus:border-slate-900"
                      placeholder="例: 1000"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">
                      單捲目標淨重 (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={rollInput.targetWeightKg}
                      onChange={e => setRollInput({ ...rollInput, targetWeightKg: parseFloat(e.target.value) || 0 })}
                      className="w-full text-xs font-mono border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-900 focus:outline-none focus:border-slate-900"
                      placeholder="例: 18.4"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    總捲數 (Rolls)
                  </label>
                  <input
                    type="number"
                    value={rollInput.rollsCount}
                    onChange={e => setRollInput({ ...rollInput, rollsCount: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs font-mono border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-900 focus:outline-none focus:border-slate-900 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    預期吹膜損耗率 (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={rollInput.expectedLossRatePercent}
                    onChange={e => setRollInput({ ...rollInput, expectedLossRatePercent: parseFloat(e.target.value) || 0 })}
                    className="w-full text-xs font-mono border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-900 focus:outline-none focus:border-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RECIPE BLENDING */}
          {calcTab === 'recipe' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    總投料目標批量 (kg)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={recipeTargetTotalKg}
                      onChange={e => setRecipeTargetTotalKg(parseFloat(e.target.value) || 0)}
                      className="w-48 text-xs font-mono font-semibold border border-slate-200 rounded-md px-2.5 py-1.5 bg-white text-slate-900 focus:outline-none focus:border-slate-900"
                    />
                    <span className="text-xs text-slate-500">
                      折合約 {Math.ceil(recipeTargetTotalKg / 25)} 包 (25kg 原包)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setRecipeRows([...recipeRows, { materialId: materials[0]?.id || '', ratioPercent: 0 }]);
                  }}
                  className="inline-flex items-center gap-1 text-xs text-slate-700 hover:text-slate-900 font-medium border border-slate-200 rounded px-2.5 py-1.5 hover:bg-slate-50"
                >
                  <Plus className="w-3.5 h-3.5" />
                  新增原料配比
                </button>
              </div>

              {/* Recipe rows table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2 px-3 text-left font-medium">原料成分</th>
                      <th className="py-2 px-3 text-right font-medium w-24">配比 (%)</th>
                      <th className="py-2 px-3 text-right font-medium w-28">計算投料量</th>
                      <th className="py-2 px-3 text-right font-medium w-32">原裝拆解 (25kg)</th>
                      <th className="py-2 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recipeCalculatedItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3">
                          <select
                            value={item.materialId}
                            onChange={e => {
                              const newRows = [...recipeRows];
                              newRows[idx].materialId = e.target.value;
                              setRecipeRows(newRows);
                            }}
                            className="w-full text-xs border border-slate-200 rounded px-2 py-1 bg-white text-slate-800"
                          >
                            {materials.map(m => (
                              <option key={m.id} value={m.id}>
                                {m.name} ({m.grade})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <input
                              type="number"
                              step="0.5"
                              value={item.ratioPercent}
                              onChange={e => {
                                const newRows = [...recipeRows];
                                newRows[idx].ratioPercent = parseFloat(e.target.value) || 0;
                                setRecipeRows(newRows);
                              }}
                              className="w-16 text-right font-mono text-xs border border-slate-200 rounded px-1.5 py-1"
                            />
                            <span className="text-slate-400">%</span>
                          </div>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-medium text-slate-900">
                          {formatNum(item.plannedKg, 1)} kg
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-[11px] text-slate-600">
                          {item.bags25kg} 包 + {item.remainderKg} kg
                        </td>
                        <td className="py-2 px-2 text-center">
                          {recipeRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setRecipeRows(recipeRows.filter((_, i) => i !== idx));
                              }}
                              className="text-slate-400 hover:text-rose-600 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Ratio check indicator */}
              <div className="flex items-center justify-between text-xs px-2 py-1">
                <span className="text-slate-500">配比總計</span>
                <span className={`font-mono font-bold ${
                  Math.abs(totalRatio - 100) < 0.01 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {totalRatio.toFixed(1)}% {Math.abs(totalRatio - 100) >= 0.01 && '(需等於 100%)'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right Output Results Card */}
        <div className="lg:col-span-5 bg-slate-900 text-white rounded-lg p-5 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold tracking-wide text-slate-200 uppercase">
                  計算成果與投料定額
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopySummary}
                className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? '已複製' : '複製摘要'}
              </button>
            </div>

            {/* BAG RESULTS VIEW */}
            {calcTab === 'bag' && (
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">單個理論淨重 (Net Weight)</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold font-mono text-emerald-400 tracking-tight">
                      {bagResult.singleWeightG}
                    </span>
                    <span className="text-xs text-slate-300">g / 只</span>
                    <span className="text-xs text-slate-400 font-mono ml-auto">
                      ({formatNum(bagResult.singleWeightG, 2)} kg/千只)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-0.5">理論定額需求量</span>
                    <div className="text-lg font-bold font-mono text-slate-100">
                      {formatNum(bagResult.theoreticalTotalKg, 1)} <span className="text-xs font-normal text-slate-400">kg</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block mb-0.5">建議投料 (含{bagInput.expectedLossRatePercent}%損耗)</span>
                    <div className="text-lg font-bold font-mono text-amber-300">
                      {formatNum(bagResult.recommendedFeedKg, 1)} <span className="text-xs font-normal text-slate-400">kg</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">原裝拆袋建議</span>
                    <span className="font-mono text-slate-200">
                      {Math.ceil(bagResult.recommendedFeedKg / 25)} 包 (25kg/包)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">每公斤出袋個數</span>
                    <span className="font-mono text-slate-200">
                      約 {bagResult.piecesPerKg} 只 / kg
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">平米克重</span>
                    <span className="font-mono text-slate-200">
                      {bagResult.gramPerSqm} g/m²
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">計算採用密度</span>
                    <span className="font-mono text-slate-200">
                      {bagResult.density} g/cm³
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ROLL RESULTS VIEW */}
            {calcTab === 'roll' && (
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">
                    {rollInput.calcMode === 'by_length' ? '單捲理論重量' : '單捲收捲預估米數'}
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold font-mono text-emerald-400 tracking-tight">
                      {rollInput.calcMode === 'by_length' 
                        ? `${rollResult.singleRollWeightKg} kg` 
                        : `${formatNum(rollResult.resultLengthM, 0)} m`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-0.5">總理論定額 (淨料)</span>
                    <div className="text-lg font-bold font-mono text-slate-100">
                      {formatNum(rollResult.totalTheoreticalKg, 1)} <span className="text-xs font-normal text-slate-400">kg</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] text-slate-400 block mb-0.5">建議投料 (含{rollInput.expectedLossRatePercent}%損耗)</span>
                    <div className="text-lg font-bold font-mono text-amber-300">
                      {formatNum(rollResult.recommendedFeedKg, 1)} <span className="text-xs font-normal text-slate-400">kg</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px]">每米膜重 (kg/m)</span>
                    <span className="font-mono text-slate-200">
                      {rollResult.weightPerMeterKg} kg/m
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">備料包數</span>
                    <span className="font-mono text-slate-200">
                      {Math.ceil(rollResult.recommendedFeedKg / 25)} 包 (25kg/包)
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">平米克重</span>
                    <span className="font-mono text-slate-200">
                      {rollResult.gramPerSqm} g/m²
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">總生產捲數</span>
                    <span className="font-mono text-slate-200">
                      {rollResult.rollsCount} 捲
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* RECIPE RESULTS VIEW */}
            {calcTab === 'recipe' && (
              <div className="space-y-4">
                <div>
                  <span className="text-[11px] text-slate-400 block mb-0.5">配方批次總量</span>
                  <div className="text-3xl font-bold font-mono text-emerald-400 tracking-tight">
                    {formatNum(recipeTargetTotalKg, 1)} <span className="text-sm font-normal text-slate-300">kg</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <span className="text-[11px] text-slate-400 block">各料投入清單：</span>
                  {recipeCalculatedItems.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 truncate max-w-[150px]">
                        {item.material?.name || '原料'} ({item.ratioPercent}%)
                      </span>
                      <span className="font-mono text-emerald-300 font-semibold">
                        {item.plannedKg} kg ({item.bags25kg}包 + {item.remainderKg}kg)
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action: Create Work Order directly from this calculation */}
          <div className="pt-5 mt-4 border-t border-slate-800">
            <button
              onClick={handleConvert}
              className="w-full py-2.5 px-4 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>轉換並建立正式生產工單</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <p className="text-[10px] text-slate-400 text-center mt-2">
              自動將計算尺寸、定額用量與配比導入工單系統
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
