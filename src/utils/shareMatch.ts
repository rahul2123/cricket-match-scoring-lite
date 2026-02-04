import { supabase, getUserId, type MatchRecord } from './supabase';
import type { MatchState } from '../types';

// Generate a random 6-character match code
function generateMatchCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous characters
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Check if a match code already exists
async function matchCodeExists(code: string): Promise<boolean> {
    const { data, error } = await supabase
        .from('matches')
        .select('match_code')
        .eq('match_code', code)
        .single();

    return !error && data !== null;
}

// Generate a unique match code
async function generateUniqueMatchCode(): Promise<string> {
    let code = generateMatchCode();
    let attempts = 0;

    while (await matchCodeExists(code) && attempts < 10) {
        code = generateMatchCode();
        attempts++;
    }

    if (attempts >= 10) {
        throw new Error('Failed to generate unique match code');
    }

    return code;
}

// Create a new shared match
export async function createSharedMatch(matchState: MatchState): Promise<string | null> {
    try {
        const userId = await getUserId();
        if (!userId) {
            throw new Error('User not authenticated');
        }

        const matchCode = await generateUniqueMatchCode();

        const matchRecord: Omit<MatchRecord, 'id' | 'created_at' | 'updated_at'> = {
            match_code: matchCode,
            created_by: userId,
            match_state: matchState,
        };

        const { error } = await supabase
            .from('matches')
            .insert(matchRecord);

        if (error) {
            console.error('Error creating shared match:', error);
            return null;
        }

        return matchCode;
    } catch (error) {
        console.error('Error in createSharedMatch:', error);
        return null;
    }
}

// Update an existing shared match
export async function updateSharedMatch(matchCode: string, matchState: MatchState): Promise<boolean> {
    try {
        const userId = await getUserId();
        if (!userId) {
            throw new Error('User not authenticated');
        }

        const { error } = await supabase
            .from('matches')
            .update({ match_state: matchState })
            .eq('match_code', matchCode)
            .eq('created_by', userId); // Ensure only creator can update

        if (error) {
            console.error('Error updating shared match:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in updateSharedMatch:', error);
        return false;
    }
}

// Get a match by code
export async function getMatchByCode(matchCode: string): Promise<MatchState | null> {
    try {
        const { data, error } = await supabase
            .from('matches')
            .select('match_state')
            .eq('match_code', matchCode)
            .single();

        if (error || !data) {
            console.error('Error fetching match:', error);
            return null;
        }

        return data.match_state as MatchState;
    } catch (error) {
        console.error('Error in getMatchByCode:', error);
        return null;
    }
}

// Subscribe to real-time updates for a match
export function subscribeToMatch(
    matchCode: string,
    onUpdate: (matchState: MatchState) => void
) {
    const channel = supabase
        .channel(`match:${matchCode}`)
        .on(
            'postgres_changes',
            {
                event: 'UPDATE',
                schema: 'public',
                table: 'matches',
                filter: `match_code=eq.${matchCode}`,
            },
            (payload: any) => {
                if (payload.new && 'match_state' in payload.new) {
                    onUpdate(payload.new.match_state as MatchState);
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
}

// Delete a shared match (stop sharing)
export async function deleteSharedMatch(matchCode: string): Promise<boolean> {
    try {
        const userId = await getUserId();
        if (!userId) {
            throw new Error('User not authenticated');
        }

        const { error } = await supabase
            .from('matches')
            .delete()
            .eq('match_code', matchCode)
            .eq('created_by', userId); // Ensure only creator can delete

        if (error) {
            console.error('Error deleting shared match:', error);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error in deleteSharedMatch:', error);
        return false;
    }
}
