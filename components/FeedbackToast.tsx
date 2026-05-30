"use client";

import { motion } from "motion/react";

export type Feedback = { text: string; type: "success" | "error" | "info" };

export function FeedbackToast({ feedback, onClose }: { feedback: Feedback; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, x: 8 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: 16, x: 8 }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      role="status"
      aria-live={feedback.type === "error" ? "assertive" : "polite"}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border bg-white px-5 py-4 text-base shadow-xl"
    >
      {feedback.type === "success" && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}
      {feedback.type === "error" && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </div>
      )}
      {feedback.type === "info" && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>
      )}
      <div className="font-medium text-zinc-800">{feedback.text}</div>
      <button onClick={onClose} className="ml-2 shrink-0 text-zinc-400 hover:text-zinc-600" aria-label="Sluiten">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </motion.div>
  );
}
