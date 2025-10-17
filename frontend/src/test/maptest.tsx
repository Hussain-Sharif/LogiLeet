import { DeliveryMap } from '@/components/maps/DeliveryMap';

export default function MapTest() {
  const testPickup = { lat: 16.5062, lng: 80.7480 }; // Vijayawada
  const testDropoff = { lat: 17.4065, lng: 78.4772 }; // Hyderabad
  const testDriver = { lat: 16.8, lng: 79.6 }; // Between them
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Map Test</h1>
      <div className="space-y-4">
        <div>
          <h3 className="font-semibold">Test Data:</h3>
          <pre className="bg-gray-100 p-2 rounded text-xs">
            {JSON.stringify({ testPickup, testDropoff, testDriver }, null, 2)}
          </pre>
        </div>
        <DeliveryMap 
          pickup={testPickup}
          dropoff={testDropoff}
          driver={testDriver}
          height="500px"
        />
      </div>
    </div>
  );
}
