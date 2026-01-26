import { useState } from 'react';

export default function PromptBuilder() {
  const [task, setTask] = useState('summarize');
  const [tone, setTone] = useState('neutral');
  const [length, setLength] = useState('medium');
  const [context, setContext] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');

  const generatePrompt = () => {
    let prompt = `As an expert in [Your Field], your task is to ${task}. `;
    if (context) prompt += `The context is: ${context}. `;
    prompt += `Please respond in a ${tone} tone and keep it ${length}.`;
    setGeneratedPrompt(prompt);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Prompt Builder</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Task</label>
          <select 
            value={task} 
            onChange={(e) => setTask(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="summarize">Summarize</option>
            <option value="explain">Explain</option>
            <option value="write">Write</option>
            <option value="analyze">Analyze</option>
            <option value="brainstorm">Brainstorm</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tone</label>
          <select 
            value={tone} 
            onChange={(e) => setTone(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="neutral">Neutral</option>
            <option value="professional">Professional</option>
            <option value="friendly">Friendly</option>
            <option value="creative">Creative</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Length</label>
          <select 
            value={length} 
            onChange={(e) => setLength(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Context (Optional)</label>
          <textarea 
            value={context}
            onChange={(e) => setContext(e.target.value)}
            className="w-full p-2 border rounded"
            rows="3"
            placeholder="e.g., I am a marketing manager trying to..."
          />
        </div>
        <button 
          onClick={generatePrompt}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Generate Prompt
        </button>
      </div>
      {generatedPrompt && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <p className="font-mono text-sm">{generatedPrompt}</p>
          <button 
            onClick={() => navigator.clipboard.writeText(generatedPrompt)}
            className="mt-2 text-sm text-blue-500 hover:underline"
          >
            Copy to Clipboard
          </button>
        </div>
      )}
    </div>
  );
}
