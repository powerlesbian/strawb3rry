// src/components/Header.jsx
import { Card, CardContent } from "@/components/ui"; // Note the new import path

export default function Header() {
  return (
    <header className="border-b border-gray-200">
      <Card className="p-6 shadow-none border-none">
        <CardContent className="p-0">
          <h1 className="text-3xl font-bold text-gray-900">Your AI Prompt Companion</h1>
          <p className="text-gray-600 mt-1">for more effective and meaningful prompts</p>
        </CardContent>
      </Card>
    </header>
  );
}
