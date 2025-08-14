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

// ========== NAVIGATION DEBUG SCRIPT ==========
window.debugNavigation = true;

// Override console functions to catch navigation attempts
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = function(...args) {
  if (window.debugNavigation && args.some(arg => 
    typeof arg === 'string' && (
      arg.includes('🚀') || 
      arg.includes('Navigating') || 
      arg.includes('navigation') ||
      arg.includes('article/') ||
      arg.includes('story')
    )
  )) {
    originalConsoleLog('🐛 NAVIGATION DEBUG:', ...args);
    
    // Show in debug overlay
    const debugDiv = document.getElementById('debug-overlay') || createDebugOverlay();
    const time = new Date().toLocaleTimeString();
    debugDiv.innerHTML += `<div style="color: #00ff00; font-size: 11px; margin: 2px 0;">[${time}] ${args.join(' ')}</div>`;
    debugDiv.scrollTop = debugDiv.scrollHeight;
  }
  originalConsoleLog(...args);
};

console.error = function(...args) {
  if (window.debugNavigation) {
    const debugDiv = document.getElementById('debug-overlay') || createDebugOverlay();
    const time = new Date().toLocaleTimeString();
    debugDiv.innerHTML += `<div style="color: #ff4444; font-size: 11px; margin: 2px 0; font-weight: bold;">[${time}] ❌ ERROR: ${args.join(' ')}</div>`;
    debugDiv.scrollTop = debugDiv.scrollHeight;
  }
  originalConsoleError(...args);
};

