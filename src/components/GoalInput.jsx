// src/components/GoalInput.jsx
import { useState } from 'react';
import { Card, CardContent, Textarea, Button } from "@/components/ui"; // Note the new import path

export default function GoalInput() {
  const [goal, setGoal] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("User's goal:", goal);
    setGoal('');
  };

  return (
    <Card className="shadow-lg border border-gray-100 mb-8">
      <CardContent className="p-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">What do you need help with?</h2>
        <form onSubmit={handleSubmit}>
          <Textarea
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            className="w-full p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={4}
            placeholder="Describe your task or problem here..."
          />
          <Button 
            type="submit" 
            className="mt-4 px-6 py-2.5 font-medium rounded-xl shadow-md hover:shadow-lg transition-all duration-200 bg-gray-900 text-black"
          >
            Set Goal
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
