import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/components/DashboardLayout";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import UserOverview from "@/pages/UserOverview";
import TrainingHub from "@/pages/TrainingHub";
import FullLatihan from "@/pages/training/FullLatihan";
import SingleDrill from "@/pages/training/SingleDrill";
import GKLatihan from "@/pages/training/GKLatihan";
import AdminDashboard from "@/pages/AdminDashboard";
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
  if (user.role === "marketing") return <Navigate to="/app/marketing" replace />;
  if (user.role === "admin" || user.role === "superadmin") return <Navigate to="/app/admin" replace />;
  return <UserOverview />;
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/app" element={<ProtectedRoute><DashboardLayout><AppHome /></DashboardLayout></ProtectedRoute>} />
            <Route path="/app/training" element={<ProtectedRoute roles={["user", "admin", "superadmin"]}><DashboardLayout><TrainingHub /></DashboardLayout></ProtectedRoute>} />
            <Route path="/app/training/full" element={<ProtectedRoute roles={["user", "admin", "superadmin"]}><DashboardLayout><FullLatihan /></DashboardLayout></ProtectedRoute>} />
            <Route path="/app/training/single" element={<ProtectedRoute roles={["user", "admin", "superadmin"]}><DashboardLayout><SingleDrill /></DashboardLayout></ProtectedRoute>} />
            <Route path="/app/training/gk" element={<ProtectedRoute roles={["user", "admin", "superadmin"]}><DashboardLayout><GKLatihan /></DashboardLayout></ProtectedRoute>} />
            {/* Legacy route → redirect to hub */}
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
