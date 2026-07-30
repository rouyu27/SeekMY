import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/AuthContext";
import { queryClientInstance } from "@/lib/query-client";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";

import Home from "@/pages/Home";
import MapView from "@/pages/MapView";
import Discover from "@/pages/Discover";
import ActivityLog from "@/pages/ActivityLog";
import Bookmarks from "@/pages/Bookmarks";
import Leaderboard from "@/pages/Leaderboard";
import Insights from "@/pages/Insights";
import Chatbot from "@/pages/Chatbot";
import ContributorPortal from "@/pages/ContributorPortal";
import AdminPanel from "@/pages/AdminPanel";
import LocationDetail from "@/pages/LocationDetail";
import StatePage from "@/pages/StatePage";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import PageNotFound from "@/lib/PageNotFound";
import Profile from "@/pages/Profile";
import Help from "@/pages/Help";

function LoginRedirect() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 p-8">
      <p className="text-gray-600">Please log in to continue.</p>
      <a href="/login" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
        Go to Login
      </a>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClientInstance}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/location/:id" element={<LocationDetail />} />
              <Route path="/state/:state" element={<StatePage />} />
              <Route path="/locations" element={<Discover />} />
              <Route path="/chatbot" element={<Chatbot />} />
              <Route path="/contributor" element={<ContributorPortal />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/insights" element={<Insights />} />
              <Route path="/help" element={<Help />} />


              <Route element={<ProtectedRoute unauthenticatedElement={<LoginRedirect />} />}>
                <Route path="/activity-log" element={<ActivityLog />} />
                <Route path="/bookmarks" element={<Bookmarks />} />
                <Route path="/profile" element={<Profile />} />
              </Route>

              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminPanel />} />
              </Route>
            </Route>

            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
