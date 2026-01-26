// src/components/App.jsx
import { useState } from 'react';
import Header from './Header';
import PromptBuilder from './PromptBuilder';
import PromptLibrary from './PromptLibrary';
import PrinciplesList from './PrinciplesList';
import PitfallsList from './PitfallsList';
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
