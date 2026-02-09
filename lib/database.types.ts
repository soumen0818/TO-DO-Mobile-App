// Database type definitions for Supabase
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          image_url?: string | null
          updated_at?: string
        }
      }
      todos: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          is_completed: boolean
          due_date: string | null
          due_time: string | null
          priority: 'high' | 'medium' | 'low'
          category: 'daily' | 'weekly' | 'monthly' | null
          is_recurring: boolean | null
          recurring_pattern: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          is_completed?: boolean
          due_date?: string | null
          due_time?: string | null
          priority: 'high' | 'medium' | 'low'
          category?: 'daily' | 'weekly' | 'monthly' | null
          is_recurring?: boolean | null
          recurring_pattern?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          is_completed?: boolean
          due_date?: string | null
          due_time?: string | null
          priority?: 'high' | 'medium' | 'low'
          category?: 'daily' | 'weekly' | 'monthly' | null
          is_recurring?: boolean | null
          recurring_pattern?: string | null
          updated_at?: string
          completed_at?: string | null
        }
      }
      feedback: {
        Row: {
          id: string
          user_id: string
          user_email: string
          user_name: string | null
          type: 'feature' | 'bug'
          title: string
          description: string | null
          status: 'pending' | 'reviewed' | 'resolved'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          user_email: string
          user_name?: string | null
          type: 'feature' | 'bug'
          title: string
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          user_email?: string
          user_name?: string | null
          type?: 'feature' | 'bug'
          title?: string
          description?: string | null
          status?: 'pending' | 'reviewed' | 'resolved'
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
