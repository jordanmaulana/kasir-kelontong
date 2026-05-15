export interface Product {
  id: string;
  barcode: string | null;
  name: string;
  sell_price: number;
  bundle_qty: number | null;
  bundle_price: number | null;
  bundle_label: string | null;
  is_weighted: boolean;
  unit_label: string;
  created_on: string;
  updated_on: string;
}

export interface ProductInput {
  barcode?: string | null;
  name: string;
  sell_price: number;
  bundle_qty?: number | null;
  bundle_price?: number | null;
  bundle_label?: string | null;
  is_weighted?: boolean;
  unit_label?: string;
  initial_store_id?: string;
  initial_qty?: number;
}
