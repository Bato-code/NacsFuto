import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; matric_number: string; name: string; username: string | null; email: string | null; is_admin: boolean | null; created_at: string | null; updated_at: string | null }
      }
      users: {
        Row: { id: string; email: string; name: string; role: string | null; avatar_url: string | null; created_at: string | null; updated_at: string | null; matric_number: string | null }
      }
      whitelisted_matric_numbers: {
        Row: { matric_number: string; created_at: string | null; is_active: boolean | null }
      }
      posts: {
        Row: { id: string; author_id: string; author_name: string; content: string; media: any; likes: number | null; approved: boolean | null; pending: boolean | null; created_at: string | null; updated_at: string | null; liked_by: string[] | null; timestamp: string | null; likedBy: string[] | null }
      }
      comments: {
        Row: { id: string; post_id: string; author: string; author_id: string | null; content: string; timestamp: string | null; created_at: string | null; updated_at: string | null }
      }
      post_likes: {
        Row: { id: string; post_id: string; user_id: string; created_at: string | null }
      }
      courses: {
        Row: { id: string; title: string; category: string; level: string; duration: string; description: string; topics: string[] | null; instructor: string; type: string; approved: boolean | null; students: number | null; rating: number | null; author_id: string | null; author_name: string | null; media: any; created_at: string | null; updated_at: string | null }
      }
      materials: {
        Row: { id: string; title: string; course_code: string; level: string; semester: string; file_url: string; file_name: string; file_size: number; file_type: string; description: string | null; uploaded_by: string; download_count: number | null; created_at: string | null; updated_at: string | null }
      }
      lecture_notes: {
        Row: { id: string; title: string; course_code: string; topic: string; level: string; semester: string; file_url: string; file_name: string; file_size: number; file_type: string; description: string | null; uploaded_by: string; download_count: number | null; created_at: string | null; updated_at: string | null }
      }
      material_downloads: {
        Row: { id: string; material_id: string | null; user_id: string | null; downloaded_at: string | null }
      }
      anonymous_reports: {
        Row: { id: string; category: string; subject: string; message: string; contact_info: string | null; status: string | null; created_at: string | null; updated_at: string | null; submitter_id: string | null }
      }
      contact_messages: {
        Row: { id: string; name: string; email: string; subject: string; message: string; status: string | null; created_at: string | null; updated_at: string | null }
      }
      election_candidates: {
        Row: { id: string; name: string; position: string; image_url: string | null; status: string; created_at: string | null }
      }
      election_settings: {
        Row: { id: number; election_open: boolean; results_visible: boolean; allow_changes: boolean; updated_at: string | null }
      }
      election_submissions: {
        Row: { id: string; voter_id: string; submitted_at: string | null }
      }
      election_votes: {
        Row: { id: string; voter_id: string; position: string; candidate_id: string; voted_at: string | null }
      }
    }
  }
}
