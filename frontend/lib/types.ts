export interface Transaction {
  sender_public_key: string;
  recipient_public_key: string;
  amount: string | number;
}

export interface Block {
  block_number: number;
  timestamp: number;
  transactions: Transaction[];
  nonce: number;
  previous_hash: string;
}

export interface ChainResponse {
  chain: Block[];
  length: number;
}

export interface MempoolResponse {
  transactions: Transaction[];
}

export interface NodesResponse {
  nodes: string[];
}

export interface WalletResponse {
  public_key: string;
  private_key: string;
}

export interface GeneratedTransaction {
  transaction: {
    sender_public_key: string;
    recipient_public_key: string;
    amount: string;
  };
  signature: string;
}
