import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

export default function useTaskManager() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
    fetchCategories();
  }, []);

  const fetchTasks = async () => {
    const { data, error } = await supabase.from('tasks').select('*');
    if (error) console.error(error);
    else setTasks(data);
    setLoading(false);
  };

  const createTask = async (task) => {
    const { data, error } = await supabase.from('tasks').insert([task]).select();
    if (error) console.error(error);
    else setTasks([...tasks, data[0]]);
  };

  const updateTask = async (id, updates) => {
    const { data, error } = await supabase.from('tasks').update(updates).eq('id', id);
    if (error) console.error(error);
    else setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, ...updates, updatedAt: nowIso() } : task
      )
    );
  };

  const deleteTask = async (id) => {
    const { data, error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) console.error(error);
    else setTasks((current) => current.filter((task) => task.id !== id));
  };

  const duplicateTask = async (id) => {
    const { data, error } = await supabase.from('tasks').select('*').eq('id', id);
    if (error) console.error(error);
    else {
      const duplicate = {
        ...data[0],
        id: createId(),
        title: `${data[0].title} copy`,
        completed: false,
        archived: false,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      setTasks([...tasks, duplicate]);
    }
  };

  const bulkDelete = async (ids) => {
    const { data, error } = await supabase.from('tasks').delete().in('id', ids);
    if (error) console.error(error);
    else setTasks((current) => current.filter((task) => !ids.includes(task.id)));
  };

  const bulkComplete = async (ids) => {
    const { data, error } = await supabase.from('tasks').update({ completed: true }).in('id', ids);
    if (error) console.error(error);
    else setTasks((current) =>
      current.map((task) =>
        ids.includes(task.id) ? { ...task, completed: true, updatedAt: nowIso() } : task
      )
    );
  };

  const toggleComplete = async (id) => {
    const { data, error } = await supabase.from('tasks').update({ completed: !task.completed }).eq('id', id);
    if (error) console.error(error);
    else setTasks((current) =>
      current.map((task) =>
        task.id === id ? { ...task, completed: !task.completed, updatedAt: nowIso() } : task
      )
    );
  };

  const archiveTask = async (id) => {
    const { data, error } = await supabase.from('tasks').update({ archived: true }).eq('id', id);
    if (error) console.error(error);
    else setTasks((current) =>
      current.filter((task) => {
        if (task.id !== id) return true;
        setArchivedTasks((archived) => [
          { ...task, archived: true, archivedAt: nowIso() },
          ...archived,
        ]);
        return false;
      })
    );
  };

  const restoreTask = async (id) => {
    const { data, error } = await supabase.from('tasks').update({ archived: false }).eq('id', id);
    if (error) console.error(error);
    else setTasks((active) => [{ ...task, archived: false, updatedAt: nowIso() }, ...active]);
  };

  const deleteArchivedTask = async (id) => {
    const { data, error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) console.error(error);
    else setArchivedTasks((current) => current.filter((task) => task.id !== id));
  };

  const getArchivedTasks = useCallback(() => archivedTasks, [archivedTasks]);

  const setPriority = useCallback((taskId, priority) => {
    if (!PRIORITY_PALETTE[priority]) return;
    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, priority, updatedAt: nowIso() } : task
      )
    );
  }, []);

  const createCategory = async (name, color = "slate") => {
    const { data, error } = await supabase.from('categories').insert([{ name, color }]).select();
    if (error) console.error(error);
    else setCategories([...categories, data[0]]);
  };

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
    categories,
    loading,
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