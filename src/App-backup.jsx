import { useState } from 'react';
import Header from './components/Header';
import PromptBuilder from './components/PromptBuilder';
import PromptLibrary from './components/PromptLibrary';
import PrinciplesList from './components/PrinciplesList';
import PitfallsList from './components/PitfallsList';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <PromptBuilder />
          <PromptLibrary />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <PrinciplesList />
          <PitfallsList />
        </div>
      </main>
    </div>
  );
}

export default App;
