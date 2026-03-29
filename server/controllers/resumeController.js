import mongoose from 'mongoose';
import { PDFParse } from 'pdf-parse';
import Groq from 'groq-sdk';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import { enforceChatFifoLimit, MAX_FILES_PER_CHAT } from '../services/chatCleanupService.js';
import {
  MAX_RESUME_TEXT_CHARS,
  MAX_JOB_DESCRIPTION_CHARS,
  MAX_CHAT_MESSAGE_CHARS,
  GENERIC_PHRASES,
  TECH_HINT_CANDIDATES,
  SYSTEM_PROMPT_FOR_GROQ_AI,
} from '../constants.js';

const cleanAndLimitText = (value, maxChars) => {
  const text = String(value || '')
    .replace(/\r\n/g, '\n')
    .replace(/[\t\f\v]+/g, ' ')
    .replace(/ +/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (!text) {
    return '';
  }

  return text.length > maxChars ? text.slice(0, maxChars) : text;
};

const extractJsonObject = (rawText) => {
  const text = String(rawText || '').trim();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch (_) {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return null;
    }

    const slice = text.slice(firstBrace, lastBrace + 1);

    try {
      return JSON.parse(slice);
    } catch {
      return null;
    }
  }
};

const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }

  const client = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  return {
    client,
    preferredModel: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
  };
};

const getCandidateModels = (preferredModel) => {
  const candidates = [
    preferredModel,
    'llama-3.1-8b-instant',
    'llama-3.3-70b-versatile',
    'mixtral-8x7b-32768',
  ].filter(Boolean);

  return [...new Set(candidates)];
};

const isModelUnavailableError = (error) => {
  const message = String(error?.message || '').toLowerCase();
  return (
    message.includes('model') ||
    message.includes('does not exist') ||
    message.includes('not found') ||
    message.includes('decommissioned') ||
    message.includes('not supported') ||
    message.includes('unsupported') ||
    message.includes('invalid model') ||
    message.includes('unknown model')
  );
};

const generateWithFallbackModels = async ({ client, preferredModel, prompt }) => {
  const candidates = getCandidateModels(preferredModel);
  const errors = [];

  for (const modelName of candidates) {
    try {
      const completion = await client.chat.completions.create({
        model: modelName,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const responseText = completion?.choices?.[0]?.message?.content;

      if (!responseText) {
        throw new Error('Groq returned an empty completion response');
      }

      return {
        modelName,
        responseText,
      };
    } catch (error) {
      errors.push({ model: modelName, message: error.message });

      if (!isModelUnavailableError(error)) {
        throw error;
      }
    }
  }

  const failureSummary = errors.map((entry) => `${entry.model}: ${entry.message}`).join(' | ');
  throw new Error(
    `No available Groq model worked for chat.completions. Set GROQ_MODEL in server/.env. Attempts: ${failureSummary}`
  );
};

const getMode = ({ message, resumeText, jobDescription }) => {
  if (message && !resumeText && !jobDescription) {
    return 'chat_only';
  }

  if (resumeText && !jobDescription) {
    return 'resume_only';
  }

  if (resumeText && jobDescription) {
    return 'resume_with_job_description';
  }

  return null;
};

const buildPrompt = ({ mode, message, resumeText, jobDescription }) => {
  const systemInstruction = SYSTEM_PROMPT_FOR_GROQ_AI.trim();

  const modeContext = `Mode: ${mode}`;
  const messageContext = message ? `User Message:\n${message}` : 'User Message: None';
  const resumeContext = resumeText ? `Resume Text:\n${resumeText}` : 'Resume Text: None';
  const jobDescriptionContext = jobDescription
    ? `Job Description:\n${jobDescription}`
    : 'Job Description: None';

  return [systemInstruction, modeContext, messageContext, resumeContext, jobDescriptionContext].join(
    '\n\n'
  );
};

const parseBoolean = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }

  return false;
};

const extractTechHints = (resumeText) => {
  const lower = String(resumeText || '').toLowerCase();

  return TECH_HINT_CANDIDATES.filter((item) => lower.includes(item));
};

const buildUploadedResumeFiles = ({ file, resumeText }) => {
  if (!file) {
    return [];
  }

  return [
    {
      url: `text://${file.originalname || 'resume.txt'}`,
      publicId: null,
      resourceType: 'raw',
      originalName: file.originalname || 'Resume.pdf',
      extractedText: cleanAndLimitText(resumeText, MAX_RESUME_TEXT_CHARS),
    },
  ];
};

