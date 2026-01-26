// src/components/PrinciplesList.jsx
import { Card, CardContent } from "@/components/ui"; // Note the new import path

const principles = [
  { id: 1, title: "Assign a Clear Role", description: "Start by assigning a role (e.g., 'Act as a senior developer'). Provides context and guides the AI's tone." },
  { id: 2, title: "Embrace the Iterative Process", description: "Treat AI interaction as a conversation. Refine your prompt based on the response." },
  { id: 3, title: "Request Clarifying Questions", description: "Ask the AI to ask you 1-5 clarifying questions to 'tease out' the true goal." },
  { id: 4, title: "Encourage Critical Feedback", description: "Prompt the AI to be a critical partner and highlight incorrect assumptions." },
  { id: 5, title: "Specify Constraints", description: "Always define the desired output format and any constraints." }
];

export default function PrinciplesList() {
  return (
    <Card className="shadow-lg border border-gray-100">
      <CardContent className="p-8">
        <h2 className="text-xl font-semibold mb-6 text-gray-900">Core Principles</h2>
        <div className="space-y-4">
          {principles.map((principle) => (
            <div key={principle.id} className="pb-4 last:pb-0 border-b border-gray-100 last:border-0">
              <h3 className="font-medium text-gray-900">{principle.title}</h3>
              <p className="text-gray-600 text-sm mt-1">{principle.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
