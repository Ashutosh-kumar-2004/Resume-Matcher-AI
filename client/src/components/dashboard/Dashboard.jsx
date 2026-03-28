import { useEffect, useState } from "react";
import { IoAdd, IoSend } from "react-icons/io5";
import { GrRobot } from "react-icons/gr";
import { useNavigate, useParams } from "react-router-dom";

const Dashboard = () => {
  const { chatId } = useParams();
  const isChatView = Boolean(chatId);
  const [prompt, setPrompt] = useState("");
  const [activeMessage, setActiveMessage] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isChatView) {
      setActiveMessage("");
      return;
    }

    const storedPrompt = sessionStorage.getItem(`chat_prompt_${chatId}`) || "";
    setActiveMessage(storedPrompt);
  }, [chatId, isChatView]);

  const generateChatId = () => {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }

    return `chat-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      return;
    }

    if (isChatView && chatId) {
      sessionStorage.setItem(`chat_prompt_${chatId}`, cleanPrompt);
      setActiveMessage(cleanPrompt);
      setPrompt("");
      return;
    }

    const nextChatId = generateChatId();
    sessionStorage.setItem(`chat_prompt_${nextChatId}`, cleanPrompt);
    setIsTransitioning(true);

    setTimeout(() => {
      navigate(`/c/${nextChatId}`);
    }, 220);
  };

  return (
    <section className="relative h-full min-h-full overflow-hidden bg-gray-50 px-4 py-6 text-gray-900 dark:bg-[#0b1020] dark:text-white sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-28 top-10 h-72 w-72 rounded-full bg-purple-500/18 blur-3xl" />
        <div className="absolute -right-28 bottom-10 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      </div>

      {!isChatView ? (
        <div className="relative mx-auto flex min-h-full w-full max-w-4xl flex-col items-center justify-center py-10">
          <h1
            className={`animate-rainbow-flow bg-clip-text text-center text-2xl font-medium tracking-tight text-transparent transition-transform duration-200 sm:text-4xl ${
              isTransitioning ? "scale-110" : "scale-100"
            }`}
            style={{
              backgroundImage:
                "linear-gradient(90deg, #ff0033 0%, #ff7a00 16%, #ffe600 32%, #00d26a 48%, #00b7ff 64%, #4f46e5 80%, #b517ff 100%)",
              backgroundSize: "300% 100%",
            }}
          >
            Good to see you,
            <br />
            Ashutosh Kumar Yadav.
          </h1>

          <form
            onSubmit={handleSubmit}
            className="mt-8 flex w-full items-center rounded-full border border-gray-200/80 bg-white/85 px-4 py-2 shadow-[0_10px_30px_-18px_rgba(59,130,246,0.55)] backdrop-blur-md dark:border-white/10 dark:bg-white/8 sm:px-5 sm:py-3"
          >
            <button
              type="button"
              className="mr-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100 dark:text-white/90 dark:hover:bg-white/10"
              aria-label="Add"
            >
              <IoAdd size={24} />
            </button>

            <input
              type="text"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Check resume, Analyse resume, Give job description"
              className="flex-1 bg-transparent text-base text-gray-800 placeholder:text-gray-500 focus:outline-none dark:text-white/90 dark:placeholder:text-white/45"
            />

            <button
              type="submit"
              className="ml-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-purple-500 to-blue-500 text-white transition hover:from-purple-600 hover:to-blue-600"
              aria-label="Send"
            >
              <IoSend size={18} />
            </button>
          </form>
        </div>
      ) : (
        <div className="relative mx-auto flex h-full w-full max-w-4xl flex-col">
          <div className="flex-1 overflow-y-auto py-6 sm:py-8">
            {activeMessage ? (
              <div className="mb-6 flex justify-end">
                <div className="max-w-[85%] rounded-2xl bg-linear-to-r from-purple-500 to-blue-500 px-4 py-3 text-sm font-medium text-white shadow-lg sm:max-w-[70%]">
                  {activeMessage}
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-3">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-r from-purple-500 to-blue-500 text-white shadow-md">
                <GrRobot size={16} />
              </div>
              <p className="thinking-dots text-sm font-medium text-gray-700 dark:text-white/70">
                Analysing...
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="sticky bottom-0 mt-4 flex w-full items-center rounded-full border border-gray-200/80 bg-white/90 px-4 py-2 shadow-[0_10px_30px_-18px_rgba(59,130,246,0.55)] backdrop-blur-md dark:border-white/10 dark:bg-white/8 sm:px-5 sm:py-3"
          >
            <button
              type="button"
              className="mr-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100 dark:text-white/90 dark:hover:bg-white/10"
              aria-label="Add"
            >
              <IoAdd size={24} />
            </button>

            <input
              type="text"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Type your message"
              className="flex-1 bg-transparent text-base text-gray-800 placeholder:text-gray-500 focus:outline-none dark:text-white/90 dark:placeholder:text-white/45"
            />

            <button
              type="submit"
              className="ml-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-purple-500 to-blue-500 text-white transition hover:from-purple-600 hover:to-blue-600"
              aria-label="Send"
            >
              <IoSend size={18} />
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes rainbowFlow {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animate-rainbow-flow {
          animation: rainbowFlow 6s linear infinite;
        }

        @keyframes thinkingDots {
          0% {
            opacity: 0.4;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.4;
          }
        }

        .thinking-dots {
          animation: thinkingDots 1.2s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default Dashboard;
