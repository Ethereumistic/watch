// /pages/api/admin/bots/[id].ts

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

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await isAdmin(request)) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const updatedFields = await request.json();
    console.log(`[PUT /api/admin/bots/${params.id}] Updating with:`, updatedFields);
    const { data, error } = await supabase
      .from('bots')
      .update(updatedFields)
      .eq('id', params.id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      console.warn(`[PUT /api/admin/bots/${params.id}] Bot not found.`);
      return new NextResponse(JSON.stringify({ error: 'Bot not found.' }), { status: 404 });
    }

    return NextResponse.json(data[0]);
  } catch (error: any) {
    console.error(`[PUT /api/admin/bots/${params.id}] Failed to update bot:`, error.message);
    return new NextResponse(JSON.stringify({ error: 'Failed to update bot.', details: error.message }), { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!await isAdmin(request)) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { error } = await supabase.from('bots').delete().eq('id', params.id);
    if (error) throw error;
    console.log(`[DELETE /api/admin/bots/${params.id}] Bot deleted successfully.`);
    return new NextResponse(null, { status: 204 });
  } catch (error: any) {
    console.error(`[DELETE /api/admin/bots/${params.id}] Failed to delete bot:`, error.message);
    return new NextResponse(JSON.stringify({ error: 'Failed to delete bot.', details: error.message }), { status: 500 });
  }
}
