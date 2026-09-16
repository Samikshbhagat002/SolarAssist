import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Chatbot from './components/Chatbot';
import PublicLayout from './layouts/PublicLayout';
import Messages from './pages/vendor/Messages';

import StartupScreen from './components/StartupScreen';
import Login from './pages/auth/Login';
import VendorLogin from './pages/auth/VendorLogin';
import RepairProviderLogin from './pages/auth/RepairProviderLogin';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Unauthorized from './pages/Unauthorized';
import AboutUs from './pages/AboutUs';
import Feedback from './pages/Feedback';
import ProfileSettings from './pages/ProfileSettings';

import UserLayout from './layouts/UserLayout';
import UserDashboard from './pages/user/Dashboard';
import SolarPlanner from './pages/user/SolarPlanner';
import Recommendation from './pages/user/Recommendation';
import FinancialAnalysis from './pages/user/FinancialAnalysis';
import UserReports from './pages/user/Reports';
import UserVendors from './pages/user/Vendors';
import ExistingSolarSupport from './pages/user/ExistingSolarSupport';

import VendorLayout from './layouts/VendorLayout';
import VendorDashboard from './pages/vendor/Dashboard';
import VendorServices from './pages/vendor/Services';
import VendorRequests from './pages/vendor/Requests';
import VendorReports from './pages/vendor/Reports';
import VendorProfile from './pages/vendor/Profile';

import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminVendors from './pages/admin/Vendors';
import VendorApprovals from './pages/admin/VendorApprovals';
import AdminAnalytics from './pages/admin/Analytics';
import AdminSettings from './pages/admin/Settings';
import RepairProviders from './pages/admin/RepairProviders';
import RepairProviderApprovals from './pages/admin/RepairProviderApprovals';

import RepairProviderLayout from './layouts/RepairProviderLayout';
import RepairProviderDashboard from './pages/repair/Dashboard';
import RepairProviderProfile from './pages/repair/Profile';
import RepairServices from './pages/repair/Services';
import RepairProviderRequests from './pages/repair/Requests';
import RepairMessages from './pages/repair/Messages';

// Paths where the chatbot should NOT appear
const HIDE_CHATBOT_ON = [
  '/', '/login', '/admin/login', '/vendor/login', '/repair/login', '/register',
];

function ChatbotGate() {
  const location = useLocation();
  if (HIDE_CHATBOT_ON.includes(location.pathname)) return null;
  return <Chatbot />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<StartupScreen />} />
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<Login />} />
            <Route path="/existing-solar-support/login" element={<Login />} />
            <Route path="/vendor/login" element={<VendorLogin />} />
            <Route path="/service-provider/login" element={<RepairProviderLogin />} />
            <Route path="/repair-provider/login" element={<RepairProviderLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/feedback" element={<Feedback />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
          </Route>
          <Route path="/user" element={<ProtectedRoute allowedRole="USER"><UserLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="planner" element={<SolarPlanner />} />
            <Route path="recommendation" element={<Recommendation />} />
            <Route path="financial" element={<FinancialAnalysis />} />
            <Route path="vendors" element={<UserVendors />} />
            <Route path="existing-solar-support" element={<ExistingSolarSupport />} />
            <Route path="reports" element={<UserReports />} />
            <Route path="profile-settings" element={<ProfileSettings />} />
          </Route>
          <Route path="/vendor" element={<ProtectedRoute allowedRole="VENDOR"><VendorLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<VendorDashboard />} />
            <Route path="services" element={<VendorServices />} />
            <Route path="requests" element={<VendorRequests />} />
            <Route path="reports" element={<VendorReports />} />
            <Route path="profile" element={<VendorProfile />} />
            <Route path="profile-settings" element={<ProfileSettings />} />
            <Route path="messages" element={<Messages />} />
          </Route>
          <Route path="/service-provider" element={<ProtectedRoute allowedRole="REPAIR_PROVIDER"><VendorLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<VendorDashboard />} />
            <Route path="services" element={<VendorServices />} />
            <Route path="requests" element={<VendorRequests />} />
            <Route path="reports" element={<VendorReports />} />
            <Route path="profile" element={<VendorProfile />} />
            <Route path="profile-settings" element={<ProfileSettings />} />
            <Route path="messages" element={<Messages />} />
          </Route>
          <Route path="/admin" element={<ProtectedRoute allowedRole="ADMIN"><AdminLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="vendors" element={<AdminVendors />} />
            <Route path="approvals" element={<VendorApprovals />} />
            <Route path="repair-providers" element={<RepairProviders />} />
            <Route path="repair-provider-approvals" element={<RepairProviderApprovals />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="profile-settings" element={<ProfileSettings />} />
          </Route>
          <Route path="/repair" element={<ProtectedRoute allowedRole="REPAIR_PROVIDER"><RepairProviderLayout /></ProtectedRoute>}>
            <Route path="dashboard" element={<RepairProviderDashboard />} />
            <Route path="profile" element={<RepairProviderProfile />} />
            <Route path="profile-settings" element={<ProfileSettings />} />
            <Route path="services" element={<RepairServices />} />
            <Route path="requests" element={<RepairProviderRequests />} />
            <Route path="messages" element={<RepairMessages />} />
          </Route>
        </Routes>
        <ChatbotGate />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;