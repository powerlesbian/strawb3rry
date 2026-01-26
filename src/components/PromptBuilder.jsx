// src/components/PromptBuilder.jsx
import { Card, CardContent, Select, Button } from "@/components/ui"; // Note the new import path

export default function PromptBuilder() {
  return (
    <Card className="shadow-lg border border-gray-100">
      <CardContent className="p-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Prompt Builder</h2>
        <div className="space-y-4">
          <div>
            <Select>
              <option>Select a task...</option>
            </Select>
          </div>
          <div>
            <Select>
              <option>Select a tone...</option>
            </Select>
          </div>
          <div>
            <Select>
              <option>Select a length...</option>
            </Select>
          </div>
          <Button className="w-full py-3 font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200">
            Generate Prompt
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
