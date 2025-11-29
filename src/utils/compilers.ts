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
      throw new Error(errors.map(e => e.message).join('\n'));
    }

    let code = '';

    if (descriptor.styles.length > 0) {
      const style = descriptor.styles[0];
      const escapedStyle = style.content.replace(/`/g, '\\`').replace(/\$/g, '\\$');
      code += `const style = document.createElement('style');\n`;
      code += `style.textContent = \`${escapedStyle}\`;\n`;
      code += `document.head.appendChild(style);\n\n`;
    }

    if (descriptor.scriptSetup) {
      const compiled = VueCompiler.compileScript(descriptor, {
        id: file.name,
        inlineTemplate: false
      });

      code += transformCompiledScript(compiled.content, descriptor.template?.content || '');
    } else if (descriptor.script) {
      const escapedTemplate = (descriptor.template?.content || '').trim().replace(/`/g, '\\`').replace(/\$/g, '\\$');
      code += `${descriptor.script.content}\n\n`;
      code += `export default {\n`;
      code += `  ...(__default__ || {}),\n`;
      code += `  template: \`${escapedTemplate}\`\n`;
      code += `};\n`;
    } else if (descriptor.template) {
      const escapedTemplate = descriptor.template.content.trim().replace(/`/g, '\\`').replace(/\$/g, '\\$');
      code += `export default {\n`;
      code += `  template: \`${escapedTemplate}\`\n`;
      code += `};\n`;
    }

    return code;
  } catch (error: any) {
    throw new Error(`Failed to compile ${file.name}: ${error.message}`);
  }
}

function transformCompiledScript(compiledScript: string, template: string): string {
  const escapedTemplate = template.trim().replace(/`/g, '\\`').replace(/\$/g, '\\$');

  const exportDefaultMatch = compiledScript.match(/export default ([^]*)/);
  if (exportDefaultMatch) {
    const defaultExport = exportDefaultMatch[1].trim();

    if (defaultExport.startsWith('/*@__PURE__*/')) {
      return `${compiledScript.replace(/export default [^]*/, '')}\n\nexport default {\n  ...${defaultExport.replace(/^\/\*@__PURE__\*\/\s*/, '')},\n  template: \`${escapedTemplate}\`\n};\n`;
    }

    return `${compiledScript.replace(/export default [^]*/, '')}\n\nexport default {\n  ...${defaultExport},\n  template: \`${escapedTemplate}\`\n};\n`;
  }

  return `${compiledScript}\n\nexport default {\n  template: \`${escapedTemplate}\`\n};\n`;
}


