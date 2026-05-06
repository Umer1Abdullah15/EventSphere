export interface User {
  username: string;
  isAdmin: boolean;
}

export interface Event {
  id: number;
  name: string;
  location: string;
  date: string;
  category: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
}

export interface Ticket {
  id: number;
  eventID: number;
  ticketType: string;
  price: number;
  availability: number;
}

export interface Booking {
  id: number;
  eventID: number;
  ticketType: string;
  quantity: number;
  name: string;
  location: string;
  date: string;
  category: string;
  price: number;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: User;
  isAuthenticated?: boolean;
}

export interface EventsResponse {
  success: boolean;
  events: Event[];
}

export interface EventResponse {
  success: boolean;
  event: Event;
}

export interface TicketsResponse {
  success: boolean;
  tickets: Ticket[];
}

export interface BookingsResponse {
  success: boolean;
  bookings: Booking[];
}

export interface BookingResponse {
  success: boolean;
  message: string;
  bookingId?: number;
}