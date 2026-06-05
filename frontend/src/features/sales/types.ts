export interface SaleLineInput {
  product_id: string;
  qty: number;
  is_bundle?: boolean;
}

export interface CreateSaleInput {
  lines?: SaleLineInput[];
  amount?: number;
  tendered: number;
}

export interface SaleLine {
  id: string;
  product_id: string;
  product_name: string;
  barcode: string | null;
  qty: number;
  unit_price: number;
  line_total: number;
  is_bundle: boolean;
  bundle_qty: number | null;
  bundle_label: string | null;
  is_weighted: boolean;
  unit_label: string;
}

export interface Sale {
  id: string;
  store_id: string;
  cashier_id: string;
  cashier_name: string;
  subtotal: number;
  tendered: number;
  change: number;
  created_on: string;
  lines: SaleLine[];
}

export interface SaleSummary {
  id: string;
  subtotal: number;
  tendered: number;
  change: number;
  created_on: string;
  line_count: number;
}

export interface CashierStockItem {
  product_id: string;
  name: string;
  barcode: string | null;
  sell_price: number;
  qty: number;
  last_movement_at: string | null;
  bundle_qty: number | null;
  bundle_price: number | null;
  bundle_label: string | null;
  is_weighted: boolean;
  unit_label: string;
}
