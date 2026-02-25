import React from 'react';

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="bg-slate-900 text-pink-400 rounded px-1 font-mono text-xs">{part.slice(1, -1)}</code>;
    }
    return <span key={i}>{part}</span>;
  });
}

export default function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={`code-${i}`} className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-200 overflow-x-auto my-1">
          {lang && <div className="text-slate-500 mb-1">{lang}</div>}
          <code>{codeLines.join('\n')}</code>
        </pre>
      );
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={i} className="text-lg font-bold text-white mt-4 mb-1">{renderInline(line.slice(2))}</h1>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} className="text-base font-semibold text-white mt-3 mb-1">{renderInline(line.slice(3))}</h2>);
    } else if (line.startsWith('### ')) {
      elements.push(<h3 key={i} className="text-sm font-semibold text-slate-200 mt-2 mb-0.5">{renderInline(line.slice(4))}</h3>);
    } else if (/^[-*] /.test(line)) {
      elements.push(
        <div key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
          <span className="text-slate-500 mt-0.5 shrink-0">•</span>
          <span>{renderInline(line.slice(2))}</span>
        </div>
      );
    } else if (/^\d+\. /.test(line)) {
      const match = line.match(/^(\d+)\. (.*)$/)!;
      elements.push(
        <div key={i} className="flex gap-2 text-sm text-slate-300 leading-relaxed">
          <span className="text-slate-500 shrink-0 min-w-4">{match[1]}.</span>
          <span>{renderInline(match[2])}</span>
        </div>
      );
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-1.5" />);
    } else {
      elements.push(<p key={i} className="text-sm text-slate-300 leading-relaxed">{renderInline(line)}</p>);
    }
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}
