import { transform } from '@babel/standalone';
import type { FileType } from '../types/sandbox';

export function compileReactFile(file: FileType): string {
  const isJSXOrTSX = file.language === 'jsx' || file.language === 'tsx';

  if (isJSXOrTSX) {
    const result = transform(file.content, {
      presets: [['react', { runtime: 'classic' }]],
      filename: file.name
    });
    return result.code || '';
  }

  return file.content;
}

export function compileVueFile(file: FileType): string {
  if (file.language !== 'vue') {
    return file.content;
  }

  const templateMatch = file.content.match(/<template>([\s\S]*?)<\/template>/);
  const scriptMatch = file.content.match(/<script(?:\s+setup)?>([\s\S]*?)<\/script>/);
  const styleMatch = file.content.match(/<style(?:\s+scoped)?>([\s\S]*?)<\/style>/);
  const isSetup = file.content.includes('<script setup>');

  const template = templateMatch ? templateMatch[1].trim() : '';
  const script = scriptMatch ? scriptMatch[1].trim() : '';
  const style = styleMatch ? styleMatch[1].trim() : '';

  let code = '';

  if (style) {
    code += `
const style = document.createElement('style');
style.textContent = \`${style.replace(/`/g, '\\`')}\`;
document.head.appendChild(style);
`;
  }

  if (isSetup) {
    const propsMatch = script.match(/(?:const\s+\w+\s+=\s+)?defineProps\(\{([^}]+)\}\)/);
    const propsContent = propsMatch ? propsMatch[1].trim().replace(/\s+/g, ' ') : '';
    const scriptWithoutDefineProps = script.replace(/(?:const\s+\w+\s+=\s+)?defineProps\(\{[^}]+\}\);?\s*/g, '');

    code += `
import { ref, reactive, computed, watch, onMounted } from 'vue';

export default {
  ${propsContent ? `props: { ${propsContent} },` : ''}
  setup(props) {
    ${scriptWithoutDefineProps}
    return { ${extractSetupReturns(scriptWithoutDefineProps)} };
  },
  template: \`${template.replace(/`/g, '\\`')}\`
};
`;
  } else if (script) {
    code += `
${script}
`;
    code += `
export default {
  ...(__default__ || {}),
  template: \`${template.replace(/`/g, '\\`')}\`
};
`;
  } else {
    code += `
export default {
  template: \`${template.replace(/`/g, '\\`')}\`
};
`;
  }

  return code;
}

function extractSetupReturns(script: string): string {
  const constMatches = script.match(/(?:const|let)\s+(\w+)/g);
  const functionMatches = script.match(/(?:function|const|let)\s+(\w+)\s*(?:=\s*\(|=\s*function|\()/g);

  const variables = new Set<string>();

  if (constMatches) {
    constMatches.forEach(m => {
      const varName = m.split(/\s+/)[1];
      variables.add(varName);
    });
  }

  if (functionMatches) {
    functionMatches.forEach(m => {
      const varName = m.replace(/(?:function|const|let)\s+/, '').split(/[\s=(]/)[0];
      if (varName) variables.add(varName);
    });
  }

  return Array.from(variables).join(', ');
}
