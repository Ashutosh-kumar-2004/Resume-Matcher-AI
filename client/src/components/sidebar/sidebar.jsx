import { useState, useCallback, useEffect, useRef } from "react";
import {
  HiChevronLeft,
  HiChevronRight,
  HiDotsVertical,
  HiMenu,
  HiMoon,
  HiSun,
  HiX,
} from "react-icons/hi";
import {
  MdPerson,
  MdSettings,
  MdLogout,
  MdAddComment,
  MdHistory,
} from "react-icons/md";
import { Link, useLocation, useNavigate } from "react-router-dom";
import apiClient from "../../services/apiClient";

const AUTH_STORAGE_KEY = "auth_user_resume_matcher_ai";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [chatHistoryItems, setChatHistoryItems] = useState([]);
  const [activeChatMenuId, setActiveChatMenuId] = useState(null);
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingChatTitle, setEditingChatTitle] = useState("");
  const [isUpdatingChat, setIsUpdatingChat] = useState(false);
  const sidebarRef = useRef(null);
  const sidebarToggleRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const storedTheme = sessionStorage.getItem("ui_theme");

    if (storedTheme) {
      return storedTheme === "dark";
    }

    return true;
  });
  const location = useLocation();
  const navigate = useNavigate();
  const authUser = (() => {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);

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
    const handleOutsideClick = (event) => {
      if (!sidebarRef.current) {
        return;
      }

      if (sidebarToggleRef.current?.contains(event.target)) {
        return;
      }

      if (!sidebarRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
        setActiveChatMenuId(null);
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
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

  useEffect(() => {
    let isMounted = true;

    const loadChats = async () => {
      try {
        const response = await apiClient.get("/chats");
        if (isMounted) {
          setChatHistoryItems(response.data?.data || []);
        }
      } catch {
        if (isMounted) {
          setChatHistoryItems([]);
        }
      }
    };

    loadChats();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  const reloadChats = useCallback(async () => {
    try {
      const response = await apiClient.get("/chats");
      setChatHistoryItems(response.data?.data || []);
    } catch {
      setChatHistoryItems([]);
    }
  }, []);

  const beginRenameChat = (chat) => {
    setEditingChatId(chat._id);
    setEditingChatTitle(chat.title || "New Chat");
    setActiveChatMenuId(null);
  };

  const cancelRenameChat = () => {
    setEditingChatId(null);
    setEditingChatTitle("");
  };

  const submitRenameChat = async (chatId) => {
    const nextTitle = editingChatTitle.trim();

    if (!nextTitle || isUpdatingChat) {
      return;
    }

    setIsUpdatingChat(true);

    try {
      await apiClient.patch(`/chats/${chatId}`, { title: nextTitle });
      setEditingChatId(null);
      setEditingChatTitle("");
      await reloadChats();
    } catch {
      // Keep UI responsive even if rename fails.
    } finally {
      setIsUpdatingChat(false);
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (isUpdatingChat) {
      return;
    }

    setIsUpdatingChat(true);

    try {
      await apiClient.delete(`/chats/${chatId}`);
      setActiveChatMenuId(null);

      if (location.pathname === `/c/${chatId}`) {
        navigate("/new-chat");
      }

      await reloadChats();
    } catch (error) {
      window.alert(error?.response?.data?.message || "Unable to delete chat");
    } finally {
      setIsUpdatingChat(false);
    }
  };

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Keep logout action working even if API request fails.
    } finally {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
      window.dispatchEvent(new Event("auth-changed"));
      navigate("/login");
    }
  };

  return (
    <>
      {/* Hamburger Button - Visible on Mobile */}
      <button
        ref={sidebarToggleRef}
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
        ref={sidebarRef}
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
                     bg-[#402599]
                     text-white font-bold text-xl"
        >
          <span
            className={`${isDesktopCollapsed ? "lg:hidden" : "lg:inline"} inline`}
          >
            ResumeMatcher AI
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
                {isDesktopCollapsed ? (
                  <MdAddComment size={16} />
                ) : (
                  <MdAddComment size={18} />
                )}
              </span>
              <span
                className={`text-sm ${isDesktopCollapsed ? "lg:hidden" : "lg:inline"} inline`}
              >
                {item.name}
              </span>
            </Link>
          ))}
        </nav>

        <section
          className="flex-1 px-4 pb-4 overflow-y-auto"
          onClick={() => setActiveChatMenuId(null)}
        >
          <div
            className={`mb-2 flex items-center ${isDesktopCollapsed ? "lg:justify-center" : "gap-2"}`}
          >
            <MdHistory size={16} className="text-gray-500 dark:text-gray-400" />
            <p
              className={`text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 ${isDesktopCollapsed ? "lg:hidden" : "lg:block"} block`}
            >
              Chat History
            </p>
          </div>

          <div className="space-y-1">
            {chatHistoryItems.map((item) => (
              <div key={item._id} className="relative">
                {editingChatId === item._id ? (
                  <div className="rounded-lg bg-gray-100 px-2 py-2 dark:bg-gray-800">
                    <input
                      type="text"
                      value={editingChatTitle}
                      onChange={(event) =>
                        setEditingChatTitle(event.target.value)
                      }
                      className="mb-2 w-full min-w-0 rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                      autoFocus
                      maxLength={120}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => submitRenameChat(item._id)}
                        className="flex-1 rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
                        disabled={isUpdatingChat}
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelRenameChat}
                        className="flex-1 rounded-md bg-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        disabled={isUpdatingChat}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`w-full rounded-lg transition-colors ${
                      isDesktopCollapsed
                        ? "lg:flex lg:justify-center lg:px-2 lg:py-2"
                        : "px-3 py-2"
                    } text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 ${
                      location.pathname === `/c/${item._id}`
                        ? "bg-gray-100 dark:bg-gray-800"
                        : ""
                    }`}
                  >
                    {isDesktopCollapsed ? (
                      <div className="flex w-full items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/c/${item._id}`)}
                          className="inline-flex items-center justify-center"
                          title={item.title || "New Chat"}
                        >
                          <MdHistory size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setActiveChatMenuId((prev) =>
                              prev === item._id ? null : item._id,
                            );
                          }}
                          className="rounded-md p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                          aria-label="Open chat actions"
                        >
                          <HiDotsVertical size={12} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => navigate(`/c/${item._id}`)}
                          className="min-w-0 flex-1 text-left"
                          title={item.title || "New Chat"}
                        >
                          <span className="block truncate text-sm">
                            {item.title || "New Chat"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setActiveChatMenuId((prev) =>
                              prev === item._id ? null : item._id,
                            );
                          }}
                          className="rounded-md p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
                          aria-label="Open chat actions"
                        >
                          <HiDotsVertical size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {activeChatMenuId === item._id && editingChatId !== item._id ? (
                  <div
                    onClick={(event) => event.stopPropagation()}
                    className={`absolute z-20 min-w-36 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-1 ${
                      isDesktopCollapsed ? "left-14 top-1" : "right-2 top-10"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => beginRenameChat(item)}
                      className="w-full rounded-md px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Edit name
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteChat(item._id)}
                      className="w-full rounded-md px-3 py-2 text-left text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                      disabled={isUpdatingChat}
                    >
                      Delete chat
                    </button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {/* User Info Section */}
        <div className="relative border-t border-gray-200 dark:border-gray-800 p-4">
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

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <MdLogout size={18} />
                <span>Logout</span>
              </button>
            </div>
          ) : null}

          <div
            className={`flex items-center ${isDesktopCollapsed ? "lg:justify-center" : "gap-3"}`}
          >
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
