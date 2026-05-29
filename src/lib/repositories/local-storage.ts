"use client";

import { articles } from "@/data/articles";
import { merchants } from "@/data/merchants";
import { saleEvents } from "@/data/sales";
import type {
  AppRepositories,
  Article,
  HistoryRepository,
  Merchant,
  MerchantRepository,
  NotificationRepository,
  NotificationSetting,
  PurchaseHistory,
  PurchaseHistoryInput,
  SaleEvent,
  SaleRepository,
  WishlistRepository,
  WishItem,
  WishItemInput
} from "@/lib/repositories/types";
import { limitHistoryItems } from "@/lib/utils/history";
import { migrateWishItem, syncWishItemMirrors } from "@/lib/utils/wish-item";

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") {
    return fallback;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return fallback;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}

const keys = {
  wishlist: (userId: string) => `sale-calendar-navi:${userId}:wishlist`,
  history: (userId: string) => `sale-calendar-navi:${userId}:history`,
  notification: (userId: string) => `sale-calendar-navi:${userId}:notification`
};

export class LocalMerchantRepository implements MerchantRepository {
  async list(): Promise<Merchant[]> {
    return merchants.filter((merchant) => merchant.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async get(merchantId: string): Promise<Merchant | null> {
    return merchants.find((merchant) => merchant.merchantId === merchantId) ?? null;
  }
}

export class LocalSaleRepository implements SaleRepository {
  async list(): Promise<SaleEvent[]> {
    return [...saleEvents].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }

  async get(id: string): Promise<SaleEvent | null> {
    return saleEvents.find((event) => event.id === id) ?? null;
  }
}

export class LocalWishlistRepository implements WishlistRepository {
  async list(userId: string): Promise<WishItem[]> {
    return readJson<WishItem[]>(keys.wishlist(userId), []).map(migrateWishItem).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async get(userId: string, id: string): Promise<WishItem | null> {
    const items = await this.list(userId);
    return items.find((item) => item.id === id) ?? null;
  }

  async create(userId: string, input: WishItemInput): Promise<WishItem> {
    const now = new Date().toISOString();
    const item = syncWishItemMirrors<WishItem>({
      ...input,
      id: crypto.randomUUID(),
      userId,
      createdAt: now,
      updatedAt: now
    });
    const items = readJson<WishItem[]>(keys.wishlist(userId), []);
    writeJson(keys.wishlist(userId), [item, ...items]);
    return item;
  }

  async update(userId: string, id: string, patch: Partial<WishItemInput>): Promise<WishItem> {
    const items = readJson<WishItem[]>(keys.wishlist(userId), []);
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error("欲しいものが見つかりません。");
    }

    const current = migrateWishItem(items[index]);
    const updated = syncWishItemMirrors<WishItem>({
      ...current,
      ...patch,
      updatedAt: new Date().toISOString()
    });
    items[index] = updated;
    writeJson(keys.wishlist(userId), items);
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    const items = readJson<WishItem[]>(keys.wishlist(userId), []);
    writeJson(
      keys.wishlist(userId),
      items.filter((item) => item.id !== id)
    );
  }
}

export class LocalHistoryRepository implements HistoryRepository {
  async list(userId: string): Promise<PurchaseHistory[]> {
    return limitHistoryItems(readJson<PurchaseHistory[]>(keys.history(userId), []));
  }

  async create(userId: string, input: PurchaseHistoryInput): Promise<PurchaseHistory> {
    const item = {
      ...input,
      id: crypto.randomUUID(),
      userId
    };
    const history = readJson<PurchaseHistory[]>(keys.history(userId), []);
    writeJson(keys.history(userId), limitHistoryItems([item, ...history]));
    return item;
  }

  async remove(userId: string, id: string): Promise<void> {
    const history = readJson<PurchaseHistory[]>(keys.history(userId), []);
    writeJson(keys.history(userId), history.filter((item) => item.id !== id));
  }

  async clear(userId: string): Promise<void> {
    writeJson(keys.history(userId), []);
  }
}

export class LocalNotificationRepository implements NotificationRepository {
  async get(userId: string): Promise<NotificationSetting> {
    return readJson<NotificationSetting>(keys.notification(userId), {
      userId,
      enabled: false,
      leadDays: 2,
      perMerchant: null
    });
  }

  async save(setting: NotificationSetting): Promise<NotificationSetting> {
    writeJson(keys.notification(setting.userId), setting);
    return setting;
  }
}

export class LocalArticleRepository {
  async list(): Promise<Article[]> {
    return [...articles].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  }

  async get(slug: string): Promise<Article | null> {
    return articles.find((article) => article.slug === slug) ?? null;
  }
}

export function createLocalRepositories(): AppRepositories {
  return {
    merchants: new LocalMerchantRepository(),
    sales: new LocalSaleRepository(),
    wishlist: new LocalWishlistRepository(),
    history: new LocalHistoryRepository(),
    notifications: new LocalNotificationRepository(),
    articles: new LocalArticleRepository()
  };
}
