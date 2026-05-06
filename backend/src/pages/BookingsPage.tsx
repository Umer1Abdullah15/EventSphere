import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { bookingAPI } from '../services/api';
import { Booking } from '../types';
import BookingCard from '../components/BookingCard';
import { Ticket, Calendar, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const BookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/bookings' } });
      return;
    }
    
    const fetchUserBookings = async () => {
      try {
        setLoading(true);
        const response = await bookingAPI.getUserBookings();
        if (response.success) {
          setBookings(response.bookings);
          setError(null);
        } else {
          setError('Failed to fetch bookings');
        }
      } catch (err) {
        setError('An error occurred while fetching bookings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserBookings();
  }, [isAuthenticated, navigate]);
  
  // Separate bookings into upcoming and past
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0); // Set to midnight for fair comparison
  
  const parseBookingDate = (dateString: string) => {
    const year = 2000 + parseInt(dateString.substring(0, 2));
    const month = parseInt(dateString.substring(2, 4)) - 1; // JS months are 0-indexed
    const day = parseInt(dateString.substring(4, 6));
    
    return new Date(year, month, day);
  };
  
  const upcomingBookings = bookings.filter(booking => 
    parseBookingDate(booking.date) >= currentDate
  );
  
  const pastBookings = bookings.filter(booking => 
    parseBookingDate(booking.date) < currentDate
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-2xl font-bold mb-2 flex items-center">
            <Ticket size={24} className="mr-2 text-indigo-600" />
            My Bookings
          </h1>
          <p className="text-gray-600">
            View and manage your event bookings.
          </p>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 text-red-700 p-4 rounded-md mb-8">
            <div className="flex items-center">
              <AlertTriangle size={20} className="mr-2" />
              <span>{error}</span>
            </div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl text-gray-600 mb-2">No bookings found</h3>
            <p className="text-gray-500 mb-6">You haven't made any bookings yet.</p>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Browse Events
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {upcomingBookings.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Calendar size={20} className="mr-2 text-indigo-600" />
                  Upcoming Events
                </h2>
                <div className="space-y-4">
                  {upcomingBookings.map(booking => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              </div>
            )}
            
            {pastBookings.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 text-gray-700">
                  Past Events
                </h2>
                <div className="space-y-4 opacity-80">
                  {pastBookings.map(booking => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingsPage;