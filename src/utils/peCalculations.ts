import { MaterialType, BagCalcInput, RollCalcInput } from '../types';

export const STANDARD_DENSITIES: Record<MaterialType, number> = {
  LDPE: 0.920,
  HDPE: 0.950,
  LLDPE: 0.922,
  PCR_PE: 0.928,
  MASTERBATCH: 1.250,
  ADDITIVE: 0.980,
};

export const MATERIAL_LABELS: Record<MaterialType, string> = {
  LDPE: '低密度聚乙烯 (LDPE)',
  HDPE: '高密度聚乙烯 (HDPE)',
  LLDPE: '線性低密度聚乙烯 (LLDPE)',
  PCR_PE: '消費後再生聚乙烯 (PCR-PE)',
  MASTERBATCH: '色母料 (Masterbatch)',
  ADDITIVE: '功能助劑 (滑劑/抗靜電/UV)',
};

/**
 * 計算平口袋 / 摺邊袋單個理論重量與總量
 */
export function calculateBagUsage(input: BagCalcInput) {
  const density = input.customDensity || STANDARD_DENSITIES[input.materialType] || 0.920;
  
  // 尺寸轉換成 cm
  // 袋子總展開周長/寬度考慮：平口袋雙層 (寬度 * 2) + 側邊風琴摺 (折角 * 2)
  const widthCm = input.widthMm / 10;
  const lengthCm = input.lengthMm / 10;
  const gussetCm = (input.gussetMm || 0) / 10;
  
  // 厚度轉成 cm: 1 μm (微米) = 0.0001 cm
  const thicknessCm = input.thicknessMicron / 10000;
  
  // 雙層袋體表面積計算： (寬度 + 風琴展開) * 2 * 長度
  // 體積 (cm³) = (widthCm + gussetCm) * 2 * lengthCm * thicknessCm
  const singleVolumeCm3 = (widthCm + gussetCm) * 2 * lengthCm * thicknessCm;
  
  // 單件理論淨重 (g)
  const singleWeightG = singleVolumeCm3 * density;
  
  // 總理論重量 (kg)
  const theoreticalTotalKg = (singleWeightG * input.quantity) / 1000;
  
  // 考慮工藝損耗後的建議投料量 (kg)
  const lossMultiplier = 1 + (input.expectedLossRatePercent / 100);
  const recommendedFeedKg = theoreticalTotalKg * lossMultiplier;
  
  // 每公斤產出個數 (pcs/kg)
  const piecesPerKg = singleWeightG > 0 ? 1000 / singleWeightG : 0;
  
  // 每平方米克重 (g/m²)
  const gramPerSqm = input.thicknessMicron * density;

  return {
    density,
    singleWeightG: Number(singleWeightG.toFixed(3)),
    theoreticalTotalKg: Number(theoreticalTotalKg.toFixed(2)),
    recommendedFeedKg: Number(recommendedFeedKg.toFixed(2)),
    piecesPerKg: Math.floor(piecesPerKg),
    gramPerSqm: Number(gramPerSqm.toFixed(1)),
    weightPer1000PcsKg: Number((singleWeightG).toFixed(2)),
  };
}

/**
 * 計算捲膜 / 吹膜捲料用量與米數反算
 */
export function calculateRollUsage(input: RollCalcInput) {
  const density = input.customDensity || STANDARD_DENSITIES[input.materialType] || 0.920;
  
  // 每米重量 (kg/m) = (寬度 mm / 1000) * (厚度 μm / 1,000,000) * (密度 g/cm³ * 1000)
  // 簡化：widthMm * thicknessMicron * density / 1,000,000
  const weightPerMeterKg = (input.widthMm * input.thicknessMicron * density) / 1000000;
  
  let resultLengthM = input.lengthM;
  let singleRollWeightKg = 0;
  let totalTheoreticalKg = 0;

  if (input.calcMode === 'by_length') {
    singleRollWeightKg = weightPerMeterKg * input.lengthM;
    totalTheoreticalKg = singleRollWeightKg * input.rollsCount;
  } else {
    // 依目標重量反算長度
    singleRollWeightKg = input.targetWeightKg;
    resultLengthM = weightPerMeterKg > 0 ? input.targetWeightKg / weightPerMeterKg : 0;
    totalTheoreticalKg = singleRollWeightKg * input.rollsCount;
  }

  const lossMultiplier = 1 + (input.expectedLossRatePercent / 100);
  const recommendedFeedKg = totalTheoreticalKg * lossMultiplier;
  const gramPerSqm = input.thicknessMicron * density;

  return {
    density,
    weightPerMeterKg: Number(weightPerMeterKg.toFixed(4)),
    singleRollWeightKg: Number(singleRollWeightKg.toFixed(2)),
    resultLengthM: Math.round(resultLengthM),
    totalTheoreticalKg: Number(totalTheoreticalKg.toFixed(2)),
    recommendedFeedKg: Number(recommendedFeedKg.toFixed(2)),
    gramPerSqm: Number(gramPerSqm.toFixed(1)),
    rollsCount: input.rollsCount,
  };
}

/**
 * 格式化數值保留固定小數
 */
export function formatNum(val: number, decimals: number = 2): string {
  if (isNaN(val) || val === null || val === undefined) return '0';
  return val.toLocaleString('zh-TW', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}
