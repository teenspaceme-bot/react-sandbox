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
