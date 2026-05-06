import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Tag, Ticket } from 'lucide-react';
import { Booking } from '../types';
import { format } from 'date-fns';

interface BookingCardProps {
  booking: Booking;
}

const BookingCard: React.FC<BookingCardProps> = ({ booking }) => {
  // Parse the date from YYMMDD format
  const parseBookingDate = (dateString: string) => {
    const year = 2000 + parseInt(dateString.substring(0, 2));
    const month = parseInt(dateString.substring(2, 4)) - 1; // JS months are 0-indexed
    const day = parseInt(dateString.substring(4, 6));
    
    return new Date(year, month, day);
  };

  const eventDate = parseBookingDate(booking.date);
  const formattedDate = format(eventDate, 'MMMM d, yyyy');
  const isPastEvent = eventDate < new Date();
  
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

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 ${
      isPastEvent ? 'border-gray-400' : 'border-green-500'
    }`}>
      <div className="p-5">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">
              {booking.name}
              {isPastEvent && (
                <span className="ml-2 text-sm bg-gray-200 text-gray-600 py-1 px-2 rounded-full">
                  Past Event
                </span>
              )}
            </h3>
            
            <div className="flex items-center text-gray-600 mb-2">
              <Calendar size={16} className="mr-2 text-indigo-600" />
              <span>{formattedDate}</span>
            </div>
            
            <div className="flex items-center text-gray-600 mb-3">
              <MapPin size={16} className="mr-2 text-indigo-600" />
              <span>{booking.location}</span>
            </div>
            
            <div className="flex flex-wrap gap-2 items-center mb-3">
              <div className="flex items-center">
                <Tag size={16} className="mr-2 text-indigo-600" />
                <span className={`text-sm px-3 py-1 rounded-full ${getCategoryStyle(booking.category)}`}>
                  {booking.category}
                </span>
              </div>
              
              <div className="flex items-center">
                <Ticket size={16} className="mr-2 text-indigo-600" />
                <span className="text-sm px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                  {booking.ticketType}
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="text-sm text-gray-500 mb-1">Booking Details</div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-600">Quantity:</span>
              <span className="font-semibold">{booking.quantity}</span>
            </div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-gray-600">Price per ticket:</span>
              <span className="font-semibold">£{booking.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200 mt-2">
              <span className="text-gray-700 font-medium">Total:</span>
              <span className="text-lg font-bold text-indigo-600">
                £{(booking.price * booking.quantity).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
          <Link
            to={`/events/${booking.eventID}`}
            className="text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            View Event Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookingCard;