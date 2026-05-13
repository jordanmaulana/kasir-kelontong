export interface CashierIdentity {
  id: string;
  display_name: string;
  last_login_at: string | null;
}

export interface CashierStoreRef {
  id: string;
  code: string;
  name: string;
}

export interface CashierSession {
  token: string;
  expires_at: string;
  cashier: CashierIdentity;
  store: CashierStoreRef;
}

export interface CashierLoginInput {
  store_code: string;
  pin: string;
}
