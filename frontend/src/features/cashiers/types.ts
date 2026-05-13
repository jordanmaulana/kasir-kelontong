export interface Cashier {
  id: string;
  store: string;
  display_name: string;
  active: boolean;
  last_login_at: string | null;
  created_on: string;
  updated_on: string;
}

export interface CashierInput {
  display_name: string;
  pin: string;
}

export interface CashierUpdate {
  display_name?: string;
  pin?: string;
  active?: boolean;
}
