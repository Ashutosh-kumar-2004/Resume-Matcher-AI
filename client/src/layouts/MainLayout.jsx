import Sidebar from "../components/sidebar/sidebar";

/**
 * Main Layout component wrapping the sidebar
 * Use this as the layout for your entire app
 */
const MainLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex-1 overflow-y-auto h-full">{children}</div>
      </main>
    </div>
  );
};

export default MainLayout;
