import { Router } from 'express';
import { RefundErrorCode, RefundService } from '../services/refundService.js';
import { refundToDto } from './dtos.js';

const STATUS_BY_CODE: Record<RefundErrorCode, number> = {
  IDEMPOTENCY_KEY_REQUIRED: 400,
  REASON_REQUIRED: 400,
  TRANSACTION_NOT_FOUND: 404,
  INVALID_STATUS: 409,
  REFUND_WINDOW_EXPIRED: 409
};

interface RefundRequestBody {
  reason?: string;
}

export function refundEndpoints(refundService: RefundService): Router {
  const router = Router();

  router.post('/api/transactions/:id/refunds', (req, res) => {
    const idempotencyKey = req.header('Idempotency-Key') ?? undefined;
    const body = req.body as RefundRequestBody;

    const result = refundService.refundFull(req.params.id, body?.reason, idempotencyKey);

    if (!result.ok) {
      res.status(STATUS_BY_CODE[result.code]).json({ code: result.code, message: result.message });
      return;
    }

    res.status(result.replay ? 200 : 201).json(refundToDto(result.refund));
  });

  return router;
}
