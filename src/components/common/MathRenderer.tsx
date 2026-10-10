import React, { useMemo } from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '', inline = false }) => {
  const renderedHtml = useMemo(() => {
    if (!content) return '';

    // Split by $$...$$ (display math) and $...$ (inline math)
    // Regex matches:
    // 1. $$ ... $$
    // 2. $ ... $
    // 3. \[ ... \]
    // 4. \( ... \)
    const regex = /(\$\$[\s\S]+?\$\$|\$[^\$]+?\$|\\\[[\s\S]+?\\\]|\\\([\s\S]+?\\\))/g;

    return content.split(regex).map((part, index) => {
      if (!part) return '';

      // Check display math $$...$$ or \[...\]
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const math = part.slice(2, -2).trim();
        try {
          return katex.renderToString(math, { displayMode: true, throwOnError: false });
        } catch {
          return `<span class="text-rose-600 font-mono">[Lỗi công thức: ${math}]</span>`;
        }
      }

      if (part.startsWith('\\[') && part.endsWith('\\]')) {
        const math = part.slice(2, -2).trim();
        try {
          return katex.renderToString(math, { displayMode: true, throwOnError: false });
        } catch {
          return `<span class="text-rose-600 font-mono">[Lỗi công thức: ${math}]</span>`;
        }
      }

      // Check inline math $...$ or \(...\)
      if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
        const math = part.slice(1, -1).trim();
        try {
          return katex.renderToString(math, { displayMode: false, throwOnError: false });
        } catch {
          return `<span class="text-rose-600 font-mono">[Lỗi công thức: ${math}]</span>`;
        }
      }

      if (part.startsWith('\\(') && part.endsWith('\\)')) {
        const math = part.slice(2, -2).trim();
        try {
          return katex.renderToString(math, { displayMode: false, throwOnError: false });
        } catch {
          return `<span class="text-rose-600 font-mono">[Lỗi công thức: ${math}]</span>`;
        }
      }

      // Plain text: escape HTML and replace newlines with <br />
      const escaped = part
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return inline ? escaped : escaped.replace(/\n/g, '<br/>');
    }).join('');
  }, [content, inline]);

  return (
    <span
      className={`math-content ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
};
