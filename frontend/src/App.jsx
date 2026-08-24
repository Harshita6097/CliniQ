import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import useAuth from './hooks/useAuth';

// Auth pages
import Login    from './pages/auth/Login';
import Register from './pages/auth/Register';

// Patient pages
import PatientLayout      from './pages/patient/PatientLayout';
import PatientDashboard   from './pages/patient/Dashboard';
import BookAppointment    from './pages/patient/BookAppointment';
import MyAppointments     from './pages/patient/MyAppointments';
import PatientApptDetail  from './pages/patient/AppointmentDetail';

// Doctor pages
import DoctorLayout      from './pages/doctor/DoctorLayout';
import DoctorDashboard   from './pages/doctor/Dashboard';
import DoctorAppointments from './pages/doctor/Appointments';
import DoctorApptDetail  from './pages/doctor/AppointmentDetail';
import LeaveManager      from './pages/doctor/LeaveManager';

// Admin pages
import AdminLayout              from './pages/admin/AdminLayout';
import AdminDashboard           from './pages/admin/Dashboard';
import ManageDoctors            from './pages/admin/ManageDoctors';
import AllAppointments          from './pages/admin/AllAppointments';
import AdminAppointmentDetail   from './pages/admin/AppointmentDetail';
import Notifications            from './pages/admin/Notifications';

// Shared pages
import CalendarSettings from './pages/shared/CalendarSettings';
import Landing         from './pages/Landing';

const ProtectedRoute = ({ allowedRole }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRole && user.role !== allowedRole) return <Navigate to={`/${user.role}`} replace />;
  return <Outlet />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/"        element={<Landing />} />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Patient portal */}
        <Route element={<ProtectedRoute allowedRole="patient" />}>
          <Route element={<PatientLayout />}>
            <Route path="/patient"                      element={<PatientDashboard />} />
            <Route path="/patient/book"                 element={<BookAppointment />} />
            <Route path="/patient/appointments"         element={<MyAppointments />} />
            <Route path="/patient/appointments/:id"     element={<PatientApptDetail />} />
            <Route path="/patient/settings"             element={<CalendarSettings />} />
          </Route>
        </Route>

        {/* Doctor portal */}
        <Route element={<ProtectedRoute allowedRole="doctor" />}>
          <Route element={<DoctorLayout />}>
            <Route path="/doctor"                       element={<DoctorDashboard />} />
            <Route path="/doctor/appointments"          element={<DoctorAppointments />} />
            <Route path="/doctor/appointments/:id"      element={<DoctorApptDetail />} />
            <Route path="/doctor/leave"                 element={<LeaveManager />} />
            <Route path="/doctor/settings"              element={<CalendarSettings />} />
          </Route>
        </Route>

        {/* Admin portal */}
        <Route element={<ProtectedRoute allowedRole="admin" />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin"                        element={<AdminDashboard />} />
            <Route path="/admin/doctors"                element={<ManageDoctors />} />
            <Route path="/admin/appointments"           element={<AllAppointments />} />
            <Route path="/admin/appointments/:id"       element={<AdminAppointmentDetail />} />
            <Route path="/admin/notifications"          element={<Notifications />} />
            <Route path="/admin/settings"               element={<CalendarSettings />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
