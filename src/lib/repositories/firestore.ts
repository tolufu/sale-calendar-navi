import { createLocalRepositories } from "@/lib/repositories/local-storage";
import type { AppRepositories } from "@/lib/repositories/types";

export function createFirestoreRepositories(): AppRepositories {
  // Firestore implementation is intentionally swappable. Until Firebase settings
  // and rules are finalized, local repositories keep development usable.
  return createLocalRepositories();
}
