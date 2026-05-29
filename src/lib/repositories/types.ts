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
  strategyMemo?: string;
  relatedSaleEventIds?: string[];
};

export type ProductGroup = {
  id: string;
  name: string;
  description: string;
  placeholderKey: string;
};

export type Offer = {
  id: string;
  merchantId: string;
  productGroupId: string;
  productUrl: string;
  priceMemo: string | null;
  updatedAt: string;
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

export type ViewHistory = {
  id: string;
  userId: string;
  type: "sale" | "article" | "deletedWish";
  title: string;
  href: string | null;
  merchantId: string | null;
  occurredAt: string;
  memo: string | null;
};

export type ViewHistoryInput = Omit<ViewHistory, "id" | "userId">;
export type PurchaseHistory = ViewHistory;
export type PurchaseHistoryInput = ViewHistoryInput;

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

export type LoadingState = "idle" | "loading" | "success" | "empty" | "error";

export type Result<T, E = string> =
  | { ok: true; value: T }
  | { ok: false; error: E };

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
  list(userId: string): Promise<ViewHistory[]>;
  create(userId: string, input: ViewHistoryInput): Promise<ViewHistory>;
  remove(userId: string, id: string): Promise<void>;
  clear(userId: string): Promise<void>;
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
