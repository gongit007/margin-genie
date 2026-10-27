import React from 'react'
import ReactDOM from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import App from './App'
import IntelligencePage from './pages/IntelligencePage'
import './index.css'

registerSW({ immediate: true })

const isIntelligence =
  typeof window !== 'undefined' && window.location.pathname.startsWith('/intelligence')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isIntelligence ? <IntelligencePage /> : <App />}
  </React.StrictMode>,
)
