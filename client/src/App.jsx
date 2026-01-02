import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Booking from './pages/Booking';
import CategorySelection from './pages/CategorySelection';
import Profile from './pages/Profile';
import MyBookings from './pages/MyBookings';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import UserManagement from './pages/dashboard/UserManagement';
import CourtManagement from './pages/dashboard/CourtManagement';

import BookingSchedule from './pages/dashboard/BookingSchedule';
import NewsManagement from './pages/dashboard/NewsManagement';
import GeneralSettings from './pages/dashboard/GeneralSettings';

import NewsDetail from './pages/NewsDetail';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/news/:id" element={<NewsDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/booking" element={<CategorySelection />} />
          <Route path="/booking/schedule" element={<Booking />} />
          <Route path="/my-booking" element={<MyBookings />} />
          <Route path="/profile" element={<Profile />} />

          {/* Protected Dashboard Routes */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route path="users" element={<UserManagement />} />

            <Route path="courts" element={<CourtManagement />} />
            <Route path="bookings" element={<BookingSchedule />} />
            <Route path="news" element={<NewsManagement />} />
            <Route path="settings" element={<GeneralSettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
