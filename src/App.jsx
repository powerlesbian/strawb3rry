// src/components/App.jsx
import { useState } from 'react';
import Header from './components/Header';
import PromptBuilder from './components/PromptBuilder';
import PromptLibrary from './components/PromptLibrary';
import PrinciplesList from './components/PrinciplesList';
import PitfallsList from './components/PitfallsList';
import GoalInput from './components/GoalInput';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      <main className="container mx-auto px-6 py-8">
        <GoalInput />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <PromptBuilder />
          <PromptLibrary />
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
