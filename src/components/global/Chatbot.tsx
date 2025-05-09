"use client";
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Send,
  X,
  ChevronDown,
  ChevronUp,
  Bot,
  User,
  PlusCircle,
  Loader,
  Copy,
  CheckCheck,
  RefreshCw,
} from "lucide-react";

interface Message {
  type: "user" | "bot";
  text: string;
  timestamp: number;
}

interface SuggestionCategory {
  name: string;
  questions: string[];
}

const ChatbotMessage: React.FC<{
  message: Message;
  darkMode: boolean;
  index: number;
  isLatest: boolean;
}> = ({ message, darkMode, index, isLatest }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1 * index }}
      className={`flex gap-3 p-3 rounded-xl relative group ${
        message.type === "user" ? "ml-auto" : "mr-auto"
      } ${isLatest ? "animate-pulse-once" : ""}`}
    >
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          message.type === "user"
            ? darkMode
              ? "bg-blue-600 text-white"
              : "bg-blue-500 text-white"
            : darkMode
              ? "bg-purple-600 text-white"
              : "bg-purple-500 text-white"
        }`}
      >
        {message.type === "user" ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>

      <div
        className={`p-3 rounded-xl max-w-[85%] relative ${
          message.type === "user"
            ? darkMode
              ? "bg-blue-900/40 text-blue-100 border border-blue-800/50"
              : "bg-blue-50 text-blue-900 border border-blue-200"
            : darkMode
              ? "bg-gray-800/80 backdrop-blur-sm text-gray-100 border border-gray-700/50"
              : "bg-white text-gray-800 border border-gray-200 shadow-sm"
        }`}
      >
        <div
          className={`whitespace-pre-line text-sm ${
            darkMode ? "text-gray-200" : "text-gray-700"
          }`}
        >
          {message.text}
        </div>
        
        <div className={`text-xs mt-1 ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
          {formatTimestamp(message.timestamp)}
        </div>

        {message.type === "bot" && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 0 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => copyToClipboard(message.text)}
            className={`absolute bottom-2 right-2 p-1 rounded-full group-hover:opacity-100 transition-opacity ${
              darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
            }`}
            title="Copy to clipboard"
          >
            {copied ? (
              <CheckCheck className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-3 h-3 text-gray-400" />
            )}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

