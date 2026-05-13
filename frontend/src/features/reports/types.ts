export interface ReportSummary {
  count: number;
  gross_revenue: number;
  items_sold: number;
}

export interface ReportSaleRow {
  id: string;
  created_on: string;
  cashier_name: string;
  subtotal: number;
  tendered: number;
  change: number;
  line_count: number;
}

export interface TopProduct {
  product_id: string;
  name: string;
  barcode: string | null;
  qty_sold: number;
  revenue: number;
}

export interface SalesReport {
  from: string;
  to: string;
  summary: ReportSummary;
  sales: ReportSaleRow[];
  top_products: TopProduct[];
}
