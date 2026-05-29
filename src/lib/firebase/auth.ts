"use client";

import { signInAnonymously } from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebase/client";

const LOCAL_UID_KEY = "sale-calendar-navi:local-uid";

export async function getAnonymousUserId(): Promise<string> {
  const client = getFirebaseClient();

  if (client) {
    const credential = await signInAnonymously(client.auth);
    return credential.user.uid;
  }

  const existing = window.localStorage.getItem(LOCAL_UID_KEY);
  if (existing) {
    return existing;
  }

  const uid = `local-${crypto.randomUUID()}`;
  window.localStorage.setItem(LOCAL_UID_KEY, uid);
  return uid;
}
