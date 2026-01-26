// src/lib/poeApi.js
export async function sendToPoe(prompt, apiKey) {
  const response = await fetch('https://api.poe.com/bot/ChatGPT', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: prompt,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  return data.text || data.response || JSON.stringify(data);
}
