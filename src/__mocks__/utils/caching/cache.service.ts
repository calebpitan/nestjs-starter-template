// A simple mock implementation of the original CacheService

import { Injectable } from '@nestjs/common';
import { jitter, mapSessionToToken } from '../../../utils';

type Data = { key: string; value: string; timerId: NodeJS.Timeout };

interface CachedDatabase {
  data: Data[];
}

const SESSION_TOKEN_TRACK = `session:token-track`;

@Injectable()
export class CacheServiceMock {
  private database: CachedDatabase;
  constructor() {
    this.database = { data: [] };
  }

  public get TOKEN_TRACKING_KEY() {
    return SESSION_TOKEN_TRACK;
  }

  public async close() {
    await this.clear();
    return await Promise.resolve('OK');
  }

  public async clear() {
    this.database.data.forEach(value => clearTimeout(value.timerId));
    this.database = { data: [] };
    return await Promise.resolve('OK');
  }

  public async setKey(key: string, value: string, ttl: number) {
    const data: Data = { key, value, timerId: null! };
    this.database.data.unshift(data);
    data.timerId = setTimeout(() => this.delete(key), ttl * 1e3);
    return await Promise.resolve('OK');
  }

  public async getKey(key: string): Promise<string | null> {
    const data = this.database.data.find(value => value.key === key);
    if (!data) return null;
    return await Promise.resolve(data.value);
  }

  public async getKeys(...keys: string[]) {
    return await Promise.resolve(
      keys.map(key => {
        const data = this.database.data.find(value => value.key === key);
        if (!data) return null;
        return data.value;
      }),
    );
  }

  public async setJSON(key: string, value: Record<string, any>, ttl: number) {
    return await this.setKey(key, JSON.stringify(value), ttl + jitter(2));
  }

  public async getJSON<R = any>(key: string): Promise<R | null> {
    const value = await this.getKey(key);
    if (value === null) return value;
    return (JSON.parse(value) as unknown) as R;
  }

  public async delete(...keys: string[]) {
    return await Promise.resolve(
      keys.reduce((count, key) => {
        const indexOfData = this.database.data.findIndex(value => value.key === key);
        this.database.data.splice(indexOfData, 1);
        return ++count;
      }, 0),
    );
  }

  public async matchKeys(pattern: string) {
    const regExpPattern = new RegExp(pattern.replace(/[*]+/g, '.+'));
    return this.database.data
      .map(value => (regExpPattern.test(value.key) ? value.key : null))
      .filter(Boolean) as string[];
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
