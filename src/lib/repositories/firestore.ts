import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  where,
  writeBatch,
  type DocumentData,
  type Firestore
} from "firebase/firestore";
import { articles } from "@/data/articles";
import { merchants } from "@/data/merchants";
import { saleEvents } from "@/data/sales";
import { getPublishedArticles, sortArticles } from "@/lib/articles/article";
import { getFirebaseClient } from "@/lib/firebase/client";
import { createLocalAdminRepositories, createLocalRepositories } from "@/lib/repositories/local-storage";
import type {
  AdminArticleRepository,
  AdminMerchantRepository,
  AdminRepositories,
  AdminSaleRepository,
  AppRepositories,
  Article,
  ArticleRepository,
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
import { defaultNotificationSetting, normalizeNotificationSetting } from "@/lib/services/notifications";
import { limitHistoryItems } from "@/lib/utils/history";
import { migrateWishItem, syncWishItemMirrors } from "@/lib/utils/wish-item";

const collections = {
  articles: "articles",
  merchants: "merchants",
  sales: "sales",
  wishlist: "wishItems",
  history: "purchaseHistory",
  notification: "notificationSetting"
} as const;

type FirestoreSeedState = {
  canSeed: boolean;
  counts: {
    articles: number;
    merchants: number;
    sales: number;
  };
};

function withoutUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map(withoutUndefined) as T;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, nestedValue]) =>
        nestedValue === undefined ? [] : [[key, withoutUndefined(nestedValue)]]
      )
    ) as T;
  }

  return value;
}

function sortSales(events: SaleEvent[]): SaleEvent[] {
  return events.sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}

function sortMerchants(items: Merchant[]): Merchant[] {
  return items.sort((a, b) => a.sortOrder - b.sortOrder);
}

async function readCollection(db: Firestore, name: string): Promise<DocumentData[]> {
  const snapshot = await getDocs(collection(db, name));
  return snapshot.docs.map((item) => item.data());
}

async function hasCloudSeedData(db: Firestore): Promise<boolean> {
  const [merchantSnapshot, saleSnapshot] = await Promise.all([
    getDocs(query(collection(db, collections.merchants), limit(1))),
    getDocs(query(collection(db, collections.sales), limit(1)))
  ]);
  return !merchantSnapshot.empty || !saleSnapshot.empty;
}

export class FirestoreMerchantRepository implements MerchantRepository {
  constructor(private readonly db: Firestore) {}

