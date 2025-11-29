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

    const vueImportsMatch = script.match(/import\s+\{([^}]+)\}\s+from\s+['"]vue['"]/);
    const vueImports = vueImportsMatch ? vueImportsMatch[1].split(',').map(s => s.trim()).join(', ') : '';

    const componentImports: string[] = [];
    const componentImportMatches = script.matchAll(/import\s+(\w+)\s+from\s+['"]\.\/.+?['"]/g);
    for (const match of componentImportMatches) {
      componentImports.push(match[0]);
    }

    let scriptWithoutDefineProps = script.replace(/(?:const\s+\w+\s+=\s+)?defineProps\(\{[^}]+\}\);?\s*/g, '');
    scriptWithoutDefineProps = scriptWithoutDefineProps.replace(/import\s+\{[^}]+\}\s+from\s+['"]vue['"];?\s*/g, '');
    scriptWithoutDefineProps = scriptWithoutDefineProps.replace(/import\s+\w+\s+from\s+['"]\.\/.+?['"];?\s*/g, '');

    const hasVueImports = vueImports || scriptWithoutDefineProps.trim();
    const allImports = [
      hasVueImports ? `import { ${vueImports || 'ref, reactive, computed, watch, onMounted'} } from 'vue';` : '',
      ...componentImports
    ].filter(Boolean).join('\n');

    if (allImports) {
      code += allImports + '\n\n';
    }

    const setupReturns = extractSetupReturns(scriptWithoutDefineProps, componentImports);

    code += `export default {
  ${propsContent ? `props: { ${propsContent} },` : ''}
  ${scriptWithoutDefineProps.trim() || componentImports.length > 0 ? `setup(props) {
    ${scriptWithoutDefineProps}
    return { ${setupReturns} };
  },` : ''}
  template: \`${template.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`
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

function extractSetupReturns(script: string, componentImports: string[]): string {
  const constMatches = script.match(/(?:const|let)\s+(\w+)/g);
  const functionMatches = script.match(/(?:function|const|let)\s+(\w+)\s*(?:=\s*\(|=\s*function|\()/g);

  const variables = new Set<string>();

  componentImports.forEach(importStatement => {
    const match = importStatement.match(/import\s+(\w+)\s+from/);
    if (match) {
      variables.add(match[1]);
    }
  });

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
