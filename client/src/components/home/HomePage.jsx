import { Link } from "react-router-dom";
import { HiArrowRight, HiSparkles } from "react-icons/hi";
import Navbar from "../navbar/Navbar";

const HomePage = () => {
  const isAuthenticated = Boolean(sessionStorage.getItem("auth_user"));

  return (
    <div className="min-h-screen bg-linear-to-br from-[#5d2ecf] via-[#4624a2] to-[#32217f] text-white">
      <Navbar />

      <main className="relative mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-6xl items-center justify-center px-6 py-12 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/10 blur-3xl" />
        </div>

        <section className="relative z-10 max-w-3xl">
          <p className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wide text-white/90">
            <HiSparkles size={14} />
            Powered by Advanced AI
          </p>

          <h1 className="mt-8 text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            AI-Powered Resume
            <br />
            Matcher
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/80 sm:text-2xl">
            Analyze your resume against any job description with intelligent insights.
            Get actionable feedback to land your dream job.
          </p>

          <div className="mt-8">
            <Link
              to={isAuthenticated ? "/dashboard" : "/login"}
              className="inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-sky-500 to-indigo-500 px-6 py-3 text-base font-bold text-white shadow-lg transition hover:from-sky-400 hover:to-indigo-400"
            >
              Get Started
              <HiArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
};

export default HomePage;
