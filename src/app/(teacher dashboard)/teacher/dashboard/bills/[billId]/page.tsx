import { getBill } from "@/src/app/actions/billActions";
import { notFound } from "next/navigation";
import { BillDetailClient } from "./BillDetailClient";

type PageProps = {
  params: Promise<{ billId: string }>;
};

export default async function BillDetailPage({ params }: PageProps) {
  const { billId } = await params;
  
  const response = await getBill(billId);

  if (!response.success || !response.data) {
    return notFound();
  }

  return <BillDetailClient bill={response.data} />;
}