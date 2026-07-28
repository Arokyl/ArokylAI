import { ConversationMemory, type StoredMessage, type Summarizer } from './memory.js'
import { createRedisStore, type RedisStore } from '../lib/redis.js'

export interface RedisConversationMemoryOptions {
  ttlMs?: number
  maxMessages?: number
  summarizeThreshold?: number
  summarizer?: Summarizer
  redisUrl?: string
  redisPrefix?: string
  messageTtlSeconds?: number
}

export class RedisConversationMemory {
  private readonly memory: ConversationMemory
  private readonly redis: RedisStore
  private readonly prefix: string
  private readonly messageTtlSeconds: number
  private lastBroadcast = new Map<string, number>()

  constructor(options: RedisConversationMemoryOptions = {}) {
    this.memory = new ConversationMemory({
      ttlMs: options.ttlMs ?? 60 * 60 * 1000,
      maxMessages: options.maxMessages ?? 20,
      summarizeThreshold: options.summarizeThreshold ?? 30,
      summarizer: options.summarizer,
    })
    this.redis = createRedisStore('conversation-memory', options.redisUrl)
    this.prefix = options.redisPrefix || 'conv'
    this.messageTtlSeconds = options.messageTtlSeconds ?? 86400
  }

  async init() {
    await this.redis.get('noop')
  }

  setSummarizer(summarizer: Summarizer): void {
    this.memory.setSummarizer(summarizer)
  }

  async addMessage(conversationId: string, role: 'user' | 'assistant' | 'system', content: string): Promise<void> {
    this.memory.addMessage(conversationId, role, content)

    if (this.redis.isAvailable()) {
      const key = `${this.prefix}:${conversationId}:messages`
      const payload = JSON.stringify({ role, content, timestamp: Date.now() })
      await this.redis.set(key, payload, this.messageTtlSeconds)
    }
  }

  async getHistory(conversationId: string, maxMessages = 20): Promise<StoredMessage[]> {
    const cached = this.memory.getHistory(conversationId, maxMessages)
    if (cached.length > 0) return cached

    if (this.redis.isAvailable()) {
      const key = `${this.prefix}:${conversationId}:messages`
      const raw = await this.redis.get(key)
      if (raw) {
        try {
          const msg = JSON.parse(raw) as StoredMessage
          this.memory.addMessage(conversationId, msg.role, msg.content)
          return this.memory.getHistory(conversationId, maxMessages)
        } catch {
          // ignore parse errors
        }
      }
    }

    return []
  }

  getSummary(conversationId: string): string | null {
    return this.memory.getSummary(conversationId)
  }

  hasSummary(conversationId: string): boolean {
    return this.memory.hasSummary(conversationId)
  }

  async summarizeHistory(conversationId: string): Promise<string | null> {
    return this.memory.summarizeHistory(conversationId)
  }

  cleanup(): number {
    return this.memory.cleanup()
  }

  size(): number {
    return this.memory.size()
  }

  async getActiveConversations(): Promise<string[]> {
    if (this.redis.isAvailable()) {
      const keys = await this.redis.get('noop') as any
      return []
    }
    return []
  }
}
