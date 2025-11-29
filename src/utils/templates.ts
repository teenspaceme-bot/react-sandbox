import type { ProjectTemplate } from '../types/sandbox';

export const reactTemplate: ProjectTemplate = {
  framework: 'react',
  files: [
    {
      name: 'index.html',
      content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@18.2.0",
        "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
        "react/": "https://esm.sh/react@18.2.0/",
        "lucide-react": "https://esm.sh/lucide-react@0.330.0",
        "react-dom/": "https://aistudiocdn.com/react-dom@^19.2.0/"
      }
    }
  </script>
  <style>
    body {
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
    }
    #root {
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./src/index.jsx"></script>
</body>
</html>`,
      language: 'html'
    },
    {
      name: 'src/index.jsx',
      content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
      language: 'jsx'
    },
    {
      name: 'src/App.jsx',
      content: `import React, { useState } from 'react';
import { Button } from './components/Button';
import { Card } from './components/Card';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '20px', fontFamily: 'system-ui' }}>
      <h1>React Sandbox Demo</h1>
      <Card title="Counter Example">
        <p>Count: {count}</p>
        <Button onClick={() => setCount(count + 1)}>
          Increment
        </Button>
        <Button onClick={() => setCount(count - 1)}>
          Decrement
        </Button>
      </Card>
    </div>
  );
}

export default App;`,
      language: 'jsx'
    },
    {
      name: 'src/components/Button.jsx',
      content: `import React from 'react';

export function Button({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 20px',
        fontSize: '16px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        marginRight: '10px'
      }}
    >
      {children}
    </button>
  );
}`,
      language: 'jsx'
    },
    {
      name: 'src/components/Card.jsx',
      content: `import React from 'react';

export function Card({ title, children }) {
  return (
    <div style={{
      border: '1px solid #ddd',
      borderRadius: '8px',
      padding: '20px',
      backgroundColor: '#f9f9f9',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      maxWidth: '500px'
    }}>
      {title && <h2 style={{ marginTop: 0, color: '#333' }}>{title}</h2>}
      <div>{children}</div>
    </div>
  );
}`,
      language: 'jsx'
    }
  ],
  importMap: {
    imports: {
      'react': 'https://esm.sh/react@18.2.0',
      'react-dom': 'https://esm.sh/react-dom@18.2.0',
      'react-dom/client': 'https://esm.sh/react-dom@18.2.0/client'
    }
  }
};

export const vueTemplate: ProjectTemplate = {
  framework: 'vue',
  files: [
    {
      name: 'index.html',
      content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script type="importmap">
    {
      "imports": {
        "vue": "https://esm.sh/vue@3.4.21/dist/vue.esm-browser.js"
      }
    }
  </script>
  <style>
    body {
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
    }
    #app {
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="./src/main.js"></script>
</body>
</html>`,
      language: 'html'
    },
    {
      name: 'src/main.js',
      content: `import { createApp } from 'vue';
import App from './App.vue';

createApp(App).mount('#app');`,
      language: 'javascript'
    },
    {
      name: 'src/App.vue',
      content: `<template>
  <div style="padding: 20px; font-family: system-ui">
    <h1>Vue Sandbox Demo</h1>
    <Card title="Counter Example">
      <p>Count: {{ count }}</p>
      <Button @click="count++">Increment</Button>
      <Button @click="count--">Decrement</Button>
    </Card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Button from './components/Button.vue';
import Card from './components/Card.vue';

const count = ref(0);
</script>`,
      language: 'vue'
    },
    {
      name: 'src/components/Button.vue',
      content: `<template>
  <button class="btn">
    <slot></slot>
  </button>
</template>

<script setup>
</script>

<style scoped>
.btn {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #42b883;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
}

.btn:hover {
  background-color: #35a372;
}
</style>`,
      language: 'vue'
    },
    {
      name: 'src/components/Card.vue',
      content: `<template>
  <div class="card">
    <h2 v-if="title" class="card-title">{{ title }}</h2>
    <div><slot></slot></div>
  </div>
</template>

<script setup>
defineProps({
  title: String
});
</script>

<style scoped>
.card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  background-color: #f9f9f9;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  max-width: 500px;
}

.card-title {
  margin-top: 0;
  color: #333;
}
</style>`,
      language: 'vue'
    }
  ],
  importMap: {
    imports: {
      'vue': 'https://esm.sh/vue@3.4.21/dist/vue.esm-browser.js'
    }
  }
};