  async list(): Promise<Merchant[]> {
    const stored = (await readCollection(this.db, collections.merchants)) as Merchant[];
    const items = stored.length > 0 ? stored : merchants;
    return items.filter((merchant) => merchant.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async get(merchantId: string): Promise<Merchant | null> {
    const snapshot = await getDoc(doc(this.db, collections.merchants, merchantId));
    if (snapshot.exists()) {
      return snapshot.data() as Merchant;
    }
    return merchants.find((merchant) => merchant.merchantId === merchantId) ?? null;
  }
}

export class FirestoreSaleRepository implements SaleRepository {
  constructor(private readonly db: Firestore) {}

  async list(): Promise<SaleEvent[]> {
    const stored = (await readCollection(this.db, collections.sales)) as SaleEvent[];
    if (stored.length > 0 || await hasCloudSeedData(this.db)) {
      return sortSales(stored);
    }
    return sortSales([...saleEvents]);
  }

  async get(id: string): Promise<SaleEvent | null> {
    const snapshot = await getDoc(doc(this.db, collections.sales, id));
    if (snapshot.exists()) {
      return snapshot.data() as SaleEvent;
    }
    return await hasCloudSeedData(this.db) ? null : saleEvents.find((event) => event.id === id) ?? null;
  }
}

export class FirestoreWishlistRepository implements WishlistRepository {
  constructor(private readonly db: Firestore) {}

  async list(userId: string): Promise<WishItem[]> {
    const snapshot = await getDocs(collection(this.db, "users", userId, collections.wishlist));
    return snapshot.docs
      .map((item) => migrateWishItem(item.data() as WishItem))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async get(userId: string, id: string): Promise<WishItem | null> {
    const snapshot = await getDoc(doc(this.db, "users", userId, collections.wishlist, id));
    return snapshot.exists() ? migrateWishItem(snapshot.data() as WishItem) : null;
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
    await setDoc(doc(this.db, "users", userId, collections.wishlist, item.id), withoutUndefined(item));
    return item;
  }

  async update(userId: string, id: string, patch: Partial<WishItemInput>): Promise<WishItem> {
    const current = await this.get(userId, id);
    if (!current) {
      throw new Error("欲しいものが見つかりません。");
    }

    const updated = syncWishItemMirrors<WishItem>({
      ...current,
      ...patch,
      updatedAt: new Date().toISOString()
    });
    await setDoc(doc(this.db, "users", userId, collections.wishlist, id), withoutUndefined(updated));
    return updated;
  }

  async remove(userId: string, id: string): Promise<void> {
    await deleteDoc(doc(this.db, "users", userId, collections.wishlist, id));
  }
}

export class FirestoreHistoryRepository implements HistoryRepository {
  constructor(private readonly db: Firestore) {}

  async list(userId: string): Promise<PurchaseHistory[]> {
    const snapshot = await getDocs(collection(this.db, "users", userId, collections.history));
    return limitHistoryItems(
      snapshot.docs
        .map((item) => item.data() as PurchaseHistory)
        .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())
    );
  }

  async create(userId: string, input: PurchaseHistoryInput): Promise<PurchaseHistory> {
    const item = {
      ...input,
      id: crypto.randomUUID(),
      userId
    };
    await setDoc(doc(this.db, "users", userId, collections.history, item.id), withoutUndefined(item));
    return item;
  }

  async remove(userId: string, id: string): Promise<void> {
    await deleteDoc(doc(this.db, "users", userId, collections.history, id));
  }

  async clear(userId: string): Promise<void> {
    const snapshot = await getDocs(collection(this.db, "users", userId, collections.history));
    await Promise.all(snapshot.docs.map((item) => deleteDoc(item.ref)));
  }
}

export class FirestoreNotificationRepository implements NotificationRepository {
  constructor(private readonly db: Firestore) {}

  async get(userId: string): Promise<NotificationSetting> {
    const snapshot = await getDoc(doc(this.db, "users", userId, collections.notification, "default"));
    return normalizeNotificationSetting(
      userId,
      snapshot.exists() ? (snapshot.data() as Partial<NotificationSetting>) : defaultNotificationSetting(userId)
    );
  }

  async save(setting: NotificationSetting): Promise<NotificationSetting> {
    const normalized = normalizeNotificationSetting(setting.userId, setting);
    await setDoc(doc(this.db, "users", setting.userId, collections.notification, "default"), withoutUndefined(normalized));
    return normalized;
  }
}

export class FirestoreArticleRepository implements ArticleRepository {
  constructor(private readonly db: Firestore) {}

  async list(): Promise<Article[]> {
    const snapshot = await getDocs(
      query(collection(this.db, collections.articles), where("status", "==", "published"))
    );
    const stored = snapshot.docs.map((item) => item.data() as Article);
    if (stored.length > 0 || await hasCloudSeedData(this.db)) {
      return sortArticles(stored);
    }
    return sortArticles(getPublishedArticles(articles));
  }

  async get(slug: string): Promise<Article | null> {
    return (await this.list()).find((article) => article.slug === slug) ?? null;
  }
}

export class FirestoreAdminArticleRepository implements AdminArticleRepository {
  constructor(private readonly db: Firestore) {}

  async listAll(): Promise<Article[]> {
    const stored = (await readCollection(this.db, collections.articles)) as Article[];
    if (stored.length > 0 || await hasCloudSeedData(this.db)) {
      return sortArticles(stored);
    }
    return sortArticles(articles);
  }

  async get(slug: string): Promise<Article | null> {
    const snapshot = await getDoc(doc(this.db, collections.articles, slug));
    if (snapshot.exists()) {
      return snapshot.data() as Article;
    }

    return await hasCloudSeedData(this.db) ? null : articles.find((article) => article.slug === slug) ?? null;
  }

  async upsert(article: Article): Promise<Article> {
    const updated = {
      ...article,
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(this.db, collections.articles, article.slug), withoutUndefined(updated));
    return updated;
  }

  async remove(slug: string): Promise<void> {
    await deleteDoc(doc(this.db, collections.articles, slug));
  }
}

export class FirestoreAdminSaleRepository implements AdminSaleRepository {
  constructor(private readonly db: Firestore) {}

  async listAll(): Promise<SaleEvent[]> {
    const stored = (await readCollection(this.db, collections.sales)) as SaleEvent[];
    if (stored.length > 0 || await hasCloudSeedData(this.db)) {
      return sortSales(stored);
    }
    return sortSales([...saleEvents]);
  }

  async get(id: string): Promise<SaleEvent | null> {
    const snapshot = await getDoc(doc(this.db, collections.sales, id));
    if (snapshot.exists()) {
      return snapshot.data() as SaleEvent;
    }

    return await hasCloudSeedData(this.db) ? null : saleEvents.find((event) => event.id === id) ?? null;
  }

  async upsert(event: SaleEvent): Promise<SaleEvent> {
    await setDoc(doc(this.db, collections.sales, event.id), withoutUndefined(event));
    return event;
  }

  async bulkUpsert(events: SaleEvent[]): Promise<{ created: number; updated: number }> {
    // 取込対象のIDだけ存在確認し、コレクション全件読取を避ける。
    const existing = await Promise.all(
      events.map((event) => getDoc(doc(this.db, collections.sales, event.id)))
    );
    const created = existing.filter((snapshot) => !snapshot.exists()).length;
    const updated = events.length - created;

    for (let index = 0; index < events.length; index += 500) {
      const batch = writeBatch(this.db);
      events.slice(index, index + 500).forEach((event) => {
        batch.set(doc(this.db, collections.sales, event.id), withoutUndefined(event));
      });
      await batch.commit();
    }
    return { created, updated };
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(this.db, collections.sales, id));
  }
}

export class FirestoreAdminMerchantRepository implements AdminMerchantRepository {
  constructor(private readonly db: Firestore) {}

