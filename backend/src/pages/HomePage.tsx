import React, { useState, useEffect } from 'react';
import { eventAPI } from '../services/api';
import EventCard from '../components/EventCard';
import LocationSelector from '../components/LocationSelector';
import { Event } from '../types';
import { CalendarDays, Search } from 'lucide-react';

const HomePage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState('London'); // Default location
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await eventAPI.getEventsByLocation(selectedLocation);
        if (response.success) {
          setEvents(response.events);
          setError(null);
        } else {
          setError('Failed to fetch events');
        }
      } catch (err) {
        setError('An error occurred while fetching events');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [selectedLocation]);

  const handleLocationSelect = (location: string) => {
    setSelectedLocation(location);
  };

  // Filter events based on search query
  const filteredEvents = events.filter(event => 
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group events by category
  const eventsByCategory = filteredEvents.reduce((acc, event) => {
    if (!acc[event.category]) {
      acc[event.category] = [];
    }
    acc[event.category].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-indigo-700 py-16 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Discover Amazing Events Near You
          </h1>
          <p className="text-indigo-100 text-lg max-w-2xl mx-auto mb-8">
            Find and book tickets for concerts, sports, theatre, comedy, and more!
          </p>
          
          <div className="max-w-md mx-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input 
                type="text"
                placeholder="Search events or categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-3 pl-10 pr-4 bg-white rounded-full shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <LocationSelector 
            onLocationSelect={handleLocationSelect}
            selectedLocation={selectedLocation}
          />
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-md">
            {error}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <CalendarDays size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl text-gray-600 mb-2">No events found</h3>
            <p className="text-gray-500">
              {searchQuery ? 'Try a different search term or ' : ''}
              Try selecting a different location.
            </p>
          </div>
        ) : (
          <>
            {Object.keys(eventsByCategory).map(category => (
              <div key={category} className="mb-10">
                <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">
                  {category} Events
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {eventsByCategory[category].map(event => (
                    <EventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;