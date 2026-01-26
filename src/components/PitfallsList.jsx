// src/components/PitfallsList.jsx
import { Card, CardContent } from "@/components/ui"; // Note the new import path

const pitfalls = [
  {
    id: 1,
    title: "The Vague Prompt",
    description: "A vague prompt (e.g., 'Tell me about climate change') will almost always yield a vague, generic, and broad answer. The AI has no way to know what specific aspect you're interested in."
  },
  {
    id: 2,
    title: "Assuming the Wrong Context",
    description: "The AI may make incorrect assumptions about your knowledge level or the context of your request. For example, it might use complex jargon or assume you know specific commands, leaving you confused and stuck."
  },
  {
    id: 3,
    title: "The Hallucination Trap",
    description: "AI models can 'hallucinate'—they may invent facts, code, or references that sound plausible but are incorrect. **Always verify** critical information, especially code and data, before using it."
  },
  {
    id: 4,
    title: "Over-Reliance on the Oracle",
    description: "It's easy to fall into the trap of treating the AI as an infallible source of truth. Remember, it's a predictive model, not a knowledge base. It can be wrong, biased, or simply miss the mark."
  },
  {
    id: 5,
    title: "Forgetting to Clarify",
    description: "Failing to ask for clarification or not providing enough context is a common mistake. This leads to answers that don't solve your actual problem because the AI didn't understand the nuances of your request."
  }
];

export default function PitfallsList() {
  return (
    <Card className="shadow-lg border border-gray-100">
      <CardContent className="p-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-900">Common Pitfalls to Avoid</h2>
        <div className="space-y-4">
          {pitfalls.map((pitfall) => (
            <div key={pitfall.id} className="pb-4 last:pb-0 border-b border-gray-100 last:border-0">
              <h3 className="font-medium text-gray-900">{pitfall.title}</h3>
              <p className="text-gray-600 text-sm mt-1">{pitfall.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
