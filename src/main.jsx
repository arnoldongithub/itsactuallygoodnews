// Add this at the very top of main.jsx (before imports)
const originalSetAttribute = Element.prototype.setAttribute;
Element.prototype.setAttribute = function(name, value) {
  // Log all setAttribute calls to find the problematic one
  if (this.tagName === 'BUTTON') {
    console.log('🔍 Button setAttribute:', { name, value, element: this });
  }
  
  try {
    return originalSetAttribute.call(this, name, value);
  } catch (error) {
    console.error('❌ setAttribute FAILED:', { 
      name, 
      value, 
      element: this, 
      tagName: this.tagName,
      error: error.message 
    });
    throw error; // Re-throw to maintain error flow
  }
};

// Fixed main.jsx - Remove duplicate Router
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
