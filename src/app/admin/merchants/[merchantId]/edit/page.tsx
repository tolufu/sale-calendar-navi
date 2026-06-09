import { AdminMerchantForm } from "@/features/admin/merchants/AdminMerchantForm";

export default async function AdminEditMerchantPage({ params }: { params: Promise<{ merchantId: string }> }) {
  const { merchantId } = await params;
  return <AdminMerchantForm merchantId={merchantId} />;
}
