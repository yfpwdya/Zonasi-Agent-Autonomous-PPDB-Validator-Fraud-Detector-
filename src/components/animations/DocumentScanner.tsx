"use client";
import { motion } from "motion/react";

export function DocumentScanner() {
  return (
    <motion.div
      animate={{ top: ["0%", "100%", "0%"] }}
      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      className="w-full h-1.5 bg-gradient-to-r from-transparent via-secondary to-transparent shadow-[0_0_20px_4px_rgba(0,81,213,0.8)] absolute left-0 z-10 pointer-events-none"
    />
  );
}
