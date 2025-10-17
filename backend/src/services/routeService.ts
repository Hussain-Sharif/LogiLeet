export const computeRoute = async (pickup: {lat: number, lng: number}, dropoff: {lat: number, lng: number}) => {
  try {
    const url = `https://api.tomtom.com/routing/1/calculateRoute/${pickup.lat},${pickup.lng}:${dropoff.lat},${dropoff.lng}/json?key=${process.env.TOMTOM_API_KEY}&traffic=true&routeType=fastest`;
    
    const response = await fetch(url);
    const data:any = await response.json();
    
    if (!data.routes?.[0]) {
      return {
        waypoints: [
          { lat: pickup.lat, lng: pickup.lng },
          { lat: dropoff.lat, lng: dropoff.lng }
        ],
        distance: 0,
        estimatedDuration: 30
      };
    }

    const route = data.routes[0];
    const allPoints = route.legs[0].points.map((p: any) => ({ 
      lat: p.latitude, 
      lng: p.longitude 
    }));
    
    // Compress route - keep every Nth point for performance
    const compressionFactor = Math.max(1, Math.ceil(allPoints.length / 150));
    const waypoints = allPoints.filter((_: any, index: number) => index % compressionFactor === 0);
    
    return {
      waypoints,
      distance: route.summary.lengthInMeters,
      estimatedDuration: Math.round(route.summary.travelTimeInSeconds / 60)
    };
  } catch (error) {
    console.error('Route calculation error:', error);
    return {
      waypoints: [
        { lat: pickup.lat, lng: pickup.lng },
        { lat: dropoff.lat, lng: dropoff.lng }
      ],
      distance: 0,
      estimatedDuration: 30
    };
  }
};

export const computeETA = async (current: {lat: number, lng: number}, destination: {lat: number, lng: number}) => {
  try {
    const url = `https://api.tomtom.com/routing/1/calculateRoute/${current.lat},${current.lng}:${destination.lat},${destination.lng}/json?key=${process.env.TOMTOM_API_KEY}&traffic=true&routeType=fastest`;
    
    const response = await fetch(url);
    const data:any = await response.json();
    
    if (data.routes?.[0]) {
      return Math.round(data.routes[0].summary.travelTimeInSeconds / 60);
    }
    return null;
  } catch (error) {
    console.error('ETA calculation error:', error);
    return null;
  }
};
