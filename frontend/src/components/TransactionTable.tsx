import type { TransactionDto } from '../types';
import { formatDateTime, formatMoney } from '../format';

interface Props {
  transactions: TransactionDto[];
  onRefund: (transaction: TransactionDto) => void;
}

const REFUNDABLE: TransactionDto['status'][] = ['Settled'];

export function TransactionTable({ transactions, onRefund }: Props) {
  return (
    <table>
      <thead>
        <tr>
          <th>Transaksi</th>
          <th>Merchant</th>
          <th>Kartu</th>
          <th className="num">Gross</th>
          <th className="num">Fee</th>
          <th className="num">Sisa refundable</th>
          <th>Status</th>
          <th>Waktu otorisasi</th>
          <th />
        </tr>
      </thead>
      <tbody>
        {transactions.map((transaction) => (
          <tr key={transaction.id}>
            <td>{transaction.id}</td>
            <td>{transaction.merchantId}</td>
            <td className="mono">{transaction.maskedPan}</td>
            <td className="num">{formatMoney(transaction.gross)}</td>
            <td className="num">{formatMoney(transaction.merchantFee)}</td>
            <td className="num">{formatMoney(transaction.refundableRemaining)}</td>
            <td>
              <span className={`badge status-${transaction.status.toLowerCase()}`}>
                {transaction.status}
              </span>
            </td>
            <td>{formatDateTime(transaction.authorizedAt)}</td>
            <td>
              <button
                type="button"
                disabled={!REFUNDABLE.includes(transaction.status)}
                onClick={() => onRefund(transaction)}
              >
                Refund
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
