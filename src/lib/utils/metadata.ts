import type { Metadata } from "next";

const siteName = "セールカレンダー比較ナビ";
const defaultOgImage = "/images/placeholders/og-sale-calendar.svg";

type BuildMetadataInput = {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
};

export function buildPageMetadata({ title, description, path, ogImage = defaultOgImage }: BuildMetadataInput): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path
    },
    openGraph: {
      title,
      description,
      url: path,
      siteName,
      images: [ogImage]
    }
  };
}

export function truncateDescription(value: string, maxLength = 120): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 1)}…` : normalized;
}
