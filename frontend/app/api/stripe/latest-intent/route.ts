import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
        return NextResponse.json({ error: 'Missing customerId' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
        .from('stripe_intents')
        .select('payment_intent_id, client_secret, created_at')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        clientSecret: data?.client_secret ?? null,
        paymentIntentId: data?.payment_intent_id ?? null,
        createdAt: data?.created_at ?? null,
    });
}