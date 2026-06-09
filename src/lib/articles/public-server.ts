import { collection, getDocs, getFirestore, limit, query, where, type Firestore } from "firebase/firestore/lite";
import { articles } from "@/data/articles";
import { getPublishedArticles, sortArticles } from "@/lib/articles/article";
import { getFirebaseApp } from "@/lib/firebase/config";
import type { Article } from "@/lib/repositories/types";

export async function listPublishedArticlesForServer(): Promise<Article[]> {
  const app = getFirebaseApp();
  if (!app) {
    return sortArticles(getPublishedArticles(articles));
  }
  const db = getFirestore(app);

  try {
    const snapshot = await getDocs(
      query(collection(db, "articles"), where("status", "==", "published"))
    );
    const stored = snapshot.docs.map((item) => item.data() as Article);
    if (stored.length > 0 || await hasCloudSeedData(db)) {
      return sortArticles(stored);
    }
  } catch {
    // 公開画面はFirestoreの一時障害時にも静的記事で成立させる。
  }

  return sortArticles(getPublishedArticles(articles));
}

export async function getPublishedArticleForServer(slug: string): Promise<Article | null> {
  return (await listPublishedArticlesForServer()).find((article) => article.slug === slug) ?? null;
}

async function hasCloudSeedData(db: Firestore): Promise<boolean> {
  const [merchantSnapshot, saleSnapshot] = await Promise.all([
    getDocs(query(collection(db, "merchants"), limit(1))),
    getDocs(query(collection(db, "sales"), limit(1)))
  ]);
  return !merchantSnapshot.empty || !saleSnapshot.empty;
}
