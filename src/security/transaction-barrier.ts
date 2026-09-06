/**
 * Financial Transaction Barrier
 * Prevents autonomous models from accidentally executing payments, subscriptions, or checkout flows.
 */

export interface TransactionCheckResult {
  isFinancial: boolean;
  keyword?: string;
  reason?: string;
}

export class TransactionBarrier {
  private static FINANCIAL_KEYWORDS = [
    'pay now',
    'buy now',
    'place order',
    'complete order',
    'purchase',
    'checkout',
    'subscribe now',
    'confirm payment',
    'wire transfer',
    'authorize payment',
    'buy with 1-click',
  ];

  public static checkAction(text: string, ariaLabel?: string | null): TransactionCheckResult {
    const combined = `${text || ''} ${ariaLabel || ''}`.toLowerCase();

    for (const kw of TransactionBarrier.FINANCIAL_KEYWORDS) {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      if (regex.test(combined)) {
        return {
          isFinancial: true,
          keyword: kw,
          reason: `[FINANCIAL ACTION BLOCKED] Element triggers payment/checkout ("${kw}"). Blocked to prevent unintended financial transactions. Pass "allowFinancialAction: true" to proceed.`,
        };
      }
    }

    return { isFinancial: false };
  }
}
