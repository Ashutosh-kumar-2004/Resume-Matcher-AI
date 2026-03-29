import { Link } from "react-router-dom";
import Navbar from "../navbar/Navbar";

const NotFoundPage = () => {
  const isAuthenticated = Boolean(sessionStorage.getItem("auth_user"));

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 dark:bg-[#0b1020] dark:text-white">
      <Navbar />

      <section className="relative overflow-hidden px-6 py-10">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-red-500/15 blur-3xl" />
          <div className="absolute -right-24 bottom-12 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        </div>

        <div className="relative mx-auto flex min-h-[80vh] w-full max-w-3xl flex-col items-center justify-center text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-red-600 dark:text-red-300">
            Error 404
          </p>
          <h1 className="bg-linear-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-5xl font-black tracking-tight text-transparent sm:text-6xl">
            Page Not Found
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-600 dark:text-white/75">
            The page you are looking for does not exist, may have moved, or the link is broken.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to={isAuthenticated ? "/dashboard" : "/login"}
              className="rounded-full bg-linear-to-r from-red-500 to-orange-500 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white transition hover:from-red-600 hover:to-orange-600"
            >
              {isAuthenticated ? "Go to Dashboard" : "Go to Login"}
            </Link>
            <Link
              to="/new-chat"
              className="rounded-full border border-gray-300 bg-white/80 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-gray-700 transition hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:bg-white/20"
            >
              Start New Chat
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default NotFoundPage;
