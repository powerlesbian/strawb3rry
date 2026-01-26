// src/components/PromptLibrary.jsx
import { Card, CardContent } from "@/components/ui"; // Note the new import path

export default function PromptLibrary() {
  return (
    <Card className="shadow-lg border border-gray-100">
      <CardContent className="p-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Prompt Library</h2>
        <p className="text-gray-600">Your saved and favorite prompts will appear here.</p>
      </CardContent>
    </Card>
  );
}
