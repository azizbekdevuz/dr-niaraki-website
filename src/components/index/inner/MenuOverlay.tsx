import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X } from "lucide-react";

const MenuOverlay: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  darkMode: boolean;
}> = ({ isOpen, onClose, darkMode }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0, x: "100%" }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: "100%" }}
        transition={{ type: "spring", damping: 20 }}
        className={`fixed inset-0 z-50 ${darkMode ? "bg-gray-900" : "bg-white"}`}
      >
        <div className="flex justify-end p-4 md:p-6">
          <button onClick={onClose} className="text-xl md:text-2xl">
            <X />
          </button>
        </div>
        <nav className="flex flex-col items-center justify-center h-full space-y-6 md:space-y-8">
          {["Experience"].map((item) => (
            <motion.div
              key={item}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href={`/${item.toLowerCase()}`}>
                <span
                  className={`text-2xl md:text-3xl font-bold ${darkMode ? "hover:text-blue-300" : "hover:text-blue-600"}`}
                >
                  {item}
                </span>
              </Link>
            </motion.div>
          ))}
        </nav>
      </motion.div>
    )}
  </AnimatePresence>
);

export default MenuOverlay;
