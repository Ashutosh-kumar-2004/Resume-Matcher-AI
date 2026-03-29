import { useEffect, useMemo, useState } from "react";
import {
  HiMoon,
  HiOutlineLogin,
  HiOutlineLogout,
  HiOutlineUserAdd,
  HiSun,
} from "react-icons/hi";
import { Link, NavLink, useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";

const AUTH_STORAGE_KEY = "auth_user";
const THEME_STORAGE_KEY = "ui_theme";

const Navbar = () => {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const storedTheme = sessionStorage.getItem(THEME_STORAGE_KEY);

    if (storedTheme) {
      return storedTheme === "dark";
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [authUser, setAuthUser] = useState(() => {
    const cached = sessionStorage.getItem(AUTH_STORAGE_KEY);
    return cached ? JSON.parse(cached) : null;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      sessionStorage.setItem(THEME_STORAGE_KEY, "dark");
      return;
    }

    document.documentElement.classList.remove("dark");
    sessionStorage.setItem(THEME_STORAGE_KEY, "light");
  }, [isDarkMode]);

  useEffect(() => {
    const syncAuth = () => {
      const cached = sessionStorage.getItem(AUTH_STORAGE_KEY);
      setAuthUser(cached ? JSON.parse(cached) : null);
    };

    syncAuth();
    window.addEventListener("storage", syncAuth);
    window.addEventListener("auth-changed", syncAuth);

    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("auth-changed", syncAuth);
    };
  }, []);

  const links = useMemo(() => {
    if (authUser) {
      return [
        { label: "Dashboard", to: "/dashboard" },
        { label: "Profile", to: "/profile" },
      ];
    }

    return [
      { label: "Login", to: "/login", icon: <HiOutlineLogin size={18} /> },
      { label: "Sign Up", to: "/signup", icon: <HiOutlineUserAdd size={18} /> },
    ];
  }, [authUser]);

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Keep client-side logout resilient even when server logout call fails.
    } finally {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/login");
    }
  };

  return (
    <header className="w-full border-b border-white/20 bg-linear-to-br from-purple-500 to-indigo-500 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to={authUser ? "/dashboard" : "/login"}
          className="font-bold tracking-tight text-white text-xl"
        >
          ResumeMatcher AI
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-white/25 text-white"
                    : "text-white/90 hover:bg-white/15 hover:text-white"
                }`
              }
            >
              {item.icon ? <span>{item.icon}</span> : null}
              <span>{item.label}</span>
            </NavLink>
          ))}

          <button
            type="button"
            onClick={() => setIsDarkMode((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-lg p-2 text-white/90 transition-colors hover:bg-white/15 hover:text-white"
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={isDarkMode ? "Light mode" : "Dark mode"}
          >
            {isDarkMode ? <HiSun size={20} /> : <HiMoon size={20} />}
          </button>

          {authUser ? (
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white/95 transition-colors hover:bg-white/15 hover:text-white"
            >
              <HiOutlineLogout size={18} />
              <span>Logout</span>
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
