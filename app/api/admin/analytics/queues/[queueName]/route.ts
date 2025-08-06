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

export async function GET(
  request: Request,
  { params }: { params: { queueName: string } }
) {
  const queueName = decodeURIComponent(params.queueName);

  try {
    const redis = await getRedisClient();
    const userIds = await redis.zRange(queueName, 0, -1);

    const users = await Promise.all(
      userIds.map(async (userId) => {
        const cooldowns = await redis.sMembers(`cooldown:${userId}`);
        return { id: userId, cooldowns };
      })
    );

    return NextResponse.json({ users });
  } catch (error: any) {
    console.error(`Failed to fetch users for queue ${queueName}:`, error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to fetch queue details.' }),
      { status: 500 }
    );
  }
}
