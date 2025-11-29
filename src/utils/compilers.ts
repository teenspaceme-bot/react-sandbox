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
    const id = file.name.replace(/[^a-zA-Z0-9]/g, '_');

    const { descriptor, errors } = VueCompiler.parse(file.content, {
      filename: file.name,
      sourceMap: false
    });

    if (errors.length > 0) {
      throw new Error(`Parse errors: ${errors.map(e => e.message).join(', ')}`);
    }

    let scriptCode = '';
    if (descriptor.script || descriptor.scriptSetup) {
      const compiled = VueCompiler.compileScript(descriptor, {
        id,
        inlineTemplate: false
      });
      scriptCode = compiled.content;
    }

    let templateCode = '';
    if (descriptor.template) {
      const compiled = VueCompiler.compileTemplate({
        source: descriptor.template.content,
        filename: file.name,
        id,
        scoped: descriptor.styles.some(s => s.scoped),
        compilerOptions: {
          mode: 'module'
        }
      });

      if (compiled.errors.length > 0) {
        throw new Error(`Template errors: ${compiled.errors.map(e => typeof e === 'string' ? e : e.message).join(', ')}`);
      }

      templateCode = compiled.code;
    }

    let stylesCode = '';
    if (descriptor.styles.length > 0) {
      stylesCode = descriptor.styles.map((style, index) => {
        const css = style.content;
        return `
const style${index} = document.createElement('style');
style${index}.textContent = \`${css.replace(/`/g, '\\`')}\`;
document.head.appendChild(style${index});`;
      }).join('\n');
    }

    let finalCode = '';

    if (scriptCode && scriptCode.includes('export default')) {
      const scriptWithoutExport = scriptCode.replace('export default', 'const __sfc__');
      finalCode = `
${scriptWithoutExport}
${templateCode}
${stylesCode}

__sfc__.render = render;
export default __sfc__;
`;
    } else if (scriptCode) {
      finalCode = `
${scriptCode}
${templateCode}
${stylesCode}

export default {
  render
};
`;
    } else {
      finalCode = `
${templateCode}
${stylesCode}

export default {
  render
};
`;
    }

    return finalCode;
  } catch (error: any) {
    throw new Error(`Vue compilation failed for ${file.name}: ${error.message}`);
  }
}
