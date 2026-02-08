import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux' // <--- Import 1
import { store } from './store'        // <--- Import 2
import { ToastProvider } from './components/ui/Toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* The Provider passes the 'store' to every component in the tree */}
    <Provider store={store}>
      <ToastProvider>
        <App />
      </ToastProvider>
    </Provider>
  </React.StrictMode>,
)