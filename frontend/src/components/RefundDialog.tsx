import { useState } from 'react';
import type { TransactionDto } from '../types';
import { formatMoney } from '../format';

interface Props {
  transaction: TransactionDto;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
  submitting?: boolean;
  errorMessage?: string | null;
}

/**
 * Operator confirmation for a refund.
 *
 * Today this dialog can only send a FULL refund: the amount is shown but not
 * editable. Validation here is a convenience for the operator — the server is
 * the authority. Any rule shown to the operator must exist server side too,
 * or the two drift apart.
 */
export function RefundDialog({
  transaction,
  onCancel,
  onConfirm,
  submitting = false,
  errorMessage = null
}: Props) {
  const [reason, setReason] = useState('');
  const [touched, setTouched] = useState(false);

  const reasonError = reason.trim().length === 0 ? 'Alasan refund wajib diisi.' : null;
  const canSubmit = !submitting && reasonError === null;

  return (
    <div className="dialog-backdrop" role="dialog" aria-modal="true" aria-label="Konfirmasi refund">
      <div className="dialog">
        <h2>Refund transaksi {transaction.id}</h2>

        <dl className="summary">
          <div>
            <dt>Merchant</dt>
            <dd>{transaction.merchantId}</dd>
          </div>
          <div>
            <dt>Kartu</dt>
            <dd>{transaction.maskedPan}</dd>
          </div>
          <div>
            <dt>Nominal refund</dt>
            <dd data-testid="refund-amount">{formatMoney(transaction.gross)}</dd>
          </div>
          <div>
            <dt>Fee dikembalikan</dt>
            <dd>{formatMoney(transaction.merchantFee)}</dd>
          </div>
        </dl>

        <label htmlFor="refund-reason">Alasan refund</label>
        <textarea
          id="refund-reason"
          value={reason}
          rows={3}
          onBlur={() => setTouched(true)}
          onChange={(event) => setReason(event.target.value)}
        />
        {touched && reasonError ? (
          <p className="error" role="alert">
            {reasonError}
          </p>
        ) : null}

        {errorMessage ? (
          <p className="error" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <div className="actions">
          <button type="button" onClick={onCancel} disabled={submitting}>
            Batal
          </button>
          <button
            type="button"
            className="primary"
            disabled={!canSubmit}
            onClick={() => onConfirm(reason.trim())}
          >
            {submitting ? 'Memproses…' : 'Konfirmasi refund penuh'}
          </button>
        </div>
      </div>
    </div>
  );
}
