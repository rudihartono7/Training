import type { ApiError, RefundDto, TransactionDto } from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5199';

export class ApiCallError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'ApiCallError';
  }
}

async function parse<T>(response: Response): Promise<T> {
  if (response.ok) {
    return (await response.json()) as T;
  }

  let error: ApiError = { code: 'UNKNOWN', message: response.statusText };
  try {
    error = (await response.json()) as ApiError;
  } catch {
    // keep the fallback
  }

  throw new ApiCallError(error.code, error.message);
}

export async function listTransactions(): Promise<TransactionDto[]> {
  return parse<TransactionDto[]>(await fetch(`${BASE_URL}/api/transactions`));
}

/**
 * Posts a FULL refund. The Idempotency-Key is generated once per operator
 * action and reused on retry — never regenerated inside a retry loop, or a
 * network hiccup turns into a double refund.
 */
export async function postFullRefund(
  transactionId: string,
  reason: string,
  idempotencyKey: string
): Promise<RefundDto> {
  const response = await fetch(`${BASE_URL}/api/transactions/${transactionId}/refunds`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': idempotencyKey
    },
    body: JSON.stringify({ reason })
  });

  return parse<RefundDto>(response);
}

export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}
