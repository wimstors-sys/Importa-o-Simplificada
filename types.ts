
export interface ImportInputs {
  quantity: number;
  unitPriceUsd: number;
  freightUsd: number;
  exchangeRate: number;
  icmsRate: number; // Nova alíquota personalizável
  sellingPriceShopee: number;
  sellingPriceML: number;
}

export interface CalculationResult {
  declaredProductTotalBRL: number; // Valor dos produtos conforme a invoice (100% ou 30%)
  productTotalBRL: number; // Valor real total (sempre 100%)
  freightTotalBRL: number;
  customsValueBRL: number;
  importTaxBRL: number;
  icmsBRL: number;
  totalTaxesBRL: number;
  totalImportCostBRL: number;
  unitCostBRL: number;
}

export interface MarketplaceMargin {
  sellingPrice: number;
  feePercent: number;
  fixedFee: number;
  profit: number;
  marginPercent: number;
}

export enum Scenario {
  FULL = '100% Invoice',
  REDUCED = '30% Invoice'
}
