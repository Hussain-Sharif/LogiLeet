// frontend/src/components/deliveries/StatusTimeline.tsx
import type { Delivery } from '@/types/models';

export default function StatusTimeline({ d }: { d: Delivery }) {
  const steps = [
    { key: 'pending', at: d.createdAt, label: 'Created' },
    { key: 'assigned', at: d.assignedAt, label: 'Assigned' },
    { key: 'picked_up', at: d.actualPickupTime, label: 'Picked Up' },
    { key: 'on_route', at: d.actualPickupTime, label: 'On Route' },
    { key: 'delivered', at: d.actualDeliveryTime, label: 'Delivered' },
    { key: 'cancelled', at: null, label: 'Cancelled' }
  ];

  const statusOrder = ['pending', 'assigned', 'picked_up', 'on_route', 'delivered', 'cancelled'];
  const currentIndex = statusOrder.indexOf(d.status);
  
  return (
    <div className="flex items-center gap-2 overflow-x-auto">
      {steps.slice(0, d.status === 'cancelled' ? 6 : 5).map((s, idx) => {
        const isActive = idx === currentIndex;
        const isDone = idx < currentIndex || (d.status === 'cancelled' && s.key === 'cancelled');
        const isCancelled = d.status === 'cancelled' && s.key === 'cancelled';
        
        return (
          <div key={s.key} className="flex items-center">
            <div className={`h-3 w-3 rounded-full flex-shrink-0 ${
              isCancelled ? 'bg-red-600' : isDone ? 'bg-green-600' : isActive ? 'bg-blue-600' : 'bg-gray-300'
            }`} />
            <div className={`ml-1 text-xs whitespace-nowrap ${isActive ? 'font-medium' : ''}`}>
              {s.label}
              {s.at && <div className="text-[10px] text-gray-500">{new Date(s.at).toLocaleTimeString()}</div>}
            </div>
            {idx < steps.length - 1 && idx < (d.status === 'cancelled' ? 5 : 4) && 
              <div className="mx-2 h-[1px] w-8 bg-gray-300 flex-shrink-0" />
            }
          </div>
        );
      })}
    </div>
  );
}
