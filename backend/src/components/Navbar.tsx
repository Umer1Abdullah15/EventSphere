import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Menu, X, CalendarDays, Map, User, LogOut } from 'lucide-react';

const Navbar: React.FC = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <header className="bg-indigo-600 text-white shadow-md">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="text-2xl font-bold flex items-center">
            <CalendarDays className="mr-2" size={24} />
            <span>EventEase</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="hover:text-indigo-200 transition-colors">
              Events
            </Link>
            <Link to="/map" className="hover:text-indigo-200 transition-colors">
              Map View
            </Link>
            {isAuthenticated ? (
              <>
                <Link to="/bookings" className="hover:text-indigo-200 transition-colors">
                  My Bookings
                </Link>
                <div className="flex items-center">
                  <span className="mr-4">{user?.username}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-indigo-700 hover:bg-indigo-800 px-4 py-2 rounded-md flex items-center transition-colors"
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="space-x-4">
                <Link
                  to="/login"
                  className="hover:text-indigo-200 transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-indigo-700 hover:bg-indigo-800 px-4 py-2 rounded-md transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <nav className="md:hidden mt-4 pb-4 flex flex-col space-y-3">
            <Link 
              to="/" 
              className="hover:bg-indigo-700 p-2 rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Events
            </Link>
            <Link 
              to="/map" 
              className="hover:bg-indigo-700 p-2 rounded-md transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Map View
            </Link>
            {isAuthenticated ? (
              <>
                <Link 
                  to="/bookings" 
                  className="hover:bg-indigo-700 p-2 rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  My Bookings
                </Link>
                <div className="border-t border-indigo-500 pt-2 mt-2">
                  <div className="flex items-center mb-2">
                    <User size={16} className="mr-2" />
                    <span>{user?.username}</span>
                  </div>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full bg-indigo-700 hover:bg-indigo-800 px-4 py-2 rounded-md flex items-center justify-center transition-colors"
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col space-y-2 border-t border-indigo-500 pt-2 mt-2">
                <Link
                  to="/login"
                  className="hover:bg-indigo-700 p-2 rounded-md transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="bg-indigo-700 hover:bg-indigo-800 p-2 rounded-md text-center transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  );
};

export default Navbar;