export interface Transaction {
  id?: string;
  client_id?: string;
  owner_id?: string;
  amount?: number;
  status?: 'pending' | 'approved' | 'rejected';
  detail?: any;
  operation: 'income' | 'expense';
  created_at?: Date;
  updated_at?: Date;
  txn_hash?: string;
  clientData?: {
    document?: string;
    name?: string;
    lastname?: string;
    phone?: string | number;
    city?: string;
  };
}