// Create floating debug overlay
function createDebugOverlay() {
  const debugDiv = document.createElement('div');
  debugDiv.id = 'debug-overlay';
  debugDiv.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    width: 450px;
    height: 350px;
    background: rgba(0,0,0,0.95);
    color: white;
    font-family: 'Courier New', monospace;
    font-size: 10px;
    padding: 20px 15px 15px 15px;
    border-radius: 8px;
    z-index: 999999;
    overflow-y: auto;
    border: 2px solid #333;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  `;
  
  // Add header
  const header = document.createElement('div');
  header.style.cssText = `
    color: #ffff00;
    font-weight: bold;
    margin-bottom: 10px;
    font-size: 12px;
    border-bottom: 1px solid #444;
    padding-bottom: 5px;
  `;
  header.textContent = '🐛 NAVIGATION DEBUG LOG';
  
  // Add close button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = `
    position: absolute;
    top: 8px;
    right: 8px;
    background: #ff4444;
    color: white;
    border: none;
    border-radius: 3px;
    cursor: pointer;
    width: 20px;
    height: 20px;
    font-size: 12px;
    font-weight: bold;
  `;
  closeBtn.onclick = () => {
    debugDiv.remove();
    window.debugNavigation = false;
    console.log('🐛 Debug overlay closed');
  };
  
  debugDiv.appendChild(header);
  debugDiv.appendChild(closeBtn);
  
  // Add initial message
  debugDiv.innerHTML += '<div style="color: #888; font-size: 10px; margin: 5px 0;">Monitoring story clicks and navigation...</div>';
  
  document.body.appendChild(debugDiv);
  console.log('🐛 Debug overlay created');
  return debugDiv;
}

// Global click monitor - catch ALL clicks
document.addEventListener('click', function(e) {
  if (!window.debugNavigation) return;
  
  const target = e.target;
  let element = target;
  let foundStoryElement = false;
  
  // Walk up the DOM tree to find story-related elements
  for (let i = 0; i < 10 && element; i++) {
    const className = element.className || '';
    const isStoryElement = (
      typeof className === 'string' && (
        className.includes('newscard') ||
        className.includes('trending') ||
        className.includes('viral') ||
        className.includes('daily') ||
        className.includes('blindspot') ||
        className.includes('sidebar') ||
        className.includes('story')
      )
    );
    
    if (isStoryElement) {
      foundStoryElement = true;
      
      const debugInfo = {
        element: element.tagName,
        className: className,
        hasHref: !!element.href,
        href: element.href,
        hasOnClick: !!element.onclick,
        textContent: element.textContent?.substring(0, 50) + '...',
        path: window.location.pathname
      };
      
      console.log('🖱️ STORY ELEMENT CLICKED:', debugInfo);
      
      // Check for dangerous href navigation
      if (element.href && (element.href.includes('/article/') || element.href.includes('/category/'))) {
        console.error('🚨 DANGEROUS HREF DETECTED:', element.href);
        console.error('🚨 This <a href> will cause page reload and break React Router!');
        
        // Optionally prevent dangerous navigation
        setTimeout(() => {
          if (window.confirm('🚨 DANGEROUS NAVIGATION DETECTED!\n\nThis <a href> tag will cause the error.\n\nClick OK to prevent it, Cancel to allow it.')) {
            e.preventDefault();
            e.stopImmediatePropagation();
            console.log('✅ Dangerous navigation prevented');
          }
        }, 50);
      }
      
      break;
    }
    element = element.parentElement;
  }
  
  // Log general clicks on potential story content
  if (!foundStoryElement && target.textContent && target.textContent.length > 30) {
    console.log('🖱️ Potential story click:', {
      tag: target.tagName,
      className: target.className,
      textLength: target.textContent.length,
      hasHref: !!target.href
    });
  }
}, true); // Use capture phase

// Monitor route changes
let currentPath = window.location.pathname;
const checkRouteChange = () => {
  if (window.location.pathname !== currentPath) {
    console.log('🛣️ ROUTE CHANGE DETECTED:', {
      from: currentPath,
      to: window.location.pathname,
      timestamp: new Date().toLocaleTimeString()
    });
    currentPath = window.location.pathname;
  }
};

setInterval(checkRouteChange, 200);

// Global error handler - catch navigation errors
window.addEventListener('error', function(e) {
  const isNavigationError = (
    e.message.includes('Something went wrong') ||
    e.message.includes('Navigation error') ||
    e.message.includes('Cannot read') ||
    e.message.includes('router') ||
    e.message.includes('navigate') ||
    e.filename?.includes('App.jsx') ||
    e.filename?.includes('NewsCard') ||
    e.filename?.includes('TrendingStories')
  );
  
  if (isNavigationError) {
    const errorDetails = {
      message: e.message,
      filename: e.filename,
      line: e.lineno,
      column: e.colno,
      currentPath: window.location.pathname,
      userAgent: navigator.userAgent.substring(0, 50),
      timestamp: new Date().toISOString()
    };
    
    console.error('🚨 NAVIGATION ERROR CAUGHT:', errorDetails);
    
    // Try to get stack trace
    if (e.error && e.error.stack) {
      console.error('📋 Error Stack:', e.error.stack);
      
      // Identify component that caused error
      const stack = e.error.stack;
      if (stack.includes('NewsCard')) {
        console.error('🎯 ERROR SOURCE: NewsCard component');
      } else if (stack.includes('TrendingStories')) {
        console.error('🎯 ERROR SOURCE: TrendingStories component');
      } else if (stack.includes('DailyReads')) {
        console.error('🎯 ERROR SOURCE: DailyReads component');
      } else if (stack.includes('Blindspot')) {
        console.error('🎯 ERROR SOURCE: Blindspot component');
      } else {
        console.error('🎯 ERROR SOURCE: Unknown component');
      }
    }
    
    // Show user-friendly error with options
    setTimeout(() => {
      const message = `❌ Navigation Error Detected!\n\nError: ${e.message}\nPath: ${window.location.pathname}\n\nWhat would you like to do?`;
      
      if (window.confirm(message + '\n\nOK = Reload page\nCancel = Continue debugging')) {
        window.location.reload();
      } else {
        console.log('🐛 Continuing debug session...');
      }
    }, 1000);
  }
});

// Helper function for manual testing
window.testStoryClick = function(storyId) {
  console.log('🧪 Testing story click for ID:', storyId);
  console.log('Current path:', window.location.pathname);
  console.log('Target path:', `/article/${storyId}`);
};

console.log('🐛 Navigation debug system loaded - monitoring clicks and errors');
console.log('🔧 Use window.testStoryClick(id) to test story navigation');

// ========== END DEBUG SCRIPT ==========

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