const hasConcreteSignal = (line, techHints) => {
  const value = String(line || '').toLowerCase();

  if (!value.trim()) {
    return false;
  }

  if (/\b\d+(\+|%|x)?\b/.test(value)) {
    return true;
  }

  if (/(built|implemented|designed|deployed|optimized|integrated|reduced|improved)/i.test(value)) {
    return true;
  }

  if (techHints.some((tech) => value.includes(tech))) {
    return true;
  }

  return false;
};

const collectQualityIssues = ({ analysis, mode, resumeText, jobDescription }) => {
  const issues = [];

  if (!analysis || typeof analysis !== 'object') {
    return ['Response is not a valid JSON object'];
  }

  const techHints = extractTechHints(resumeText);
  const strengths = Array.isArray(analysis.strengths) ? analysis.strengths : [];
  const weaknesses = Array.isArray(analysis.weaknesses) ? analysis.weaknesses : [];
  const improvements = Array.isArray(analysis.actionableImprovements)
    ? analysis.actionableImprovements
    : [];

  if (typeof analysis.overallScore !== 'number' || analysis.overallScore < 0 || analysis.overallScore > 100) {
    issues.push('overallScore must be a number in range 0..100');
  }

  if (strengths.length < 3) {
    issues.push('strengths should include at least 3 resume-grounded points');
  }

  if (weaknesses.length < 3) {
    issues.push('weaknesses should include at least 3 concrete gaps');
  }

  if (improvements.length < 3) {
    issues.push('actionableImprovements should include at least 3 practical actions');
  }

  strengths.forEach((entry, index) => {
    if (!hasConcreteSignal(entry, techHints)) {
      issues.push(`strengths[${index}] is generic or lacks resume evidence`);
    }
  });

  weaknesses.forEach((entry, index) => {
    if (!hasConcreteSignal(entry, techHints)) {
      issues.push(`weaknesses[${index}] is generic or lacks concrete evidence`);
    }
  });

  const allLines = [...strengths, ...weaknesses, ...improvements, analysis.summary]
    .map((line) => String(line || '').toLowerCase())
    .filter(Boolean);

  for (const phrase of GENERIC_PHRASES) {
    if (allLines.some((line) => line.includes(phrase))) {
      issues.push(`Contains banned generic phrase: ${phrase}`);
    }
  }

  const hasJobDescription = Boolean(String(jobDescription || '').trim());
  const jobMatch = analysis.jobMatch || {};

  if (!hasJobDescription && mode !== 'resume_with_job_description') {
    if (jobMatch.matchScore !== null) {
      issues.push('jobMatch.matchScore must be null when no job description is provided');
    }

    if ((jobMatch.matchingSkills || []).length || (jobMatch.missingKeywords || []).length || (jobMatch.targetedSuggestions || []).length) {
      issues.push('jobMatch arrays must be empty when no job description is provided');
    }
  }

  return issues;
};

const buildRepairPrompt = ({ mode, message, resumeText, jobDescription, previousAnalysis, issues }) => {
  const basePrompt = buildPrompt({ mode, message, resumeText, jobDescription });
  const issueLines = issues.map((entry, index) => `${index + 1}. ${entry}`).join('\n');

  return `${basePrompt}\n\nYour previous JSON failed quality checks:\n${issueLines}\n\nPrevious JSON:\n${JSON.stringify(
    previousAnalysis,
    null,
    2
  )}\n\nRewrite the full JSON from scratch. Make every point resume-evidenced and non-generic. Return only valid JSON.`;
};

const extractResumeText = async (req) => {
  if (req.file?.buffer) {
    const parser = new PDFParse({ data: req.file.buffer });

    try {
      const pdfData = await parser.getText();
      return cleanAndLimitText(pdfData?.text || '', MAX_RESUME_TEXT_CHARS);
    } finally {
      await parser.destroy();
    }
  }

  return cleanAndLimitText(req.body.resumeText, MAX_RESUME_TEXT_CHARS);
};

