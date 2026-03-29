import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import LoginPage from "../components/auth/LoginPage";
import SignUpPage from "../components/auth/SignUpPage";
import Dashboard from "../components/dashboard/Dashboard";
import ProfilePage from "../components/profile/ProfilePage";
import SettingsPage from "../components/settings/SettingsPage";
import NotFoundPage from "../components/notFound/NotFoundPage";
import HomePage from "../components/home/HomePage";
import apiClient from "../services/apiClient";

const AUTH_STORAGE_KEY = "auth_user_resume_matcher_ai";

const ProtectedRoute = ({ children, authChecked, isAuthenticated }) => {
  if (!authChecked) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const AppRoutes = () => {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        const response = await apiClient.get("/auth/me");
        const user = response?.data?.user || null;

        if (!isMounted) {
          return;
        }

        if (user) {
          sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
          setIsAuthenticated(true);
          window.dispatchEvent(new Event("auth-changed"));
        } else {
          sessionStorage.removeItem(AUTH_STORAGE_KEY);
          setIsAuthenticated(false);
        }
      } catch {
        if (isMounted) {
          sessionStorage.removeItem(AUTH_STORAGE_KEY);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setAuthChecked(true);
        }
      }
    };

    verifySession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!authChecked) {
    return null;
  }

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute authChecked={authChecked} isAuthenticated={isAuthenticated}>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/new-chat"
        element={
          <ProtectedRoute authChecked={authChecked} isAuthenticated={isAuthenticated}>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/c/:chatId"
        element={
          <ProtectedRoute authChecked={authChecked} isAuthenticated={isAuthenticated}>
            <MainLayout>
              <Dashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute authChecked={authChecked} isAuthenticated={isAuthenticated}>
            <MainLayout>
              <ProfilePage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute authChecked={authChecked} isAuthenticated={isAuthenticated}>
            <MainLayout>
              <SettingsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};

export default AppRoutes;
