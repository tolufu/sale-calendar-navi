import { SaleDetail } from "@/features/sales/SaleDetail";

export default async function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SaleDetail saleId={id} />;
}