const saveToChatHistory = async ({
  userId,
  chatId,
  userMessage,
  assistantPayload,
  mode,
  uploadedFiles,
}) => {
  if (!mongoose.Types.ObjectId.isValid(chatId)) {
    throw new Error('Invalid chat id');
  }

  const chat = await Chat.findOne({ _id: chatId, user: userId });
  if (!chat) {
    throw new Error('Chat not found');
  }

  const textUserMessage = cleanAndLimitText(userMessage, MAX_CHAT_MESSAGE_CHARS) || `Run ${mode} analysis`;
  const incomingFiles = Array.isArray(uploadedFiles) ? uploadedFiles.length : 0;
  const nextFileCount = (chat.fileCount || 0) + incomingFiles;

  if (nextFileCount > MAX_FILES_PER_CHAT) {
    throw new Error(`This chat has reached the ${MAX_FILES_PER_CHAT}-file limit. Start a new chat to continue.`);
  }

  await Message.create({
    chat: chat._id,
    user: userId,
    role: 'user',
    content: textUserMessage,
    files: uploadedFiles || [],
  });

  await Message.create({
    chat: chat._id,
    user: userId,
    role: 'assistant',
    content: JSON.stringify(assistantPayload),
    files: [],
  });

  chat.fileCount = nextFileCount;
  chat.lastMessageAt = new Date();
  await chat.save();
};

const ensureChatIdForStorage = async ({ userId, chatId, message, mode }) => {
  if (chatId) {
    return { chatId, createdChat: null };
  }

  const titleSeed = cleanAndLimitText(message, 120) || `${mode} analysis`;

  const deletedOldestChat = await enforceChatFifoLimit(userId);
  const createdChat = await Chat.create({
    user: userId,
    title: titleSeed,
  });

  return {
    chatId: String(createdChat._id),
    createdChat: {
      chat: createdChat,
      deletedOldestChat,
    },
  };
};

// @desc    Analyze resume/chat using Groq with token-optimized preprocessing
// @route   POST /api/resume/analyze
// @access  Private
export const analyzeResume = async (req, res) => {
  try {
    const message = cleanAndLimitText(req.body.message, MAX_CHAT_MESSAGE_CHARS);
    const jobDescription = cleanAndLimitText(req.body.jobDescription, MAX_JOB_DESCRIPTION_CHARS);
    const resumeText = await extractResumeText(req);
    const mode = getMode({ message, resumeText, jobDescription });

    if (!mode) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid input combination. Use one of: message only, resume only, or resume with job description.',
      });
    }

    const prompt = buildPrompt({ mode, message, resumeText, jobDescription });
    const { client, preferredModel } = getGroqClient();
    const { responseText, modelName } = await generateWithFallbackModels({
      client,
      preferredModel,
      prompt,
    });
    const parsed = extractJsonObject(responseText);

    if (!parsed) {
      return res.status(502).json({
        success: false,
        message: 'Groq returned an unparsable response',
        rawResponse: responseText,
      });
    }

    let finalAnalysis = parsed;
    const initialIssues = collectQualityIssues({
      analysis: parsed,
      mode,
      resumeText,
      jobDescription,
    });

    if (initialIssues.length) {
      const repairPrompt = buildRepairPrompt({
        mode,
        message,
        resumeText,
        jobDescription,
        previousAnalysis: parsed,
        issues: initialIssues,
      });

      const repaired = await generateWithFallbackModels({
        client,
        preferredModel,
        prompt: repairPrompt,
      });

      const repairedParsed = extractJsonObject(repaired.responseText);

      if (repairedParsed) {
        const repairedIssues = collectQualityIssues({
          analysis: repairedParsed,
          mode,
          resumeText,
          jobDescription,
        });

        if (repairedIssues.length < initialIssues.length) {
          finalAnalysis = repairedParsed;
        }
      }
    }

    const storeInChat = parseBoolean(req.body.storeInChat);
    const requestedChatId = req.body.chatId;
    let storageMeta = null;
    let finalChatId = requestedChatId;

    if (storeInChat) {
      const ensured = await ensureChatIdForStorage({
        userId: req.user.id,
        chatId: requestedChatId,
        message,
        mode,
      });

      finalChatId = ensured.chatId;
      storageMeta = ensured.createdChat;

      const uploadedFiles = buildUploadedResumeFiles({
        file: req.file,
        resumeText,
      });

      await saveToChatHistory({
        userId: req.user.id,
        chatId: finalChatId,
        userMessage: message,
        assistantPayload: finalAnalysis,
        mode,
        uploadedFiles,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        mode,
        analysis: finalAnalysis,
        inputStats: {
          resumeChars: resumeText.length,
          jobDescriptionChars: jobDescription.length,
          messageChars: message.length,
          usedUploadedPdf: Boolean(req.file?.buffer),
        },
        modelUsed: modelName,
        chat: storeInChat
          ? {
              chatId: finalChatId,
              created: Boolean(storageMeta?.chat),
              createdChat: storageMeta,
            }
          : null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};