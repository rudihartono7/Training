import { useCallback, useEffect, useState } from 'react';
import { ApiCallError, listTransactions, newIdempotencyKey, postFullRefund } from './api/client';
import { RefundDialog } from './components/RefundDialog';
import { TransactionTable } from './components/TransactionTable';
import type { TransactionDto } from './types';

export default function App() {
  const [transactions, setTransactions] = useState<TransactionDto[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selected, setSelected] = useState<TransactionDto | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dialogError, setDialogError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    try {
      setTransactions(await listTransactions());
      setLoadError(null);
    } catch (error) {
      setLoadError(
        error instanceof Error
          ? `${error.message} — is the API running on :5199?`
          : 'Gagal memuat transaksi.'
      );
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function confirmRefund(reason: string) {
    if (!selected) {
      return;
    }

    setSubmitting(true);
    setDialogError(null);

    // One key per operator action, reused on retry.
    const idempotencyKey = newIdempotencyKey();

    try {
      await postFullRefund(selected.id, reason, idempotencyKey);
      setSelected(null);
      await reload();
    } catch (error) {
      setDialogError(
        error instanceof ApiCallError
          ? `${error.code}: ${error.message}`
          : 'Refund gagal diproses.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main>
      <header>
        <h1>PaymentLab — Back Office</h1>
        <p className="subtitle">
          Lab repo untuk workshop <em>Spec-Driven Agentic Execution</em>. Data in-memory, reset tiap
          restart API.
        </p>
      </header>

      {loadError ? <p className="error">{loadError}</p> : null}

      <TransactionTable
        transactions={transactions}
        onRefund={(transaction) => {
          setDialogError(null);
          setSelected(transaction);
        }}
      />

      {selected ? (
        <RefundDialog
          transaction={selected}
          submitting={submitting}
          errorMessage={dialogError}
          onCancel={() => setSelected(null)}
          onConfirm={(reason) => void confirmRefund(reason)}
        />
      ) : null}
    </main>
  );
}
