import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// TODO: Replace these with your actual Supabase project credentials
// Get these from: https://app.supabase.com/project/_/settings/api
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
    },
    realtime: {
        params: {
            eventsPerSecond: 10,
        },
    },
});

// Database types
export interface SessionRecord {
    id?: number;
    session_code: string;
    created_by: string;
    created_at?: string;
    updated_at?: string;
}

export interface MatchRecord {
    id?: number;
    session_code: string;
    match_number: number;
    created_by: string;
    match_state: any; // JSON field containing the full MatchState
    created_at?: string;
    updated_at?: string;
}

// Initialize anonymous authentication
export async function initAuth() {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
        console.error('Error signing in anonymously:', error);
        return null;
    }
    return data.user;
}

// Get current user ID
export async function getUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // Try to sign in anonymously if no user
        const newUser = await initAuth();
        return newUser?.id || null;
    }

    return user.id;
}
