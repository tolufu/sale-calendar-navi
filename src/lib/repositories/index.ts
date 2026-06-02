"use client";

import { getFirebaseClient } from "@/lib/firebase/client";
import { createFirestoreAdminRepositories, createFirestoreRepositories } from "@/lib/repositories/firestore";
import { createLocalAdminRepositories, createLocalRepositories } from "@/lib/repositories/local-storage";
import type { AdminRepositories, AppRepositories } from "@/lib/repositories/types";

let repositories: AppRepositories | null = null;
let adminRepositories: AdminRepositories | null = null;

export function getRepositories(): AppRepositories {
  if (repositories) {
    return repositories;
  }

  repositories = getFirebaseClient() ? createFirestoreRepositories() : createLocalRepositories();
  return repositories;
}

export function getAdminRepositories(): AdminRepositories {
  if (adminRepositories) {
    return adminRepositories;
  }

  adminRepositories = getFirebaseClient() ? createFirestoreAdminRepositories() : createLocalAdminRepositories();
  return adminRepositories;
}
