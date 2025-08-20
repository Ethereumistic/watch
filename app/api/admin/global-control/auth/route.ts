import { NextResponse } from 'next/server';
import { createClient } from 'redis';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

const GLOBAL_AUTH_ENABLED_KEY = "global:auth:enabled";

// --- Redis Client Setup ---
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});
redisClient.on('error', (err) => console.error('Redis Client Error', err));

async function getRedisClient() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
}

// --- Supabase Client for Auth Check ---
const supabase = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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
  try {
    const redis = await getRedisClient();
    const isAuthEnabled = (await redis.get(GLOBAL_AUTH_ENABLED_KEY)) !== 'false';
    return NextResponse.json({ isAuthEnabled });
  } catch (error: any) {
    console.error('Failed to fetch auth state:', error.message);
    return new NextResponse(JSON.stringify({ error: 'Failed to fetch auth state.' }), { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!await isAdmin(request)) {
    return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  try {
    const { isAuthEnabled } = await request.json();
    const redis = await getRedisClient();
    await redis.set(GLOBAL_AUTH_ENABLED_KEY, isAuthEnabled ? 'true' : 'false');
    return NextResponse.json({ success: true, isAuthEnabled });
  } catch (error: any) {
    console.error('Failed to set auth state:', error.message);
    return new NextResponse(JSON.stringify({ error: 'Failed to set auth state.' }), { status: 500 });
  }
}
