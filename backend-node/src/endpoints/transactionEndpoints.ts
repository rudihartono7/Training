import { Router } from 'express';
import { TransactionStore } from '../infrastructure/transactionStore.js';
import { transactionToDto } from './dtos.js';

export function transactionEndpoints(store: TransactionStore): Router {
  const router = Router();

  router.get('/api/transactions', (req, res) => {
    const merchantId = typeof req.query.merchantId === 'string' && req.query.merchantId.trim() !== ''
      ? req.query.merchantId
      : undefined;
    const transactions = store.list(merchantId).map(transactionToDto);
    res.json(transactions);
  });

  router.get('/api/transactions/:id', (req, res) => {
    const transaction = store.findById(req.params.id);
    if (!transaction) {
      res.status(404).json({ code: 'TRANSACTION_NOT_FOUND', message: `No transaction ${req.params.id}.` });
      return;
    }
    res.json(transactionToDto(transaction));
  });

  return router;
}
