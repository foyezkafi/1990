import { OrderStatus } from '../types';

export interface PaymentInitiationResult {
  success: boolean;
  gatewayType: 'manual' | 'api';
  instructions?: {
    methods: {
      name: string;
      number: string;
      type: 'Merchant' | 'Personal';
    }[];
    amount: number;
    reference: string;
  };
  redirectUrl?: string; // For automated API gateways like Stripe or SSLCommerz
}

export interface PaymentVerificationResult {
  success: boolean;
  status: OrderStatus;
  message: string;
  transactionId?: string;
}

/**
 * Clean reusable Payment Gateway interface.
 * Any future API integrations (Stripe, bKash API, SSLCommerz) can simply
 * implement this interface and be dropped in seamlessly.
 */
export interface PaymentGateway {
  id: string;
  name: string;
  type: 'manual' | 'api';
  
  initiatePayment(orderId: string, amount: number): Promise<PaymentInitiationResult>;
  verifyPayment(orderId: string, paymentDetails: {
    paymentMethod: string;
    transactionId: string;
    screenshot?: string;
  }): Promise<PaymentVerificationResult>;
}

/**
 * Implementation of the Manual Payment Gateway (bKash, Nagad, Rocket merchant transfers)
 */
export class ManualPaymentGateway implements PaymentGateway {
  id = 'manual';
  name = 'Manual Mobile Banking (bKash, Nagad, Rocket)';
  type = 'manual' as const;

  async initiatePayment(orderId: string, amount: number): Promise<PaymentInitiationResult> {
    return {
      success: true,
      gatewayType: 'manual',
      instructions: {
        methods: [
          { name: 'bKash Merchant', number: '01712-345678', type: 'Merchant' },
          { name: 'Nagad Merchant', number: '01987-654321', type: 'Merchant' },
          { name: 'Rocket', number: '01555-9998887', type: 'Personal' }
        ],
        amount: amount,
        reference: orderId,
      }
    };
  }

  async verifyPayment(
    orderId: string,
    paymentDetails: { paymentMethod: string; transactionId: string; screenshot?: string }
  ): Promise<PaymentVerificationResult> {
    if (!paymentDetails.transactionId) {
      return {
        success: false,
        status: 'Pending Payment',
        message: 'Transaction ID is required.'
      };
    }
    // For manual gateway, initial status remains Pending Payment until the Admin approves it.
    return {
      success: true,
      status: 'Pending Payment',
      message: 'Payment details submitted successfully. Awaiting admin verification.',
      transactionId: paymentDetails.transactionId
    };
  }
}

/**
 * Mock example showing how bKash API Gateway can easily replace manual gateway in the future.
 */
export class bKashAPIGateway implements PaymentGateway {
  id = 'bkash_api';
  name = 'bKash API Checkout';
  type = 'api' as const;

  async initiatePayment(orderId: string, amount: number): Promise<PaymentInitiationResult> {
    return {
      success: true,
      gatewayType: 'api',
      redirectUrl: `https://checkout.bkash.com/payment/tokenized/initiate?order=${orderId}&amount=${amount}`
    };
  }

  async verifyPayment(orderId: string, paymentDetails: { transactionId: string }): Promise<PaymentVerificationResult> {
    // Under API gateway, we query bKash API to check if transaction ID is genuine.
    console.log(`[Future-Ready bKash API] Verifying trx: ${paymentDetails.transactionId} for order: ${orderId}`);
    return {
      success: true,
      status: 'Payment Verified', // Automatically verify immediately
      message: 'bKash API: Payment completed and verified successfully!',
      transactionId: paymentDetails.transactionId
    };
  }
}

/**
 * Mock example showing how Stripe Gateway can replace manual gateway.
 */
export class StripeGateway implements PaymentGateway {
  id = 'stripe';
  name = 'Stripe Card Checkout';
  type = 'api' as const;

  async initiatePayment(orderId: string, amount: number): Promise<PaymentInitiationResult> {
    return {
      success: true,
      gatewayType: 'api',
      redirectUrl: `https://checkout.stripe.com/pay/${orderId}?amount=${amount}`
    };
  }

  async verifyPayment(orderId: string, paymentDetails: { transactionId: string }): Promise<PaymentVerificationResult> {
    console.log(`[Future-Ready Stripe API] Verifying with Stripe webhook/API...`);
    return {
      success: true,
      status: 'Payment Verified',
      message: 'Stripe: Charge succeeded and captured.',
      transactionId: paymentDetails.transactionId
    };
  }
}

/**
 * Payment Service registry to resolve active payment methods
 */
export class PaymentServiceRegistry {
  private gateways: Map<string, PaymentGateway> = new Map();
  private activeGatewayId: string = 'manual';

  constructor() {
    this.registerGateway(new ManualPaymentGateway());
    this.registerGateway(new bKashAPIGateway());
    this.registerGateway(new StripeGateway());
  }

  registerGateway(gateway: PaymentGateway) {
    this.gateways.set(gateway.id, gateway);
  }

  setActiveGateway(id: string) {
    if (this.gateways.has(id)) {
      this.activeGatewayId = id;
    }
  }

  getActiveGateway(): PaymentGateway {
    return this.gateways.get(this.activeGatewayId) || new ManualPaymentGateway();
  }

  getAllGateways(): PaymentGateway[] {
    return Array.from(this.gateways.values());
  }
}

export const paymentRegistry = new PaymentServiceRegistry();
