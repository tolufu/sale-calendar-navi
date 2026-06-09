import { AdminSaleForm } from "@/features/admin/sales/AdminSaleForm";

export default async function AdminEditSalePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminSaleForm id={id} />;
}
