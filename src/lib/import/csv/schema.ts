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

export type ProductFeedCsvValidationResult =
  | { ok: true; value: ValidatedProductFeedRow }
  | { ok: false; errors: string[] };

export type ProductFeedCsvPreviewRow = {
  lineNumber: number;
  row: ProductFeedCsvRow;
  result: ProductFeedCsvValidationResult;
};

export type ProductFeedCsvPreview = {
  fileErrors: string[];
  rows: ProductFeedCsvPreviewRow[];
  validRows: ValidatedProductFeedRow[];
  validCount: number;
  skippedCount: number;
  duplicateCount: number;
};
