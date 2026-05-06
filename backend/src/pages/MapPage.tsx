import React, { useState, useEffect } from 'react';
import { eventAPI } from '../services/api';
import EventMap from '../components/EventMap';
import { Event } from '../types';
import { Map, List } from 'lucide-react';

const MapPage: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllEvents = async () => {
      try {
        setLoading(true);
        const response = await eventAPI.getAllEvents();
        if (response.success) {
          // Add mock coordinates for the events
          // In a real application, these would come from the database
          const eventsWithCoordinates = response.events.map(event => {
            // Mock coordinates based on location
            const coordinates: Record<string, [number, number]> = {
              'London': [51.505, -0.09],
              'Manchester': [53.483, -2.243],
              'Birmingham': [52.480, -1.898],
              'Liverpool': [53.408, -2.991],
              'Edinburgh': [55.953, -3.188]
            };
            
            const [latitude, longitude] = coordinates[event.location] || [51.505, -0.09];
            
            // Add slight randomization to prevent markers from overlapping
            const randomOffset = () => (Math.random() - 0.5) * 0.02;
            
            return {
              ...event,
              latitude: latitude + randomOffset(),
              longitude: longitude + randomOffset()
            };
          });
          
          setEvents(eventsWithCoordinates);
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

    fetchAllEvents();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-2xl font-bold mb-2 flex items-center">
            <Map size={24} className="mr-2 text-indigo-600" />
            Event Map View
          </h1>
          <p className="text-gray-600">
            Explore events across all locations. Click on a marker to see event details and book tickets.
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-md">
            {error}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <List size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl text-gray-600">No events found</h3>
          </div>
        ) : (
          <EventMap events={events} />
        )}
      </div>
    </div>
  );
};

export default MapPage;