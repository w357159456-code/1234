export type MaterialType = 'LDPE' | 'HDPE' | 'LLDPE' | 'PCR_PE' | 'MASTERBATCH' | 'ADDITIVE';

export interface Material {
  id: string;
  code: string;
  name: string;
  type: MaterialType;
  grade: string; // e.g. "吹膜級 2426H"
  density: number; // g/cm³ (e.g. 0.920)
  stockKg: number;
  safetyStockKg: number;
  unitPrice: number; // NT$/kg
  supplier: string;
  lotNumber: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'in_progress' | 'completed' | 'abnormal';

export interface RecipeItem {
  materialId: string;
  materialName: string;
  materialType: MaterialType;
  ratioPercent: number; // e.g. 70 (%)
  plannedKg: number;
}

export type ScrapReason = 
  | '調機開機損耗' // Setup / calibration scrap
  | '邊料修邊裁切' // Trimming / edge strip
  | '厚薄不均超差' // Gauge variation
  | '斷膜破膜' // Film breakage / bubble collapse
  | '晶點魚眼不良' // Gel / fish eye defect
  | '印刷封口不良' // Sealing / printing failure
  | '其他異常';

export interface ProductionOrder {
  id: string;
  orderNumber: string; // e.g. "PO-20261012-01"
  productName: string; // e.g. "重包裝 PE 防潮袋 800x1200x0.08mm"
  productType: 'bag' | 'roll' | 'custom';
  machineId: string; // e.g. "吹膜 1 號機", "制袋 2 號機"
  targetQuantity: number; // pcs or rolls
  unit: 'pcs' | 'rolls' | 'kg';
  
  // Spec details
  specs: {
    widthMm: number; // 寬度 mm
    lengthMm: number; // 長度 mm
    thicknessMicron: number; // 厚度 μm (micron)
    gussetMm?: number; // 摺邊/折角 mm
    density: number; // g/cm³
    layers?: number; // 1 or 2
  };

  // Recipe
  recipe: RecipeItem[];

  // Quantities & Material Weights
  singleTheoreticalWeightG: number; // 單件理論淨重 (g)
  theoreticalTotalKg: number; // 理論定額總重 (kg)
  actualIssuedKg: number; // 實際領料/投料 (kg)
  finishedGoodKg: number; // 良品成品重 (kg)
  scrapKg: number; // 報廢/邊料重 (kg)
  
  // Calculations
  scrapRate: number; // 損耗率 % = (actualIssuedKg - finishedGoodKg) / actualIssuedKg * 100
  varianceKg: number; // 用量偏差 = actualIssuedKg - theoreticalTotalKg
  varianceRate: number; // 偏差率 %
  
  primaryScrapReason?: ScrapReason;
  status: OrderStatus;
  operator: string;
  createdAt: string;
  completedAt?: string;
  notes?: string;
}

export interface InventoryLog {
  id: string;
  materialId: string;
  materialName: string;
  type: 'in' | 'out' | 'adjust';
  quantityKg: number;
  orderNumber?: string;
  operator: string;
  date: string;
  remark: string;
}

export interface BagCalcInput {
  bagType: 'flat' | 'gusset' | 'zipper';
  widthMm: number;
  lengthMm: number;
  gussetMm: number;
  thicknessMicron: number;
  isDoubleLayer: boolean;
  materialType: MaterialType;
  customDensity?: number;
  quantity: number;
  expectedLossRatePercent: number; // e.g. 2.5%
}

export interface RollCalcInput {
  widthMm: number;
  thicknessMicron: number;
  materialType: MaterialType;
  customDensity?: number;
  calcMode: 'by_length' | 'by_weight';
  lengthM: number;
  targetWeightKg: number;
  rollsCount: number;
  expectedLossRatePercent: number;
}
