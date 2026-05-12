export interface Store {
  id: string;
  name: string;
  address: string;
  code: string;
  created_on: string;
  updated_on: string;
}

export interface StoreInput {
  name: string;
  code: string;
  address?: string;
}
