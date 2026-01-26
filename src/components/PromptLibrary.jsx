// src/components/PromptLibrary.jsx
import { Card, CardContent, Button } from "@/components/ui";

export default function PromptLibrary({ prompts = [], onDeletePrompt, onUsePrompt }) {
  const copyPrompt = async (prompt) => {
    try {
      await navigator.clipboard.writeText(prompt);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

    const openInPoe = (prompt) => {
      navigator.clipboard.writeText(prompt);
      window.open('https://poe.com/BusinessZami', '_blank');
    };

  return (
    <Card className="shadow-lg border border-gray-100">
      <CardContent className="p-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Prompt Library</h2>
        
        {prompts.length === 0 ? (
          <p className="text-gray-600">Your saved prompts will appear here.</p>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {prompts.map((item) => (
              <div key={item.id} className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-gray-500">
                    {item.task} • {new Date(item.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => onDeletePrompt && onDeletePrompt(item.id)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    Delete
                  </button>
                </div>
                <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono mb-3 line-clamp-4">
                  {item.prompt}
                </pre>
                <div className="flex gap-2">
                  <Button
                    onClick={() => copyPrompt(item.prompt)}
                    className="px-3 py-1 bg-blue-600 text-white black-xs"
                  >
                    Copy
                  </Button>
                  <Button
                    onClick={() => openInPoe(item.prompt)}
                    className="px-3 py-1 bg-purple-600 text-white black-xs"
                  >
                    Let's ask Zami
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
