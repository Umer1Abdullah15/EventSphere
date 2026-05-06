import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Tag } from 'lucide-react';
import { Event } from '../types';
import { format } from 'date-fns';

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const navigate = useNavigate();
  
  // Parse the date from YYMMDD format
  const parseEventDate = (dateString: string) => {
    const year = 2000 + parseInt(dateString.substring(0, 2));
    const month = parseInt(dateString.substring(2, 4)) - 1; // JS months are 0-indexed
    const day = parseInt(dateString.substring(4, 6));
    
    return new Date(year, month, day);
  };

  const eventDate = parseEventDate(event.date);
  const formattedDate = format(eventDate, 'MMMM d, yyyy');

  // Get category-specific styling
  const getCategoryStyle = (category: string) => {
    const styles = {
      'Music': 'bg-purple-100 text-purple-800 border-purple-200',
      'Sports': 'bg-blue-100 text-blue-800 border-blue-200',
      'Theatre': 'bg-red-100 text-red-800 border-red-200',
      'Comedy': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Arts': 'bg-green-100 text-green-800 border-green-200'
    };
    
    return styles[category as keyof typeof styles] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const handleClick = () => {
    navigate(`/events/${event.id}`);
  };

  // Default image if none provided
  const imageUrl = event.imageUrl || 
    `https://images.pexels.com/photos/2263436/pexels-photo-2263436.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1`;

  return (
    <div 
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      <div className="h-48 overflow-hidden">
        <img 
          src={imageUrl} 
          alt={event.name} 
          className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
        />
      </div>
      
      <div className="p-5">
        <h3 className="text-xl font-bold mb-2 text-gray-800">{event.name}</h3>
        
        <div className="flex items-center text-gray-600 mb-2">
          <Calendar size={16} className="mr-2 text-indigo-600" />
          <span>{formattedDate}</span>
        </div>
        
        <div className="flex items-center text-gray-600 mb-3">
          <MapPin size={16} className="mr-2 text-indigo-600" />
          <span>{event.location}</span>
        </div>
        
        <div className="flex items-center">
          <Tag size={16} className="mr-2 text-indigo-600" />
          <span className={`text-sm px-3 py-1 rounded-full border ${getCategoryStyle(event.category)}`}>
            {event.category}
          </span>
        </div>
      </div>
    </div>
  );
};

export default EventCard;