import type { ReferenceLink, ReferenceLinkKind } from "@/lib/repositories/types";

export const MAX_REFERENCE_LINKS = 5;

export type ReferenceLinkDraft = {
  id: string;
  kind: ReferenceLinkKind;
  label: string;
  url: string;
};

export function parseReferenceLinks(drafts: ReferenceLinkDraft[]): ReferenceLink[] {
  const links = drafts
    .filter((draft) => draft.url.trim())
    .map((draft) => {
      const label = draft.label.trim();
      if (!label) {
        throw new Error("参考リンクの表示名を入力してください。");
      }

      try {
        const parsed = new URL(draft.url);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          throw new Error("unsupported protocol");
        }

        return {
          id: draft.id,
          kind: draft.kind,
          label: label.slice(0, 40),
          url: parsed.toString()
        };
      } catch {
        throw new Error("参考リンクは http または https のURLで入力してください。");
      }
    });

  if (links.length > MAX_REFERENCE_LINKS) {
    throw new Error(`参考リンクは${MAX_REFERENCE_LINKS}件まで登録できます。`);
  }

  return links;
}
