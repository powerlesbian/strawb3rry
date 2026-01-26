// src/components/ApiKeySettings.jsx
import { useState, useEffect } from 'react';
import { Card, CardContent, Button, Input } from "@/components/ui";

export default function ApiKeySettings() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const storedKey = localStorage.getItem('poe_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setSaved(true);
    }
  }, []);

  const saveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('poe_api_key', apiKey.trim());
      setSaved(true);
      alert('API key saved!');
    }
  };

  const clearKey = () => {
    localStorage.removeItem('poe_api_key');
    setApiKey('');
    setSaved(false);
  };

  return (
    <Card className="shadow-lg border border-gray-100 mb-6">
      <CardContent className="p-6">
        <h2 className="text-lg font-semibold mb-3 text-gray-900">API Settings</h2>
        <div className="flex gap-3">
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Poe API key"
            className="flex-1"
          />
          <Button 
            onClick={saveKey}
            className="px-4 bg-gray-900 text-white"
          >
            {saved ? 'Update' : 'Save'}
          </Button>
          {saved && (
            <Button 
              onClick={clearKey}
              className="px-4 bg-red-600 text-white"
            >
              Clear
            </Button>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Get your API key from <a href="https://poe.com/api_key" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">poe.com/api_key</a>
        </p>
      </CardContent>
    </Card>
  );
}
