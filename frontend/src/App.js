import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import PublicLayout from "@/components/public/PublicLayout";

import Home from "@/pages/public/Home";
import About from "@/pages/public/About";
import Services from "@/pages/public/Services";
import Tools from "@/pages/public/Tools";
import Community from "@/pages/public/Community";
import Contact from "@/pages/public/Contact";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";

import Dashboard from "@/pages/Dashboard";
import TrainingHub from "@/pages/TrainingHub";
import FullLatihan from "@/pages/training/FullLatihan";
import SingleDrill from "@/pages/training/SingleDrill";
import GKLatihan from "@/pages/training/GKLatihan";
import TrainingHistory from "@/pages/training/TrainingHistory";
import AdminDashboard from "@/pages/AdminDashboard";
import UpgradePackage from "@/pages/UpgradePackage";
import PaymentTest from "@/pages/admin/PaymentTest";
import AdminUsers from "@/pages/admin/Users";
import AdminPackages from "@/pages/admin/Packages";
import AdminPromos from "@/pages/admin/Promos";
import AdminTransactions from "@/pages/admin/Transactions";
import { AdminNews, AdminEvents } from "@/pages/admin/Cms";
import PaymentConfig from "@/pages/admin/PaymentConfig";
import MarketingDashboard from "@/pages/MarketingDashboard";

function AppHome() {
  const { user } = useAuth();
  if (!user) return null;
  // Semua role masuk ke unified Dashboard — tidak ada redirect berdasarkan role
  return <Dashboard />;
}

const Pub = ({ children }) => <PublicLayout>{children}</PublicLayout>;

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public site (with Navigation + Footer) */}
            <Route path="/" element={<Pub><Home /></Pub>} />
            <Route path="/about" element={<Pub><About /></Pub>} />
            <Route path="/services" element={<Pub><Services /></Pub>} />
            <Route path="/tools" element={<Pub><Tools /></Pub>} />
            <Route path="/community" element={<Pub><Community /></Pub>} />
            <Route path="/contact" element={<Pub><Contact /></Pub>} />
            <Route path="/login" element={<Pub><Login /></Pub>} />
            <Route path="/register" element={<Pub><Register /></Pub>} />
            <Route path="/forgot-password" element={<Pub><ForgotPassword /></Pub>} />
            <Route path="/reset-password" element={<Pub><ResetPassword /></Pub>} />

            {/* Dashboard (no public Nav) */}
            <Route path="/app" element={<ProtectedRoute><DashboardLayout><AppHome /></DashboardLayout></ProtectedRoute>} />
            <Route path="/app/training" element={<ProtectedRoute roles={["user", "admin", "superadmin"]}><DashboardLayout><TrainingHub /></DashboardLayout></ProtectedRoute>} />
            <Route path="/app/training/full" element={<ProtectedRoute roles={["user", "admin", "superadmin"]}><DashboardLayout><FullLatihan /></DashboardLayout></ProtectedRoute>} />
            <Route path="/app/training/single" element={<ProtectedRoute roles={["user", "admin", "superadmin"]}><DashboardLayout><SingleDrill /></DashboardLayout></ProtectedRoute>} />
            <Route path="/app/training/gk" element={<ProtectedRoute roles={["user", "admin", "superadmin"]}><DashboardLayout><GKLatihan /></DashboardLayout></ProtectedRoute>} />
            <Route path="/app/training/history" element={<ProtectedRoute roles={["user", "admin", "superadmin"]}><DashboardLayout><TrainingHistory /></DashboardLayout></ProtectedRoute>} />
            <Route path="/app/upgrade" element={<ProtectedRoute roles={["user"]}><DashboardLayout><UpgradePackage /></DashboardLayout></ProtectedRoute>} />
            <Route path="/app/admin/payment-test" element={<ProtectedRoute roles={["superadmin"]}><DashboardLayout><PaymentTest /></DashboardLayout></ProtectedRoute>} />
            <Route path="/app/calculator" element={<Navigate to="/app/training" replace />} />

            <Route path="/app/admin" element={<ProtectedRoute roles={["admin", "superadmin"]}><DashboardLayout><AdminDashboard /></DashboardLayout></ProtectedRoute>} />
            <Route path="/app/admin/users" element={<ProtectedRoute roles={["admin", "superadmin"]}><DashboardLayout><AdminUsers /></DashboardLayout></ProtectedRoute>} />
            <Route path="/app/admin/packages" element={<ProtectedRoute roles={["admin", "superadmin"]}><DashboardLayout><AdminPackages /></DashboardLayout></ProtectedRoute>} />
            <Route path="/app/admin/promos" element={<ProtectedRoute roles={["admin", "superadmin", "marketing"]}><DashboardLayout><AdminPromos /></DashboardLayout></ProtectedRoute>} />
            <Route path="/app/admin/transactions" element={<ProtectedRoute roles={["admin", "superadmin"]}><DashboardLayout><AdminTransactions /></DashboardLayout></ProtectedRoute>} />
            <Route path="/app/admin/news" element={<ProtectedRoute roles={["admin", "superadmin"]}><DashboardLayout><AdminNews /></DashboardLayout></ProtectedRoute>} />
            <Route path="/app/admin/events" element={<ProtectedRoute roles={["admin", "superadmin"]}><DashboardLayout><AdminEvents /></DashboardLayout></ProtectedRoute>} />
            <Route path="/app/admin/payment" element={<ProtectedRoute roles={["superadmin"]}><DashboardLayout><PaymentConfig /></DashboardLayout></ProtectedRoute>} />
            <Route path="/app/marketing" element={<ProtectedRoute roles={["marketing", "admin", "superadmin"]}><DashboardLayout><MarketingDashboard /></DashboardLayout></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
