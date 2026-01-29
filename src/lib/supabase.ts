//Create src/lib/supabase.ts
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

export type Project = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  context_markdown: string;
  learnings_summary: string;
  created_at: string;
  updated_at: string;
};

export type ProjectAttachment = {
  id: string;
  project_id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  created_at: string;
};

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