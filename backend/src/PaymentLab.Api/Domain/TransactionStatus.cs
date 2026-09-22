namespace PaymentLab.Api.Domain;

public enum TransactionStatus
{
    /// <summary>Authorised and settled to the merchant. Refundable.</summary>
    Settled = 0,

    /// <summary>Part of the principal has been refunded. Still refundable.</summary>
    PartiallyRefunded = 1,

    /// <summary>Fully refunded. Not refundable any more.</summary>
    Refunded = 2,

    /// <summary>Authorisation failed or was reversed. Not refundable.</summary>
    Failed = 3
}
