import { AdminDashboard } from "@/features/admin/AdminDashboard";
import { isCsvImportEnabled } from "@/lib/features/csv-import";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  return <AdminDashboard csvImportEnabled={isCsvImportEnabled()} />;
}
