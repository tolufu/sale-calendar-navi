export type PublicShareSetting = {
  enabled: boolean;
  expiresAt: string | null;
};

export type PublicShareItem = {
  title: string;
  merchantName: string;
  desiredPrice: number | null;
  placeholderImageType: string;
};

export type PublicShareSnapshot = {
  shareId: string;
  createdAt: string;
  expiresAt: string | null;
  revoked: boolean;
  items: PublicShareItem[];
};
