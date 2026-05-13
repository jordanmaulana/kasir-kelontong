export interface Product {
  id: string;
  barcode: string | null;
  name: string;
  sell_price: number;
  created_on: string;
  updated_on: string;
}

export interface ProductInput {
  barcode?: string | null;
  name: string;
  sell_price: number;
}
