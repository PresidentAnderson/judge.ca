import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
  PaymentElement,
  LinkAuthenticationElement,
  AddressElement
} from '@stripe/react-stripe-js';
import { FiCreditCard, FiLock, FiCheck, FiAlertCircle } from 'react-icons/fi';

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface PaymentIntentData {
  amount: number;
  currency: string;
  description: string;
  metadata?: Record<string, string>;
  attorneyId?: string;
  clientId?: string;
  appointmentId?: string;
  invoiceId?: string;
}

interface StripeCheckoutProps {
  paymentData: PaymentIntentData;
  onSuccess: (paymentIntent: any) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}

const CheckoutForm: React.FC<StripeCheckoutProps> = ({
  paymentData,
  onSuccess,
  onError,
  onCancel
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [clientSecret, setClientSecret] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [email, setEmail] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'bank' | 'interac'>('card');
  const [billingDetails, setBillingDetails] = useState({
    name: '',
    email: '',
    phone: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'CA'
    }
  });

  useEffect(() => {
    // Create payment intent on the server
    createPaymentIntent();
  }, [paymentData]);

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(paymentData)
      });

      if (response.ok) {
        const data = await response.json();
        setClientSecret(data.clientSecret);
      } else {
        onError('Failed to initialize payment');
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      onError('Payment initialization failed');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements || !clientSecret) {return;}

    setProcessing(true);

    try {
      // Confirm the payment
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
          payment_method_data: {
            billing_details: billingDetails
          }
        },
        redirect: 'if_required'
      });

      if (result.error) {
        onError(result.error.message || 'Payment failed');
      } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
        // Payment succeeded
        await recordPayment(result.paymentIntent);
        onSuccess(result.paymentIntent);
      }
    } catch (error) {
      console.error('Payment error:', error);
      onError('An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };

  const recordPayment = async (paymentIntent: any) => {
    try {
      await fetch('/api/payments/record', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          status: paymentIntent.status,
          metadata: paymentData.metadata
        })
      });
    } catch (error) {
      console.error('Error recording payment:', error);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#9e2146',
      },
    },
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Method Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Payment Method
        </label>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setPaymentMethod('card')}
            className={`p-3 border rounded-lg text-center transition ${
              paymentMethod === 'card'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <FiCreditCard className="w-6 h-6 mx-auto mb-1" />
            <span className="text-sm">Credit Card</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('bank')}
            className={`p-3 border rounded-lg text-center transition ${
              paymentMethod === 'bank'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="text-sm">Bank Transfer</span>
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod('interac')}
            className={`p-3 border rounded-lg text-center transition ${
              paymentMethod === 'interac'
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
          >
            <span className="text-sm">Interac</span>
          </button>
        </div>
      </div>

      {/* Billing Information */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Billing Information</h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <input
            type="text"
            value={billingDetails.name}
            onChange={(e) => setBillingDetails({
              ...billingDetails,
              name: e.target.value
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={billingDetails.email}
            onChange={(e) => setBillingDetails({
              ...billingDetails,
              email: e.target.value
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone
          </label>
          <input
            type="tel"
            value={billingDetails.phone}
            onChange={(e) => setBillingDetails({
              ...billingDetails,
              phone: e.target.value
            })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Card Element */}
      {paymentMethod === 'card' && clientSecret && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Card Details
          </label>
          <div className="p-3 border border-gray-300 rounded-lg">
            <PaymentElement 
              options={{
                layout: 'tabs',
                paymentMethodOrder: ['card']
              }}
            />
          </div>
        </div>
      )}

      {/* Save Card Option */}
      {paymentMethod === 'card' && (
        <div className="flex items-center">
          <input
            type="checkbox"
            id="saveCard"
            checked={saveCard}
            onChange={(e) => setSaveCard(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="saveCard" className="ml-2 text-sm text-gray-700">
            Save card for future payments
          </label>
        </div>
      )}

      {/* Payment Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-3">Payment Summary</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Service</span>
            <span className="font-medium">{paymentData.description}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Amount</span>
            <span className="font-medium">
              ${(paymentData.amount / 100).toFixed(2)} {paymentData.currency.toUpperCase()}
            </span>
          </div>
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between">
              <span className="font-medium">Total</span>
              <span className="font-bold text-lg">
                ${(paymentData.amount / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="flex items-center space-x-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
        <FiLock className="w-4 h-4 text-blue-600" />
        <span>Your payment information is encrypted and secure. We never store your card details.</span>
      </div>

      {/* Submit Button */}
      <div className="flex space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
            disabled={processing}
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={!stripe || processing || !clientSecret}
          className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center"
        >
          {processing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </>
          ) : (
            <>
              <FiCreditCard className="w-5 h-5 mr-2" />
              Pay ${(paymentData.amount / 100).toFixed(2)}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export const StripeCheckout: React.FC<StripeCheckoutProps> = (props) => {
  const appearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#2563eb',
      colorBackground: '#ffffff',
      colorText: '#1f2937',
      colorDanger: '#ef4444',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      borderRadius: '8px'
    }
  };

  const options = {
    appearance,
    loader: 'auto' as const
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm {...props} />
    </Elements>
  );
};

// Payment Success Component
export const PaymentSuccess: React.FC<{ paymentIntentId?: string }> = ({ paymentIntentId }) => {
  const [paymentDetails, setPaymentDetails] = useState<any>(null);

  useEffect(() => {
    if (paymentIntentId) {
      loadPaymentDetails();
    }
  }, [paymentIntentId]);

  const loadPaymentDetails = async () => {
    try {
      const response = await fetch(`/api/payments/${paymentIntentId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPaymentDetails(data);
      }
    } catch (error) {
      console.error('Error loading payment details:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <FiCheck className="w-8 h-8 text-green-600" />
      </div>
      
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
      <p className="text-gray-600 mb-6">
        Your payment has been processed successfully.
      </p>
      
      {paymentDetails && (
        <div className="bg-gray-50 rounded-lg p-4 text-left mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Transaction Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Transaction ID</span>
              <span className="font-mono">{paymentDetails.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount</span>
              <span className="font-medium">
                ${(paymentDetails.amount / 100).toFixed(2)} {paymentDetails.currency.toUpperCase()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Date</span>
              <span>{new Date(paymentDetails.created * 1000).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-3">
        <button
          onClick={() => window.location.href = '/portal'}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Go to Client Portal
        </button>
        <button
          onClick={() => window.print()}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Download Receipt
        </button>
      </div>
    </div>
  );
};