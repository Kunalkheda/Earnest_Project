"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTask,
  Task,
  TasksResponse,
} from "@/lib/api";
import TaskCard from "@/components/TaskCard";
import TaskModal from "@/components/TaskModal";
import { toast } from "@/components/Toast";

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  });
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Stats
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [user, authLoading, router]);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data: TasksResponse = await getTasks({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter || undefined,
        search: debouncedSearch || undefined,
      });
      setTasks(data.tasks);
      setPagination(data.pagination);
    } catch (err: any) {
      toast(err.message || "Failed to load tasks", "error");
    } finally {
      setLoading(false);
    }
  }, [user, pagination.page, pagination.limit, statusFilter, debouncedSearch]);

  // Fetch all tasks for stats (no filters)
  const fetchStats = useCallback(async () => {
    if (!user) return;
    try {
      const data = await getTasks({ limit: 50 });
      setAllTasks(data.tasks);
    } catch {}
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    setPagination((p) => ({ ...p, page: 1 }));
  }, [statusFilter, debouncedSearch]);

  const refreshAll = () => {
    fetchTasks();
    fetchStats();
  };

  const handleCreate = async (data: { title: string; description?: string }) => {
    await createTask(data);
    toast("Task created");
    refreshAll();
  };

  const handleUpdate = async (data: { title: string; description?: string }) => {
    if (!editingTask) return;
    await updateTask(editingTask.id, data);
    toast("Task updated");
    refreshAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this task?")) return;
    try {
      await deleteTask(id);
      toast("Task deleted");
      refreshAll();
    } catch (err: any) {
      toast(err.message || "Failed to delete", "error");
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleTask(id);
      toast("Task status updated");
      refreshAll();
    } catch (err: any) {
      toast(err.message || "Failed to toggle", "error");
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Stats calculations
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t) => t.status === "completed").length;
  const pendingTasks = allTasks.filter((t) => t.status === "pending").length;
  const inProgressTasks = allTasks.filter((t) => t.status === "in_progress").length;

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3">
          <svg className="animate-spin h-5 w-5 text-indigo-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-gray-500 font-medium">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const filterButtons = [
    { value: "", label: "All", count: totalTasks },
    { value: "pending", label: "Pending", count: pendingTasks },
    { value: "in_progress", label: "In Progress", count: inProgressTasks },
    { value: "completed", label: "Completed", count: completedTasks },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="glass border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 gradient-bg rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h1 className="text-xl font-bold gradient-text hidden sm:block">TaskFlow</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-sm font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-600 font-medium transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{totalTasks}</div>
            <div className="text-xs font-medium text-gray-500 mt-0.5">Total Tasks</div>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 animate-fade-in stagger-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{pendingTasks}</div>
            <div className="text-xs font-medium text-gray-500 mt-0.5">Pending</div>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 animate-fade-in stagger-2">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{inProgressTasks}</div>
            <div className="text-xs font-medium text-gray-500 mt-0.5">In Progress</div>
          </div>
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 animate-fade-in stagger-3">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{completedTasks}</div>
            <div className="text-xs font-medium text-gray-500 mt-0.5">Completed</div>
          </div>
        </div>

        {/* Progress bar */}
        {totalTasks > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-gray-200 mb-8 animate-fade-in">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-700">Overall Progress</span>
              <span className="text-sm font-bold text-indigo-600">
                {Math.round((completedTasks / totalTasks) * 100)}%
              </span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full gradient-bg transition-all duration-700 ease-out"
                style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Search + Add */}
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tasks..."
                className="input-field w-full pl-10 pr-4 py-2.5 rounded-xl text-gray-900 text-sm"
              />
            </div>
            <button
              onClick={() => {
                setEditingTask(null);
                setShowModal(true);
              }}
              className="btn-primary px-5 py-2.5 text-sm font-semibold text-white rounded-xl whitespace-nowrap flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <span className="hidden sm:inline">New Task</span>
            </button>
          </div>

          {/* Filter pills */}
          <div className="flex gap-2 flex-wrap">
            {filterButtons.map((btn) => (
              <button
                key={btn.value}
                onClick={() => setStatusFilter(btn.value)}
                className={`px-4 py-2 text-xs font-semibold rounded-full transition-all ${
                  statusFilter === btn.value
                    ? "gradient-bg text-white shadow-md shadow-indigo-200"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-indigo-200 hover:text-indigo-600"
                }`}
              >
                {btn.label}
                <span className={`ml-1.5 ${statusFilter === btn.value ? "text-white/80" : "text-gray-400"}`}>
                  {btn.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Task Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="skeleton h-5 w-20 mb-4" />
                <div className="skeleton h-5 w-3/4 mb-2" />
                <div className="skeleton h-4 w-full mb-1" />
                <div className="skeleton h-4 w-2/3 mb-5" />
                <div className="border-t border-gray-100 pt-3 flex gap-2">
                  <div className="skeleton h-7 w-16" />
                  <div className="skeleton h-7 w-14" />
                </div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-indigo-50 flex items-center justify-center">
              <svg className="w-10 h-10 text-indigo-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {search || statusFilter ? "No matching tasks" : "No tasks yet"}
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              {search || statusFilter
                ? "Try adjusting your search or filters"
                : "Create your first task to get started"}
            </p>
            {!search && !statusFilter && (
              <button
                onClick={() => {
                  setEditingTask(null);
                  setShowModal(true);
                }}
                className="btn-primary inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white rounded-xl"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Create your first task
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tasks.map((task, i) => (
                <div key={task.id} className={`stagger-${Math.min(i + 1, 6)}`}>
                  <TaskCard
                    task={task}
                    onEdit={(t) => {
                      setEditingTask(t);
                      setShowModal(true);
                    }}
                    onDelete={handleDelete}
                    onToggle={handleToggle}
                  />
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page <= 1}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:border-indigo-200 hover:text-indigo-600 transition-all text-gray-700"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPagination((prev) => ({ ...prev, page: p }))}
                      className={`w-9 h-9 text-sm font-medium rounded-lg transition-all ${
                        p === pagination.page
                          ? "gradient-bg text-white shadow-md shadow-indigo-200"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-xl disabled:opacity-40 hover:border-indigo-200 hover:text-indigo-600 transition-all text-gray-700"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <TaskModal
          task={editingTask}
          onClose={() => {
            setShowModal(false);
            setEditingTask(null);
          }}
          onSave={editingTask ? handleUpdate : handleCreate}
        />
      )}
    </div>
  );
}
