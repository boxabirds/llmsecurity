import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { installOutboundGuard } from './foundations/guards'
import './styles/global.css'

// Enforce the no-egress property at run time, once per app load.
installOutboundGuard()

const container = document.getElementById('root')
if (!container) throw new Error('Root container missing')

createRoot(container).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
