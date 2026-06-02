import { collection, getDocs, getFirestore } from "firebase/firestore/lite";
import { saleEvents as staticSaleEvents } from "@/data/sales";
import { getFirebaseApp } from "@/lib/firebase/config";
import type { SaleEvent } from "@/lib/repositories/types";

function sortSales(events: SaleEvent[]): SaleEvent[] {
  return [...events].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
}

// サーバーコンポーネント/メタデータ/サイトマップから利用するセール日程取得。
// Firestoreにデータがあればそれを、なければ静的シードを返す（公開画面は障害時も静的で成立させる）。
export async function listSalesForServer(): Promise<SaleEvent[]> {
  const app = getFirebaseApp();
  if (!app) {
    return sortSales(staticSaleEvents);
  }
  const db = getFirestore(app);

  try {
    const snapshot = await getDocs(collection(db, "sales"));
    if (!snapshot.empty) {
      return sortSales(snapshot.docs.map((item) => item.data() as SaleEvent));
    }
  } catch {
    // Firestoreの一時障害時も静的シードで成立させる。
  }

  return sortSales(staticSaleEvents);
}

export async function getSaleForServer(id: string): Promise<SaleEvent | null> {
  return (await listSalesForServer()).find((event) => event.id === id) ?? null;
}
