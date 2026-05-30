export const PRODUCT_FEED_CSV_COLUMNS = [
  "merchantId",
  "externalId",
  "title",
  "productUrl",
  "affiliateUrl",
  "imageUrl",
  "priceMemo"
] as const;

export type ProductFeedCsvColumn = (typeof PRODUCT_FEED_CSV_COLUMNS)[number];
export type ProductFeedCsvRow = Record<ProductFeedCsvColumn, string>;

export type ValidatedProductFeedRow = {
  merchantId: string;
  externalId: string;
  title: string;
  productUrl: string;
  affiliateUrl: string | null;
  imageUrl: string | null;
  priceMemo: string | null;
};
