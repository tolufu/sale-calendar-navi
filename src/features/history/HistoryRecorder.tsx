"use client";

import { useEffect } from "react";
import { getAnonymousUserId } from "@/lib/firebase/auth";
import { getRepositories } from "@/lib/repositories";
import type { ViewHistoryInput } from "@/lib/repositories/types";

export function HistoryRecorder({ input }: { input: ViewHistoryInput }) {
  useEffect(() => {
    async function record() {
      const userId = await getAnonymousUserId();
      await getRepositories().history.create(userId, {
        ...input,
        occurredAt: new Date().toISOString()
      });
    }

    void record();
  }, [input]);

  return null;
}
