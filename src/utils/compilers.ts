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

  try {
    const parts = parseVueSFC(file.content);
    return generateVueCode(parts);
  } catch (error) {
    throw new Error(`Failed to compile ${file.name}: ${error}`);
  }
}

interface VueSFCParts {
  template: string;
  script: string;
  style: string;
  isSetup: boolean;
}

function parseVueSFC(content: string): VueSFCParts {
  const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
  const scriptMatch = content.match(/<script(?:\s+setup)?>([\s\S]*?)<\/script>/);
  const styleMatch = content.match(/<style(?:\s+scoped)?>([\s\S]*?)<\/style>/);
  const isSetup = /<script\s+setup>/.test(content);

  return {
    template: templateMatch ? templateMatch[1].trim() : '',
    script: scriptMatch ? scriptMatch[1].trim() : '',
    style: styleMatch ? styleMatch[1].trim() : '',
    isSetup
  };
}

function generateVueCode(parts: VueSFCParts): string {
  let code = '';

  if (parts.style) {
    const escapedStyle = parts.style.replace(/`/g, '\\`').replace(/\$/g, '\\$');
    code += `const style = document.createElement('style');\nstyle.textContent = \`${escapedStyle}\`;\ndocument.head.appendChild(style);\n\n`;
  }

  if (parts.isSetup) {
    code += compileScriptSetup(parts.script, parts.template);
  } else if (parts.script) {
    const escapedTemplate = parts.template.replace(/`/g, '\\`').replace(/\$/g, '\\$');
    code += `${parts.script}\n\nexport default {\n  ...(__default__ || {}),\n  template: \`${escapedTemplate}\`\n};\n`;
  } else {
    const escapedTemplate = parts.template.replace(/`/g, '\\`').replace(/\$/g, '\\$');
    code += `export default {\n  template: \`${escapedTemplate}\`\n};\n`;
  }

  return code;
}

function compileScriptSetup(script: string, template: string): string {
  const lines = script.split('\n');
  const imports: string[] = [];
  const vueImports: string[] = [];
  const componentNames: string[] = [];
  const propsDefinitions: string[] = [];
  const codeLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith('import')) {
      if (/from\s+['"]vue['"]/.test(trimmed)) {
        const match = trimmed.match(/import\s+\{([^}]+)\}/);
        if (match) {
          vueImports.push(...match[1].split(',').map(s => s.trim()));
        }
      } else if (/from\s+['"]\.\/.+['"]/.test(trimmed)) {
        const match = trimmed.match(/import\s+(\w+)/);
        if (match) {
          componentNames.push(match[1]);
        }
        imports.push(trimmed);
      }
    } else if (trimmed.includes('defineProps')) {
      propsDefinitions.push(trimmed);
    } else if (trimmed) {
      codeLines.push(line);
    }
  }

  const propsObject = extractPropsFromDefineProps(propsDefinitions.join('\n'));
  const variables = extractVariableNames(codeLines.join('\n'));
  const allReturns = [...componentNames, ...variables].join(', ');

  const vueImportLine = vueImports.length > 0
    ? `import { ${vueImports.join(', ')} } from 'vue';\n`
    : '';

  const componentImportLines = imports.length > 0
    ? imports.join('\n') + '\n'
    : '';

  const escapedTemplate = template.replace(/`/g, '\\`').replace(/\$/g, '\\$');

  let output = '';
  if (vueImportLine || componentImportLines) {
    output += vueImportLine + componentImportLines + '\n';
  }

  output += `export default {\n`;
  if (propsObject) {
    output += `  props: ${propsObject},\n`;
  }
  if (codeLines.length > 0 || componentNames.length > 0) {
    output += `  setup(props) {\n`;
    if (codeLines.length > 0) {
      output += codeLines.map(line => '    ' + line).join('\n') + '\n';
    }
    output += `    return { ${allReturns} };\n`;
    output += `  },\n`;
  }
  output += `  template: \`${escapedTemplate}\`\n`;
  output += `};\n`;

  return output;
}

function extractPropsFromDefineProps(propsCode: string): string {
  if (!propsCode) return '';

  const match = propsCode.match(/defineProps\s*\(\s*(\{[\s\S]*?\})\s*\)/);
  if (match) {
    return match[1].trim();
  }

  return '';
}

function extractVariableNames(code: string): string[] {
  const variables = new Set<string>();

  const patterns = [
    /(?:const|let|var)\s+(\w+)\s*=/g,
    /function\s+(\w+)\s*\(/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      variables.add(match[1]);
    }
  }

  return Array.from(variables);
}

