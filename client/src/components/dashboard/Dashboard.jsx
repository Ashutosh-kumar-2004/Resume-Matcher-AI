import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { IoAdd, IoClose, IoDocumentTextOutline, IoSend } from "react-icons/io5";
import { GrRobot } from "react-icons/gr";
import { MdWarningAmber } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "../../services/apiClient";

const MAX_CHATS_PER_USER = 10;
const MAX_FILES_PER_CHAT = 10;

const Dashboard = () => {
  const { chatId } = useParams();
  const isChatView = Boolean(chatId);
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState([]);
  const [isSending, setIsSending] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedResumeFile, setSelectedResumeFile] = useState(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [deletingFileKey, setDeletingFileKey] = useState("");
  const [typingMessageId, setTypingMessageId] = useState("");
  const [typingCharCount, setTypingCharCount] = useState(0);
  const fileInputRef = useRef(null);
  const promptTextareaRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const animatedAssistantIdsRef = useRef(new Set());
  const navigate = useNavigate();

  const autoResizePromptTextarea = (textarea) => {
    if (!textarea) {
      return;
    }

    const maxHeight = 84;
    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  const handlePromptChange = (event) => {
    setPrompt(event.target.value);
    autoResizePromptTextarea(event.target);
  };

  useEffect(() => {
    let isMounted = true;

    const fetchMessages = async () => {
      if (!isChatView || !chatId) {
        if (isMounted) {
          setMessages([]);
        }
        return;
      }

      try {
        const response = await apiClient.get(`/chats/${chatId}/messages`);
        if (isMounted) {
          setMessages(response.data?.data || []);
        }
      } catch {
        if (isMounted) {
          setMessages([]);
        }
      }
    };

    fetchMessages();

    return () => {
      isMounted = false;
    };
  }, [chatId, isChatView]);

  useEffect(() => {
    if (!isChatView) {
      return;
    }

    const container = messagesContainerRef.current;
    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [messages, isSending, isChatView]);

  useEffect(() => {
    autoResizePromptTextarea(promptTextareaRef.current);
  }, [prompt, isChatView]);

  const handleFilePickerOpen = () => {
    if (isSending) {
      return;
    }

    fileInputRef.current?.click();
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0] || null;

    if (!file) {
      setSelectedResumeFile(null);
      return;
    }

    const isPdfMime = file.type === "application/pdf";
    const hasPdfExtension = file.name.toLowerCase().endsWith(".pdf");
    const maxSizeBytes = 5 * 1024 * 1024;

    if ((!isPdfMime && !hasPdfExtension) || file.size > maxSizeBytes) {
      setSelectedResumeFile(null);
      event.target.value = "";
      return;
    }

    setSelectedResumeFile(file);
  };

  const clearSelectedFile = () => {
    if (isUploadingFile) {
      return;
    }

    setSelectedResumeFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const renderAssistantContent = (content) => {
    try {
      const parsed = JSON.parse(content);

      if (!parsed || typeof parsed !== "object") {
        return content;
      }

      const strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
      const weaknesses = Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [];
      const improvements = Array.isArray(parsed.actionableImprovements)
        ? parsed.actionableImprovements
        : [];
      const nextSteps = Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [];
      const roleReadiness =
        parsed.roleReadiness && typeof parsed.roleReadiness === "object" ? parsed.roleReadiness : null;
      const jobMatch = parsed.jobMatch && typeof parsed.jobMatch === "object" ? parsed.jobMatch : null;
      const matchingSkills = Array.isArray(jobMatch?.matchingSkills) ? jobMatch.matchingSkills : [];
      const missingKeywords = Array.isArray(jobMatch?.missingKeywords) ? jobMatch.missingKeywords : [];
      const targetedSuggestions = Array.isArray(jobMatch?.targetedSuggestions)
        ? jobMatch.targetedSuggestions
        : [];

      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-extrabold uppercase tracking-wide text-blue-700 dark:text-blue-200">
              ATS Analysis
            </span>
            {typeof parsed.overallScore === "number" ? (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-500/20 dark:text-blue-200">
                Score: {parsed.overallScore}/100
              </span>
            ) : null}
          </div>

          {parsed.summary ? <p className="text-sm leading-relaxed">{parsed.summary}</p> : null}

          {strengths.length ? (
            <div>
              <p className="mb-1 text-sm font-bold uppercase tracking-wide text-green-700 dark:text-green-200">
                Strengths
              </p>
              <ul className="space-y-1 text-sm">
                {strengths.map((item, idx) => (
                  <li key={`str-${idx}`} className="leading-relaxed">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {weaknesses.length ? (
            <div>
              <p className="mb-1 text-sm font-bold uppercase tracking-wide text-red-700 dark:text-red-200">
                Weaknesses
              </p>
              <ul className="space-y-1 text-sm">
                {weaknesses.map((item, idx) => (
                  <li key={`weak-${idx}`} className="leading-relaxed">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {improvements.length ? (
            <div>
              <p className="mb-1 text-sm font-bold uppercase tracking-wide text-purple-700 dark:text-purple-200">
                Improvements
              </p>
              <ul className="space-y-1 text-sm">
                {improvements.map((item, idx) => (
                  <li key={`imp-${idx}`} className="leading-relaxed">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {roleReadiness ? (
            <div>
              <p className="mb-1 text-sm font-bold uppercase tracking-wide text-amber-700 dark:text-amber-200">
                Role Readiness
              </p>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-100">
                {roleReadiness.status || "Unknown"}
              </p>
              {roleReadiness.reason ? (
                <p className="mt-1 text-sm leading-relaxed text-amber-700 dark:text-amber-200">
                  {roleReadiness.reason}
                </p>
              ) : null}
            </div>
          ) : null}

          {nextSteps.length ? (
            <div>
              <p className="mb-1 text-sm font-bold uppercase tracking-wide text-cyan-700 dark:text-cyan-200">
                Next Steps
              </p>
              <ul className="space-y-1 text-sm">
                {nextSteps.map((item, idx) => (
                  <li key={`step-${idx}`} className="leading-relaxed">
                    • {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {jobMatch ? (
            <div>
              <p className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                Job Match
              </p>
              <p className="text-sm">
                Match Score: {jobMatch.matchScore === null || jobMatch.matchScore === undefined ? "N/A" : jobMatch.matchScore}
              </p>

              {matchingSkills.length ? (
                <div className="mt-2">
                  <p className="mb-1 text-sm font-bold text-green-700 dark:text-green-200">Matching Skills</p>
                  <ul className="space-y-1 text-sm">
                    {matchingSkills.map((item, idx) => (
                      <li key={`ms-${idx}`} className="leading-relaxed">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {missingKeywords.length ? (
                <div className="mt-2">
                  <p className="mb-1 inline-flex items-center gap-1.5 text-sm font-extrabold uppercase tracking-wide text-red-700 dark:text-red-200">
                    <MdWarningAmber size={16} />
                    <span className="danger-gradient-text">Missing Keywords</span>
                  </p>
                  <ul className="space-y-1 text-sm">
                    {missingKeywords.map((item, idx) => (
                      <li key={`mk-${idx}`} className="leading-relaxed">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {targetedSuggestions.length ? (
                <div className="mt-2">
                  <p className="mb-1 text-sm font-bold text-blue-700 dark:text-blue-200">Targeted Suggestions</p>
                  <ul className="space-y-1 text-sm">
                    {targetedSuggestions.map((item, idx) => (
                      <li key={`ts-${idx}`} className="leading-relaxed">
                        • {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      );
    } catch {
      return content;
    }
  };

  const extractAssistantTypingText = (content) => {
    try {
      const parsed = JSON.parse(content);

      if (!parsed || typeof parsed !== "object") {
        return String(content || "");
      }

      const parts = [];

      if (parsed.summary) {
        parts.push(String(parsed.summary));
      }

      const strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
      const weaknesses = Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [];
      const improvements = Array.isArray(parsed.actionableImprovements)
        ? parsed.actionableImprovements
        : [];

      if (strengths.length) {
        parts.push(`Strengths: ${strengths.join("; ")}`);
      }

      if (weaknesses.length) {
        parts.push(`Weaknesses: ${weaknesses.join("; ")}`);
      }

      if (improvements.length) {
        parts.push(`Improvements: ${improvements.join("; ")}`);
      }

      return parts.join("\n\n") || String(content || "");
    } catch {
      return String(content || "");
    }
  };

  const renderTypingPreview = (content) => {
    const fullText = extractAssistantTypingText(content);
    const partialText = fullText.slice(0, typingCharCount);

    return (
      <p className="whitespace-pre-wrap wrap-break-word">
        {partialText}
        <span className="typing-cursor">|</span>
      </p>
    );
  };

  const handleDeleteUploadedFile = async ({ messageId, fileIndex, key }) => {
    if (!chatId || !messageId) {
      return;
    }

    setDeletingFileKey(key);

    try {
      await apiClient.delete(`/chats/${chatId}/messages/${messageId}/files/${fileIndex}`);

      setMessages((prev) =>
        prev.map((message) => {
          if (message._id !== messageId) {
            return message;
          }

          const nextFiles = Array.isArray(message.files)
            ? message.files.filter((_, idx) => idx !== fileIndex)
            : [];

          return {
            ...message,
            files: nextFiles,
          };
        })
      );
    } catch {
      // Keep UI functional even if deletion fails.
    } finally {
      setDeletingFileKey("");
    }
  };

  const getApiAbsoluteUrl = (path) => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    const configuredBase = apiClient?.defaults?.baseURL || "";

    if (/^https?:\/\//i.test(configuredBase)) {
      const origin = new URL(configuredBase).origin;
      return `${origin}${normalizedPath}`;
    }

    return normalizedPath;
  };

  const appendAssistantNotice = (noticeMessage) => {
    setMessages((prev) => [
      ...prev,
      {
        _id: `local-${Date.now()}-${Math.floor(Math.random() * 100000)}`,
        role: "assistant",
        content: JSON.stringify({
          summary: noticeMessage,
          strengths: [],
          weaknesses: [],
          actionableImprovements: [],
        }),
        files: [],
      },
    ]);
  };

  const renderUploadedFiles = (files, messageId) => {
    if (!Array.isArray(files) || files.length === 0) {
      return null;
    }

    return (
      <div className="mt-2 space-y-1">
        {files.map((file, index) => {
          const displayName = file?.originalName || file?.url || `File ${index + 1}`;
          const key = `${messageId}-${index}`;
          const isDeleting = deletingFileKey === key;
          const fileHref = getApiAbsoluteUrl(
            `/api/chats/${chatId}/messages/${messageId}/files/${index}/open`
          );

          return (
            <div
              key={`${displayName}-${index}`}
              className="inline-flex max-w-full items-center rounded-full bg-white/20 px-3 py-1 text-xs text-white/95"
            >
              <a
                href={fileHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-w-0 items-center transition hover:opacity-90"
                title={displayName}
              >
                <span className="mr-1 rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide">
                  FILE
                </span>
                <span className="truncate">{displayName}</span>
              </a>

              <button
                type="button"
                onClick={() => handleDeleteUploadedFile({ messageId, fileIndex: index, key })}
                className="ml-2 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold transition hover:bg-white/30"
                title="Delete file"
                disabled={isDeleting}
              >
                {isDeleting ? "..." : "X"}
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSelectedFileChip = () => {
    if (!selectedResumeFile) {
      return null;
    }

    const extension = (selectedResumeFile.name.split(".").pop() || "file").toUpperCase();

    return (
      <div
        className="mr-2 inline-flex max-w-[56%] items-start gap-3 rounded-2xl border border-white/15 bg-[#2f3033] px-3 py-2 text-white shadow-sm"
        title={selectedResumeFile.name}
      >
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f15747] text-white">
          <IoDocumentTextOutline size={20} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold leading-5">{selectedResumeFile.name}</span>
          <span className="block text-xs uppercase tracking-wide text-white/75">{extension}</span>
          {isUploadingFile ? (
            <span className="mt-1 block text-[11px] font-medium text-[#8bd1ff]">Uploading {uploadPercent}%</span>
          ) : null}
        </span>

        <button
          type="button"
          onClick={clearSelectedFile}
          className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/30 bg-black/25 text-white/90 transition hover:bg-black/45"
          title="Remove selected resume"
          disabled={isUploadingFile}
        >
          <IoClose size={14} />
        </button>
      </div>
    );
  };

  const totalFilesInChat = messages.reduce((count, message) => {
    const fileCount = Array.isArray(message.files) ? message.files.length : 0;
    return count + fileCount;
  }, 0);
  const isFileLimitReached = isChatView && totalFilesInChat >= MAX_FILES_PER_CHAT;
  const latestMessage = messages[messages.length - 1];
  const latestAssistantMessageId =
    latestMessage?.role === "assistant" ? latestMessage._id || "" : "";

  const shouldRenderTypingForMessage = (message) => {
    if (!message || message.role !== "assistant" || !message._id) {
      return false;
    }

    if (typingMessageId === message._id) {
      return true;
    }

    // Render typing preview immediately for a fresh assistant tail message
    // before state updates finish, preventing a one-frame full-text flash.
    return (
      message._id === latestAssistantMessageId &&
      !animatedAssistantIdsRef.current.has(message._id)
    );
  };

  useLayoutEffect(() => {
    if (!messages.length || !isChatView) {
      return;
    }

    const lastMessage = messages[messages.length - 1];

    if (!lastMessage?._id || lastMessage.role !== "assistant") {
      return;
    }

    if (animatedAssistantIdsRef.current.has(lastMessage._id)) {
      return;
    }

    animatedAssistantIdsRef.current.add(lastMessage._id);
    setTypingMessageId(lastMessage._id);
    setTypingCharCount(0);
  }, [messages, isChatView]);

  useEffect(() => {
    if (!typingMessageId) {
      return;
    }

    const targetMessage = messages.find((message) => message._id === typingMessageId);
    if (!targetMessage) {
      setTypingMessageId("");
      setTypingCharCount(0);
      return;
    }

    const fullText = extractAssistantTypingText(targetMessage.content);
    if (!fullText) {
      setTypingMessageId("");
      setTypingCharCount(0);
      return;
    }

    const intervalId = window.setInterval(() => {
      setTypingCharCount((prev) => {
        const next = prev + 1;

        if (next >= fullText.length) {
          window.clearInterval(intervalId);
          window.setTimeout(() => {
            setTypingMessageId("");
            setTypingCharCount(0);
          }, 120);
          return fullText.length;
        }

        return next;
      });
    }, 36);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [typingMessageId, messages]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isFileLimitReached) {
      window.alert("This chat already has 10 files. Please start a new chat.");
      return;
    }

    const cleanPrompt = prompt.trim();
    const hasFile = Boolean(selectedResumeFile);
    if ((!cleanPrompt && !hasFile) || isSending) {
      return;
    }

    setIsSending(true);

    try {
      // Step 1: Ensure chat exists and ID always comes from backend.
      let ensuredChatId = chatId;

      if (!ensuredChatId) {
        const chatListResponse = await apiClient.get("/chats");
        const existingChats = Array.isArray(chatListResponse.data?.data)
          ? chatListResponse.data.data
          : [];

        if (existingChats.length >= MAX_CHATS_PER_USER) {
          window.alert(
            "You already have 10 chats. Creating a new chat will immediately delete your oldest chat and its file details."
          );
        }

        const createResponse = await apiClient.post("/chats", {
          title: cleanPrompt.slice(0, 80),
        });

        if (createResponse.data?.data?.deletedOldestChat?.deleted) {
          appendAssistantNotice(
            "Your oldest chat was deleted because the 10-chat history limit was exceeded."
          );
        }

        ensuredChatId = createResponse.data?.data?.chat?._id;
      }

      if (!ensuredChatId) {
        throw new Error("Unable to create chat");
      }

      // Step 2: Store both user + assistant messages through analysis endpoint.
      if (hasFile) {
        const formData = new FormData();
        formData.append("resume", selectedResumeFile);

        if (cleanPrompt) {
          formData.append("message", cleanPrompt);
        }

        formData.append("storeInChat", "true");
        formData.append("chatId", ensuredChatId);

        setIsUploadingFile(true);
        setUploadPercent(0);

        await apiClient.post("/resume/analyze", formData, {
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total || 0;
            if (!total) {
              return;
            }

            const nextPercent = Math.min(100, Math.round((progressEvent.loaded * 100) / total));
            setUploadPercent(nextPercent);
          },
        });
      } else {
        await apiClient.post("/resume/analyze", {
          message: cleanPrompt,
          storeInChat: true,
          chatId: ensuredChatId,
        });
      }

      const refreshed = await apiClient.get(`/chats/${ensuredChatId}/messages`);
      setMessages(refreshed.data?.data || []);

      if (!isChatView) {
        setIsTransitioning(true);
        navigate(`/c/${ensuredChatId}`);
      }

      setPrompt("");
      clearSelectedFile();
    } catch (error) {
      const serverMessage = error?.response?.data?.message || "";

      if (serverMessage.toLowerCase().includes("file limit")) {
        appendAssistantNotice(serverMessage);
      }

      console.error("Chat request failed:", error?.response?.data || error.message);
    } finally {
      setIsUploadingFile(false);
      setUploadPercent(0);
      setIsSending(false);
    }
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
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileSelect}
              className="hidden"
            />

            <button
              type="button"
              onClick={handleFilePickerOpen}
              className="mr-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100 dark:text-white/90 dark:hover:bg-white/10"
              aria-label="Add"
              title="Attach File"
            >
              <IoAdd size={24} />
            </button>

            {renderSelectedFileChip()}

            <textarea
              ref={promptTextareaRef}
              value={prompt}
              onChange={handlePromptChange}
              placeholder="Check resume, Analyse resume, Give job description"
              rows={1}
              className="max-h-21 min-h-10 flex-1 resize-none overflow-y-auto bg-transparent py-2 text-base leading-6 text-gray-800 placeholder:text-gray-500 focus:outline-none dark:text-white/90 dark:placeholder:text-white/45"
            />

            <button
              type="submit"
              className="ml-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-purple-500 to-blue-500 text-white transition hover:from-purple-600 hover:to-blue-600"
              aria-label="Send"
              title="Send Message"
            >
              <IoSend size={18} />
            </button>
          </form>
        </div>
      ) : (
        <div className="relative mx-auto flex h-full w-full max-w-4xl flex-col">
          <div ref={messagesContainerRef} className="chat-scroll flex-1 overflow-y-auto py-6 sm:py-8">
            {messages.map((message) => {
              const isUser = message.role === "user";

              return (
                <div key={message._id} className={`mb-4 flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-lg sm:max-w-[70%] ${
                      isUser
                        ? "bg-linear-to-r from-purple-500 to-blue-500 font-medium text-white"
                        : "bg-white text-gray-800 dark:bg-white/10 dark:text-white/90"
                    }`}
                  >
                    {isUser ? (
                      <>
                        <p className="whitespace-pre-wrap wrap-break-word">{message.content}</p>
                        {renderUploadedFiles(message.files, message._id)}
                      </>
                    ) : (
                      shouldRenderTypingForMessage(message)
                        ? renderTypingPreview(message.content)
                        : renderAssistantContent(message.content)
                    )}
                  </div>
                </div>
              );
            })}

            <div className="flex items-center gap-3">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-r from-purple-500 to-blue-500 text-white shadow-md">
                <GrRobot size={16} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="thinking-dots text-sm font-medium text-gray-700 dark:text-white/70">
                  {isSending ? "Analysing..." : "Ready"}
                </p>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
                  Files used: {totalFilesInChat}/{MAX_FILES_PER_CHAT}
                </span>
              </div>
            </div>
          </div>

          {isFileLimitReached ? (
            <div className="sticky bottom-0 mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/95 px-4 py-3 text-sm text-amber-900 shadow-[0_10px_30px_-18px_rgba(245,158,11,0.55)] backdrop-blur-md dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100 sm:px-5">
              <p className="font-medium">
                This chat reached the 10 file limit. Start a new chat to continue.
              </p>
              <button
                type="button"
                onClick={() => navigate("/new-chat")}
                className="shrink-0 rounded-full bg-amber-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-amber-700"
              >
                Start New Chat
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="sticky bottom-0 mt-4 flex w-full items-center rounded-full border border-gray-200/80 bg-white/90 px-4 py-2 shadow-[0_10px_30px_-18px_rgba(59,130,246,0.55)] backdrop-blur-md dark:border-white/10 dark:bg-white/8 sm:px-5 sm:py-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              <button
                type="button"
                onClick={handleFilePickerOpen}
                className="mr-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100 dark:text-white/90 dark:hover:bg-white/10"
                aria-label="Add"
                title="Attach File"
              >
                <IoAdd size={24} />
              </button>

              {renderSelectedFileChip()}

              <textarea
                ref={promptTextareaRef}
                value={prompt}
                onChange={handlePromptChange}
                placeholder="Type your message"
                rows={1}
                className="max-h-21 min-h-10 flex-1 resize-none overflow-y-auto bg-transparent py-2 text-base leading-6 text-gray-800 placeholder:text-gray-500 focus:outline-none dark:text-white/90 dark:placeholder:text-white/45"
              />

              <button
                type="submit"
                className="ml-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-purple-500 to-blue-500 text-white transition hover:from-purple-600 hover:to-blue-600 disabled:opacity-60"
                aria-label="Send"
                disabled={isSending}
                title="Send Message"
              >
                <IoSend size={18} />
              </button>
            </form>
          )}
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

        @keyframes cursorBlink {
          0%,
          49% {
            opacity: 1;
          }
          50%,
          100% {
            opacity: 0;
          }
        }

        .typing-cursor {
          display: inline-block;
          margin-left: 2px;
          font-weight: 700;
          animation: cursorBlink 1s steps(1, end) infinite;
        }

        .chat-scroll {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .chat-scroll::-webkit-scrollbar {
          width: 0;
          height: 0;
        }

        @keyframes dangerGradientFlow {
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

        .danger-gradient-text {
          background-image: linear-gradient(90deg, #7f1d1d 0%, #dc2626 28%, #ef4444 52%, #f87171 70%, #dc2626 100%);
          background-size: 220% 100%;
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          animation: dangerGradientFlow 2s linear infinite;
          text-shadow: 0 0 10px rgba(220, 38, 38, 0.35);
        }

      `}</style>
    </section>
  );
};

export default Dashboard;
