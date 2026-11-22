import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  const isLocalHost = location.hostname === '127.0.0.1' || location.hostname === 'localhost'
  if (isLocalHost) {
    void navigator.serviceWorker.getRegistrations().then(list => {
      list.forEach(registration => {
        void registration.unregister()
      })
    })
  } else if (import.meta.env.PROD) {
    window.addEventListener('load', () => void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`))
  }
}
