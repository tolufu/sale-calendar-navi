import { beforeEach, describe, expect, it } from "vitest";
import { LocalAdminArticleRepository, LocalArticleRepository } from "@/lib/repositories/local-storage";
import type { Article } from "@/lib/repositories/types";

describe("local article repositories", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("下書きを公開一覧から除外し、公開切替と削除を反映する", async () => {
    const adminRepository = new LocalAdminArticleRepository();
    const publicRepository = new LocalArticleRepository();
    const draft = createArticle({ slug: "local-draft", status: "draft" });

    await adminRepository.upsert(draft);
    expect(await adminRepository.get(draft.slug)).toMatchObject({ slug: draft.slug, status: "draft" });
    expect(await publicRepository.get(draft.slug)).toBeNull();

    await adminRepository.upsert({ ...draft, status: "published" });
    expect(await publicRepository.get(draft.slug)).toMatchObject({ slug: draft.slug, status: "published" });

    await adminRepository.remove(draft.slug);
    expect(await adminRepository.get(draft.slug)).toBeNull();
    expect(await publicRepository.get(draft.slug)).toBeNull();
  });
});

function createArticle(patch: Partial<Article>): Article {
  return {
    slug: "article",
    title: "タイトル",
    description: "説明",
    body: "本文",
    ogImage: "/images/placeholders/og-sale-calendar.svg",
    tags: [],
    publishedAt: "2026-06-02T00:00:00.000Z",
    ...patch
  };
}
