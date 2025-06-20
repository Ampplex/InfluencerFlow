import { useState, useEffect } from 'react';
import { CreditCard, DollarSign, CheckCircle, XCircle, AlertCircle, TestTube } from 'lucide-react';

// Razorpay types
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id?: string;
  handler: (response: RazorpayResponse) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
  modal: {
    ondismiss: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PaymentTest = () => {
  const [amount, setAmount] = useState(10);
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const initiatePayment = () => {
    if (!window.Razorpay) {
      setError('Razorpay SDK not loaded. Please refresh the page.');
      return;
    }

    setLoading(true);
    setError(null);
    setPaymentResult(null);

    // Create payment options
    const options: RazorpayOptions = {
      key: 'rzp_test_HirACCAzNefhEJ', // Test key - replace with your actual test key
      amount: amount * 100, // Amount in cents (for USD) or paise (for INR)
      currency: 'USD', // Change to 'INR' if testing with INR
      name: 'InfluencerFlow Test',
      description: `Test Payment - $${amount}`,
      // order_id: 'test_order_' + Date.now(), // Optional: can be commented out for testing
      handler: (response: RazorpayResponse) => {
        setLoading(false);
        setPaymentResult({
          success: true,
          payment_id: response.razorpay_payment_id,
          order_id: response.razorpay_order_id,
          signature: response.razorpay_signature,
          amount: amount,
          timestamp: new Date().toISOString()
        });
      },
      prefill: {
        name: 'Test User',
        email: 'test@example.com',
        contact: '+1234567890'
      },
      theme: {
        color: '#3B82F6'
      },
      modal: {
        ondismiss: () => {
          setLoading(false);
          setError('Payment cancelled by user');
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setLoading(false);
      setError(`Failed to open payment: ${err.message}`);
    }
  };

  const resetTest = () => {
    setPaymentResult(null);
    setError(null);
    setAmount(10);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <TestTube className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Test Lab</h1>
          <p className="text-gray-600">Test Razorpay integration without backend dependencies</p>
        </div>

        {/* Test Form */}
        <div className="bg-white rounded-2xl shadow-sm border p-8 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <CreditCard className="w-5 h-5 mr-2" />
            Payment Test Configuration
          </h2>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                Test Amount (USD)
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                min="1"
                max="1000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter amount to test"
              />
              <p className="text-sm text-gray-500 mt-1">
                Amount will be: ${amount} ({amount * 100} cents)
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-yellow-800">Test Mode</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    This uses Razorpay test mode. No real money will be charged.
                    Use test card: <code className="bg-yellow-100 px-1 rounded">4111 1111 1111 1111</code>
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={initiatePayment}
              disabled={loading || amount <= 0}
              className="w-full bg-blue-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Opening Payment...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Test Payment: ${amount}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Payment Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
                <button
                  onClick={resetTest}
                  className="mt-2 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success Display */}
        {paymentResult && paymentResult.success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <div className="flex items-start mb-4">
              <CheckCircle className="w-6 h-6 text-green-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-green-800">Payment Successful! 🎉</h3>
                <p className="text-sm text-green-700 mt-1">
                  Test payment completed successfully
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-gray-900">Payment Details:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-gray-500">Payment ID:</span>
                  <p className="font-mono text-xs bg-gray-100 p-1 rounded mt-1 break-all">
                    {paymentResult.payment_id}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Amount:</span>
                  <p className="font-semibold text-green-600">${paymentResult.amount}</p>
                </div>
                <div>
                  <span className="text-gray-500">Order ID:</span>
                  <p className="font-mono text-xs bg-gray-100 p-1 rounded mt-1">
                    {paymentResult.order_id || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Timestamp:</span>
                  <p className="text-xs">{new Date(paymentResult.timestamp).toLocaleString()}</p>
                </div>
                {paymentResult.signature && (
                  <div className="md:col-span-2">
                    <span className="text-gray-500">Signature:</span>
                    <p className="font-mono text-xs bg-gray-100 p-1 rounded mt-1 break-all">
                      {paymentResult.signature}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={resetTest}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Test Another Payment
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(paymentResult, null, 2));
                  alert('Payment details copied to clipboard!');
                }}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                Copy Details
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">Test Instructions</h3>
          <div className="space-y-2 text-sm text-blue-800">
            <p><strong>1.</strong> Enter any amount between $1-$1000</p>
            <p><strong>2.</strong> Click "Test Payment" to open Razorpay</p>
            <p><strong>3.</strong> Use test card: <code className="bg-blue-100 px-1 rounded">4111 1111 1111 1111</code></p>
            <p><strong>4.</strong> Use any future date for expiry (e.g., 12/25)</p>
            <p><strong>5.</strong> Use any 3-digit CVV (e.g., 123)</p>
            <p><strong>6.</strong> Complete payment to see success response</p>
          </div>
          
          <div className="mt-4 p-3 bg-blue-100 rounded">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> This test component bypasses your backend entirely. 
              It only tests the Razorpay payment window and response handling. 
              Perfect for testing payment integration without server dependencies!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentTest;