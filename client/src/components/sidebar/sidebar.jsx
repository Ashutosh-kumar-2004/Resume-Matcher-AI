import { useState, useCallback, useEffect } from "react";
import { HiChevronLeft, HiChevronRight, HiDotsVertical, HiMenu, HiMoon, HiSun, HiX } from "react-icons/hi";
import { MdPerson, MdSettings, MdLogout, MdAddComment, MdHistory } from "react-icons/md";
import { Link, useLocation, useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const storedTheme = sessionStorage.getItem("ui_theme");

    if (storedTheme) {
      return storedTheme === "dark";
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const location = useLocation();
  const navigate = useNavigate();
  const authUser = (() => {
    const raw = sessionStorage.getItem("auth_user");

    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  })();

  const toggleSidebar = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleDesktopSidebar = useCallback(() => {
    setIsDesktopCollapsed((prev) => !prev);
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      return;
    }

    document.documentElement.classList.remove("dark");
  }, [isDarkMode]);

  const toggleTheme = useCallback(() => {
    setIsDarkMode((prev) => {
      const nextValue = !prev;

      if (nextValue) {
        document.documentElement.classList.add("dark");
        sessionStorage.setItem("ui_theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        sessionStorage.setItem("ui_theme", "light");
      }

      return nextValue;
    });
  }, []);

  const menuItems = [
    {
      name: "New Chat",
      path: "/new-chat",
      icon: <MdAddComment size={24} />,
    },
  ];

  const chatHistoryItems = [
    "Resume score for backend role",
    "ATS improvement suggestions",
    "React developer profile review",
    "Job description matching",
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Keep logout action working even if API request fails.
    } finally {
      sessionStorage.removeItem("auth_user");
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/login");
    }
  };

  return (
    <>
      {/* Hamburger Button - Visible on Mobile */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-4 right-4 z-50 p-2 rounded-lg 
                   bg-linear-to-br from-purple-500 to-blue-500 
                   text-white hover:from-purple-600 hover:to-blue-600
                   transition-all duration-300 shadow-lg focus:outline-none
                   focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
                   dark:focus:ring-offset-gray-900"
        aria-label="Toggle sidebar"
      >
        {isOpen ? <HiX size={24} /> : <HiMenu size={24} />}
      </button>

      {/* Overlay - Visible when sidebar is open on mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 dark:bg-black/70 z-30
                     transition-opacity duration-300"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static top-0 left-0 h-screen flex flex-col
          ${isDesktopCollapsed ? "lg:w-20" : "lg:w-64"} w-64
          bg-white dark:bg-gray-900 
          border-r border-gray-200 dark:border-gray-800
          transition-all duration-300 ease-in-out
          z-40 lg:z-30
          shadow-lg lg:shadow-none
          ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Close Button - Mobile Only */}
        <button
          onClick={closeSidebar}
          className="lg:hidden absolute top-4 right-4 p-2 rounded-lg
                     hover:bg-gray-100 dark:hover:bg-gray-800
                     transition-colors duration-200 text-gray-900 dark:text-white"
          aria-label="Close sidebar"
        >
          <HiX size={24} />
        </button>

        {/* Logo Section */}
        <div
          className="h-20 relative flex items-center justify-center
                     bg-linear-to-br from-purple-500 to-blue-500
                     text-white font-bold text-xl"
        >
          <span
            className={`${isDesktopCollapsed ? "lg:hidden" : "lg:inline"} inline`}
          >
            Resume Checker
          </span>
          <button
            onClick={toggleDesktopSidebar}
            className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2
                       h-8 w-8 items-center justify-center rounded-full
                       border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800
                       text-gray-700 dark:text-gray-200 shadow-md hover:shadow-lg
                       transition-all duration-200 z-50"
            aria-label="Toggle sidebar on desktop"
          >
            {isDesktopCollapsed ? (
              <HiChevronRight size={18} />
            ) : (
              <HiChevronLeft size={18} />
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="px-4 py-6 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={closeSidebar}
              className={`
                flex items-center transition-colors rounded-lg text-gray-700 dark:text-gray-300
                ${isDesktopCollapsed ? "lg:justify-center lg:px-2 lg:py-2" : "gap-2 px-3 py-2"}
                hover:bg-gray-100 dark:hover:bg-gray-800
                ${isActive(item.path) ? "bg-gray-100 dark:bg-gray-800" : ""}
              `}
            >
              <span className="inline-flex items-center justify-center">
                {isDesktopCollapsed ? <MdAddComment size={16} /> : <MdAddComment size={18} />}
              </span>
              <span
                className={`text-sm ${isDesktopCollapsed ? "lg:hidden" : "lg:inline"} inline`}
              >
                {item.name}
              </span>
            </Link>
          ))}
        </nav>

        <section className="flex-1 px-4 pb-4 overflow-y-auto">
          <div className={`mb-2 flex items-center ${isDesktopCollapsed ? "lg:justify-center" : "gap-2"}`}>
            <MdHistory size={16} className="text-gray-500 dark:text-gray-400" />
            <p className={`text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ${isDesktopCollapsed ? "lg:hidden" : "lg:block"} block`}>
              Chat History
            </p>
          </div>

          <div className="space-y-1">
            {chatHistoryItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => navigate("/new-chat")}
                className={`w-full rounded-lg text-left transition-colors ${
                  isDesktopCollapsed
                    ? "lg:flex lg:justify-center lg:px-2 lg:py-2"
                    : "px-3 py-2"
                } text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800`}
                title={item}
              >
                {isDesktopCollapsed ? (
                  <MdHistory size={16} />
                ) : (
                  <span className="block truncate text-sm">{item}</span>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* User Info Section */}
        <div
          className="relative border-t border-gray-200 dark:border-gray-800 p-4"
        >
          {isUserMenuOpen ? (
            <div
              className={`absolute z-50 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl p-2 space-y-1 ${
                isDesktopCollapsed
                  ? "left-full bottom-2 ml-2 min-w-48"
                  : "left-4 right-4 bottom-[calc(100%+8px)]"
              }`}
            >
              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <MdPerson size={18} />
                <span>Profile</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/settings")}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <MdSettings size={18} />
                <span>Settings</span>
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium bg-linear-to-r from-purple-500 to-blue-500 text-white hover:from-purple-600 hover:to-blue-600 transition-colors"
              >
                {isDarkMode ? <HiSun size={18} /> : <HiMoon size={18} />}
                <span>Theme: {isDarkMode ? "Dark" : "Light"}</span>
              </button>
            </div>
          ) : null}

          <div className={`flex items-center ${isDesktopCollapsed ? "lg:justify-center" : "gap-3"}`}>
            <div
              className="w-10 h-10 rounded-full bg-linear-to-br 
                           from-purple-400 to-blue-400 flex items-center 
                           justify-center text-white font-bold"
            >
              {(authUser?.name || "U")
                .split(" ")
                .map((value) => value[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div
              className={`flex-1 min-w-0 ${isDesktopCollapsed ? "lg:hidden" : "lg:block"} block`}
            >
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {authUser?.name || "User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {authUser?.email || "No email"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className={`rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 ${
                isDesktopCollapsed ? "lg:hidden" : ""
              }`}
              aria-label="Open user menu"
            >
              <HiDotsVertical size={18} />
            </button>
          </div>

          {isDesktopCollapsed ? (
            <button
              type="button"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="mt-2 hidden w-full items-center justify-center rounded-lg py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 lg:flex"
              aria-label="Open user menu"
            >
              <HiDotsVertical size={18} />
            </button>
          ) : null}
        </div>

        {/* Logout Button */}
        <div className="border-t border-gray-200 dark:border-gray-800 p-4">
          <button
            type="button"
            onClick={handleLogout}
            className={`w-full flex items-center ${isDesktopCollapsed ? "lg:justify-center lg:px-2" : "gap-3 px-4"} py-3 rounded-lg
                       text-gray-700 dark:text-gray-300
                       hover:bg-red-50 dark:hover:bg-red-900/20
                       hover:text-red-600 dark:hover:text-red-400
                       transition-all duration-200 group font-medium`}
          >
            <span className="transition-transform duration-200 group-hover:scale-110">
              <MdLogout size={24} />
            </span>
            <span
              className={`${isDesktopCollapsed ? "lg:hidden" : "lg:inline"} inline`}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper - Adjust margin on desktop */}
      <style>{`
        @media (min-width: 1024px) {
          body {
            margin-left: 0;
          }
        }
      `}</style>
    </>
  );
};

export default Sidebar;
