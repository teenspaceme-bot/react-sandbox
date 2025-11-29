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

    if (descriptor.scriptSetup || descriptor.script) {
      const compiled = VueCompiler.compileScript(descriptor, {
        id: file.name
      });

      const template = descriptor.template?.content.trim().replace(/`/g, '\\`').replace(/\$/g, '\\$') || '';

      code += compiled.content.replace(
        /export default/,
        `const __component__ =`
      );

      code += `\n\n__component__.template = \`${template}\`;\nexport default __component__;\n`;
    } else if (descriptor.template) {
      const template = descriptor.template.content.trim().replace(/`/g, '\\`').replace(/\$/g, '\\$');
      code += `export default { template: \`${template}\` };\n`;
    }

    return code;
  } catch (error: any) {
    throw new Error(`Failed to compile ${file.name}: ${error.message}`);
  }
}


