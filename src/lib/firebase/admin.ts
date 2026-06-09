"use client";

import {
  signInWithEmailAndPassword,
  signOut,
  type User
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { getFirebaseClient } from "@/lib/firebase/client";

export async function isAdminUser(user: User): Promise<boolean> {
  const client = getFirebaseClient();
  if (!client || user.isAnonymous) {
    return false;
  }

  const snapshot = await getDoc(doc(client.db, "admins", user.uid));
  return snapshot.exists();
}

export async function signInAdmin(email: string, password: string): Promise<void> {
  const client = getFirebaseClient();
  if (!client) {
    throw new Error("Firebaseが設定されていません。");
  }

  const credential = await signInWithEmailAndPassword(client.auth, email, password);
  if (!(await isAdminUser(credential.user))) {
    await signOut(client.auth);
    throw new Error("管理者権限がありません。");
  }
}

export async function signOutAdmin(): Promise<void> {
  const client = getFirebaseClient();
  if (client) {
    await signOut(client.auth);
  }
}
