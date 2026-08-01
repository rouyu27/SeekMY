import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/AuthContext";
import { queryClientInstance } from "@/lib/query-client";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";

// Lazy-loaded: each page becomes its own chunk instead of all 19 pages
// shipping in one bundle on first load (was 1.1MB / 320KB gzip).
const Home = lazy(() => import("@/pages/Home"));
const MapView = lazy(() => import("@/pages/MapView"));
const Discover = lazy(() => import("@/pages/Discover"));
const ActivityLog = lazy(() => import("@/pages/ActivityLog"));
const Bookmarks = lazy(() => import("@/pages/Bookmarks"));
const Leaderboard = lazy(() => import("@/pages/Leaderboard"));
const Insights = lazy(() => import("@/pages/Insights"));
const Chatbot = lazy(() => import("@/pages/Chatbot"));
const ContributorPortal = lazy(() => import("@/pages/ContributorPortal"));
const AdminPanel = lazy(() => import("@/pages/AdminPanel"));
const LocationDetail = lazy(() => import("@/pages/LocationDetail"));
const StatePage = lazy(() => import("@/pages/StatePage"));
const Login = lazy(() => import("@/pages/Login"));
const Register = lazy(() => import("@/pages/Register"));
const ForgotPassword = lazy(() => import("@/pages/ForgotPassword"));
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const PageNotFound = lazy(() => import("@/lib/PageNotFound"));
const Profile = lazy(() => import("@/pages/Profile"));
const Help = lazy(() => import("@/pages/Help"));

function RouteFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
    </div>
  );
}

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
          <Suspense fallback={<RouteFallback />}>
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
          </Suspense>
        </BrowserRouter>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}
