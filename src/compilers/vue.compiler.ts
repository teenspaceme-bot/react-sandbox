import type { Compiler } from './types';
import type { FileType } from '../types/sandbox';

let vueCompilerInstance: typeof import('@vue/compiler-sfc') | null = null;

async function loadVueCompiler() {
  if (!vueCompilerInstance) {
    vueCompilerInstance = await import('@vue/compiler-sfc');
  }
  return vueCompilerInstance;
}

function compileVueTemplate(
  VueCompiler: typeof import('@vue/compiler-sfc'),
  descriptor: import('@vue/compiler-sfc').SFCDescriptor,
  file: FileType,
  scopeId: string,
  bindings?: import('@vue/compiler-sfc').BindingMetadata
) {
  const templateResult = VueCompiler.compileTemplate({
    source: descriptor.template!.content,
    filename: file.name,
    id: scopeId,
    scoped: descriptor.styles.some(s => s.scoped),
    compilerOptions: {
      mode: 'module',
      ...(bindings && { bindingMetadata: bindings })
    }
  });

  if (templateResult.errors.length > 0) {
    console.error('Template compilation errors:', templateResult.errors);
  }

  return templateResult.code;
}

export const vueCompiler: Compiler = {
  async compile(file: FileType): Promise<string> {
    if (file.language !== 'vue') {
      return file.content;
    }

    try {
      const VueCompiler = await loadVueCompiler();
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
          id: scopeId,
          inlineTemplate: false
        });

        let scriptContent = compiled.content;
        scriptContent = VueCompiler.rewriteDefault(scriptContent, '__sfc__');
        code += scriptContent;

        if (descriptor.template) {
          const templateCode = compileVueTemplate(VueCompiler, descriptor, file, scopeId, compiled.bindings);
          code += `\n${templateCode}\n`;
          code += `__sfc__.render = render;\n`;
        }

        const hasScoped = descriptor.styles.some(s => s.scoped);
        if (hasScoped) {
          code += `__sfc__.__scopeId = '${scopeId}';\n`;
        }

        code += `__sfc__.__file = '${file.name}';\n`;
        code += `export default __sfc__;\n`;
      } else if (descriptor.template) {
        const templateCode = compileVueTemplate(VueCompiler, descriptor, file, scopeId);
        code += `${templateCode}\n`;

        const hasScoped = descriptor.styles.some(s => s.scoped);
        code += `const __sfc__ = { render };\n`;
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
};
