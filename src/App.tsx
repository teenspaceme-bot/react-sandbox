import { createSignal, Show } from 'solid-js'
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

  const frameworkButtons = (
    <>
      <button
        class={`view-toggle-button ${framework() === 'react' ? 'active' : ''}`}
        onClick={() => switchFramework('react')}
      >
        React
      </button>
      <button
        class={`view-toggle-button ${framework() === 'vue' ? 'active' : ''}`}
        onClick={() => switchFramework('vue')}
      >
        Vue
      </button>
    </>
  );

  return (
    <>
      <Show when={framework() === 'react'}>
        <ReactSandbox frameworkButtons={frameworkButtons} />
      </Show>
      <Show when={framework() === 'vue'}>
        <VueSandbox frameworkButtons={frameworkButtons} />
      </Show>
    </>
  )
}

export default App
