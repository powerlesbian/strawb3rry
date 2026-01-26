const prompts = [
  {
    id: 1,
    title: "Code Review",
    prompt: "Review the following code for bugs, security vulnerabilities, and suggest improvements for readability and performance. Provide specific line numbers where applicable.",
    category: "Coding"
  },
  {
    id: 2,
    title: "Creative Writing",
    prompt: "Write a short, engaging story about a detective who solves a mystery using only historical records from the 1920s. The tone should be mysterious and atmospheric.",
    category: "Creative"
  },
  {
    id: 3,
    title: "Data Analysis",
    prompt: "Analyze the attached CSV data. Identify the top 3 trends and provide a brief explanation for each. Present your findings in a bulleted list.",
    category: "Analysis"
  }
];

export default function PromptLibrary() {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">Prompt Library</h2>
      <div className="space-y-4">
        {prompts.map(prompt => (
          <div key={prompt.id} className="border-b pb-4">
            <h3 className="font-semibold">{prompt.title}</h3>
            <p className="text-gray-600 text-sm mt-1">{prompt.prompt}</p>
            <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-200 rounded">{prompt.category}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
