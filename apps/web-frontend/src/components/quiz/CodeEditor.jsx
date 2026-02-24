import React from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({ value, onChange }) => {
  return (
    <div className="rounded-xl overflow-hidden border border-slate-700">
      <Editor
        height="400px"
        defaultLanguage="python"
        theme="vs-dark"
        value={value}
        onChange={(val) => onChange(val ?? '')}
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 4,
          scrollBeyondLastLine: false,
        }}
      />
    </div>
  );
};

export default CodeEditor;


