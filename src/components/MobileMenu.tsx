import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { X } from 'lucide-react';

const MobileMenu: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    darkMode: boolean;
  }> = ({ isOpen, onClose, darkMode }) => (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className={`fixed inset-x-0 top-16 z-50 ${darkMode ? "bg-gray-900" : "bg-white"} shadow-lg`}
        >
          <nav className="flex flex-col p-4">
            {["Experience"].map((item) => (
              <Link key={item} href={`/${item.toLowerCase()}`}>
                <span
                  className={`block py-2 text-lg font-semibold ${darkMode ? "text-white hover:text-blue-400" : "text-gray-800 hover:text-blue-600"}`}
                >
                  {item}
                </span>
              </Link>
            ))}
          </nav>
          <button
            onClick={onClose}
            className={`absolute top-2 right-2 p-2 rounded-full ${darkMode ? "bg-gray-800" : "bg-gray-200"}`}
          >
            <X className="w-6 h-6" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );

export default MobileMenu;