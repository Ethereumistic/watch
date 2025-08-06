import { NextResponse } from 'next/server';
import { createClient } from 'redis';
import { nanoid } from 'nanoid';

// --- Redis Client Setup ---
// Establish a single client instance that can be reused.
const redisClient = createClient({
  url: `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

// Ensure the client is connected before handling requests.
async function getRedisClient() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
}

// --- In-memory Match Log (for demonstration) ---
let recentMatches: Array<{ id: string, type: 'real' | 'bot', userA: string, partner: string, timestamp: string }> = [];

// --- Main API Route Handler ---
export async function GET() {
  try {
    const redis = await getRedisClient();

    // 1. Get Live Stats
    const onlineUsers = await redis.sCard('users:online');
    const activeMatches = (await redis.hLen('active_matches')) / 2;

    // 2. Safely get all queue keys using SCAN
    let queueKeys: string[] = [];
    let cursor = '0'; // Start cursor as a string for sendCommand
    do {
      // Use sendCommand for the most robust, protocol-level access to SCAN
      const reply = await redis.sendCommand(['SCAN', cursor, 'MATCH', 'queue:*:*', 'COUNT', '100']);
      cursor = reply[0] as string;
      queueKeys.push(...(reply[1] as string[]));
    } while (cursor !== '0');

    // 3. Get Queue Breakdown and Total Users in Queue
    let usersInQueue = 0;
    const queuePromises = queueKeys.map(async (key) => {
      const count = await redis.zCard(key);
      usersInQueue += count;
      return { name: key, count };
    });
    
    let queues = await Promise.all(queuePromises);
    queues = queues.filter(q => q.count > 0).sort((a, b) => b.count - a.count);

    const stats = { onlineUsers, usersInQueue, activeMatches: Math.floor(activeMatches) };
    
    // 4. Get Match Logs
    const matchLogs = [...recentMatches].reverse();

    return NextResponse.json({ stats, queues, matchLogs });

  } catch (error: any) {
    console.error('[ADMIN ANALYTICS API ERROR]:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch analytics data.', details: error.message }),
      { status: 500 }
    );
  }
}

// --- Helper for logging matches (called from another service) ---
// NOTE: In a real microservices architecture, this would likely be its own
// dedicated endpoint or use a message queue for reliability.
export function logMatch(userA: string, partner: any) {
    const entry = {
        id: nanoid(),
        type: typeof partner === 'string' ? 'real' : 'bot',
        userA: userA,
        partner: typeof partner === 'string' ? partner : partner.profile.id,
        timestamp: new Date().toISOString(),
    };
    recentMatches.unshift(entry);
    if (recentMatches.length > 50) {
        recentMatches.pop();
    }
}
