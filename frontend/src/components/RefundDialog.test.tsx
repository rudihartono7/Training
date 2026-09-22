import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RefundDialog } from './RefundDialog';
import type { TransactionDto } from '../types';

const transaction: TransactionDto = {
  id: 'trx_1001',
  merchantId: 'mch_warungkopi',
  gross: { units: 150000, currency: 'IDR' },
  merchantFee: { units: 1550, currency: 'IDR' },
  totalRefunded: { units: 0, currency: 'IDR' },
  refundableRemaining: { units: 150000, currency: 'IDR' },
  status: 'Settled',
  maskedPan: '455612******1234',
  authorizedAt: '2026-09-20T03:00:00+00:00',
  refunds: []
};

describe('RefundDialog', () => {
  it('shows the full principal as the refund amount', () => {
    render(<RefundDialog transaction={transaction} onCancel={vi.fn()} onConfirm={vi.fn()} />);

    expect(screen.getByTestId('refund-amount')).toHaveTextContent('Rp 150.000');
  });

  it('keeps confirm disabled until a reason is given', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<RefundDialog transaction={transaction} onCancel={vi.fn()} onConfirm={onConfirm} />);

    const confirm = screen.getByRole('button', { name: /konfirmasi refund penuh/i });
    expect(confirm).toBeDisabled();

    await user.type(screen.getByLabelText(/alasan refund/i), 'Barang tidak dikirim');
    expect(confirm).toBeEnabled();

    await user.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith('Barang tidak dikirim');
  });

  it('surfaces a server error to the operator', () => {
    render(
      <RefundDialog
        transaction={transaction}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        errorMessage="REFUND_WINDOW_EXPIRED"
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('REFUND_WINDOW_EXPIRED');
  });
});
