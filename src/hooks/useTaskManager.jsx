import { useCallback, useMemo, useState } from "react";

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const nowIso = () => new Date().toISOString();

export const PRIORITY_PALETTE = {
  low: { label: "Low", classes: "bg-slate-600 text-slate-100" },
  medium: { label: "Medium", classes: "bg-blue-600 text-white" },
  high: { label: "High", classes: "bg-orange-500 text-white" },
  urgent: { label: "Urgent", classes: "bg-red-500 text-white" },
};

const initialCategories = [
  { id: "general", name: "General", color: "slate" },
  { id: "work", name: "Work", color: "blue" },
  { id: "personal", name: "Personal", color: "emerald" },
];

const buildTask = ({ title, description = "", priority = "medium", dueDate = null, category = "general" }) => ({
  id: createId(),
  title: title.trim(),
  description: description.trim(),
  priority,
  dueDate,
  category,
  completed: false,
  archived: false,
  createdAt: nowIso(),
  updatedAt: nowIso(),
});

export default function useTaskManager() {
  const [tasks, setTasks] = useState([]);
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [categories, setCategories] = useState(initialCategories);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMethod, setSortMethod] = useState("dateDesc");

  const createTask = useCallback((payload) => {
    if (!payload.title?.trim()) return null;
    const task = buildTask(payload);
    setTasks((current) => [task, ...current]);
    return task;
  }, []);

  const updateTask = useCallback((id, updates) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, ...updates, updatedAt: nowIso() } : task
      )
    );
  }, []);

  const deleteTask = useCallback((id) => {
    setTasks((current) => current.filter((task) => task.id !== id));
    setSelectedTaskIds((current) => current.filter((selected) => selected !== id));
  }, []);

  const duplicateTask = useCallback((id) => {
    setTasks((current) => {
      const original = current.find((task) => task.id === id);
      if (!original) return current;
      const duplicate = {
        ...original,
        id: createId(),
        title: `${original.title} copy`,
        completed: false,
        archived: false,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      return [duplicate, ...current];
    });
  }, []);

  const bulkDelete = useCallback((ids) => {
    setTasks((current) => current.filter((task) => !ids.includes(task.id)));
    setSelectedTaskIds([]);
  }, []);

  const bulkComplete = useCallback((ids) => {
    setTasks((current) =>
      current.map((task) =>
        ids.includes(task.id) ? { ...task, completed: true, updatedAt: nowIso() } : task
      )
    );
  }, []);

  const toggleComplete = useCallback((id) => {
    setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, completed: !task.completed, updatedAt: nowIso() } : task
      )
    );
  }, []);

  const archiveTask = useCallback((id) => {
    setTasks((current) =>
      current.filter((task) => {
        if (task.id !== id) return true;
        setArchivedTasks((archived) => [
          { ...task, archived: true, archivedAt: nowIso() },
          ...archived,
        ]);
        return false;
      })
    );
    setSelectedTaskIds((current) => current.filter((selected) => selected !== id));
  }, []);

  const restoreTask = useCallback((id) => {
    setArchivedTasks((current) =>
      current.filter((task) => {
        if (task.id !== id) return true;
        setTasks((active) => [{ ...task, archived: false, updatedAt: nowIso() }, ...active]);
        return false;
      })
    );
  }, []);

  const deleteArchivedTask = useCallback((id) => {
    setArchivedTasks((current) => current.filter((task) => task.id !== id));
  }, []);

  const getArchivedTasks = useCallback(() => archivedTasks, [archivedTasks]);

  const setPriority = useCallback((taskId, priority) => {
    if (!PRIORITY_PALETTE[priority]) return;
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, priority, updatedAt: nowIso() } : task
      )
    );
  }, []);

  const createCategory = useCallback((name, color = "slate") => {
    if (!name.trim()) return;
    const id = name.toLowerCase().replace(/\s+/g, "-");
    setCategories((current) => {
      if (current.some((category) => category.id === id)) return current;
      return [...current, { id, name: name.trim(), color }];
    });
  }, []);

  const deleteCategory = useCallback((id) => {
    if (id === "general") return;
    setCategories((current) => current.filter((category) => category.id !== id));
    setTasks((current) =>
      current.map((task) => (task.category === id ? { ...task, category: "general" } : task))
    );
    setCategoryFilter((current) => (current === id ? "all" : current));
  }, []);

  const assignCategory = useCallback(
    (taskId, categoryId) => {
      if (!categories.some((category) => category.id === categoryId)) return;
      setTasks((current) =>
        current.map((task) =>
          task.id === taskId ? { ...task, category: categoryId, updatedAt: nowIso() } : task
        )
      );
    },
    [categories]
  );

  const filterByCategory = useCallback((categoryId) => {
    setCategoryFilter(categoryId);
  }, []);

  const filteredTasks = useMemo(() => {
    let list = [...tasks];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter(
        (task) =>
          task.title.toLowerCase().includes(query) ||
          task.description.toLowerCase().includes(query) ||
          task.category.toLowerCase().includes(query)
      );
    }

    if (categoryFilter !== "all") {
      list = list.filter((task) => task.category === categoryFilter);
    }

    if (sortMethod === "dateAsc") {
      list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortMethod === "dateDesc") {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortMethod === "dueAsc") {
      list.sort((a, b) => (a.dueDate || "9999") > (b.dueDate || "9999") ? 1 : -1);
    } else if (sortMethod === "priority") {
      const rank = { urgent: 0, high: 1, medium: 2, low: 3 };
      list.sort((a, b) => rank[a.priority] - rank[b.priority]);
    }

    return list;
  }, [tasks, searchQuery, categoryFilter, sortMethod]);

  const getTotalTasks = useCallback(() => tasks.length, [tasks]);
  const getCompletedTasks = useCallback(() => tasks.filter((task) => task.completed).length, [tasks]);
  const getPendingTasks = useCallback(() => tasks.filter((task) => !task.completed).length, [tasks]);
  const getProductivityScore = useCallback(() => {
    const total = getTotalTasks() || 1;
    return Math.round((getCompletedTasks() / total) * 100);
  }, [getCompletedTasks, getTotalTasks]);

  return {
    tasks,
    archivedTasks,
    categories,
    selectedTaskIds,
    categoryFilter,
    searchQuery,
    sortMethod,
    filteredTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleComplete,
    duplicateTask,
    bulkDelete,
    bulkComplete,
    archiveTask,
    restoreTask,
    deleteArchivedTask,
    getArchivedTasks,
    setPriority,
    createCategory,
    deleteCategory,
    assignCategory,
    filterByCategory,
    setSearchQuery,
    setSortMethod,
    setSelectedTaskIds,
    setCategoryFilter,
    getTotalTasks,
    getCompletedTasks,
    getPendingTasks,
    getProductivityScore,
    PRIORITY_PALETTE,
  };
}