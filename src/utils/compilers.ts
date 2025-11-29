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

  if (script) {
    code += `
${script}
`;
  }

  code += `
export default {
  template: \`${template.replace(/`/g, '\\`')}\`
};
`;

  return code;
}
