'use server';

import { supabaseAdmin } from '@/lib/supabase-server';
import { auth } from '@clerk/nextjs/server';
import crypto from 'crypto';

const PEPPER = process.env.API_KEY_PEPPER;

if (!PEPPER) {
    // Warn but don't crash dev if missing, but it will fail creation.
    console.warn("API_KEY_PEPPER not set in environment!");
}

export type ApiKey = {
    id: string;
    name: string;
    prefix: string;
    created_at: string;
    last_used_at: string | null;
    status: 'active' | 'revoked';
}

export async function getApiKeys(): Promise<{ success: boolean; data?: ApiKey[]; error?: string }> {
    try {
        const session = await auth();
        const userId = session.userId;

        if (!userId) {
            return { success: false, error: 'Unauthorized' };
        }

        const { data, error } = await supabaseAdmin
            .from('api_keys')
            .select('id, name, prefix, created_at, last_used_at, status')
            .eq('account_id', userId)
            .eq('status', 'active') // Only show active keys? Or all? Let's show all for now but usually we hide revoked.
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Fetch keys error:", error);
            return { success: false, error: 'Database error' };
        }

        return { success: true, data: data as ApiKey[] };
    } catch (error) {
        console.error("Get keys exception:", error);
        return { success: false, error: 'Internal server error' };
    }
}

export async function createApiKey(name: string): Promise<{ success: boolean; key?: string; error?: string }> {
    try {
        const session = await auth();
        const userId = session.userId;

        if (!userId) {
            return { success: false, error: 'Unauthorized' };
        }

        if (!PEPPER) {
            return { success: false, error: 'Server misconfiguration (PEPPER)' };
        }

        // Generate Key
        // Format: bs_<prefix 8 chars>_<secret 32 chars>
        const randomBytes = crypto.randomBytes(24); // 48 chars hex roughly
        const secret = randomBytes.toString('hex');
        const prefix = secret.substring(0, 8);
        const fullKey = `bs_${prefix}_${secret}`;

        // Hash Logic must match Python:
        // salted_key = f"{api_key}{settings.API_KEY_PEPPER}"
        // hashed = sha256(salted_key)

        const salted = `${fullKey}${PEPPER}`;
        const hash = crypto.createHash('sha256').update(salted).digest('hex');

        // Insert into DB
        const { error } = await supabaseAdmin
            .from('api_keys')
            .insert({
                account_id: userId,
                name: name,
                prefix: prefix,
                key_hash: hash,
                status: 'active'
            });

        if (error) {
            console.error("Create key error:", error);
            if (error.code === '23505') { // Unique violation on prefix
                return { success: false, error: 'Collision, please try again.' };
            }
            return { success: false, error: 'Database error' };
        }

        return { success: true, key: fullKey };

    } catch (error) {
        console.error("Create key exception:", error);
        return { success: false, error: 'Internal server error' };
    }
}

export async function revokeApiKey(keyId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await auth();
        const userId = session.userId;

        if (!userId) {
            return { success: false, error: 'Unauthorized' };
        }

        const { error } = await supabaseAdmin
            .from('api_keys')
            .update({ status: 'revoked' })
            .eq('id', keyId)
            .eq('account_id', userId);

        if (error) {
            console.error("Revoke key error:", error);
            return { success: false, error: 'Database error' };
        }

        return { success: true };
    } catch (error) {
        console.error("Revoke key exception:", error);
        return { success: false, error: 'Internal server error' };
    }
}
