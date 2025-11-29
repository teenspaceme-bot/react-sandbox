import { transform } from '@babel/standalone';
import * as VueCompiler from '@vue/compiler-sfc';
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

  try {
    const { descriptor } = VueCompiler.parse(file.content, { filename: file.name });

    let code = '';

    if (descriptor.styles.length > 0) {
      const style = descriptor.styles[0].content.replace(/`/g, '\\`').replace(/\$/g, '\\$');
      code += `const style = document.createElement('style');\nstyle.textContent = \`${style}\`;\ndocument.head.appendChild(style);\n\n`;
    }

    const template = descriptor.template?.content.trim().replace(/`/g, '\\`').replace(/\$/g, '\\$') || '';

    if (descriptor.scriptSetup) {
      const scriptContent = descriptor.scriptSetup.content;
      code += `${scriptContent}\n\nexport default { setup() { return { ${extractExports(scriptContent)} } }, template: \`${template}\` };\n`;
    } else if (descriptor.script) {
      code += `${descriptor.script.content}\n\nexport default { ...(__default__ || {}), template: \`${template}\` };\n`;
    } else if (descriptor.template) {
      code += `export default { template: \`${template}\` };\n`;
    }

    return code;
  } catch (error: any) {
    throw new Error(`Failed to compile ${file.name}: ${error.message}`);
  }
}

function extractExports(scriptContent: string): string {
  const lines = scriptContent.split('\n');
  const exports: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('const ') || trimmed.startsWith('let ') || trimmed.startsWith('var ') || trimmed.startsWith('function ')) {
      const match = trimmed.match(/^(?:const|let|var|function)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/);
      if (match) {
        exports.push(match[1]);
      }
    }
  }

  return exports.join(', ');
}


