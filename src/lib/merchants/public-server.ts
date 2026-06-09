import { collection, getDocs, getFirestore } from "firebase/firestore/lite";
import { merchants as staticMerchants } from "@/data/merchants";
import { getFirebaseApp } from "@/lib/firebase/config";
import type { Merchant } from "@/lib/repositories/types";

function sortMerchants(items: Merchant[]): Merchant[] {
  return [...items].sort((a, b) => a.sortOrder - b.sortOrder);
}

// サーバーコンポーネント/APIから利用するECマスタ取得。
// Firestoreにデータがあればそれを、なければ静的シードを返す（公開画面は障害時も静的で成立させる）。
export async function listMerchantsForServer(): Promise<Merchant[]> {
  const app = getFirebaseApp();
  if (!app) {
    return sortMerchants(staticMerchants);
  }
  const db = getFirestore(app);

  try {
    const snapshot = await getDocs(collection(db, "merchants"));
    if (!snapshot.empty) {
      return sortMerchants(snapshot.docs.map((item) => item.data() as Merchant));
    }
  } catch {
    // Firestoreの一時障害時も静的シードで成立させる。
  }

  return sortMerchants(staticMerchants);
}

export async function listActiveMerchantsForServer(): Promise<Merchant[]> {
  return (await listMerchantsForServer()).filter((merchant) => merchant.isActive);
}

export async function getMerchantForServer(merchantId: string): Promise<Merchant | null> {
  return (await listMerchantsForServer()).find((merchant) => merchant.merchantId === merchantId) ?? null;
}
