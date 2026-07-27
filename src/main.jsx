import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { hapticLight } from './utils/haptics.js'

// Global haptic feedback interceptor for all buttons
document.addEventListener('click', (e) => {
  const target = e.target.closest('button, [role="button"], .tab-btn');
  if (target) {
    hapticLight();
  }
}, false);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
