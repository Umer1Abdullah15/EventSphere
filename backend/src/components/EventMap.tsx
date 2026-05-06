import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { Event } from '../types';
import 'leaflet/dist/leaflet.css';
import { format } from 'date-fns';
import L from 'leaflet';

// Fix for marker icons in Leaflet with React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface EventMapProps {
  events: Event[];
}

const EventMap: React.FC<EventMapProps> = ({ events }) => {
  const navigate = useNavigate();

  // Parse the date from YYMMDD format
  const parseEventDate = (dateString: string) => {
    const year = 2000 + parseInt(dateString.substring(0, 2));
    const month = parseInt(dateString.substring(2, 4)) - 1; // JS months are 0-indexed
    const day = parseInt(dateString.substring(4, 6));
    
    return new Date(year, month, day);
  };

  // Default to London coordinates if no events
  const defaultCenter = [51.505, -0.09];
  
  // Get center of map based on event coordinates
  const getMapCenter = () => {
    if (events.length === 0) return defaultCenter;
    
    // Filter events that have valid lat/lng
    const eventsWithCoords = events.filter(
      event => event.latitude && event.longitude
    );
    
    if (eventsWithCoords.length === 0) return defaultCenter;
    
    // Return coordinates of first event
    return [eventsWithCoords[0].latitude!, eventsWithCoords[0].longitude!];
  };

  return (
    <div className="h-[600px] w-full rounded-lg overflow-hidden shadow-md">
      <MapContainer 
        center={getMapCenter() as [number, number]} 
        zoom={12} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {events.filter(event => event.latitude && event.longitude).map(event => (
          <Marker 
            key={event.id} 
            position={[event.latitude!, event.longitude!]}
            eventHandlers={{
              click: () => {
                navigate(`/events/${event.id}`);
              },
            }}
          >
            <Popup>
              <div className="p-1">
                <h3 className="font-bold text-indigo-700">{event.name}</h3>
                <p className="text-sm">{event.location}</p>
                <p className="text-sm">{format(parseEventDate(event.date), 'MMMM d, yyyy')}</p>
                <p className="text-xs mt-1 text-indigo-600 font-medium">
                  Click for details
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default EventMap;