// src/components/CollapsibleSection.jsx
import { useState } from 'react';

export default function CollapsibleSection({ title, children }) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-2xl font-bold">{title}</h2>
        <button className="text-gray-500">
          {isExpanded ? '▲ Hide' : '▼ Show'}
        </button>
      </div>
      {isExpanded && (
        <div className="mt-4">
          {children}
        </div>
      )}
    </div>
  );
}
