import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import api from '../services/api';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_51234567890');

/**
 * Inner component that uses Stripe hooks
 */
function CheckoutForm({ user, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [amount, setAmount] = useState('100');
  const [wallet, setWallet] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setCardError(null);

    try {
      // Create a PaymentMethod from card element
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: elements.getElement(CardElement),
      });

      if (error) {
        setCardError(error.message);
        setLoading(false);
        onError?.(error.message);
        return;
      }

      const cents = Math.round(parseFloat(amount || '0') * 100);

      // Send to backend
      const response = await api.buyBitcoin({
        amountCents: cents,
        fiatCurrency: 'USD',
        paymentMethod: 'card',
        paymentDetails: { paymentMethodId: paymentMethod.id },
        walletAddress: wallet,
      });

      if (response.error) {
        setCardError(response.error);
        onError?.(response.error);
      } else {
        onSuccess?.({
          orderId: response.id,
          btcSats: response.btcSats,
          status: response.status,
        });
        setAmount('');
        setWallet('');
        elements.getElement(CardElement)?.clear();
      }
    } catch (err) {
      setCardError(err.message);
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 12 }}>
      <label>Amount (USD)</label>
      <input 
        value={amount} 
        onChange={e => setAmount(e.target.value)} 
        placeholder="e.g. 100"
        type="number"
        step="0.01"
        min="1"
      />

      <label>Bitcoin Wallet Address</label>
      <input 
        value={wallet} 
        onChange={e => setWallet(e.target.value)} 
        placeholder="1A1z7agoat5TpgaSScstu6E7XbtBaGQDSu"
      />

      <label>Card Details</label>
      <CardElement
        options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': { color: '#aab7c4' },
            },
            invalid: { color: '#fa755a' },
          },
        }}
      />

      {cardError && <div style={{ color: 'red', fontSize: 14 }}>{cardError}</div>}

      <button type="submit" disabled={!stripe || loading} style={{ padding: 10 }}>
        {loading ? 'Processing…' : 'Buy Bitcoin'}
      </button>
    </form>
  );
}

/**
 * Main Stripe Elements wrapper
 */
export default function StripeCheckout({ user, onSuccess, onError, onBack }) {
  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <button onClick={onBack} style={{ marginBottom: 16 }}>← Back</button>
      <h2>Secure Payment — Buy Bitcoin</h2>
      <Elements stripe={stripePromise}>
        <CheckoutForm user={user} onSuccess={onSuccess} onError={onError} />
      </Elements>
    </div>
  );
}
