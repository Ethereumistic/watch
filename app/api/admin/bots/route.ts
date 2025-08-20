import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to check for admin role
async function isAdmin(request: NextRequest): Promise<boolean> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) return false;

  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return false;
  
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (error || !profile) return false;

  return profile.role === 'admin';
}

export async function GET(request: NextRequest) {
  if (!await isAdmin(request)) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { data: bots, error } = await supabase.from('bots').select('*');
    if (error) throw error;
    return NextResponse.json(bots);
  } catch (error: any) {
    console.error('Failed to fetch bots:', error.message);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch bots.', details: error.message }), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!await isAdmin(request)) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const newBot = await request.json();
    const { data, error } = await supabase.from('bots').insert([newBot]).select();
    if (error) throw error;
    return NextResponse.json(data[0]);
  } catch (error: any) {
    console.error('Failed to create bot:', error.message);
    return new NextResponse(JSON.stringify({ error: 'Failed to create bot.', details: error.message }), { status: 500 });
  }
}
