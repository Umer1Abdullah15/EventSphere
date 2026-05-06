import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI, ticketAPI, bookingAPI } from '../services/api';
import { Event, Ticket } from '../types';
import { Calendar, MapPin, Tag, AlertCircle } from 'lucide-react';
import TicketSelector from '../components/TicketSelector';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const EventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookingStatus, setBookingStatus] = useState<{ 
    success: boolean; 
    message: string 
  } | null>(null);
  
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchEventDetails = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // Fetch event details
        const eventResponse = await eventAPI.getEventById(parseInt(id));
        if (eventResponse.success) {
          setEvent(eventResponse.event);
          
          // Fetch tickets for this event
          try {
            const ticketResponse = await ticketAPI.getTicketsByEventId(parseInt(id));
            if (ticketResponse.success) {
              setTickets(ticketResponse.tickets);
            }
          } catch (err) {
            console.error('Error fetching tickets:', err);
            // Don't set error here, as we still have the event data
          }
        } else {
          setError('Failed to fetch event details');
        }
      } catch (err) {
        setError('An error occurred while fetching event details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEventDetails();
  }, [id]);
  
  const handleBooking = async (ticketType: string, quantity: number) => {
    if (!event || !isAuthenticated) return;
    
    try {
      const response = await bookingAPI.createBooking(event.id, ticketType, quantity);
      
      if (response.success) {
        setBookingStatus({
          success: true,
          message: 'Booking successful! You can view your bookings in My Bookings.'
        });
        
        // Refresh tickets after booking
        const ticketResponse = await ticketAPI.getTicketsByEventId(event.id);
        if (ticketResponse.success) {
          setTickets(ticketResponse.tickets);
        }
      } else {
        setBookingStatus({
          success: false,
          message: response.message || 'Booking failed. Please try again.'
        });
      }
    } catch (err) {
      console.error('Booking error:', err);
      setBookingStatus({
        success: false,
        message: 'An error occurred during booking. Please try again.'
      });
    }
  };
  
  // Parse the date from YYMMDD format
  const parseEventDate = (dateString: string) => {
    if (!dateString) return new Date();
    
    const year = 2000 + parseInt(dateString.substring(0, 2));
    const month = parseInt(dateString.substring(2, 4)) - 1; // JS months are 0-indexed
    const day = parseInt(dateString.substring(4, 6));
    
    return new Date(year, month, day);
  };
  
  // Get category-specific styling
  const getCategoryStyle = (category: string) => {
    const styles = {
      'Music': 'bg-purple-100 text-purple-800',
      'Sports': 'bg-blue-100 text-blue-800',
      'Theatre': 'bg-red-100 text-red-800',
      'Comedy': 'bg-yellow-100 text-yellow-800',
      'Arts': 'bg-green-100 text-green-800'
    };
    
    return styles[category as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };
  
  // Handle view bookings
  const handleViewBookings = () => {
    navigate('/bookings');
  };

  // Default image if none provided
  const imageUrl = event?.imageUrl || 
    `https://images.pexels.com/photos/2263436/pexels-photo-2263436.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1`;
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-md">
            {error}
          </div>
        ) : event ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="h-64 sm:h-80 lg:h-96 w-full overflow-hidden">
              <img 
                src={imageUrl}
                alt={event.name} 
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="p-6">
              <div className="max-w-5xl mx-auto">
                <div className="flex flex-col lg:flex-row lg:items-start gap-8">
                  <div className="lg:w-2/3">
                    <h1 className="text-3xl font-bold mb-4 text-gray-800">{event.name}</h1>
                    
                    <div className="flex flex-wrap gap-4 mb-6">
                      <div className="flex items-center text-gray-600">
                        <Calendar size={18} className="mr-2 text-indigo-600" />
                        <span>{format(parseEventDate(event.date), 'MMMM d, yyyy')}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <MapPin size={18} className="mr-2 text-indigo-600" />
                        <span>{event.location}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Tag size={18} className="mr-2 text-indigo-600" />
                        <span className={`px-3 py-1 rounded-full ${getCategoryStyle(event.category)}`}>
                          {event.category}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold mb-2">About This Event</h2>
                      <p className="text-gray-700">
                        {event.description || 
                          `Join us for an amazing ${event.category} event in ${event.location}. 
                          This is a unique opportunity to experience a fantastic event with like-minded people.
                          Don't miss out - book your tickets now!`}
                      </p>
                    </div>
                    
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold mb-2">Venue Information</h2>
                      <p className="text-gray-700">
                        Located in the heart of {event.location}, our venue offers excellent facilities
                        and is easily accessible by public transport. Doors open 30 minutes before
                        the event starts.
                      </p>
                    </div>
                  </div>
                  
                  <div className="lg:w-1/3">
                    <TicketSelector 
                      tickets={tickets} 
                      onBooking={handleBooking}
                      isAuthenticated={isAuthenticated}
                    />
                    
                    {bookingStatus && (
                      <div className={`mt-4 p-4 rounded-md ${
                        bookingStatus.success 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        <div className="flex items-start">
                          <AlertCircle className="mr-2 mt-0.5 flex-shrink-0" size={16} />
                          <div>
                            <p>{bookingStatus.message}</p>
                            {bookingStatus.success && (
                              <button
                                onClick={handleViewBookings}
                                className="mt-2 text-indigo-600 hover:text-indigo-800 font-medium"
                              >
                                View My Bookings
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <h3 className="text-xl text-gray-600">Event not found</h3>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetailPage;