import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-co.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ScriptureSheet = {
  id: string;
  pdf_url: string;
  week_date: string;
  anchor_scripture: string;
  supporting_scriptures: string | null;
  user_email: string;
  sermon_title: string | null;
  created_at: string;
  is_processed: boolean;
};

export const FALLBACK_SHEETS: ScriptureSheet[] = [
  {
    id: "fallback-1",
    week_date: "2026-05-03",
    anchor_scripture: "St. John 14:1-14",
    sermon_title: "5th Sunday of Easter",
    supporting_scriptures: "Acts 7:55-60 | Psalm 31:1-5, 15-16 | 1 Peter 2:2-10 | St. John 14:1-14",
    pdf_url: "",
    user_email: "christcathedralmembers@gmail.com",
    created_at: "2026-05-03T00:00:00.000Z",
    is_processed: true
  },
  {
    id: "fallback-2",
    week_date: "2026-05-10",
    anchor_scripture: "St. John 14:15-21",
    sermon_title: "6th Sunday of Easter - Mothers Day",
    supporting_scriptures: "Acts 17:22-31 | Psalm 66:8-20 | 1 Peter 3:13-22 | St. John 14:15-21",
    pdf_url: "",
    user_email: "christcathedralmembers@gmail.com",
    created_at: "2026-05-10T00:00:00.000Z",
    is_processed: true
  },
  {
    id: "fallback-3",
    week_date: "2026-05-17",
    anchor_scripture: "St. John 17:1-11",
    sermon_title: "7th Sunday of Easter",
    supporting_scriptures: "Acts 1:6-14 | Psalm 68:1-10, 32-35 | 1 Peter 4:12-14; 5:6-11 | St. John 17:1-11",
    pdf_url: "",
    user_email: "christcathedralmembers@gmail.com",
    created_at: "2026-05-17T00:00:00.000Z",
    is_processed: true
  },
  {
    id: "fallback-4",
    week_date: "2026-05-24",
    anchor_scripture: "St. John 7:37-39",
    sermon_title: "Day of Pentecost",
    supporting_scriptures: "Acts 2:1-21 | Psalm 104:24-35 | 1 Corinthians 12:3-13 | St. John 7:37-39",
    pdf_url: "",
    user_email: "christcathedralmembers@gmail.com",
    created_at: "2026-05-24T00:00:00.000Z",
    is_processed: true
  },
  {
    id: "fallback-5",
    week_date: "2026-05-31",
    anchor_scripture: "St. Matthew 28:16-20",
    sermon_title: "1st Sunday after Pentecost",
    supporting_scriptures: "Genesis 1:1-2:4 | Psalm 8 | 2 Corinthians 13:11-13 | St. Matthew 28:16-20",
    pdf_url: "",
    user_email: "christcathedralmembers@gmail.com",
    created_at: "2026-05-31T00:00:00.000Z",
    is_processed: true
  },
  {
    id: "fallback-6",
    week_date: "2026-06-07",
    anchor_scripture: "St. Matthew 9:9-13, 18-26",
    sermon_title: "2nd Sunday after Pentecost",
    supporting_scriptures: "Genesis 12:1-9 | Psalm 33:1-12 | Romans 4:13-25 | St. Matthew 9:9-13, 18-26",
    pdf_url: "",
    user_email: "christcathedralmembers@gmail.com",
    created_at: "2026-06-07T00:00:00.000Z",
    is_processed: true
  },
  {
    id: "fallback-7",
    week_date: "2026-06-14",
    anchor_scripture: "St. Matthew 9:35-10:8",
    sermon_title: "3rd Sunday after Pentecost",
    supporting_scriptures: "Genesis 18:1-15 | Psalm 116:1-2, 12-19 | Romans 5:1-8 | St. Matthew 9:35-10:8",
    pdf_url: "",
    user_email: "christcathedralmembers@gmail.com",
    created_at: "2026-06-14T00:00:00.000Z",
    is_processed: true
  },
  {
    id: "fallback-8",
    week_date: "2026-06-21",
    anchor_scripture: "St. Matthew 10:24-39",
    sermon_title: "4th Sunday after Pentecost - Fathers Day",
    supporting_scriptures: "Genesis 21:8-21 | Psalm 86:1-10, 16-17 | Romans 6:1-11 | St. Matthew 10:24-39",
    pdf_url: "",
    user_email: "christcathedralmembers@gmail.com",
    created_at: "2026-06-21T00:00:00.000Z",
    is_processed: true
  },
  {
    id: "fallback-9",
    week_date: "2026-06-28",
    anchor_scripture: "St. Matthew 10:40-42",
    sermon_title: "5th Sunday after Pentecost",
    supporting_scriptures: "Genesis 22:1-14 | Psalm 13 | Romans 6:12-23 | St. Matthew 10:40-42",
    pdf_url: "",
    user_email: "christcathedralmembers@gmail.com",
    created_at: "2026-06-28T00:00:00.000Z",
    is_processed: true
  }
];
