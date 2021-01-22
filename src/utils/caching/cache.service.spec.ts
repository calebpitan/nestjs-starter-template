import { RedisService } from 'nestjs-redis';
import { CacheService } from './cache.service';
import { wait } from '../index';

jest.mock('../caching/cache.service', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { CacheServiceMock } = require('../../__mocks__/utils/caching/cache.service');
  return { CacheService: CacheServiceMock };
});

describe('CacheService', () => {
  let cacheService: CacheService;
  const setKeys = async (
    cache: CacheService,
    keys: any[],
    values: any[],
    ttl: number | number[],
  ) => {
    return await Promise.all(
      keys.map(
        async (key, i) => await cache.setKey(key, values[i], Array.isArray(ttl) ? ttl[i] : ttl),
      ),
    );
  };

  beforeEach(() => {
    // The redis service is a dud, our mock doesn't require it
    cacheService = new CacheService({} as RedisService);
  });

  afterEach(async () => {
    await cacheService.clear();
    await cacheService.close();
  });

  it('#close', async () => {
    const key = 'key';
    const value = 'value';
    await cacheService.setKey(key, value, 1);
    await cacheService.close();
    const cachedValue = await cacheService.getKey(key);
    expect(cachedValue).toStrictEqual(null);
  });

  it('#clear', async () => {
    const key = 'key';
    const value = 'value';
    await cacheService.setKey(key, value, 1);
    await cacheService.close();
    const cachedValue = await cacheService.getKey(key);
    expect(cachedValue).toStrictEqual(null);
  });

  it('#setKey', async () => {
    const key = 'key';
    const value = 'value';
    const reply = await cacheService.setKey(key, value, 1);
    expect(reply).toEqual('OK');
  });

  it('#getKey', async () => {
    const key = 'key';
    const value = 'value';
    await cacheService.setKey(key, value, 1);
    const cachedValue = await cacheService.getKey(key);
    expect(cachedValue).toStrictEqual(value);
  });

  it('#getKeys', async () => {
    const keys = ['key1', 'key2', 'key3'];
    const values = ['value1', 'value2', 'value3'];
    await setKeys(cacheService, keys, values, 1);
    const cachedValues = await cacheService.getKeys(...keys);
    expect(cachedValues).toStrictEqual(values);
  });

  it('#setJSON', async () => {
    const key = 'key';
    const value = { value: 1, type: 'number' };
    const reply = await cacheService.setJSON(key, value, 1);
    expect(reply).toEqual('OK');
  });

  it('#getJSON', async () => {
    const key = 'key';
    const value = { value: 1, type: 'number' };
    await cacheService.setJSON(key, value, 1);
    const cachedValue = await cacheService.getJSON(key);
    expect(cachedValue).toStrictEqual(value);
  });

  it('#delete', async () => {
    const keys = ['key1', 'key2', 'key3'];
    const values = ['value1', 'value2', 'value3'];
    await setKeys(cacheService, keys, values, 1);

    //delete 1
    await cacheService.delete(keys[0]);
    const reply = await cacheService.getKey(keys[0]);
    expect(reply).toStrictEqual(null);

    // delete all
    await cacheService.delete(...keys.slice(1));
    const cachedValues = await cacheService.getKeys(...keys.slice(1));
    expect(cachedValues).toStrictEqual(Array(values.slice(1).length).fill(null));
  });

  it('#matchKeys', async () => {
    const keys = [
      'namespace:component:member:extension',
      'namespace1:component1:member1:extension1',
      'namespace2:component2:member2:extension2',
    ];
    const values = ['value', 'value1', 'value2'];
    await setKeys(cacheService, keys, values, 1);

    const patterns = keys.map(key => key.replace(/component\d?/, '*'));
    expect(patterns[0]).toEqual('namespace:*:member:extension');

    const [matchedKey] = await cacheService.matchKeys(patterns[0]);
    expect(matchedKey).toStrictEqual(keys[0]);

    const matchedKeys = await Promise.all(
      patterns.map(async pattern => await cacheService.matchKeys(pattern)),
    );
    matchedKeys.forEach(([key], i) => expect(key).toStrictEqual(keys[i]));
  });

  it('#setTokenTrack', async () => {
    const [userId, sid, token] = ['userId', 'sid', 'token'];
    const reply = await cacheService.setTokenTrack(userId, sid, token, 1);
    expect(reply).toEqual('OK');
  });

  it('#getTokenTrack', async () => {
    const [userId, sid, token] = ['userId', 'sid', 'token'];
    await cacheService.setTokenTrack(userId, sid, token, 1);
    const track = await cacheService.getTokenTrack(userId);
    expect(track).toBeInstanceOf(Map);
    expect(track!.get(sid)).toStrictEqual(token);
  });

  describe('Time To Live (TTL)', () => {
    it('should expire key after TTL', async () => {
      const key = 'key';
      const value = 'value';
      await cacheService.setKey(key, value, 1);
      await wait(1000);
      const cachedValue = await cacheService.getKey(key);
      expect(cachedValue).toStrictEqual(null);
    });
  });
});
