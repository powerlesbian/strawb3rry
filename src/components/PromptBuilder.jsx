// src/components/PromptBuilder.jsx
import { useState } from 'react';
import { Card, CardContent, Select, Button, Textarea } from "@/components/ui";

const TASKS = [
  { value: '', label: 'Select a task...' },
  { value: 'write-code', label: 'Write code' },
  { value: 'explain', label: 'Explain a concept' },
  { value: 'debug', label: 'Debug an issue' },
  { value: 'brainstorm', label: 'Brainstorm ideas' },
  { value: 'summarize', label: 'Summarize content' },
  { value: 'review', label: 'Review/improve text' },
  { value: 'translate', label: 'Translate' },
];

const TONES = [
  { value: '', label: 'Select a tone...' },
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'technical', label: 'Technical' },
  { value: 'simple', label: 'Simple/ELI5' },
  { value: 'formal', label: 'Formal' },
  { value: 'friendly', label: 'Friendly' },
];

const LENGTHS = [
  { value: '', label: 'Select a length...' },
  { value: 'brief', label: 'Brief (1-2 paragraphs)' },
  { value: 'moderate', label: 'Moderate (3-5 paragraphs)' },
  { value: 'detailed', label: 'Detailed (comprehensive)' },
  { value: 'bullet', label: 'Bullet points' },
];

export default function PromptBuilder({ onSavePrompt }) {
  const [task, setTask] = useState('');
  const [tone, setTone] = useState('');
  const [length, setLength] = useState('');
  const [context, setContext] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [copied, setCopied] = useState(false);

  const generatePrompt = () => {
    if (!task || !context) {
      alert('Please select a task and provide context');
      return;
    }

    const taskLabels = {
      'write-code': 'Write code to',
      'explain': 'Explain',
      'debug': 'Help me debug',
      'brainstorm': 'Brainstorm ideas for',
      'summarize': 'Summarize',
      'review': 'Review and improve',
      'translate': 'Translate',
    };

    const toneInstructions = {
      'professional': 'Use a professional tone.',
      'casual': 'Keep it casual and conversational.',
      'technical': 'Be technical and precise.',
      'simple': 'Explain in simple terms, as if to a beginner.',
      'formal': 'Use formal language.',
      'friendly': 'Be friendly and approachable.',
    };

    const lengthInstructions = {
      'brief': 'Keep your response brief (1-2 paragraphs).',
      'moderate': 'Provide a moderate-length response (3-5 paragraphs).',
      'detailed': 'Give a comprehensive, detailed response.',
      'bullet': 'Format your response as bullet points.',
    };

    let prompt = `## Task\n${taskLabels[task] || task}: ${context}\n\n`;
    prompt += `## Guidelines\n`;
    if (tone) prompt += `- ${toneInstructions[tone]}\n`;
    if (length) prompt += `- ${lengthInstructions[length]}\n`;
    prompt += `- Be clear and actionable.\n`;
    prompt += `- If you need clarification, ask before proceeding.\n`;

    setGeneratedPrompt(prompt);
    setCopied(false);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const openInPoe = () => {
    copyToClipboard();
    window.open('https://poe.com/BusinessZami', '_blank');  // Replace with actual bot name
  };

  const savePrompt = () => {
    if (generatedPrompt && onSavePrompt) {
      onSavePrompt({
        id: Date.now(),
        prompt: generatedPrompt,
        task: TASKS.find(t => t.value === task)?.label || task,
        tone: TONES.find(t => t.value === tone)?.label || tone,
        length: LENGTHS.find(l => l.value === length)?.label || length,
        context,
        createdAt: new Date().toISOString(),
      });
    }
  };

  return (
    <Card className="shadow-lg border border-gray-100">
      <CardContent className="p-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Prompt Builder</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Task</label>
            <Select value={task} onChange={(e) => setTask(e.target.value)}>
              {TASKS.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
            <Select value={tone} onChange={(e) => setTone(e.target.value)}>
              {TONES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Length</label>
            <Select value={length} onChange={(e) => setLength(e.target.value)}>
              {LENGTHS.map(l => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Context / Details</label>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Describe what you need help with..."
              rows={3}
            />
          </div>

          <Button 
            onClick={generatePrompt}
            className="w-full py-3 font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 bg-gray-900 text-black"
          >
            Generate Prompt
          </Button>

          {generatedPrompt && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-black">Generated Prompt:</span>
              </div>
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono mb-4">
                {generatedPrompt}
              </pre>
              <div className="flex gap-2 flex-wrap">
                <Button 
                  onClick={openInPoe}
                  className="px-4 py-2 bg-purple-600 text-black-sm"
                >
                  Copy & Let's ask Zami!
                </Button>
                <Button 
                  onClick={savePrompt}
                  className="px-4 py-2 bg-green-600 text-black text-sm"
                >
                  Save to Library
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
