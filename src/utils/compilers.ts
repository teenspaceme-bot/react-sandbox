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

    const scopeId = `data-v-${Math.random().toString(36).slice(2, 10)}`;
    let code = '';

    if (descriptor.styles.length > 0) {
      descriptor.styles.forEach((styleBlock, index) => {
        const compiled = VueCompiler.compileStyle({
          source: styleBlock.content,
          filename: file.name,
          id: scopeId,
          scoped: styleBlock.scoped || false
        });

        if (compiled.errors.length > 0) {
          console.error('Style compilation errors:', compiled.errors);
        }

        const processedStyle = compiled.code.replace(/`/g, '\\`').replace(/\$/g, '\\$');
        code += `const style${index} = document.createElement('style');\nstyle${index}.textContent = \`${processedStyle}\`;\ndocument.head.appendChild(style${index});\n\n`;
      });
    }

    if (descriptor.scriptSetup || descriptor.script) {
      const compiled = VueCompiler.compileScript(descriptor, {
        id: scopeId
      });

      const template = descriptor.template?.content.trim().replace(/`/g, '\\`').replace(/\$/g, '\\$') || '';

      let scriptContent = compiled.content
        .replace(/setup\(__props, \{ expose: __expose \}\)/, 'setup()')
        .replace(/__expose\(\);?\s*\n/, '')
        .replace(/const __returned__ = \{([^}]+)\}/, 'return { $1 }')
        .replace(/Object\.defineProperty\(__returned__[^\n]+\n/, '')
        .replace(/return __returned__/, '');

      code += scriptContent.replace(/export default/, 'const __sfc__ =');
      code += `\n__sfc__.template = \`${template}\`;\n`;

      const hasScoped = descriptor.styles.some(s => s.scoped);
      if (hasScoped) {
        code += `__sfc__.__scopeId = '${scopeId}';\n`;
      }

      code += `export default __sfc__;\n`;
    } else if (descriptor.template) {
      const template = descriptor.template.content.trim().replace(/`/g, '\\`').replace(/\$/g, '\\$');
      const hasScoped = descriptor.styles.some(s => s.scoped);
      code += `const __sfc__ = { template: \`${template}\` };\n`;
      if (hasScoped) {
        code += `__sfc__.__scopeId = '${scopeId}';\n`;
      }
      code += `export default __sfc__;\n`;
    }

    return code;
  } catch (error: any) {
    throw new Error(`Failed to compile ${file.name}: ${error.message}`);
  }
}


