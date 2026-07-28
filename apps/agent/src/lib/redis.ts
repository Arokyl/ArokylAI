import { Redis } from 'ioredis'

export type RedisLike = {
  get: (key: string) => Promise<string | null>
  setex: (key: string, ttl: number, value: string) => Promise<void>
  del: (key: string) => Promise<number>
  keys: (pattern: string) => Promise<string[]>
  expire: (key: string, ttl: number) => Promise<number>
}

export type RedisStore = {
  available: boolean
  get: (key: string) => Promise<string | null>
  set: (key: string, value: string, ttl?: number) => Promise<void>
  del: (key: string) => Promise<void>
  isAvailable: () => boolean
}

export function createRedisStore(name: string, url?: string): RedisStore {
  let redisAvailable = false
  let client: Redis | undefined
  const fallback = new Map<string, { value: string; expiresAt: number }>()

  const cleanExpired = () => {
    const now = Date.now()
    for (const [key, entry] of fallback) {
      if (entry.expiresAt > 0 && entry.expiresAt <= now) {
        fallback.delete(key)
      }
    }
  }

  const getFallback = (key: string): string | null => {
    cleanExpired()
    const entry = fallback.get(key)
    if (!entry) return null
    if (entry.expiresAt > 0 && entry.expiresAt <= Date.now()) {
      fallback.delete(key)
      return null
    }
    return entry.value
  }

  const setFallback = (key: string, value: string, ttlSeconds?: number) => {
    fallback.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0,
    })
  }

  const redisGet = async (key: string): Promise<string | null> => {
    if (redisAvailable && client) {
      try {
        return await client.get(key)
      } catch {
        redisAvailable = false
      }
    }
    return getFallback(key)
  }

  const redisSet = async (key: string, value: string, ttlSeconds?: number) => {
    if (redisAvailable && client) {
      try {
        if (ttlSeconds && ttlSeconds > 0) {
          await client.setex(key, ttlSeconds, value)
        } else {
          await client.set(key, value)
        }
        return
      } catch {
        redisAvailable = false
      }
    }
    setFallback(key, value, ttlSeconds)
  }

  const redisDel = async (key: string) => {
    if (redisAvailable && client) {
      try {
        await client.del(key)
        return
      } catch {
        redisAvailable = false
      }
    }
    fallback.delete(key)
  }

  let connectPromise: Promise<void> | undefined

  const connect = async (): Promise<void> => {
    if (connectPromise) return connectPromise
    if (!url) return

    connectPromise = (async () => {
      try {
        client = new Redis(url, {
          enableOfflineQueue: false,
          maxRetriesPerRequest: 1,
          lazyConnect: true,
          retryStrategy: () => null,
        })

        await client.connect()
        redisAvailable = true
        console.log(`${name} Redis connected`)
      } catch {
        redisAvailable = false
        console.warn(`${name} Redis unavailable, using in-memory fallback`)
      }
    })()

    await connectPromise
  }

  return {
    available: redisAvailable,
    get: redisGet,
    set: redisSet,
    del: redisDel,
    isAvailable: () => redisAvailable,
  }
}
