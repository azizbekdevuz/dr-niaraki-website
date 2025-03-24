'use client';
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, 
  Send, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Bot, 
  User, 
  PlusCircle, 
  Sparkles,
  Loader,
  Copy,
  CheckCheck
} from 'lucide-react';

interface Message {
  type: 'user' | 'bot';
  text: string;
}

const ChatbotMessage: React.FC<{ 
  message: Message, 
  darkMode: boolean, 
  index: number,
  isLatest: boolean
}> = ({ message, darkMode, index, isLatest }) => {
  const [copied, setCopied] = useState(false);
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.1 * index }}
      className={`flex gap-3 p-3 rounded-xl relative ${
        message.type === 'user' 
          ? 'ml-auto' 
          : 'mr-auto'
      } ${isLatest ? 'animate-pulse-once' : ''}`}
    >
      <div 
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          message.type === 'user'
            ? darkMode 
              ? 'bg-blue-600 text-white' 
              : 'bg-blue-500 text-white'
            : darkMode 
              ? 'bg-purple-600 text-white' 
              : 'bg-purple-500 text-white'
        }`}
      >
        {message.type === 'user' ? (
          <User className="w-4 h-4" />
        ) : (
          <Bot className="w-4 h-4" />
        )}
      </div>
      
      <div 
        className={`p-3 rounded-xl max-w-[85%] ${
          message.type === 'user'
            ? darkMode 
              ? 'bg-blue-900/40 text-blue-100 border border-blue-800/50' 
              : 'bg-blue-50 text-blue-900 border border-blue-200'
            : darkMode 
              ? 'bg-gray-800/80 backdrop-blur-sm text-gray-100 border border-gray-700/50' 
              : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
        }`}
      >
        <div 
          className={`whitespace-pre-line text-sm ${
            darkMode ? 'text-gray-200' : 'text-gray-700'
          }`}
        >
          {message.text}
        </div>
        
        {message.type === 'bot' && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            whileHover={{ scale: 1.1 }}
            onClick={() => copyToClipboard(message.text)}
            className={`absolute bottom-2 right-2 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${
              darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
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

// Create a functional component for suggestion pills
const SuggestionPill: React.FC<{ 
  question: string, 
  darkMode: boolean, 
  onClick: () => void 
}> = ({ question, darkMode, onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1 ${
        darkMode 
          ? 'bg-gray-800/80 text-blue-300 border border-blue-800/30 hover:bg-gray-700/80' 
          : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
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
    { type: 'bot', text: "Hi there! I'm Dr. Sadeghi-Niaraki's research assistant. How can I help you?" }
  ]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTypingEffect, setIsTypingEffect] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Suggestion categories with questions
  const suggestionCategories = [
    {
      name: "Research",
      questions: [
        "What are Dr. Sadeghi's main research areas?", 
        "Tell me about his work in Geo-AI"
      ]
    },
    {
      name: "Education",
      questions: [
        "What is his educational background?", 
        "Where did he complete his Ph.D.?"
      ]
    },
    {
      name: "Publications",
      questions: [
        "What are his most cited publications?", 
        "Has he published any books?"
      ]
    }
  ];

  // Scroll to bottom of messages whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
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
    setMessages(prev => [...prev, { type: 'user', text: question }]);
    const sentQuestion = question;
    setQuestion('');
    setIsLoading(true);
    setIsTypingEffect(true);
    
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: sentQuestion }),
      });
      
      if (!res.ok) {
        throw new Error(`Server responded with status: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Simulate typing effect
      setTimeout(() => {
        setIsTypingEffect(false);
        // Add bot response
        setMessages(prev => [...prev, { type: 'bot', text: data.answer }]);
      }, 800); // Adjust typing simulation time
      
    } catch (error) {
      console.error('Error sending question:', error);
      
      // Add error message
      setTimeout(() => {
        setIsTypingEffect(false);
        setMessages(prev => [...prev, { 
          type: 'bot', 
          text: 'Sorry, I encountered an error while processing your question. Please try again later.' 
        }]);
      }, 800);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
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
    setTimeout(() => sendQuestion(), 100);
  };

  // Chat button animations
  const buttonVariants = {
    open: { rotate: 0 },
    closed: { rotate: 0 },
  };

  // Chat window animations
  const chatWindowVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.9 },
    visible: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, y: 20, scale: 0.9 },
  };

  // Minimized window animations
  const minimizedVariants = {
    hidden: { opacity: 0, y: 20, height: 0 },
    visible: { opacity: 1, y: 0, height: 'auto' },
    exit: { opacity: 0, y: 20, height: 0 },
  };

  // Circular background animation
  const bgCircleVariants = {
    animate: {
      scale: [1, 1.1, 1],
      opacity: [0.3, 0.5, 0.3],
      transition: {
        duration: 4,
        repeat: Infinity,
      }
    }
  };

  return (
    <>
      {/* Chat toggle button with animated bg */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.div
          className={`absolute inset-0 rounded-full ${
            darkMode ? 'bg-blue-600' : 'bg-blue-500'
          }`}
          variants={bgCircleVariants}
          animate="animate"
          style={{ filter: 'blur(8px)' }}
        />
        
        <motion.button
          onClick={toggleChat}
          className={`relative flex items-center justify-center w-14 h-14 rounded-full shadow-lg ${
            darkMode 
              ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white' 
              : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white'
          } z-10`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          variants={buttonVariants}
          animate={isOpen ? 'open' : 'closed'}
        >
          {isOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageSquare className="h-6 w-6" />
          )}
          
          {/* Animated rings */}
          <div className={`absolute inset-0 rounded-full border-2 ${
            darkMode ? 'border-blue-400/30' : 'border-blue-300/30'
          } animate-ping-slow`} />
          
          <div className={`absolute inset-0 rounded-full border ${
            darkMode ? 'border-blue-400/20' : 'border-blue-300/20'
          }`} />
        </motion.button>
      </div>

      {/* Chat window with animations */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-24 right-6 z-40 w-[380px] max-w-[calc(100vw-2rem)]"
            variants={chatWindowVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ maxHeight: 'calc(100vh - 120px)' }}
          >
          <div 
            className={`rounded-2xl overflow-hidden shadow-xl border flex flex-col max-h-[calc(100vh-120px)] ${
              darkMode 
                ? 'bg-gray-900/90 backdrop-blur-md border-gray-700/50' 
                : 'bg-white/95 backdrop-blur-md border-gray-200'
            }`}
          >
              {/* Header */}
              <div 
                className={`p-4 ${
                  darkMode 
                    ? 'bg-gradient-to-r from-blue-900/70 to-purple-900/70' 
                    : 'bg-gradient-to-r from-blue-100 to-purple-100'
                } flex justify-between items-center cursor-pointer`}
                onClick={toggleMinimize}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className={`p-2 rounded-full ${
                      darkMode ? 'bg-blue-700' : 'bg-blue-500'
                    }`}
                  >
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 
                      className={`font-medium ${
                        darkMode ? 'text-white' : 'text-gray-800'
                      }`}
                    >
                      Research Assistant
                    </h3>
                    <p 
                      className={`text-xs ${
                        darkMode ? 'text-blue-200' : 'text-blue-600'
                      }`}
                    >
                      Powered by AI
                    </p>
                  </div>
                </div>
                
                {/* Minimize/maximize button */}
                <button
                  onClick={toggleMinimize}
                  className={`p-1 rounded-full ${
                    darkMode 
                      ? 'hover:bg-gray-700/50 text-gray-300' 
                      : 'hover:bg-gray-200 text-gray-600'
                  }`}
                >
                  {isMinimized ? (
                    <ChevronUp className="h-5 w-5" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              <AnimatePresence>
                {!isMinimized && (
                  <motion.div
                    variants={minimizedVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                  >
                    {/* Messages area */}
                    <div 
                      className={`h-[250px] overflow-y-auto p-4 scrollbar-thin ${
                        darkMode 
                          ? 'scrollbar-thumb-gray-700 scrollbar-track-gray-900' 
                          : 'scrollbar-thumb-gray-300 scrollbar-track-gray-100'
                      }`}
                    >
                      <div className="space-y-4">
                        {messages.map((msg, i) => (
                          <ChatbotMessage 
                            key={i} 
                            message={msg} 
                            darkMode={darkMode} 
                            index={i}
                            isLatest={i === messages.length - 1} 
                          />
                        ))}
                        
                        {/* Typing indicator */}
                        {isTypingEffect && (
                          <div className="flex gap-3 p-3">
                            <div 
                              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                darkMode 
                                  ? 'bg-purple-600 text-white' 
                                  : 'bg-purple-500 text-white'
                              }`}
                            >
                              <Bot className="w-4 h-4" />
                            </div>
                            <div 
                              className={`px-4 py-3 rounded-xl ${
                                darkMode 
                                  ? 'bg-gray-800/80 text-gray-100 border border-gray-700/50' 
                                  : 'bg-white text-gray-800 border border-gray-200'
                              }`}
                            >
                              <div className="flex space-x-2">
                                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0.4s' }} />
                              </div>
                            </div>
                          </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                      </div>
                    </div>
                    
                    {/* Suggestions */}
                    {messages.length <= 2 && !isLoading && !isTypingEffect && (
                      <div 
                        className={`px-4 py-3 ${
                          darkMode ? 'border-t border-gray-800' : 'border-t border-gray-200'
                        }`}
                      >
                        <p 
                          className={`text-xs mb-2 flex items-center gap-1 ${
                            darkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}
                        >
                          <Sparkles className="w-3 h-3" />
                          Suggested topics:
                        </p>
                        
                        <div className="space-y-2">
                          {suggestionCategories.slice(0, 2).map((category, i) => (
                            <div key={i}>
                              <p 
                                className={`text-xs font-medium mb-1 ${
                                  darkMode ? 'text-gray-500' : 'text-gray-600'
                                }`}
                              >
                                {category.name}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {category.questions.map((q, j) => (
                                  <SuggestionPill
                                    key={j}
                                    question={q}
                                    darkMode={darkMode}
                                    onClick={() => handleSuggestionClick(q)}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Input area */}
                    <div 
                      className={`p-3 ${
                        darkMode ? 'border-t border-gray-800' : 'border-t border-gray-200'
                      }`}
                    >
                      <div 
                        className={`flex items-end rounded-xl p-2 ${
                          darkMode 
                            ? 'bg-gray-800/50 focus-within:bg-gray-800' 
                            : 'bg-gray-100 focus-within:bg-gray-50'
                        } transition-colors duration-200`}
                      >
                        <textarea
                          ref={inputRef}
                          className={`flex-1 max-h-24 resize-none outline-none bg-transparent text-sm p-2 ${
                            darkMode ? 'text-white' : 'text-gray-900'
                          }`}
                          value={question}
                          onChange={(e) => setQuestion(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Ask about Dr. Sadeghi-Niaraki..."
                          disabled={isLoading || isTypingEffect}
                          rows={1}
                          style={{ minHeight: '40px' }}
                        />
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className={`p-2 rounded-xl ${
                            isLoading || isTypingEffect || !question.trim()
                              ? darkMode 
                                ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : darkMode 
                                ? 'bg-blue-600 text-white hover:bg-blue-500' 
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                          onClick={sendQuestion}
                          disabled={isLoading || isTypingEffect || !question.trim()}
                        >
                          {isLoading ? (
                            <Loader className="w-5 h-5 animate-spin" />
                          ) : (
                            <Send className="w-5 h-5" />
                          )}
                        </motion.button>
                      </div>
                      
                      {/* Powered by */}
                      <div 
                        className={`text-center text-xs mt-2 ${
                          darkMode ? 'text-gray-500' : 'text-gray-400'
                        }`}
                      >
                        Powered by OpenAI
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}