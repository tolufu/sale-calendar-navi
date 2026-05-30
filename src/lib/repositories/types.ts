export type MerchantType = "marketplace" | "retailer" | "b2b" | "other";
export type MerchantPlaceholderImageType = string;
export type MerchantAffiliateProvider = string | null;
export type MerchantIntegrationStatus = "available" | "manual-only" | "planned";

export type Merchant = {
  merchantId: string;
  name: string;
  type: MerchantType;
  colorToken: string;
  placeholderKey: string;
  placeholderImageType: MerchantPlaceholderImageType;
  urlHosts?: string[];
  affiliate: {
    provider: string;
    enabled: boolean;
  } | null;
  affiliateProvider: MerchantAffiliateProvider;
  supportsAffiliate: boolean;
  supportsApi: boolean;
  supportsPriceAutoFetch: boolean;
  supportsSaleCalendar: boolean;
  integrationStatus: MerchantIntegrationStatus;
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
  desiredPrice?: number | null;
  currentEffectivePriceMemo?: string | null;
};

export type ReferenceLinkKind = "kakaku" | "maker" | "other";

export type ReferenceLink = {
  id: string;
  kind: ReferenceLinkKind;
  label: string;
  url: string;
};

export type PriceBreakdown = {
  productPrice: number | null;
  shippingFee: number | null;
  couponDiscount: number | null;
  grantedPoints: number | null;
  pointRate: number | null;
};

export type Offer = {
  id: string;
  merchantId: string;
  productGroupId: string;
  productUrl: string;
  referenceUrls?: string[];
  originalUrl?: string;
  affiliateUrl?: string | null;
  price?: number | null;
  shippingFee?: number | null;
  couponAmount?: number | null;
  pointAmount?: number | null;
  pointValueRate?: number | null;
  effectivePrice?: number | null;
  checkedAt?: string | null;
  sourceType?: "manual" | "affiliate" | "imported";
  imageSource?: "placeholder" | "rakuten_api";
  imageUrl?: string | null;
  priceMemo: string | null;
  updatedAt: string;
};

export type PriceCandidate = {
  merchantId: string;
  originalUrl: string;
  affiliateUrl: string | null;
  breakdown: PriceBreakdown;
  priceMemo: string | null;
  lastCheckedAt: string | null;
  imageSource: "placeholder" | "rakuten_api";
  imageUrl?: string | null;
};

export const WISH_ITEM_SCHEMA_VERSION = 2;

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
  schemaVersion?: number;
  candidates?: PriceCandidate[];
  referenceLinks?: ReferenceLink[];
  lastCheckedAt?: string | null;
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
  email: string | null;
  timings: {
    threeDaysBefore: boolean;
    oneDayBefore: boolean;
    atStart: boolean;
  };
  perMerchant: Record<string, boolean> | null;
  unsubscribeToken: string;
};

export type Article = {
  slug: string;
  title: string;
  description: string;
  body: string;
  ogImage: string;
  tags: string[];
  publishedAt: string;
  relatedSlugs?: string[];
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
