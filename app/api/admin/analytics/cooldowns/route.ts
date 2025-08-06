import { NextResponse } from 'next/server';
import { createClient } from 'redis';

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

export async function DELETE(request: Request) {
  try {
    const { userId, botId } = await request.json();

    if (!userId || !botId) {
      return new NextResponse(
        JSON.stringify({ error: 'userId and botId are required.' }),
        { status: 400 }
      );
    }

    const redis = await getRedisClient();
    const cooldownKey = `cooldown:${userId}`;

    if (botId === 'all') {
      await redis.del(cooldownKey);
    } else {
      await redis.sRem(cooldownKey, botId);
    }

    return NextResponse.json({ success: true, message: `Cooldown for ${botId} removed from user ${userId}.` });

  } catch (error: any) {
    console.error('Cooldown Deletion API Error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to delete cooldown.' }),
      { status: 500 }
    );
  }
}
