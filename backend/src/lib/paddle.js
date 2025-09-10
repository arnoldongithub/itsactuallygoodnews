// File: backend/src/lib/paddle.js
// Create this directory structure: src/lib/paddle.js

let paddleLoaded = false;

export async function loadPaddle() {
  if (paddleLoaded) return;
  
  try {
    // Load Paddle script
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Paddle script'));
      document.head.appendChild(script);
    });

    // Initialize Paddle (no environment parameter in v2)
    if (window.Paddle) {
      await window.Paddle.Initialize({
        token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN,
        eventCallback: (data) => {
          console.log('Paddle event:', data);
        }
      });
      paddleLoaded = true;
      console.log('Paddle initialized successfully');
    } else {
      throw new Error('Paddle script loaded but window.Paddle not available');
    }
  } catch (error) {
    console.error('Error loading Paddle:', error);
    throw error;
  }
}

export async function openCheckout(priceId, customerEmail) {
  try {
    await loadPaddle();
    
    if (!window.Paddle) {
      throw new Error('Paddle not loaded');
    }

    const checkoutOptions = {
      items: [{ priceId, quantity: 1 }],
      successUrl: `${window.location.origin}/subscribe?success=1`,
      closeUrl: `${window.location.origin}`,
      settings: {
        displayMode: 'overlay',
        theme: 'light',
        locale: 'en'
      }
    };

    // Add customer email if provided
    if (customerEmail) {
      checkoutOptions.customer = { email: customerEmail };
    }

    await window.Paddle.Checkout.open(checkoutOptions);
  } catch (error) {
    console.error('Error opening Paddle checkout:', error);
    // Better error handling than generic message
    const errorMessage = error.message || 'Unable to open checkout';
    alert(`Checkout Error: ${errorMessage}. Please try again or contact support.`);
  }
}

export function getPriceIdByTier(tier) {
  const priceIds = {
    supporter: import.meta.env.VITE_PADDLE_SUPPORTER_PRICE_ID,
    ally: import.meta.env.VITE_PADDLE_ALLY_PRICE_ID,
    advocate: import.meta.env.VITE_PADDLE_ADVOCATE_PRICE_ID
  };
  return priceIds[tier];
}

export async function getPaddleStatus() {
  try {
    await loadPaddle();
    return window.Paddle ? 'loaded' : 'failed';
  } catch {
    return 'failed';
  }
}