const SuggestionPill: React.FC<{
  question: string;
  darkMode: boolean;
  onClick: () => void;
}> = ({ question, darkMode, onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1 ${
        darkMode
          ? "bg-gray-800/80 text-blue-300 border border-blue-800/30 hover:bg-gray-700/80"
          : "bg-white text-blue-700 border border-blue-200 hover:bg-blue-50"
      }`}
      onClick={onClick}
    >
      <PlusCircle className="w-3 h-3" />
      <span>{question}</span>
    </motion.button>
  );
};

export default function Chatbot({ darkMode = true }: { darkMode?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      type: "bot",
      text: "Hi there! I'm Dr. Sadeghi-Niaraki's research assistant. How can I help you?",
      timestamp: Date.now(),
    },
  ]);
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTypingEffect, setIsTypingEffect] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Enhanced suggestion categories
  const suggestionCategories: SuggestionCategory[] = [
    {
      name: "Research",
      questions: [
        "What are Dr. Sadeghi's main research areas?",
      ],
    },
    {
      name: "Education",
      questions: [
        "What is his educational background?",
      ],
    },
    {
      name: "Publications",
      questions: [
        "How many papers has he published?",
      ],
    },
    {
      name: "Experience",
      questions: [
        "Tell me about his teaching experience",
      ],
    },
  ];

  // Scroll to bottom of messages whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTypingEffect, isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, isMinimized]);

  const sendQuestion = async () => {
    if (!question.trim()) return;

    // Add user message
    const userMessage: Message = {
      type: "user",
      text: question,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    const sentQuestion = question;
    setQuestion("");
    setIsLoading(true);
    setIsTypingEffect(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question: sentQuestion,
          sessionId 
        }),
      });

      if (!res.ok) {
        throw new Error(`Server responded with status: ${res.status}`);
      }

      const data = await res.json();

      // Simulate typing effect
      setTimeout(() => {
        setIsTypingEffect(false);
        // Add bot response
        const botMessage: Message = {
          type: "bot",
          text: data.answer,
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, botMessage]);
      }, 800);
    } catch (error) {
      console.error("Error sending question:", error);

      // Add error message
      setTimeout(() => {
        setIsTypingEffect(false);
        const errorMessage: Message = {
          type: "bot",
          text: "Sorry, I encountered an error while processing your question. Please try again later.",
          timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }, 800);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuestion();
    }
  };

  // Toggle chat open/closed
  const toggleChat = () => {
    setIsOpen(!isOpen);
    setIsMinimized(false);
  };

  // Toggle chat minimized/maximized
  const toggleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestedQuestion: string) => {
    setQuestion(suggestedQuestion);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Reset conversation
  const resetConversation = () => {
    setMessages([
      {
        type: "bot",
        text: "Hi there! I'm Dr. Sadeghi-Niaraki's research assistant. How can I help you?",
        timestamp: Date.now(),
      },
    ]);
  };

  return (
    <>
      {/* Backdrop when chat is open */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black z-[49]"
            style={{ pointerEvents: 'auto' }}
            onClick={toggleChat}
          />
        )}
      </AnimatePresence>
      {/* Floating Chat Button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={toggleChat}
        className={`fixed bottom-6 right-6 z-[50] p-4 rounded-full shadow-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-purple-400 ${
          darkMode
            ? "bg-purple-600 text-white hover:bg-purple-700"
            : "bg-purple-500 text-white hover:bg-purple-600"
        }`}
        style={{ boxShadow: '0 4px 24px 0 rgba(80, 0, 120, 0.15)' }}
        aria-label="Open chat assistant"
      >
        <MessageSquare className="w-6 h-6" />
      </motion.button>
      {/* Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`fixed bottom-24 right-6 w-[90vw] max-w-sm sm:max-w-md md:max-w-lg h-[70vh] max-h-[600px] rounded-2xl shadow-2xl flex flex-col z-[51] ${
              darkMode
                ? "bg-gray-900/95 backdrop-blur-sm border border-gray-800"
                : "bg-white border border-gray-200"
            }`}
            style={{ boxShadow: '0 8px 40px 0 rgba(80, 0, 120, 0.18)' }}
          >
            {/* Chat Header */}
            <div
              className={`p-4 rounded-t-2xl flex items-center justify-between ${
                darkMode ? "bg-gray-800/50" : "bg-gray-50"
              }`}
            >
              <div className="flex items-center gap-2">
                <Bot className={`w-5 h-5 ${darkMode ? "text-purple-400" : "text-purple-600"}`} />
                <span className={`font-semibold ${darkMode ? "text-white" : "text-gray-900"}`}>
                  Research Assistant
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={resetConversation}
                  className={`p-1 rounded-full hover:bg-opacity-10 ${
                    darkMode ? "hover:bg-white" : "hover:bg-gray-900"
                  }`}
                  title="Reset conversation"
                >
                  <RefreshCw className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
                </button>
                <button
                  onClick={toggleMinimize}
                  className={`p-1 rounded-full hover:bg-opacity-10 ${
                    darkMode ? "hover:bg-white" : "hover:bg-gray-900"
                  }`}
                >
                  {isMinimized ? (
                    <ChevronUp className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
                  ) : (
                    <ChevronDown className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
                  )}
                </button>
                <button
                  onClick={toggleChat}
                  className={`p-1 rounded-full hover:bg-opacity-10 ${
                    darkMode ? "hover:bg-white" : "hover:bg-gray-900"
                  }`}
                >
                  <X className={`w-4 h-4 ${darkMode ? "text-gray-400" : "text-gray-600"}`} />
                </button>
              </div>
            </div>
            {/* Chat Messages */}
            <div
              className={`flex-1 overflow-y-auto p-4 space-y-4 ${
                darkMode ? "scrollbar-dark" : "scrollbar-light"
              }`}
            >
              {messages.map((message, index) => (
                <ChatbotMessage
                  key={index}
                  message={message}
                  darkMode={darkMode}
                  index={index}
                  isLatest={index === messages.length - 1}
                />
              ))}
              {isTypingEffect && (
                <div className="flex items-center gap-2 p-3 rounded-xl mr-auto">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" />
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce delay-100" />
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce delay-200" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            {/* Suggestions */}
            {!isMinimized && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <div className="flex flex-wrap gap-2">
                  {suggestionCategories.map((category) =>
                    category.questions.map((question, index) => (
                      <SuggestionPill
                        key={`${category.name}-${index}`}
                        question={question}
                        darkMode={darkMode}
                        onClick={() => handleSuggestionClick(question)}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
            {/* Input Area */}
            {!isMinimized && (
              <div
                className={`p-4 border-t ${
                  darkMode ? "border-gray-800" : "border-gray-200"
                }`}
              >
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    className={`flex-1 p-3 rounded-xl resize-none focus:outline-none ${
                      darkMode
                        ? "bg-gray-800 text-white placeholder-gray-400"
                        : "bg-gray-50 text-gray-900 placeholder-gray-500"
                    }`}
                    rows={1}
                    style={{ maxHeight: "120px" }}
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={sendQuestion}
                    disabled={!question.trim() || isLoading}
                    className={`p-3 rounded-full ${
                      darkMode
                        ? "bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-700"
                        : "bg-purple-500 text-white hover:bg-purple-600 disabled:bg-gray-300"
                    }`}
                  >
                    {isLoading ? (
                      <Loader className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
