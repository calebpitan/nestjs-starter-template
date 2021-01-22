import { Injectable } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import { jitter, mapSessionToToken } from '../';

const SESSION_TOKEN_TRACK = `session:token-track`;

@Injectable()
export class CacheService {
  private client: ReturnType<RedisService['getClient']>;
  constructor(private readonly redisService: RedisService) {
    this.client = this.redisService.getClient();
  }

  public get TOKEN_TRACKING_KEY() {
    return SESSION_TOKEN_TRACK;
  }

  public async close() {
    return await this.client.quit();
  }

  public async clear() {
    return await this.client.flushdb();
  }

  public async setKey(key: string, value: string, ttl: number) {
    return await this.client.setex(key, ttl + jitter(2), value);
  }

  public async getKey(key: string): Promise<string | null> {
    const value = await this.client.get(key);
    return value;
  }

  public async getKeys(...keys: string[]) {
    return await this.client.mget(...keys);
  }

  public async setJSON(key: string, value: Record<string, any>, ttl: number) {
    return await this.client.setex(key, ttl + jitter(2), JSON.stringify(value));
  }

  public async getJSON<R = any>(key: string): Promise<R | null> {
    const value = await this.client.get(key);
    if (value === null) return value;
    return (JSON.parse(value) as unknown) as R;
  }

  public async delete(...keys: string[]) {
    return await this.client.del(...keys);
  }

  public async matchKeys(pattern: string) {
    return await this.client.keys(pattern);
  }

  /**
   * Associate a user and a session id to a specific auth token
   *
   * @param userId {string}  The user id
   * @param sid {string} The session id
   * @param token {string} The token to associate
   * @param ttl {number} The "time to live" for this cache key. Should be as long as the token is valid
   */
  public async setTokenTrack(userId: string, sid: string, token: string, ttl: number) {
    const key = `${SESSION_TOKEN_TRACK}:${userId}:${sid}`;
    return await this.setKey(key, token, ttl);
  }

  /**
   * Fetch tokens associated to all of a user's sessions across devices
   *
   * @param userId The user id to fetch all sessions' associated tokens for
   */
  public async getTokenTrack(userId: string) {
    const key = `${SESSION_TOKEN_TRACK}:${userId}`;
    const sessions = await this.matchKeys(`${key}:*`);

    if (sessions.length === 0) return null;

    const tokens = await this.getKeys(...sessions);
    // Remove falsy values from tokens
    const filteredTokens: string[] = tokens.filter(Boolean) as Array<string>;

    if (filteredTokens.length === 0) return null;

    const track = mapSessionToToken(sessions, filteredTokens);

    return track;
  }

  public async delTokenTrack(userId: string, sid: string) {
    const key = `${SESSION_TOKEN_TRACK}:${userId}:${sid}`;
    const count = await this.delete(key);
    return count;
  }
}
