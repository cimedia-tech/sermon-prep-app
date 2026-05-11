import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ScriptureSheet = {
  id: string;
  pdf_url: string;
  week_date: string;
  anchor_scripture: string;
  user_email: string;
  sermon_title: string | null;
  created_at: string;
  is_processed: boolean;
};
