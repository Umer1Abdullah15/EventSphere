import React, { useState } from 'react';
import { Ticket } from '../types';
import { Minus, Plus, Ticket as TicketIcon } from 'lucide-react';

interface TicketSelectorProps {
  tickets: Ticket[];
  onBooking: (ticketType: string, quantity: number) => void;
  isAuthenticated: boolean;
}

const TicketSelector: React.FC<TicketSelectorProps> = ({ 
  tickets, 
  onBooking,
  isAuthenticated
}) => {
  const [selectedTicket, setSelectedTicket] = useState<string>(
    tickets.length > 0 ? tickets[0].ticketType : ''
  );
  const [quantity, setQuantity] = useState(1);
  
  const handleQuantityChange = (amount: number) => {
    const ticket = tickets.find(t => t.ticketType === selectedTicket);
    if (!ticket) return;
    
    const newQuantity = quantity + amount;
    if (newQuantity >= 1 && newQuantity <= ticket.availability) {
      setQuantity(newQuantity);
    }
  };
  
  const handleTicketTypeChange = (ticketType: string) => {
    setSelectedTicket(ticketType);
    setQuantity(1); // Reset quantity when changing ticket type
  };
  
  const getSelectedTicket = () => {
    return tickets.find(t => t.ticketType === selectedTicket);
  };
  
  const calculateTotal = () => {
    const ticket = getSelectedTicket();
    return ticket ? ticket.price * quantity : 0;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4 flex items-center">
        <TicketIcon size={20} className="mr-2 text-indigo-600" />
        Select Tickets
      </h3>
      
      {tickets.length === 0 ? (
        <p className="text-red-500">No tickets available for this event.</p>
      ) : (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ticket Type
            </label>
            <select
              value={selectedTicket}
              onChange={(e) => handleTicketTypeChange(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
            >
              {tickets.map(ticket => (
                <option key={ticket.ticketType} value={ticket.ticketType}>
                  {ticket.ticketType} - £{ticket.price.toFixed(2)} 
                  ({ticket.availability} available)
                </option>
              ))}
            </select>
          </div>
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <div className="flex items-center">
              <button
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className={`p-2 rounded-l-md ${
                  quantity <= 1 
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                }`}
              >
                <Minus size={16} />
              </button>
              <input
                type="number"
                value={quantity}
                readOnly
                className="w-16 text-center p-2 border-t border-b border-gray-300"
              />
              <button
                onClick={() => handleQuantityChange(1)}
                disabled={!getSelectedTicket() || quantity >= getSelectedTicket()!.availability}
                className={`p-2 rounded-r-md ${
                  !getSelectedTicket() || quantity >= getSelectedTicket()!.availability
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                    : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                }`}
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-600">Price per ticket:</span>
              <span className="font-medium">£{getSelectedTicket()?.price.toFixed(2) || '0.00'}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total:</span>
              <span className="text-lg font-bold text-indigo-600">£{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
          
          <button
            onClick={() => onBooking(selectedTicket, quantity)}
            disabled={!isAuthenticated}
            className={`w-full py-3 px-4 rounded-md font-medium ${
              isAuthenticated 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 transition-colors' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isAuthenticated ? 'Book Now' : 'Please Login to Book'}
          </button>
          
          {!isAuthenticated && (
            <p className="mt-2 text-center text-sm text-gray-500">
              You need to be logged in to book tickets.
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default TicketSelector;