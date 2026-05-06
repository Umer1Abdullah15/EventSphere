import React, { useState, useEffect } from 'react';
import { MapPin } from 'lucide-react';

interface LocationSelectorProps {
  onLocationSelect: (location: string) => void;
  selectedLocation: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ 
  onLocationSelect, 
  selectedLocation 
}) => {
  const [locations, setLocations] = useState<string[]>([
    'London', 
    'Manchester', 
    'Birmingham', 
    'Liverpool', 
    'Edinburgh'
  ]);

  // In a real application, we would fetch these from the API
  useEffect(() => {
    // This would be replaced with an API call to get all unique locations
    // For now we're using a static list
  }, []);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h2 className="text-lg font-semibold mb-4 flex items-center">
        <MapPin size={18} className="mr-2 text-indigo-600" />
        Select Location
      </h2>
      
      <div className="flex flex-wrap gap-2">
        {locations.map(location => (
          <button
            key={location}
            onClick={() => onLocationSelect(location)}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              selectedLocation === location
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {location}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LocationSelector;