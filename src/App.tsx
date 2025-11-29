import { createSignal, Show } from 'solid-js'
import { ReactSandbox } from './components/ReactSandbox'
import { VueSandbox } from './components/VueSandbox'
import { NativeSandbox } from './components/NativeSandbox'
import { SolidSandbox } from './components/SolidSandbox'
import './App.css'

function App() {
  const [framework, setFramework] = createSignal<'react' | 'vue' | 'native' | 'solid'>('native');

  const switchFramework = (newFramework: 'react' | 'vue' | 'native' | 'solid') => {
    const frameworkName = newFramework === 'native' ? 'Native JS' : newFramework === 'solid' ? 'SolidJS' : newFramework.toUpperCase();
    if (confirm(`Switch to ${frameworkName}? This will reset your current work.`)) {
      setFramework(newFramework);
    }
  };

  const frameworkButtons = (
    <>
      <button
        class={`view-toggle-button ${framework() === 'native' ? 'active' : ''}`}
        onClick={() => switchFramework('native')}
      >
        Native
      </button>
      <button
        class={`view-toggle-button ${framework() === 'solid' ? 'active' : ''}`}
        onClick={() => switchFramework('solid')}
      >
        Solid
      </button>
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
      <Show when={framework() === 'native'}>
        <NativeSandbox frameworkButtons={frameworkButtons} />
      </Show>
      <Show when={framework() === 'solid'}>
        <SolidSandbox frameworkButtons={frameworkButtons} />
      </Show>
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
