/**
 * Cache TTL simples em memória. Suficiente para uma única instância;
 * em produção com múltiplas réplicas, trocar por Redis (mesma interface,
 * `get`/`set`) para que o cache seja compartilhado entre processos.
 */
type CacheEntry<T> = { value: T; expiresAt: number };

class TtlCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  /** Evita múltiplas chamadas concorrentes ao mesmo upstream durante um cache miss. */
  async wrap<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;

    const value = await loader();
    this.set(key, value, ttlMs);
    return value;
  }
}

export const cache = new TtlCache();
