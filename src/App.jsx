// src/App.jsx
import { useState, useEffect } from 'react';
import Header from './components/Header';
import PromptBuilder from './components/PromptBuilder';
import PromptLibrary from './components/PromptLibrary';
import PrinciplesList from './components/PrinciplesList';
import PitfallsList from './components/PitfallsList';
import GoalInput from './components/GoalInput';

function App() {
  const [savedPrompts, setSavedPrompts] = useState([]);

  // Load saved prompts from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('saved_prompts');
    if (stored) {
      setSavedPrompts(JSON.parse(stored));
    }
  }, []);

  // Save to localStorage whenever prompts change
  useEffect(() => {
    localStorage.setItem('saved_prompts', JSON.stringify(savedPrompts));
  }, [savedPrompts]);

  const handleSavePrompt = (prompt) => {
    setSavedPrompts(prev => [prompt, ...prev]);
  };

  const handleDeletePrompt = (id) => {
    setSavedPrompts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      <main className="container mx-auto px-6 py-8">
        <GoalInput />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PromptBuilder onSavePrompt={handleSavePrompt} />
          <PromptLibrary 
            prompts={savedPrompts} 
            onDeletePrompt={handleDeletePrompt} 
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PrinciplesList />
          <PitfallsList />
        </div>
      </main>
    </div>
  );
}

export default App;
