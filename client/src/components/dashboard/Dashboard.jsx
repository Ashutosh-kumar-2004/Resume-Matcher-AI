import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { IoAdd, IoClose, IoDocumentTextOutline, IoSend, IoCheckmarkCircle, IoAlertCircle, IoRocketSharp, IoShieldCheckmark, IoCodeSlash, IoBulb, IoSchool, IoTrophy, IoBriefcase, IoCloudOutline, IoFlask, IoBarChart } from "react-icons/io5";
import { GrRobot } from "react-icons/gr";
import { MdWarningAmber, MdAutoGraph, MdHandshake, MdEditNote, MdSpeed, MdTipsAndUpdates, MdOutlineMoveToInbox } from "react-icons/md";
import { FiArrowRight, FiZap, FiStar, FiTarget } from "react-icons/fi";
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

  const [authUser, setAuthUser] = useState(() => {
    try {
      const cached = sessionStorage.getItem("auth_user_resume_matcher_ai");
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const syncAuth = () => {
      try {
        const cached = sessionStorage.getItem("auth_user_resume_matcher_ai");
        setAuthUser(cached ? JSON.parse(cached) : null);
      } catch {
        setAuthUser(null);
      }
    };

    window.addEventListener("storage", syncAuth);
    window.addEventListener("auth-changed", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("auth-changed", syncAuth);
    };
  }, []);

  const toggleTheme = () => {
    const isDark =
      document.documentElement.classList.contains("dark") ||
      document.documentElement.getAttribute("data-theme") === "dark";
    const nextTheme = isDark ? "light" : "dark";

    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      sessionStorage.setItem("ui_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
      sessionStorage.setItem("ui_theme", "light");
    }

    window.dispatchEvent(new Event("storage"));
    window.dispatchEvent(new Event("theme-changed"));
  };

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

  const getBulletIcon = (text, type) => {
    const lower = String(text || "").toLowerCase();
    const iconStyle = { flexShrink: 0, marginTop: "2px" };
    if (type === "strength") {
      if (lower.includes("mern") || lower.includes("socket") || lower.includes("deploy") || lower.includes("full-stack") || lower.includes("react") || lower.includes("node"))
        return <IoRocketSharp size={15} style={iconStyle} color="#6366f1" />;
      if (lower.includes("jwt") || lower.includes("auth") || lower.includes("security") || lower.includes("token"))
        return <IoShieldCheckmark size={15} style={iconStyle} color="#6366f1" />;
      if (lower.includes("api") || lower.includes("express") || lower.includes("mongodb") || lower.includes("database"))
        return <IoCodeSlash size={15} style={iconStyle} color="#6366f1" />;
      if (lower.includes("dsa") || lower.includes("algorithm") || lower.includes("java") || lower.includes("logic") || lower.includes("problem"))
        return <IoBulb size={15} style={iconStyle} color="#6366f1" />;
      if (lower.includes("cert") || lower.includes("hackerrank") || lower.includes("award") || lower.includes("degree"))
        return <IoTrophy size={15} style={iconStyle} color="#6366f1" />;
      return <FiStar size={14} style={iconStyle} color="#6366f1" />;
    } else {
      if (lower.includes("experience") || lower.includes("intern") || lower.includes("work") || lower.includes("job") || lower.includes("company"))
        return <IoBriefcase size={15} style={iconStyle} color="#ef4444" />;
      if (lower.includes("cloud") || lower.includes("aws") || lower.includes("gcp") || lower.includes("azure") || lower.includes("docker") || lower.includes("vercel"))
        return <IoCloudOutline size={15} style={iconStyle} color="#ef4444" />;
      if (lower.includes("test") || lower.includes("ci") || lower.includes("cd") || lower.includes("jest") || lower.includes("pipeline"))
        return <IoFlask size={15} style={iconStyle} color="#ef4444" />;
      if (lower.includes("impact") || lower.includes("metric") || lower.includes("quantif") || lower.includes("number") || lower.includes("summary"))
        return <IoBarChart size={15} style={iconStyle} color="#ef4444" />;
      return <IoAlertCircle size={15} style={iconStyle} color="#ef4444" />;
    }
  };

  const getImprovementIcon = (idx) => {
    const icons = [<MdEditNote size={16} color="#6366f1" />, <MdAutoGraph size={16} color="#6366f1" />, <MdHandshake size={16} color="#6366f1" />];
    return icons[idx] ?? <MdTipsAndUpdates size={16} color="#6366f1" />;
  };

  const getNextStepIcon = (idx) => {
    const icons = [
      <FiTarget size={14} color="#fff" />,
      <FiZap size={14} color="#fff" />,
      <MdSpeed size={14} color="#fff" />,
      <MdOutlineMoveToInbox size={14} color="#fff" />,
      <IoCheckmarkCircle size={14} color="#fff" />,
    ];
    return icons[idx] ?? <FiArrowRight size={14} color="#fff" />;
  };

  const formatSectionName = (key) => {
    switch (key) {
      case "formatAndClarity": return "Format & Clarity";
      case "skills": return "MERN & Core Skills";
      case "projects": return "Technical Projects";
      case "education": return "DSA & Education";
      case "experience": return "Practical Experience";
      default: return key.replace(/([A-Z])/g, " $1");
    }
  };

  const renderFormattedInline = (text) => {
    if (!text) return null;

    const parts = [];
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.slice(lastIndex, match.index),
        });
      }

      const token = match[0];
      if (token.startsWith("**") && token.endsWith("**")) {
        parts.push({
          type: "bold",
          content: token.slice(2, -2),
        });
      } else if (token.startsWith("`") && token.endsWith("`")) {
        parts.push({
          type: "code",
          content: token.slice(1, -1),
        });
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({
        type: "text",
        content: text.slice(lastIndex),
      });
    }

    return parts.map((part, i) => {
      if (part.type === "bold") {
        return (
          <strong key={i} className="md-bold font-bold">
            {part.content}
          </strong>
        );
      }
      if (part.type === "code") {
        return (
          <code
            key={i}
            className="mx-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-xs font-mono font-semibold text-pink-600 dark:bg-slate-800 dark:text-pink-400 border border-slate-200 dark:border-slate-700"
          >
            {part.content}
          </code>
        );
      }
      return <span key={i}>{part.content}</span>;
    });
  };

  const FormattedMarkdownText = ({ text }) => {
    if (!text) return null;

    const rawLines = String(text).split("\n");
    const elements = [];

    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i];
      const trimmed = line.trim();

      if (!trimmed) {
        elements.push(<div key={`spacer-${i}`} className="h-1.5" />);
        continue;
      }

      // Numbered list item: e.g. "1. **Generative AI...**"
      const numberedMatch = trimmed.match(/^(\d+)[\.\)]\s+(.*)$/);
      if (numberedMatch) {
        const num = numberedMatch[1];
        const content = numberedMatch[2];
        elements.push(
          <div key={`num-${i}`} className="my-2 flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-indigo-500 to-cyan-500 text-[11px] font-bold text-white shadow-xs mt-0.5 select-none">
              {num}
            </span>
            <div className="flex-1 min-w-0 leading-relaxed text-sm text-slate-800 dark:text-[#e8ecf7]">
              {renderFormattedInline(content)}
            </div>
          </div>
        );
        continue;
      }

      // Bullet item: e.g. "- **Title**" or "* Text"
      const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
      if (bulletMatch) {
        const content = bulletMatch[1];
        elements.push(
          <div key={`bullet-${i}`} className="my-1.5 flex items-start gap-2.5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500 dark:bg-cyan-400 mt-2 select-none" />
            <div className="flex-1 min-w-0 leading-relaxed text-sm text-slate-800 dark:text-[#e8ecf7]">
              {renderFormattedInline(content)}
            </div>
          </div>
        );
        continue;
      }

      // Header: e.g. "### Title"
      const headerMatch = trimmed.match(/^(#{1,4})\s+(.*)$/);
      if (headerMatch) {
        const content = headerMatch[2];
        elements.push(
          <h4 key={`header-${i}`} className="font-bold text-base text-slate-900 dark:text-white mt-3 mb-1">
            {renderFormattedInline(content)}
          </h4>
        );
        continue;
      }

      // Paragraph
      elements.push(
        <p key={`p-${i}`} className="my-1.5 leading-relaxed text-sm text-slate-800 dark:text-[#e8ecf7]">
          {renderFormattedInline(line)}
        </p>
      );
    }

    return <div className="space-y-1">{elements}</div>;
  };

  const renderAssistantContent = (content) => {
    try {
      const parsed = typeof content === "object" && content !== null ? content : JSON.parse(content);

      if (!parsed || typeof parsed !== "object") {
        return <p className="whitespace-pre-wrap">{content}</p>;
      }

      const score = typeof parsed.overallScore === "number" ? Math.max(0, Math.min(100, Math.round(parsed.overallScore))) : null;
      const isAtsMode = score !== null && parsed.mode === "resume_analysis";

      // Context-aware conversational response for non-resume chat queries
      if (!isAtsMode) {
        const text =
          parsed.summary ||
          parsed.response ||
          parsed.formalResponse ||
          parsed.message ||
          (typeof content === "string" ? content : JSON.stringify(content, null, 2));

        return (
          <div className="space-y-3 leading-relaxed text-slate-800 dark:text-[#e8ecf7]">
            <FormattedMarkdownText text={text} />
            {parsed.followUpQuestion ? (
              <div className="mt-2.5 rounded-xl border border-indigo-200/60 bg-indigo-50/70 px-3.5 py-2 text-xs font-medium text-indigo-700 dark:border-indigo-800/40 dark:bg-indigo-950/40 dark:text-indigo-300">
                💡 {parsed.followUpQuestion}
              </div>
            ) : null}
          </div>
        );
      }

      // Modern SaaS ATS Dashboard rendering dynamic AI resume analysis
      const finalScore = score;

      // Curated premium gradient palette — pick one per analysis render
      const HERO_GRADIENTS = [
        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
        "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
        "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
        "linear-gradient(135deg, #fd7043 0%, #ff8a65 50%, #ffa726 100%)",
        "linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)",
        "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
        "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)",
      ];
      const heroGradient = HERO_GRADIENTS[Math.floor(Math.random() * HERO_GRADIENTS.length)];

      const radius = 84;
      const circumference = 528;
      const strokeDashoffset = Math.round(circumference * (1 - finalScore / 100));

      const strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
      const weaknesses = Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [];
      const improvements = Array.isArray(parsed.actionableImprovements) ? parsed.actionableImprovements : [];
      const nextSteps = Array.isArray(parsed.nextSteps) ? parsed.nextSteps : [];

      const roleReadiness =
        parsed.roleReadiness && typeof parsed.roleReadiness === "object"
          ? parsed.roleReadiness
          : { status: "In Evaluation", reason: "" };
      const statusText = roleReadiness.status || "In Evaluation";
      const statusLower = statusText.toLowerCase();
      const readinessPercent =
        statusLower.includes("ready") && !statusLower.includes("part") && !statusLower.includes("not")
          ? 90
          : statusLower.includes("part")
          ? 55
          : 30;

      const skillItems = Array.isArray(parsed.skillSnapshot) && parsed.skillSnapshot.length
        ? parsed.skillSnapshot.map((s) => ({
            label: s.label || s.name || "Core Skill",
            width: Math.max(5, Math.min(100, Number(s.level ?? s.score ?? 50))),
          }))
        : parsed.sectionScores && typeof parsed.sectionScores === "object"
        ? Object.entries(parsed.sectionScores).map(([k, v]) => ({
            label: formatSectionName(k),
            width: Math.max(5, Math.min(100, Number(v) || 50)),
          }))
        : [];

      const jobMatch = parsed.jobMatch && typeof parsed.jobMatch === "object" ? parsed.jobMatch : null;
      const jobMatchText =
        jobMatch?.matchScore !== null && jobMatch?.matchScore !== undefined
          ? `${jobMatch.matchScore}%`
          : "N/A";

      const candidateName = parsed.candidateName || authUser?.name || "Candidate Profile";
      const targetRole = parsed.targetRole || "Technical Evaluation";
      const headline =
        parsed.headline ||
        (finalScore >= 80
          ? "Exceptional Candidate Profile"
          : finalScore >= 60
          ? "Strong technical profile, missing polish"
          : "Developing profile, practical gaps found");
      const summaryText = parsed.summary || roleReadiness.reason || "";

      return (
        <div className="ats-wrap">
          <div className="ats-top">
            <div>
              <h1>ATS Analysis</h1>
            </div>
          </div>

          <div className="ats-hero" style={{ background: heroGradient }}>
            <div className="ats-gauge">
              <svg width="200" height="200" viewBox="0 0 200 200">
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,.25)"
                  strokeWidth="16"
                />
                <circle
                  cx="100"
                  cy="100"
                  r={radius}
                  fill="none"
                  stroke="#fff"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="ats-n">
                <b>{finalScore}</b>
                <span>out of 100</span>
              </div>
            </div>
            <div>
              <span className="ats-chip">Role readiness: {statusText}</span>
              <h1 style={{ fontSize: "24px", margin: "0 0 6px" }}>{headline}</h1>
              {summaryText ? <p>{summaryText}</p> : null}
              <p style={{ marginTop: "12px" }}>
                <span className="ats-chip">Job match: {jobMatchText}</span>
              </p>
            </div>
          </div>

          <div className="ats-grid">
            {strengths.length ? (
              <div className="ats-card">
                <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <IoCheckmarkCircle size={18} color="var(--good)" />
                  Strengths
                </h2>
                <ul>
                  {strengths.map((str, idx) => (
                    <li key={idx}>
                      <i style={{ display: "flex", alignItems: "center" }}>{getBulletIcon(str, "strength")}</i>
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {weaknesses.length ? (
              <div className="ats-card">
                <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <IoAlertCircle size={18} color="var(--bad)" />
                  Weaknesses
                </h2>
                <ul>
                  {weaknesses.map((weak, idx) => (
                    <li key={idx}>
                      <i style={{ display: "flex", alignItems: "center" }}>{getBulletIcon(weak, "weakness")}</i>
                      <span>{weak}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {skillItems.length ? (
              <div className="ats-card">
                <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <IoBarChart size={18} color="var(--ats-a)" />
                  Skill snapshot
                </h2>
                <div className="ats-skills">
                  {skillItems.map((sk, idx) => {
                    const level =
                      sk.width >= 85 ? "Expert"
                      : sk.width >= 65 ? "Advanced"
                      : sk.width >= 40 ? "Intermediate"
                      : "Beginner";
                    const badgeColor =
                      sk.width >= 85 ? { bg: "#dcfce7", color: "#15803d" }
                      : sk.width >= 65 ? { bg: "#dbeafe", color: "#1d4ed8" }
                      : sk.width >= 40 ? { bg: "#fef9c3", color: "#92400e" }
                      : { bg: "#fee2e2", color: "#b91c1c" };
                    return (
                      <div key={idx} className="ats-sk">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                          <span style={{ fontWeight: "500", fontSize: "13px" }}>{sk.label}</span>
                          <div style={{ position: "relative", display: "inline-flex" }} className="skill-badge-wrap">
                            <span
                              className="skill-badge"
                              style={{ background: badgeColor.bg, color: badgeColor.color }}
                            >
                              {level}
                            </span>
                            <span className="skill-tooltip">{sk.width} / 100</span>
                          </div>
                        </div>
                        <div className="ats-bar">
                          <div style={{ width: `${sk.width}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="ats-card">
              <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <MdSpeed size={18} color="var(--ats-a)" />
                Role readiness
              </h2>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", color: "var(--ats-muted)" }}>Progress toward target role</span>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--ats-a)" }}>{readinessPercent}%</span>
              </div>
              <div className="ats-bar">
                <div style={{ width: `${readinessPercent}%` }}></div>
              </div>
              <div className="ats-sub">
                {statusText} · about {readinessPercent}% toward target role
              </div>
              {improvements.length ? (
                <ul style={{ marginTop: "10px" }}>
                  {improvements.slice(0, 3).map((imp, idx) => (
                    <li key={idx}>
                      <i style={{ display: "flex", alignItems: "center" }}>{getImprovementIcon(idx)}</i>
                      <span>{imp}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            {nextSteps.length ? (
              <div className="ats-card ats-full">
                <h2 style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FiTarget size={17} color="var(--ats-a)" />
                  Next steps
                </h2>
                <div className="ats-steps">
                  {nextSteps.slice(0, 5).map((step, idx) => (
                    <div key={idx} className="ats-step">
                      <b>{idx + 1}</b>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      );
    } catch {
      return <p className="whitespace-pre-wrap">{content}</p>;
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
      <div className="w-full max-w-4xl rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-[#232c47] dark:bg-[#131a2e] cursor-pointer">
        <div className="flex items-center gap-2 mb-3">
          <span className="h-2.5 w-2.5 rounded-full bg-cyan-500 animate-ping" />
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-cyan-400">
            Generating ATS Dashboard...
          </span>
          <span className="ml-auto text-[10px] text-slate-400">Click to reveal immediately</span>
        </div>
        <p className="whitespace-pre-wrap wrap-break-word text-sm text-slate-700 dark:text-[#cbd5e1] leading-relaxed">
          {partialText}
          <span className="typing-cursor font-bold text-cyan-500">|</span>
        </p>
      </div>
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

    // Fast dynamic typing: finish whole response smoothly in ~500-700ms at 60 FPS
    const step = Math.max(12, Math.ceil(fullText.length / 30));

    const intervalId = window.setInterval(() => {
      setTypingCharCount((prev) => {
        const next = prev + step;

        if (next >= fullText.length) {
          window.clearInterval(intervalId);
          window.setTimeout(() => {
            setTypingMessageId("");
            setTypingCharCount(0);
          }, 40);
          return fullText.length;
        }

        return next;
      });
    }, 16);

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

        const chatTitle =
          cleanPrompt.slice(0, 80) ||
          (selectedResumeFile ? selectedResumeFile.name.replace(/\.[^.]+$/, "") : "New Chat");

        const createResponse = await apiClient.post("/chats", {
          title: chatTitle,
        });

        if (createResponse.data?.data?.deletedOldestChat?.deleted) {
          appendAssistantNotice(
            "Your oldest chat was deleted because the 10-chat history limit was exceeded."
          );
        }

        ensuredChatId = createResponse.data?.data?.chat?._id;
        window.dispatchEvent(new Event("chats-changed"));
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
      window.dispatchEvent(new Event("chats-changed"));
    } catch (error) {
      const serverMessage =
        error?.response?.data?.message || error?.message || "Failed to process request";

      if (serverMessage.toLowerCase().includes("file limit")) {
        appendAssistantNotice(serverMessage);
      } else {
        window.alert(serverMessage);
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
        <div className="relative mx-auto flex h-full w-full max-w-5xl flex-col">
          <div ref={messagesContainerRef} className="chat-scroll flex-1 overflow-y-auto py-6 sm:py-8">
            {messages.map((message) => {
              const isUser = message.role === "user";
              const isAtsAnalysis =
                !isUser &&
                (() => {
                  try {
                    const p = JSON.parse(message.content);
                    return Boolean(
                      p && (p.mode === "resume_analysis" || typeof p.overallScore === "number") && typeof p.overallScore === "number"
                    );
                  } catch {
                    return false;
                  }
                })();

              return (
                <div
                  key={message._id}
                  className={`mb-5 flex ${
                    isAtsAnalysis ? "w-full justify-start" : isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    onClick={() => {
                      if (!isUser && typingMessageId === message._id) {
                        setTypingMessageId("");
                        setTypingCharCount(0);
                      }
                    }}
                    className={
                      isAtsAnalysis
                        ? "w-full"
                        : `max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-md sm:max-w-[70%] ${
                            isUser
                              ? "bg-linear-to-r from-purple-500 to-blue-500 font-medium text-white"
                              : "border border-slate-200/80 bg-white text-gray-800 dark:border-[#232c47] dark:bg-[#131a2e] dark:text-[#e8ecf7]"
                          }`
                    }
                  >
                    {isUser ? (
                      <>
                        <p className="whitespace-pre-wrap wrap-break-word">{message.content}</p>
                        {renderUploadedFiles(message.files, message._id)}
                      </>
                    ) : shouldRenderTypingForMessage(message) ? (
                      renderTypingPreview(message.content)
                    ) : (
                      renderAssistantContent(message.content)
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
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    if (!isSending) {
                      e.currentTarget.closest("form").requestSubmit();
                    }
                  }
                }}
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
          scrollbar-width: thin;
          scrollbar-color: rgba(148, 163, 184, 0.35) transparent;
        }

        .chat-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .chat-scroll::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.35);
          border-radius: 999px;
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

        .md-bold {
          font-weight: 700;
          color: #4f46e5;
          letter-spacing: -0.01em;
        }

        html.dark .md-bold,
        :root[data-theme="dark"] .md-bold {
          color: #22d3ee;
          text-shadow: 0 0 10px rgba(34, 211, 238, 0.25);
        }

        /* ATS Dashboard SaaS Aesthetics matching exact HTML reference */
        :root {
          --ats-bg: #f4f6fb;
          --ats-card: #fff;
          --ats-text: #0f172a;
          --ats-muted: #64748b;
          --ats-line: #e2e8f0;
          --ats-a: #6366f1;
          --ats-b: #06b6d4;
          --ats-good: #10b981;
          --ats-bad: #f43f5e;
          --ats-warn: #f59e0b;
          --ats-shadow: 0 8px 30px rgba(15,23,42,.08);
        }

        html.dark, :root[data-theme="dark"] {
          --ats-bg: #0b1020;
          --ats-card: #131a2e;
          --ats-text: #e8ecf7;
          --ats-muted: #94a3b8;
          --ats-line: #232c47;
          --ats-shadow: 0 8px 30px rgba(0,0,0,.45);
        }

        .ats-wrap {
          --bg: var(--ats-bg);
          --card: var(--ats-card);
          --text: var(--ats-text);
          --muted: var(--ats-muted);
          --line: var(--ats-line);
          --a: var(--ats-a);
          --b: var(--ats-b);
          --good: var(--ats-good);
          --bad: var(--ats-bad);
          --warn: var(--ats-warn);
          --shadow: var(--ats-shadow);
          max-width: 980px;
          width: 100%;
          margin: 0 auto;
          padding: 8px 0 24px;
          color: var(--text);
          font-family: Inter, system-ui, -apple-system, Segoe UI, sans-serif;
          line-height: 1.5;
          box-sizing: border-box;
        }

        .ats-wrap * {
          box-sizing: border-box;
        }

        .ats-wrap .ats-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .ats-wrap .ats-top h1 {
          font-size: 20px;
          font-weight: 700;
          margin: 0;
          color: var(--text);
          line-height: 1.2;
        }

        .ats-wrap .ats-sub {
          color: var(--muted);
          font-size: 13px;
          margin-top: 3px;
        }

        .ats-wrap .ats-btn {
          background: var(--card);
          color: var(--text);
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 8px 14px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          box-shadow: var(--shadow);
          transition: all 0.2s ease;
          user-select: none;
        }

        .ats-wrap .ats-btn:hover {
          filter: brightness(0.96);
          transform: translateY(-1px);
        }

        .ats-wrap .ats-hero {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 20px;
          background: linear-gradient(135deg, var(--a), var(--b));
          color: #fff;
          border-radius: 22px;
          padding: 22px;
          box-shadow: var(--shadow);
          align-items: center;
        }

        .ats-wrap .ats-gauge {
          position: relative;
          width: 200px;
          height: 200px;
          margin: auto;
        }

        .ats-wrap .ats-gauge svg {
          transform: rotate(-90deg);
          width: 200px;
          height: 200px;
        }

        .ats-wrap .ats-gauge .ats-n {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: #fff;
        }

        .ats-wrap .ats-n b {
          font-size: 52px;
          line-height: 1;
          font-weight: 800;
          color: #fff;
        }

        .ats-wrap .ats-n span {
          font-size: 12px;
          opacity: .85;
          color: #fff;
          font-weight: 600;
        }

        .ats-wrap .ats-hero h1 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 6px;
          color: #fff;
          line-height: 1.25;
        }

        .ats-wrap .ats-hero p {
          margin: 6px 0 0;
          opacity: .95;
          font-size: 14px;
          color: #fff;
          line-height: 1.5;
        }

        .ats-wrap .ats-chip {
          display: inline-block;
          background: rgba(255,255,255,.22);
          padding: 4px 12px;
          border-radius: 999px;
          font-size: 12px;
          margin-bottom: 8px;
          color: #fff;
          font-weight: 500;
        }

        .ats-wrap .ats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-top: 16px;
        }

        .ats-wrap .ats-card {
          background: var(--card);
          border: 1px solid var(--line);
          border-radius: 18px;
          padding: 18px;
          box-shadow: var(--shadow);
          color: var(--text);
        }

        .ats-wrap .ats-card h2 {
          font-size: 15px;
          font-weight: 700;
          margin: 0 0 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text);
        }

        .ats-wrap .ats-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          display: inline-block;
          flex-shrink: 0;
        }

        .ats-wrap ul {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .ats-wrap li {
          font-size: 13.5px;
          padding: 8px 0;
          border-top: 1px solid var(--line);
          display: flex;
          gap: 10px;
          color: var(--text);
          line-height: 1.45;
        }

        .ats-wrap li:first-child {
          border-top: 0;
        }

        .ats-wrap li i {
          font-style: normal;
          flex: none;
          font-size: 15px;
        }

        .ats-wrap .ats-bar {
          height: 10px;
          background: var(--line);
          border-radius: 99px;
          overflow: hidden;
          margin: 10px 0 6px;
        }

        .ats-wrap .ats-bar div {
          height: 100%;
          background: linear-gradient(90deg, var(--warn), var(--good));
          border-radius: 99px;
          transition: width 0.6s ease-in-out;
        }

        .ats-wrap .ats-skills {
          display: grid;
          gap: 10px;
        }

        .ats-wrap .ats-sk {
          font-size: 12.5px;
          font-weight: 500;
          color: var(--text);
        }

        .ats-wrap .ats-sk .ats-bar {
          margin: 4px 0 0;
          height: 8px;
        }

        .ats-wrap .skill-badge {
          display: inline-flex;
          align-items: center;
          padding: 2px 9px;
          border-radius: 999px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.02em;
          cursor: default;
          user-select: none;
          transition: transform 0.15s ease;
        }

        .ats-wrap .skill-badge-wrap:hover .skill-badge {
          transform: scale(1.06);
        }

        .ats-wrap .skill-tooltip {
          position: absolute;
          bottom: calc(100% + 6px);
          right: 0;
          background: #1e293b;
          color: #f1f5f9;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 9px;
          border-radius: 8px;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transform: translateY(4px);
          transition: opacity 0.18s ease, transform 0.18s ease;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          z-index: 10;
        }

        .ats-wrap .skill-tooltip::after {
          content: "";
          position: absolute;
          top: 100%;
          right: 12px;
          border: 5px solid transparent;
          border-top-color: #1e293b;
        }

        .ats-wrap .skill-badge-wrap:hover .skill-tooltip {
          opacity: 1;
          transform: translateY(0);
        }

        .ats-wrap .ats-steps {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 10px;
          margin-top: 6px;
        }

        .ats-wrap .ats-step {
          background: var(--bg);
          border: 1px solid var(--line);
          border-radius: 14px;
          padding: 12px;
          font-size: 12.5px;
          color: var(--text);
          line-height: 1.4;
          display: flex;
          flex-direction: column;
        }

        .ats-wrap .ats-step b {
          display: grid;
          place-items: center;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--a), var(--b));
          color: #fff;
          margin-bottom: 6px;
          font-size: 13px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .ats-wrap .ats-full {
          grid-column: 1 / -1;
        }

        @media(max-width: 720px) {
          .ats-wrap .ats-hero {
            grid-template-columns: 1fr;
          }
          .ats-wrap .ats-grid {
            grid-template-columns: 1fr;
          }
          .ats-wrap .ats-steps {
            grid-template-columns: 1fr 1fr;
          }
        }
      `}</style>
    </section>
  );
};

export default Dashboard;
