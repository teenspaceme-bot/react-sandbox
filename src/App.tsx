import { createSignal } from 'solid-js'
import { ReactSandbox } from './components/ReactSandbox'
import { VueSandbox } from './components/VueSandbox'
import './App.css'

function App() {
  const [framework, setFramework] = createSignal<'react' | 'vue'>('react');

  const switchFramework = (newFramework: 'react' | 'vue') => {
    if (confirm(`Switch to ${newFramework.toUpperCase()}? This will reset your current work.`)) {
      setFramework(newFramework);
    }
  };

  return (
    <div>
      <div style={{
        padding: '10px',
        background: '#f5f5f5',
        'border-bottom': '1px solid #ddd',
        display: 'flex',
        gap: '10px'
      }}>
        <button
          onClick={() => switchFramework('react')}
          style={{
            padding: '8px 16px',
            'background-color': framework() === 'react' ? '#007bff' : '#fff',
            color: framework() === 'react' ? '#fff' : '#333',
            border: '1px solid #ddd',
            'border-radius': '4px',
            cursor: 'pointer'
          }}
        >
          React
        </button>
        <button
          onClick={() => switchFramework('vue')}
          style={{
            padding: '8px 16px',
            'background-color': framework() === 'vue' ? '#42b883' : '#fff',
            color: framework() === 'vue' ? '#fff' : '#333',
            border: '1px solid #ddd',
            'border-radius': '4px',
            cursor: 'pointer'
          }}
        >
          Vue
        </button>
      </div>
      {framework() === 'react' ? <ReactSandbox /> : <VueSandbox />}
    </div>
  )
}

export default App
