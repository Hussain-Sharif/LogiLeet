export type Role = 'admin' | 'driver' | 'customer';

export interface LatLng {
  latitude: number;
  longitude: number;
  address?: string;
  placeId?: string;
}

export interface RoutePoint { lat: number; lng: number; }

export type DeliveryStatus = 'pending' | 'assigned' | 'picked_up' | 'on_route' | 'delivered' | 'cancelled';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface Vehicle {
  _id: string;
  vehicleNumber: string;
  type: 'bike' | 'car' | 'truck' | 'van';
  vehicleBrand: string;
  vehicleModel: string;
  isAvailable: boolean;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  phone?: string;
}

export interface Delivery {
  _id: string;
  customerId: User;
  driverId?: User;
  vehicleId?: Vehicle;
  pickup: LatLng;
  dropoff: LatLng;
  route?: {
    waypoints: RoutePoint[];
    distance: number;
    estimatedDuration: number;
    encodedPolyline?: string;
  } | null;
  status: DeliveryStatus;
  priority: Priority;
  packageDetails: {
    description: string;
    weight?: number;
    volume?: number;
    specialInstructions?: string;
    isFragile?: boolean;
  };
  assignedAt?: string;
  actualPickupTime?: string;
  actualDeliveryTime?: string;
  createdAt: string;
  updatedAt: string;
}