  async listAll(): Promise<Merchant[]> {
    const stored = (await readCollection(this.db, collections.merchants)) as Merchant[];
    return sortMerchants(stored.length > 0 ? stored : [...merchants]);
  }

  async get(merchantId: string): Promise<Merchant | null> {
    const snapshot = await getDoc(doc(this.db, collections.merchants, merchantId));
    if (snapshot.exists()) {
      return snapshot.data() as Merchant;
    }
    return merchants.find((merchant) => merchant.merchantId === merchantId) ?? null;
  }

  async upsert(merchant: Merchant): Promise<Merchant> {
    await setDoc(doc(this.db, collections.merchants, merchant.merchantId), withoutUndefined(merchant));
    return merchant;
  }
}

export function createFirestoreRepositories(): AppRepositories {
  const client = getFirebaseClient();
  if (!client) {
    return createLocalRepositories();
  }

  return {
    merchants: new FirestoreMerchantRepository(client.db),
    sales: new FirestoreSaleRepository(client.db),
    wishlist: new FirestoreWishlistRepository(client.db),
    history: new FirestoreHistoryRepository(client.db),
    notifications: new FirestoreNotificationRepository(client.db),
    articles: new FirestoreArticleRepository(client.db)
  };
}

export function createFirestoreAdminRepositories(): AdminRepositories {
  const client = getFirebaseClient();
  if (!client) {
    return createLocalAdminRepositories();
  }

  return {
    articles: new FirestoreAdminArticleRepository(client.db),
    sales: new FirestoreAdminSaleRepository(client.db),
    merchants: new FirestoreAdminMerchantRepository(client.db)
  };
}

export async function getFirestoreSeedState(): Promise<FirestoreSeedState> {
  const client = getFirebaseClient();
  if (!client) {
    throw new Error("Firebaseが設定されていません。");
  }

  const [articleSnapshot, merchantSnapshot, saleSnapshot] = await Promise.all([
    getDocs(collection(client.db, collections.articles)),
    getDocs(collection(client.db, collections.merchants)),
    getDocs(collection(client.db, collections.sales))
  ]);
  const counts = {
    articles: articleSnapshot.size,
    merchants: merchantSnapshot.size,
    sales: saleSnapshot.size
  };

  return {
    canSeed: Object.values(counts).every((count) => count === 0),
    counts
  };
}

export async function seedFirestoreStaticData(): Promise<void> {
  const client = getFirebaseClient();
  if (!client) {
    throw new Error("Firebaseが設定されていません。");
  }

  const state = await getFirestoreSeedState();
  if (!state.canSeed) {
    throw new Error("Firestoreに既存データがあります。静的データの投入は空の状態でのみ実行できます。");
  }

  const batch = writeBatch(client.db);
  merchants.forEach((merchant) => {
    batch.set(doc(client.db, collections.merchants, merchant.merchantId), withoutUndefined(merchant));
  });
  saleEvents.forEach((sale) => {
    batch.set(doc(client.db, collections.sales, sale.id), withoutUndefined(sale));
  });
  articles.forEach((article) => {
    batch.set(doc(client.db, collections.articles, article.slug), {
      ...withoutUndefined(article),
      status: "published"
    });
  });
  await batch.commit();
}
