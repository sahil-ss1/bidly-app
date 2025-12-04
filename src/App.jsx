import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import LandingGC from './pages/LandingGC';
import LandingSub from './pages/LandingSub';
import GCDashboard from './pages/GCDashboard';
import SubDashboard from './pages/SubDashboard';
import AdminDashboard from './pages/AdminDashboard';
import GCProjectDetail from './pages/GCProjectDetail';
import SubProjectDetail from './pages/SubProjectDetail';
import GCProjects from './pages/GCProjects';
import HelpCenter from './pages/HelpCenter';
import SettingsPage from './pages/SettingsPage';
import PricingPage from './pages/PricingPage';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/register" replace />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/general-contractors" element={<LandingGC />} />
        <Route path="/subcontractors" element={<LandingSub />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/gc/dashboard" element={<GCDashboard />} />
        <Route path="/gc/projects" element={<GCProjects />} />
        <Route path="/gc/projects/:id" element={<GCProjectDetail />} />
        <Route path="/sub/dashboard" element={<SubDashboard />} />
        <Route path="/sub/projects/:id" element={<SubProjectDetail />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/help" element={<HelpCenter />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
