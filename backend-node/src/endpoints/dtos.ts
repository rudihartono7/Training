import { Money } from '../domain/money.js';
import { Refund, Transaction } from '../domain/transaction.js';

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
  idempotencyKey: string;
  createdAt: string;
}

export interface TransactionDto {
  id: string;
  merchantId: string;
  gross: MoneyDto;
  merchantFee: MoneyDto;
  maskedPan: string;
  status: string;
  createdAt: string;
  refundableRemaining: MoneyDto;
  refunds: RefundDto[];
}

export interface ApiErrorDto {
  code: string;
  message: string;
}

export function moneyToDto(m: Money): MoneyDto {
  return { units: m.units, currency: m.currency };
}

export function refundToDto(r: Refund): RefundDto {
  return {
    id: r.id,
    transactionId: r.transactionId,
    amount: moneyToDto(r.amount),
    feeReversed: moneyToDto(r.feeReversed),
    reason: r.reason,
    idempotencyKey: r.idempotencyKey,
    createdAt: r.createdAt.toISOString()
  };
}

export function transactionToDto(t: Transaction): TransactionDto {
  return {
    id: t.id,
    merchantId: t.merchantId,
    gross: moneyToDto(t.gross),
    merchantFee: moneyToDto(t.merchantFee),
    maskedPan: t.maskedPan,
    status: t.status,
    createdAt: t.createdAt.toISOString(),
    refundableRemaining: moneyToDto(t.refundableRemaining()),
    refunds: t.refunds.map(refundToDto)
  };
}
