import type { DeliveryStatus } from '@/types/models';

const colors: Record<DeliveryStatus, string> = {
  pending: 'bg-gray-200 text-gray-800',
  assigned: 'bg-amber-200 text-amber-800',
  picked_up: 'bg-blue-200 text-blue-800',
  on_route: 'bg-indigo-200 text-indigo-800',
  delivered: 'bg-green-200 text-green-800',
  cancelled: 'bg-red-200 text-red-800'
};

export default function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  return <span className={`px-2 py-0.5 rounded text-xs ${colors[status]}`}>{status.replace('_',' ')}</span>;
}
