export type StockReason = "receiving" | "sale" | "adjustment" | "void";

export interface StockItem {
  product_id: string;
  name: string;
  barcode: string | null;
  sell_price: number;
  qty: number;
  last_movement_at: string | null;
}

export interface StockMovement {
  id: string;
  product_id: string;
  product_name: string;
  barcode: string | null;
  delta: number;
  reason: StockReason;
  note: string;
  ref_type: string;
  ref_id: string;
  actor_email: string | null;
  created_on: string;
}

export interface ReceivingItemInput {
  product_id: string;
  qty: number;
  note?: string;
}

export interface ReceivingInput {
  items: ReceivingItemInput[];
}

export type AdjustmentInput =
  | { product_id: string; delta: number; note: string }
  | { product_id: string; target_qty: number; note: string };
