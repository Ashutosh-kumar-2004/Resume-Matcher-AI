import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

const storedTheme = sessionStorage.getItem('ui_theme')

if (!storedTheme) {
  sessionStorage.setItem('ui_theme', 'dark')
  document.documentElement.classList.add('dark')
} else if (storedTheme === 'dark') {
  document.documentElement.classList.add('dark')
} else {
  document.documentElement.classList.remove('dark')
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
