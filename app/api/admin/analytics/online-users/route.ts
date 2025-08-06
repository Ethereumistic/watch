import { NextResponse } from 'next/server';
import { createClient } from 'redis';
import { getProfile } from '../../../../../../webrtc-local-env/src/matchmaker'; // Assuming this path is accessible

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
    const onlineUserIds = await redis.sMembers('users:online');

    const profiles = await Promise.all(
      onlineUserIds.map(id => getProfile(id))
    );

    const validProfiles = profiles.filter(p => p !== null);

    // Process data for the different tabs
    const byCountry = validProfiles.reduce((acc, profile) => {
      const country = profile!.country || 'Unknown';
      if (!acc[country]) {
        acc[country] = { total: 0, male: 0, female: 0, couple: 0 };
      }
      acc[country].total++;
      if (profile!.gender) {
        acc[country][profile!.gender]++;
      }
      return acc;
    }, {} as Record<string, { total: number; male: number; female: number; couple: number; }>);

    const byGender = validProfiles.reduce((acc, profile) => {
        const gender = profile!.gender || 'unknown';
        if (!acc[gender]) {
            acc[gender] = { total: 0, countries: {} };
        }
        acc[gender].total++;
        const country = profile!.country || 'Unknown';
        if(!acc[gender].countries[country]) {
            acc[gender].countries[country] = 0;
        }
        acc[gender].countries[country]++;
        return acc;
    }, {} as Record<string, { total: number; countries: Record<string, number>}>)


    return NextResponse.json({ byCountry, byGender, filters: {} }); // Filters is a placeholder for now

  } catch (error: any) {
    console.error('[API Online Users ERROR]:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch online user data.' }),
      { status: 500 }
    );
  }
}
