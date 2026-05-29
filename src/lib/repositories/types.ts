export type Merchant = {
  merchantId: string;
  name: string;
  colorToken: string;
  placeholderKey: string;
  affiliate: {
    provider: string;
    enabled: boolean;
  } | null;
  isActive: boolean;
  sortOrder: number;
};

export type SaleEvent = {
  id: string;
  merchantId: string;
  title: string;
  saleType: string;
  startAt: string;
  endAt: string;
  description: string;
  sourceUrl: string | null;
};

export type WishItem = {
  id: string;
  userId: string;
  title: string;
  productUrl: string;
  merchantId: string;
  desiredPrice: number | null;
  actualPriceMemo: string | null;
  targetSaleEventId: string | null;
  placeholderKey: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type WishItemInput = Omit<WishItem, "id" | "userId" | "createdAt" | "updatedAt">;

export type PurchaseHistory = {
  id: string;
  userId: string;
  wishItemId: string | null;
  merchantId: string;
  title: string;
  purchasedPrice: number | null;
  purchasedAt: string;
  saleEventId: string | null;
  memo: string | null;
};

export type PurchaseHistoryInput = Omit<PurchaseHistory, "id" | "userId">;

export type NotificationSetting = {
  userId: string;
  enabled: boolean;
  leadDays: number;
  perMerchant: Record<string, boolean> | null;
};

export type Article = {
  slug: string;
  title: string;
  body: string;
  ogImage: string;
  tags: string[];
  publishedAt: string;
};

export interface SaleRepository {
  list(): Promise<SaleEvent[]>;
  get(id: string): Promise<SaleEvent | null>;
}

export interface MerchantRepository {
  list(): Promise<Merchant[]>;
  get(merchantId: string): Promise<Merchant | null>;
}

export interface WishlistRepository {
  list(userId: string): Promise<WishItem[]>;
  get(userId: string, id: string): Promise<WishItem | null>;
  create(userId: string, input: WishItemInput): Promise<WishItem>;
  update(userId: string, id: string, patch: Partial<WishItemInput>): Promise<WishItem>;
  remove(userId: string, id: string): Promise<void>;
}

export interface HistoryRepository {
  list(userId: string): Promise<PurchaseHistory[]>;
  create(userId: string, input: PurchaseHistoryInput): Promise<PurchaseHistory>;
}

export interface NotificationRepository {
  get(userId: string): Promise<NotificationSetting>;
  save(setting: NotificationSetting): Promise<NotificationSetting>;
}

export interface ArticleRepository {
  list(): Promise<Article[]>;
  get(slug: string): Promise<Article | null>;
}

export type AppRepositories = {
  merchants: MerchantRepository;
  sales: SaleRepository;
  wishlist: WishlistRepository;
  history: HistoryRepository;
  notifications: NotificationRepository;
  articles: ArticleRepository;
};
