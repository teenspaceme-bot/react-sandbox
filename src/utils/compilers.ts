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
    const { descriptor, errors } = VueCompiler.parse(file.content, {
      filename: file.name
    });

    if (errors.length > 0) {
      throw new Error(`Parse errors: ${errors.map(e => e.message).join(', ')}`);
    }

    const scriptContent = descriptor.script?.content || descriptor.scriptSetup?.content || '';
    const isSetup = !!descriptor.scriptSetup;

    let templateCode = '';
    if (descriptor.template) {
      const templateCompileResult = VueCompiler.compileTemplate({
        source: descriptor.template.content,
        filename: file.name,
        id: file.name,
        scoped: descriptor.styles.some(s => s.scoped),
        compilerOptions: {
          mode: 'module'
        }
      });

      if (templateCompileResult.errors.length > 0) {
        throw new Error(`Template errors: ${templateCompileResult.errors.map(e => typeof e === 'string' ? e : e.message).join(', ')}`);
      }

      templateCode = templateCompileResult.code;
    }

    let stylesCode = '';
    if (descriptor.styles.length > 0) {
      stylesCode = descriptor.styles.map((style, index) => {
        const css = style.content;
        const id = `${file.name}-${index}`;

        if (style.scoped) {
          return `
const style${index} = document.createElement('style');
style${index}.setAttribute('data-v-${id}', '');
style${index}.textContent = \`${css.replace(/`/g, '\\`')}\`;
document.head.appendChild(style${index});`;
        } else {
          return `
const style${index} = document.createElement('style');
style${index}.textContent = \`${css.replace(/`/g, '\\`')}\`;
document.head.appendChild(style${index});`;
        }
      }).join('\n');
    }

    let compiledCode = '';

    if (isSetup) {
      const renderFunctionMatch = templateCode.match(/export function render\(_ctx[^)]*\) \{[\s\S]*\}/);
      const renderFunction = renderFunctionMatch ? renderFunctionMatch[0].replace('export ', '') : '';

      compiledCode = `
import { ${extractImports(scriptContent)} } from 'vue';

${scriptContent}

${renderFunction}

${stylesCode}

export default {
  setup() {
    ${extractSetupVariables(scriptContent)}
    return { ${extractReturnVariables(scriptContent)} };
  },
  render
};`;
    } else {
      const importsMatch = scriptContent.match(/import\s+.*?from\s+['"]vue['"];?/g);
      const imports = importsMatch ? importsMatch.join('\n') : '';
      const scriptWithoutImports = scriptContent.replace(/import\s+.*?from\s+['"]vue['"];?/g, '');

      compiledCode = `
${imports}

${templateCode}

${stylesCode}

${scriptWithoutImports}

if (typeof __default__ !== 'undefined' && __default__.render) {
  __default__.render = render;
}
`;
    }

    return compiledCode;
  } catch (error: any) {
    throw new Error(`Vue compilation failed for ${file.name}: ${error.message}`);
  }
}

function extractImports(code: string): string {
  const importMatch = code.match(/import\s+\{([^}]+)\}\s+from\s+['"]vue['"]/);
  if (importMatch) {
    return importMatch[1].trim();
  }
  return 'ref, reactive, computed, watch, onMounted';
}

function extractSetupVariables(code: string): string {
  const lines = code.split('\n')
    .filter(line => !line.trim().startsWith('import'))
    .filter(line => line.trim().length > 0);
  return lines.join('\n    ');
}

function extractReturnVariables(code: string): string {
  const varMatches = code.match(/(?:const|let|var)\s+(\w+)/g);
  if (varMatches) {
    return varMatches.map(m => m.split(/\s+/)[1]).join(', ');
  }
  return '';
}
