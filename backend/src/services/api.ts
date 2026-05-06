import axios from 'axios';
import type { 
  AuthResponse, 
  EventsResponse, 
  EventResponse, 
  TicketsResponse, 
  BookingsResponse, 
  BookingResponse 
} from '../types';

// Base API URL
const API_URL = 'http://localhost:3001/api';

// Create axios instance with credentials support
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Authentication API
export const authAPI = {
  login: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', { username, password });
    return response.data;
  },
  
  logout: async (): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },
  
  signup: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/signup', { username, password });
    return response.data;
  },
  
  checkAuth: async (): Promise<AuthResponse> => {
    const response = await apiClient.get('/auth/check');
    return response.data;
  }
};

// Events API
export const eventAPI = {
  getEventsByLocation: async (location: string): Promise<EventsResponse> => {
    const response = await apiClient.get(`/events?location=${encodeURIComponent(location)}`);
    return response.data;
  },
  
  getAllEvents: async (): Promise<EventsResponse> => {
    const response = await apiClient.get('/events/all');
    return response.data;
  },
  
  getEventById: async (id: number): Promise<EventResponse> => {
    const response = await apiClient.get(`/events/${id}`);
    return response.data;
  }
};

// Tickets API
export const ticketAPI = {
  getTicketsByEventId: async (eventId: number): Promise<TicketsResponse> => {
    const response = await apiClient.get(`/tickets/${eventId}`);
    return response.data;
  }
};

// Bookings API
export const bookingAPI = {
  createBooking: async (eventId: number, ticketType: string, quantity: number): Promise<BookingResponse> => {
    const response = await apiClient.post('/bookings', { eventId, ticketType, quantity });
    return response.data;
  },
  
  getUserBookings: async (): Promise<BookingsResponse> => {
    const response = await apiClient.get('/bookings/user');
    return response.data;
  }
};