import { redirect } from 'next/navigation';

interface PaymentDetailPageProps {
  params: {
    id: string;
  };
}

export default function PaymentDetailPage({ params }: PaymentDetailPageProps) {
  redirect(`/dashboard/payments/${params.id}/receipt`);
}
