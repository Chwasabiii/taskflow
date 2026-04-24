import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

export const PRIORITY_PALETTE = {
  low: { label: "Low", classes: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50" },
  medium: { label: "Medium", classes: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50" },
  high: { label: "High", classes: "bg-orange-500/20 text-orange-300 border border-orange-500/50" },
  urgent: { label: "Urgent", classes: "bg-red-500/20 text-red-300 border border-red-500/50" },
};

export default function useTaskManager(user = null) {
  const [tasks, setTasks] = useState([]);
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMethod, setSortMethod] = useState('dateDesc');
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .or(`user_id.eq.${user.id},and(invite_code.not.is.null,exists(select 1 from task_invites where task_id = tasks.id and user_id = ${user.id}))`)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setTasks(data);
  }, [user]);

  const fetchArchivedTasks = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', true)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setArchivedTasks(data);
  }, [user]);

  const fetchCategories = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (error) console.error(error);
    else setCategories(data);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchTasks();
      fetchArchivedTasks();
      fetchCategories();
      setLoading(false);
    }
  }, [user, fetchTasks, fetchArchivedTasks, fetchCategories]);

  const createTask = async (task) => {
    const inviteCode = `TASK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const { data, error } = await supabase
      .from('tasks')
      .insert([{ ...task, user_id: user.id, invite_code: inviteCode }])
      .select();
    if (error) console.error(error);
    else setTasks([data[0], ...tasks]);
  };

  const joinTaskByCode = async (code) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('invite_code', code)
      .single();
    if (taskError || !task) throw new Error('Invalid invite code');

    const { error: inviteError } = await supabase
      .from('task_invites')
      .insert([{ task_id: task.id, user_id: user.id }]);
    if (inviteError) throw inviteError;

    setTasks([task, ...tasks]);
    return task;
  };

  const updateTask = async (id, updates) => {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) console.error(error);
    else setTasks(tasks.map(t => t.id === id ? data[0] : t));
  };

  const deleteTask = async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) console.error(error);
    else setTasks(tasks.filter(t => t.id !== id));
  };

  const toggleComplete = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    await updateTask(id, { completed: !task.completed });
  };

  const duplicateTask = async (id) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const { id: _, ...taskCopy } = task;
    await createTask({ ...taskCopy, title: `${task.title} (Copy)` });
  };

  const bulkComplete = async (ids) => {
    const { error } = await supabase
      .from('tasks')
      .update({ completed: true })
      .in('id', ids);
    if (error) console.error(error);
    else setTasks(tasks.map(t => ids.includes(t.id) ? { ...t, completed: true } : t));
  };

  const bulkDelete = async (ids) => {
    const { error } = await supabase.from('tasks').delete().in('id', ids);
    if (error) console.error(error);
    else setTasks(tasks.filter(t => !ids.includes(t.id)));
  };

  const archiveTask = async (id) => {
    await updateTask(id, { completed: true });
    setArchivedTasks([...archivedTasks, tasks.find(t => t.id === id)]);
    setTasks(tasks.filter(t => t.id !== id));
  };

  const restoreTask = async (id) => {
    await updateTask(id, { completed: false });
    setTasks([...tasks, archivedTasks.find(t => t.id === id)]);
    setArchivedTasks(archivedTasks.filter(t => t.id !== id));
  };

  const deleteArchivedTask = async (id) => {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) console.error(error);
    else setArchivedTasks(archivedTasks.filter(t => t.id !== id));
  };

  const setPriority = async (id, priority) => {
    await updateTask(id, { priority });
  };

  const createCategory = async (name, color) => {
    const { data, error } = await supabase
      .from('categories')
      .insert([{ name, color, user_id: user.id }])
      .select();
    if (error) console.error(error);
    else setCategories([data[0], ...categories]);
  };

  const deleteCategory = async (id) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) console.error(error);
    else setCategories(categories.filter(c => c.id !== id));
  };

  const assignCategory = async (taskId, categoryId) => {
    await updateTask(taskId, { category: categoryId });
  };

  const filterByCategory = (categoryId) => {
    setCategoryFilter(categoryId);
  };

  const filteredTasks = tasks
    .filter((task) => {
      const matchesSearch = !searchQuery || task.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = !categoryFilter || task.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortMethod) {
        case 'dateAsc':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'dateDesc':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'dueAsc':
          return new Date(a.dueDate) - new Date(b.dueDate);
        case 'priority':
          const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return 0;
      }
    });

  const getTotalTasks = () => tasks.length;
  const getCompletedTasks = () => tasks.filter(t => t.completed).length;
  const getPendingTasks = () => tasks.filter(t => !t.completed).length;
  const getProductivityScore = () => {
    const total = getTotalTasks();
    const completed = getCompletedTasks();
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  return {
    tasks,
    archivedTasks,
    categories,
    selectedTaskIds,
    categoryFilter,
    searchQuery,
    sortMethod,
    filteredTasks,
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
    setPriority,
    createCategory,
    deleteCategory,
    assignCategory,
    filterByCategory,
    setSearchQuery,
    setSortMethod,
    setSelectedTaskIds,
    getTotalTasks,
    getCompletedTasks,
    getPendingTasks,
    getProductivityScore,
    joinTaskByCode,
  };
}