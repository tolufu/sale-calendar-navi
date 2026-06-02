import { beforeEach, describe, expect, it } from "vitest";
import {
  LocalAdminArticleRepository,
  LocalAdminSaleRepository,
  LocalArticleRepository,
  LocalSaleRepository
} from "@/lib/repositories/local-storage";
import type { Article, SaleEvent } from "@/lib/repositories/types";

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

  it("セール日程の一括更新と削除を公開読み取りへ反映する", async () => {
    const adminRepository = new LocalAdminSaleRepository();
    const publicRepository = new LocalSaleRepository();
    const created = createSale({ id: "local-created" });
    const updated = createSale({ id: "amazon-new-year-2023-01", title: "更新した日程" });

    expect(await adminRepository.bulkUpsert([created, updated])).toEqual({ created: 1, updated: 1 });
    expect(await publicRepository.get(created.id)).toEqual(created);
    expect(await publicRepository.get(updated.id)).toMatchObject({ title: "更新した日程" });

    await adminRepository.remove(created.id);
    expect(await publicRepository.get(created.id)).toBeNull();
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

function createSale(patch: Partial<SaleEvent>): SaleEvent {
  return {
    id: "sale",
    merchantId: "rakuten",
    title: "セール日程",
    saleType: "sale",
    startAt: "2026-06-04T11:00:00.000Z",
    endAt: "2026-06-10T16:59:00.000Z",
    description: "説明",
    sourceUrl: null,
    ...patch
  };
}
