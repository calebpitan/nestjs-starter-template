export const wait = (time = 1000) => {
  return new Promise<typeof time>(resolve => setTimeout(() => resolve(time), time));
};

export const jitter = (max = 10) => Math.floor(Math.random() * max);

/**
 * Map each session id from the passed in sessions array to a token.
 * Indices are asumed to be preserved
 *
 * @param sessions The keys matched from the cache has the session id encoded in it 3 colons away
 * @param tokens The tokens (cache value) fetched from the matched keys
 */
export const mapSessionToToken = (sessions: string[], tokens: string[]) => {
  const map = new Map<string, string>();
  sessions.forEach((session, i) => {
    const sid = session.split(':', 4).pop()!; // keys are mapped as "session:token-track:userID:sessionID"
    map.set(sid, tokens[i]);
  });
  return map;
};
