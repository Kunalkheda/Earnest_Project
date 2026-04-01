"use client";

import { Task } from "@/lib/api";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  pending: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-400", label: "Pending" },
  in_progress: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-400", label: "In Progress" },
  completed: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400", label: "Completed" },
};

export default function TaskCard({ task, onEdit, onDelete, onToggle }: TaskCardProps) {
  const status = statusConfig[task.status] || statusConfig.pending;

  return (
    <div className={`card p-5 opacity-0 animate-fade-in ${task.status === "completed" ? "opacity-70" : ""}`}>
      {/* Status badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${status.bg} ${status.text}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
        <span className="text-xs text-gray-400">
          {new Date(task.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>

      {/* Title & description */}
      <h3
        className={`font-semibold text-gray-900 mb-1 ${
          task.status === "completed" ? "line-through text-gray-400" : ""
        }`}
      >
        {task.title}
      </h3>
      {task.description && (
        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">
          {task.description}
        </p>
      )}
      {!task.description && <div className="mb-4" />}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={() => onToggle(task.id)}
          className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
            task.status === "completed"
              ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
        >
          {task.status === "completed" ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
              Undo
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Done
            </>
          )}
        </button>
        <button
          onClick={() => onEdit(task)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all ml-auto"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete
        </button>
      </div>
    </div>
  );
}
