import { NextResponse } from 'next/server';
import { createClient } from 'redis';
import { getProfile } from '../../../../../../webrtc-local-env/src/matchmaker';

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

export async function GET() {
  try {
    const redis = await getRedisClient();
    const activeMatches = await redis.hGetAll('active_matches');
    
    const matches = [];
    const processed = new Set();

    for (const userAId in activeMatches) {
      if (processed.has(userAId)) continue;
      
      const userBId = activeMatches[userAId];
      if (userBId && !userBId.includes(':start_time')) {
        const [profileA, profileB] = await Promise.all([
          getProfile(userAId),
          getProfile(userBId),
        ]);

        if (profileA && profileB) {
          matches.push({ userA: profileA, userB: profileB });
          processed.add(userAId);
          processed.add(userBId);
        }
      }
    }

    return NextResponse.json({ matches });

  } catch (error: any) {
    console.error('[API Active Matches ERROR]:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch active match data.' }),
      { status: 500 }
    );
  }
}
