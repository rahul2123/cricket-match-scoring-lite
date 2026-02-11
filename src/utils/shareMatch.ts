import { supabase, getUserId, type SessionRecord, type MatchRecord } from './supabase';
import type { MatchState } from '../types';

// Generate a random 6-character session code
function generateSessionCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous characters
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Check if a session code already exists
async function sessionCodeExists(code: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('sessions')
        .select('session_code')
        .eq('session_code', code)
        .single();

    return !error && data !== null;
}

// Generate a unique session code
async function generateUniqueSessionCode(): Promise<string> {
    let code = generateSessionCode();
    let attempts = 0;

    while (await sessionCodeExists(code) && attempts < 10) {
        code = generateSessionCode();
        attempts++;
    }

    if (attempts >= 10) {
        throw new Error('Failed to generate unique session code');
    }

    return code;
}

// Create a new shared session
export async function createSharedSession(): Promise<string | null> {
    try {
        const userId = await getUserId();
        if (!userId) {
            throw new Error('User not authenticated');
        }

        const sessionCode = await generateUniqueSessionCode();

        const sessionRecord: Omit<SessionRecord, 'id' | 'created_at' | 'updated_at'> = {
            session_code: sessionCode,
            created_by: userId,
        };

        const { error } = await supabase
            .from('sessions')
            .insert(sessionRecord);

        if (error) {
            console.error('Error creating shared session:', error);
            return null;
        }

        return sessionCode;
    } catch (error) {
        console.error('Error in createSharedSession:', error);
        return null;
    }
}

// Get the next match number for a session
async function getNextMatchNumber(sessionCode: string): Promise<number> {
    const { data, error } = await supabase
        .from('matches')
        .select('match_number')
        .eq('session_code', sessionCode)
        .order('match_number', { ascending: false })
        .limit(1)
        .single();

    if (error || !data) {
        return 1; // First match
    }

    return data.match_number + 1;
}

// Create or update a match in a session
export async function saveMatchToSession(
    sessionCode: string,
    matchState: MatchState,
    matchNumber?: number
): Promise<number | null> {
    try {
        const userId = await getUserId();
        if (!userId) {
            throw new Error('User not authenticated');
        }

        // If no match number provided, get the next one
        const finalMatchNumber = matchNumber || await getNextMatchNumber(sessionCode);

        // Check if this match already exists
        const { data: existingMatch } = await supabase
            .from('matches')
            .select('id')
            .eq('session_code', sessionCode)
            .eq('match_number', finalMatchNumber)
            .maybeSingle();

        if (existingMatch) {
            // Update existing match
            const { error } = await supabase
                .from('matches')
                .update({ match_state: matchState })
                .eq('session_code', sessionCode)
                .eq('match_number', finalMatchNumber)
                .eq('created_by', userId);

            if (error) {
                console.error('Error updating match:', error);
                return null;
            }
        } else {
            // Create new match
            const matchRecord: Omit<MatchRecord, 'id' | 'created_at' | 'updated_at'> = {
                session_code: sessionCode,
                match_number: finalMatchNumber,
                created_by: userId,
                match_state: matchState,
            };

            const { error } = await supabase
                .from('matches')
                .insert(matchRecord);

            if (error) {
                console.error('Error creating match:', error);
                return null;
            }
        }

        return finalMatchNumber;
    } catch (error) {
        console.error('Error in saveMatchToSession:', error);
        return null;
    }
}

// Get the latest match from a session
export async function getLatestMatchFromSession(sessionCode: string): Promise<{ matchState: MatchState; matchNumber: number } | null> {
    try {
        const { data, error } = await supabase
            .from('matches')
            .select('match_state, match_number')
            .eq('session_code', sessionCode)
            .order('match_number', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error || !data) {
            console.error('Error fetching latest match:', error);
            return null;
        }

        return {
            matchState: data.match_state as MatchState,
            matchNumber: data.match_number,
        };
    } catch (error) {
        console.error('Error in getLatestMatchFromSession:', error);
        return null;
    }
}

// Subscribe to real-time updates for a session (watches for new matches and updates)
export function subscribeToSession(
    sessionCode: string,
    onUpdate: (matchState: MatchState, matchNumber: number) => void
) {
    const channel = supabase
        .channel(`session:${sessionCode}`)
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'matches',
                filter: `session_code=eq.${sessionCode}`,
            },
            async (payload: any) => {
                if (payload.new && 'match_state' in payload.new) {
                    onUpdate(payload.new.match_state as MatchState, payload.new.match_number);
                }
            }
        )
        .subscribe((status) => {
            if (status === 'CHANNEL_ERROR') {
                console.error('Subscription error for session:', sessionCode);
            } else if (status === 'TIMED_OUT') {
                console.error('Subscription timed out for session:', sessionCode);
            }
        });

    return () => {
        supabase.removeChannel(channel);
    };
}

// Delete a shared session (stop sharing)
export async function deleteSharedSession(sessionCode: string): Promise<boolean> {
    try {
        const userId = await getUserId();
        if (!userId) {
            throw new Error('User not authenticated');
        }

        // Delete all matches in the session
        await supabase
            .from('matches')
            .delete()
            .eq('session_code', sessionCode)
            .eq('created_by', userId);

        // Delete the session
        const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('session_code', sessionCode)
            .eq('created_by', userId);

        if (error) {
            console.error('Error deleting shared session:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in deleteSharedSession:', error);
        return false;
    }
}

// Check if a session exists
export async function sessionExists(sessionCode: string): Promise<boolean> {
    return await sessionCodeExists(sessionCode);
}
