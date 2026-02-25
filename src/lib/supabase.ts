
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'cyan';

export type Project = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  context_markdown: string;
  learnings_summary: string;
  color: ProjectColor;
  created_at: string;
  updated_at: string;
};

export const PROJECT_COLORS: { name: ProjectColor; bg: string; border: string; hover: string }[] = [
  { name: 'red', bg: 'bg-red-500', border: 'border-red-500', hover: 'hover:border-red-400' },
  { name: 'orange', bg: 'bg-orange-500', border: 'border-orange-500', hover: 'hover:border-orange-400' },
  { name: 'yellow', bg: 'bg-yellow-500', border: 'border-yellow-500', hover: 'hover:border-yellow-400' },
  { name: 'green', bg: 'bg-green-500', border: 'border-green-500', hover: 'hover:border-green-400' },
  { name: 'blue', bg: 'bg-blue-500', border: 'border-blue-500', hover: 'hover:border-blue-400' },
  { name: 'purple', bg: 'bg-purple-500', border: 'border-purple-500', hover: 'hover:border-purple-400' },
  { name: 'pink', bg: 'bg-pink-500', border: 'border-pink-500', hover: 'hover:border-pink-400' },
  { name: 'cyan', bg: 'bg-cyan-500', border: 'border-cyan-500', hover: 'hover:border-cyan-400' },
];

export type Prompt = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  tags: string[];
  llm_tags: string[];
  notes: string | null;
  share_token: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};

export type LearningCategory = 'mistake' | 'insight' | 'decision';

export type Learning = {
  id: string;
  user_id: string;
  project_id: string | null;
  content: string;
  category: LearningCategory;
  created_at: string;
};

// LLM options
export const TEXT_LLMS = [
  'Claude 3.5 Sonnet',
  'Claude 4 Opus', 
  'Claude 4 Sonnet',
  'DeepSeek V3',
  'DeepSeek R1',
  'DeepSeek Coder',
  'GPT-4o',
  'GPT-4.5',
  'GPT-o1',
  'GPT-o3-mini',
  'Gemini 2.0 Flash',
  'Gemini 2.0 Pro',
  'Qwen',
  'Llama (local)',
  'Mistral',
  'Grok',
] as const;

export const IMAGE_LLMS = [
  'Midjourney',
  'DALL·E 3',
  'Stable Diffusion',
  'Flux',
  'Ideogram',
  'Adobe Firefly',
  'Leonardo.ai',
] as const;

export const ALL_LLMS = [...TEXT_LLMS, ...IMAGE_LLMS] as const;