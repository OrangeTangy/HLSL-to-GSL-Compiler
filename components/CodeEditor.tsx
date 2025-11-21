import React from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language: string;
  readOnly?: boolean;
  label?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, language, readOnly = false, label }) => {
  return (
    <div className="flex flex-col h-full w-full bg-[#18181b] rounded-lg border border-zinc-800 overflow-hidden">
      {label && (
        <div className="px-4 py-2 bg-[#27272a] border-b border-zinc-800 flex justify-between items-center">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">{label}</span>
          <span className="text-xs text-zinc-500">{language}</span>
        </div>
      )}
      <div className="relative flex-grow">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          spellCheck={false}
          className={`w-full h-full p-4 bg-transparent text-sm leading-6 font-mono resize-none focus:outline-none focus:ring-0 ${
            readOnly ? 'text-zinc-400' : 'text-emerald-400'
          }`}
          placeholder={readOnly ? "Output will appear here..." : "// Write your shader code here..."}
        />
      </div>
    </div>
  );
};
