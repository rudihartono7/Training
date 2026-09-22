export interface MoneyDto {
  units: number;
  currency: string;
}

export interface RefundDto {
  id: string;
  transactionId: string;
  amount: MoneyDto;
  feeReversed: MoneyDto;
  reason: string;
  createdAt: string;
}

export type TransactionStatus =
  | 'Settled'
  | 'PartiallyRefunded'
  | 'Refunded'
  | 'Failed';

export interface TransactionDto {
  id: string;
  merchantId: string;
  gross: MoneyDto;
  merchantFee: MoneyDto;
  totalRefunded: MoneyDto;
  refundableRemaining: MoneyDto;
  status: TransactionStatus;
  maskedPan: string;
  authorizedAt: string;
  refunds: RefundDto[];
}

export interface ApiError {
  code: string;
  message: string;
}