export const nativeTemplate: ProjectTemplate = {
  framework: 'native',
  files: [
    {
      name: 'index.html',
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Native JS Sandbox</title>
  <script type="importmap">
    {
      "imports": {
        "lodash-es": "https://esm.sh/lodash-es@4.17.21"
      }
    }
  </script>
  <style>
    body {
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
    }
  </style>
</head>
<body>
  <div id="app">
    <h1>Native JS Sandbox Demo</h1>
    <div class="card">
      <h2>Counter Example</h2>
      <p>Count: <span id="count">0</span></p>
      <button id="increment">Increment</button>
      <button id="decrement">Decrement</button>
    </div>
    <div class="card">
      <h2>ESM Import Example</h2>
      <p>Using lodash-es from CDN:</p>
      <button id="shuffle">Shuffle Array</button>
      <pre id="array-display">[1, 2, 3, 4, 5]</pre>
    </div>
  </div>
  <script type="module" src="./src/main.js"></script>
</body>
</html>`,
      language: 'html'
    },
    {
      name: 'src/main.js',
      content: `import { shuffle } from 'lodash-es';

let count = 0;
let currentArray = [1, 2, 3, 4, 5];

const countEl = document.getElementById('count');
const arrayEl = document.getElementById('array-display');

document.getElementById('increment').addEventListener('click', () => {
  count++;
  countEl.textContent = count;
});

document.getElementById('decrement').addEventListener('click', () => {
  count--;
  countEl.textContent = count;
});

document.getElementById('shuffle').addEventListener('click', () => {
  currentArray = shuffle(currentArray);
  arrayEl.textContent = JSON.stringify(currentArray);
});

console.log('Native JS app initialized!');`,
      language: 'javascript'
    },
    {
      name: 'src/styles.css',
      content: `body {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

#app {
  max-width: 600px;
  margin: 0 auto;
}

h1 {
  color: white;
  text-align: center;
  margin-bottom: 30px;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.card h2 {
  margin-top: 0;
  color: #333;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  background-color: #667eea;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 10px;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #5568d3;
}

button:active {
  background-color: #4451b8;
}

pre {
  background: #f4f4f4;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
}`,
      language: 'css'
    }
  ],
  importMap: {
    imports: {
      'lodash-es': 'https://esm.sh/lodash-es@4.17.21'
    }
  }
};

export const solidTemplate: ProjectTemplate = {
  framework: 'solid',
  files: [
    {
      name: 'index.html',
      content: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script type="importmap">
    {
      "imports": {
        "solid-js": "https://cdn.jsdelivr.net/npm/solid-js@1.8.22/dist/solid.js",
        "solid-js/web": "https://cdn.jsdelivr.net/npm/solid-js@1.8.22/web/dist/web.js",
        "solid-element": "https://esm.sh/solid-element@1.8.1"
      }
    }
  </script>
  <style>
    body {
      margin: 0;
      font-family: system-ui, -apple-system, sans-serif;
    }
    #root {
      min-height: 100vh;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="./src/index.jsx"></script>
</body>
</html>`,
      language: 'html'
    },
    {
      name: 'src/index.jsx',
      content: `import './components/CounterCard';
import './components/TodoCard';

const root = document.getElementById('root');
root.innerHTML = \`
  <div style="padding: 20px; font-family: system-ui">
    <h1 style="text-align: center; color: #2c4f7c">SolidJS Web Components Demo</h1>
    <counter-card></counter-card>
    <todo-card></todo-card>
  </div>
\`;`,
      language: 'jsx'
    },
    {
      name: 'src/components/CounterCard.jsx',
      content: `import { createSignal } from 'solid-js';
import { customElement } from 'solid-element';

function CounterCard() {
  const [count, setCount] = createSignal(0);

  return (
    <div style={{
      border: '1px solid #ddd',
      'border-radius': '8px',
      padding: '20px',
      'margin-bottom': '20px',
      'background-color': '#f9f9f9',
      'box-shadow': '0 2px 4px rgba(0,0,0,0.1)',
      'max-width': '500px',
      margin: '0 auto 20px'
    }}>
      <h2 style={{ 'margin-top': 0, color: '#333' }}>Counter Example</h2>
      <p style={{ 'font-size': '18px', margin: '15px 0' }}>
        Count: <strong>{count()}</strong>
      </p>
      <button onClick={() => setCount(count() + 1)} style={{
        padding: '10px 20px',
        'font-size': '16px',
        'background-color': '#2c4f7c',
        color: 'white',
        border: 'none',
        'border-radius': '4px',
        cursor: 'pointer',
        'margin-right': '10px'
      }}>
        Increment
      </button>
      <button onClick={() => setCount(count() - 1)} style={{
        padding: '10px 20px',
        'font-size': '16px',
        'background-color': '#2c4f7c',
        color: 'white',
        border: 'none',
        'border-radius': '4px',
        cursor: 'pointer'
      }}>
        Decrement
      </button>
    </div>
  );
}

customElement('counter-card', {}, CounterCard);`,
      language: 'jsx'
    },
    {
      name: 'src/components/TodoCard.jsx',
      content: `import { createSignal, For } from 'solid-js';
import { customElement } from 'solid-element';

function TodoCard() {
  const [todos, setTodos] = createSignal([
    { id: 1, text: 'Learn SolidJS', done: false },
    { id: 2, text: 'Build with Web Components', done: false }
  ]);
  const [input, setInput] = createSignal('');

  const addTodo = () => {
    const text = input().trim();
    if (text) {
      setTodos([...todos(), {
        id: Date.now(),
        text,
        done: false
      }]);
      setInput('');
    }
  };

  const toggleTodo = (id) => {
    setTodos(todos().map(todo =>
      todo.id === id ? { ...todo, done: !todo.done } : todo
    ));
  };

  const removeTodo = (id) => {
    setTodos(todos().filter(todo => todo.id !== id));
  };

  return (
    <div style="border: 1px solid #ddd; border-radius: 8px; padding: 20px; background-color: #f9f9f9; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto">
      <h2 style="margin-top: 0; color: #333">Todo List</h2>
      <div style="margin-bottom: 15px">
        <input
          type="text"
          value={input()}
          onInput={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
          placeholder="Add a new todo..."
          style="padding: 8px 12px; font-size: 14px; border: 1px solid #ddd; border-radius: 4px; width: calc(100% - 100px); margin-right: 10px"
        />
        <button
          onClick={addTodo}
          style="padding: 8px 16px; font-size: 14px; background-color: #2c4f7c; color: white; border: none; border-radius: 4px; cursor: pointer"
        >
          Add
        </button>
      </div>
      <For each={todos()}>
        {(todo) => (
          <div style="display: flex; align-items: center; padding: 10px; background-color: white; border-radius: 4px; margin-bottom: 8px">
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => toggleTodo(todo.id)}
              style="margin-right: 10px; cursor: pointer"
            />
            <span style={todo.done ? 'flex: 1; text-decoration: line-through; color: #999' : 'flex: 1; text-decoration: none; color: #333'}>
              {todo.text}
            </span>
            <button
              onClick={() => removeTodo(todo.id)}
              style="padding: 4px 8px; font-size: 12px; background-color: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer"
            >
              Delete
            </button>
          </div>
        )}
      </For>
    </div>
  );
}

customElement('todo-card', {}, TodoCard);`,
      language: 'jsx'
    }
  ],
  importMap: {
    imports: {
      'solid-js': 'https://cdn.jsdelivr.net/npm/solid-js@1.8.22/dist/solid.js',
      'solid-js/web': 'https://cdn.jsdelivr.net/npm/solid-js@1.8.22/web/dist/web.js',
      'solid-element': 'https://esm.sh/solid-element@1.8.1'
    }
  }
};
