"use client";

import { getFirebaseClient } from "@/lib/firebase/client";
import { createFirestoreRepositories } from "@/lib/repositories/firestore";
import { createLocalRepositories } from "@/lib/repositories/local-storage";
import type { AppRepositories } from "@/lib/repositories/types";

let repositories: AppRepositories | null = null;

export function getRepositories(): AppRepositories {
  if (repositories) {
    return repositories;
  }

  repositories = getFirebaseClient() ? createFirestoreRepositories() : createLocalRepositories();
  return repositories;
}
