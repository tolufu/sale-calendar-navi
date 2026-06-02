import { notFound } from "next/navigation";
import { AdminProductFeedImport } from "@/features/admin/import/AdminProductFeedImport";
import { isCsvImportEnabled } from "@/lib/features/csv-import";

export const dynamic = "force-dynamic";

export default function AdminProductFeedImportPage() {
  if (!isCsvImportEnabled()) {
    notFound();
  }
  return <AdminProductFeedImport />;
}
