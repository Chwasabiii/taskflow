import { useEffect, useMemo, useState } from "react";
import useTaskManager, { PRIORITY_PALETTE } from "./hooks/useTaskManager";
import usePomodoro from "./hooks/usePomodoro";
import useVoiceAssistant from "./hooks/useVoiceAssistant";
import useDeadlineNotifications from "./hooks/useDeadlineNotifications";
import useAuth from "./hooks/useAuth";

function App() {
  const { isAuthenticated, user, signUp, signIn, signOut, loading } = useAuth();
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ email: "", password: "", name: "" });
  const [authError, setAuthError] = useState("");

  if (loading) return <div>Loading...</div>;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-[32px] border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold">TaskFlow</h1>
            <p className="mt-2 text-slate-400">Actionable planning with focus, voice, and archive workflow.</p>
          </div>

          <div className="mb-6 flex gap-2">
            <button
              onClick={() => {
                setAuthMode("login");
                setAuthError("");
              }}
              className={`flex-1 rounded-2xl px-4 py-2 font-semibold transition ${
                authMode === "login" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => {
                setAuthMode("signup");
                setAuthError("");
              }}
              className={`flex-1 rounded-2xl px-4 py-2 font-semibold transition ${
                authMode === "signup" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              Sign up
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleAuthSubmit}>
            {authMode === "signup" && (
              <label className="space-y-2 text-sm text-slate-300">
                Full name
                <input
                  type="text"
                  value={authForm.name}
                  onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
                  placeholder="John Doe"
                />
              </label>
            )}

            <label className="space-y-2 text-sm text-slate-300">
              Email
              <input
                type="email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
                placeholder="you@example.com"
              />
            </label>

            <label className="space-y-2 text-sm text-slate-300">
              Password
              <input
                type="password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                className="w-full rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
                placeholder="••••••••"
              />
            </label>

            {authError && <p className="rounded-2xl bg-red-950/50 border border-red-600/50 text-red-300 px-4 py-3">{authError}</p>}

            <button type="submit" className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-500">
              {authMode === "login" ? "Login" : "Create account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const {
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
  } = useTaskManager();

  const [page, setPage] = useState("dashboard");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    dueTime: "",
    category: "general",
  });
  const [focusMode, setFocusMode] = useState(false);
  const [activeFocusTaskId, setActiveFocusTaskId] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState("");
  const [settings, setSettings] = useState({
    focusMode: false,
    pomodoroFocus: 1500,
    shortBreak: 300,
    longBreak: 900,
    cyclesBeforeLongBreak: 4,
    voiceEnabled: true,
  });
  const [statusMessage, setStatusMessage] = useState("");

  const { session, pomodoroSessions, startPomodoro, pausePomodoro, resetPomodoro, formatTime } = usePomodoro(settings);

  const { listening, voiceLogs, startListening, stopListening, speakTask, pauseSpeaking, stopSpeaking } = useVoiceAssistant({
    tasks,
    createTask,
    toggleComplete,
    archiveTask,
    startPomodoro,
    setStatusMessage,
  });

  const deadlineNotifications = useDeadlineNotifications(tasks);

  const activeFocusTask =
    tasks.find((task) => task.id === activeFocusTaskId) || tasks[0] || null;

  useEffect(() => {
    if (page === "focus") {
      setFocusMode(true);
      if (activeFocusTask) {
        setActiveFocusTaskId(activeFocusTask.id);
      }
    } else {
      setFocusMode(false);
    }
  }, [page, activeFocusTask]);

  const dashboardStats = useMemo(
    () => ({
      total: getTotalTasks(),
      completed: getCompletedTasks(),
      pending: getPendingTasks(),
      archived: archivedTasks.length,
      productivity: getProductivityScore(),
    }),
    [getTotalTasks, getCompletedTasks, getPendingTasks, getProductivityScore, archivedTasks.length]
  );

  const handleTaskFormChange = (field, value) => {
    setTaskForm((current) => ({ ...current, [field]: value }));
  };

  const handleCreateTask = () => {
    if (!taskForm.title.trim()) return;

    if (taskForm.dueDate) {
      const selectedDate = new Date(taskForm.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate < today) {
        setStatusMessage("Due date cannot be in the past.");
        return;
      }
    }

    createTask({ ...taskForm, workspaceId });
    setTaskForm({ title: "", description: "", priority: "medium", dueDate: "", dueTime: "", category: "general" });
    setCreateModalOpen(false);
    setStatusMessage("Task created successfully.");
  };

  const handleCategoryCreation = () => {
    setCategoryModalOpen(true);
  };

  const handleCreateCategory = () => {
    if (!newCategoryName.trim()) return;
    createCategory(newCategoryName, newCategoryColor);
    setNewCategoryName("");
    setNewCategoryColor("emerald");
    setCategoryModalOpen(false);
    setStatusMessage(`Category "${newCategoryName}" created successfully.`);
  };

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState("emerald");

  const handleInviteCode = () => {
    const id = `ws-${Date.now()}`;
    const code = `INV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    setWorkspaceId(id);
    setInviteCode(code);
    setWorkspaces((current) => [
      ...current,
      {
        id,
        code,
        owner: user?.id || "unknown",
        members: [user?.id || "owner"],
      },
    ]);

    setInviteModalOpen(true);
  };

  const handleJoinWithCode = () => {
    const workspace = workspaces.find((ws) => ws.code === joinCodeInput.trim());
    if (!workspace) {
      setStatusMessage("Invite code not found.");
      return;
    }
    if (!workspace.members.includes(user?.id)) {
      workspace.members.push(user?.id);
    }
    setWorkspaceId(workspace.id);
    setWorkspaceMembers(workspace.members);
    setStatusMessage("Joined workspace.");
    setJoinCodeInput("");
    setInviteModalOpen(false);
  };

  const toggleTaskSelection = (taskId) => {
    setSelectedTaskIds((current) =>
      current.includes(taskId) ? current.filter((id) => id !== taskId) : [...current, taskId]
    );
  };

  const pageTitle = {
    dashboard: "Workspace",
    tasks: "Task Library",
    archive: "Archive",
    focus: "Focus Mode",
    pomodoro: "Pomodoro Studio",
    settings: "Settings",
  }[page];

  if (focusMode && activeFocusTask) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-3xl rounded-[32px] bg-slate-900/95 border border-slate-700 p-8 shadow-2xl">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Focus mode</p>
              <h1 className="text-4xl font-semibold">{activeFocusTask.title}</h1>
            </div>
            <button
              className="px-4 py-2 rounded-xl bg-slate-700/80 hover:bg-slate-600"
              onClick={() => setPage("tasks")}
            >
              Exit
            </button>
          </div>

          <div className="space-y-6">
            <p className="text-lg text-slate-300">{activeFocusTask.description || "No description provided."}</p>

            <div className="rounded-3xl bg-slate-800/70 p-6 ring-1 ring-slate-700">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Deadline</p>
                  <p className="mt-2 text-2xl">{activeFocusTask.dueDate || "No deadline"}</p>
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Priority</p>
                  <span className={`mt-2 inline-flex rounded-full px-4 py-2 text-sm ${PRIORITY_PALETTE[activeFocusTask.priority]?.classes}`}>
                    {PRIORITY_PALETTE[activeFocusTask.priority]?.label}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <button
                className="rounded-3xl bg-blue-600 px-6 py-4 text-lg font-semibold hover:bg-blue-500"
                onClick={() => {
                  toggleComplete(activeFocusTask.id);
                  setStatusMessage("Task status toggled.");
                }}
              >
                {activeFocusTask.completed ? "Mark Pending" : "Mark Complete"}
              </button>
              <button
                className="rounded-3xl bg-emerald-600 px-6 py-4 text-lg font-semibold hover:bg-emerald-500"
                onClick={() => setPage("pomodoro")}
              >
                Start Pomodoro
              </button>
            </div>

            <div className="rounded-3xl bg-slate-800/80 p-6 text-center">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Task timer</p>
              <p className="mt-4 text-6xl font-semibold">{formatTime(session.remaining)}</p>
              <p className="mt-2 text-slate-400">{session.type === "focus" ? "Focus" : "Break"} session</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError("");

    try {
      if (authMode === "signup") {
        if (!authForm.name.trim()) {
          setAuthError("Name is required");
          return;
        }

        await signUp(authForm.email, authForm.password, authForm.name);
        setAuthError("Signup successful. Check your email to confirm your account.");
        setAuthMode("login");
      } else {
        await signIn(authForm.email, authForm.password);
      }

      setAuthForm({ email: "", password: "", name: "" });
    } catch (error) {
      setAuthError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="border-r border-slate-800 bg-slate-900/95 px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">TaskFlow</h1>
            <p className="mt-2 text-slate-400 text-sm">Welcome, {user?.name}!</p>
          </div>

          <nav className="space-y-2">
            {["dashboard", "tasks", "archive", "focus", "pomodoro", "settings"].map((item) => (
              <button
                key={item}
                onClick={() => setPage(item)}
                className={`w-full rounded-3xl px-4 py-3 text-left transition ${page === item ? "bg-slate-800 text-white shadow-lg" : "text-slate-300 hover:bg-slate-800/70"}`}
              >
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </button>
            ))}
          </nav>

          <div className="mt-10 space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Categories</p>
            {categories.map((category) => (
              <button
                key={category.id}
                className={`w-full rounded-2xl px-4 py-3 text-left text-slate-200 hover:bg-slate-800/70 ${categoryFilter === category.id ? "bg-slate-800" : ""}`}
                onClick={() => filterByCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>

          <button
            onClick={signOut}
            className="mt-10 w-full rounded-2xl bg-red-600 px-4 py-3 text-sm hover:bg-red-500"
          >
            Logout
          </button>
        </aside>

        <main className="p-8">
          <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-slate-500">Workspace</p>
              <h2 className="text-4xl font-semibold">{pageTitle}</h2>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                className="rounded-3xl bg-indigo-600 px-5 py-3 text-sm font-semibold hover:bg-indigo-500"
                onClick={() => setCreateModalOpen(true)}
              >
                + Add task
              </button>
              {page === "dashboard" && (
                <button
                  className="rounded-3xl bg-slate-800 px-5 py-3 text-sm hover:bg-slate-700"
                  onClick={handleInviteCode}
                >
                  Invite
                </button>
              )}
            </div>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-3">
            <StatCard label="Tasks" value={dashboardStats.total} accent="from-slate-900 to-slate-800" />
            <StatCard label="Completed" value={dashboardStats.completed} accent="from-emerald-700 to-emerald-600" />
            <StatCard label="Productivity" value={`${dashboardStats.productivity}%`} accent="from-blue-700 to-blue-600" />
          </div>

          {page === "dashboard" && (
            <section className="space-y-6">
              {deadlineNotifications.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Deadline alerts</p>
                  {deadlineNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`rounded-3xl border p-4 ${
                        notification.type === "urgent"
                          ? "border-red-500/50 bg-red-950/30"
                          : "border-orange-500/50 bg-orange-950/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{notification.title}</p>
                          <p className={`text-sm ${notification.type === "urgent" ? "text-red-300" : "text-orange-300"}`}>
                            {notification.message}
                          </p>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                            notification.type === "urgent"
                              ? "bg-red-500 text-white"
                              : "bg-orange-500 text-white"
                          }`}
                        >
                          {notification.type === "urgent" ? "Overdue" : "Due soon"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <PanelCard title="Pending tasks">
                  <div className="space-y-3">
                    {filteredTasks.slice(0, 4).map((task) => (
                      <TaskRow
                        key={task.id}
                        task={task}
                        onToggle={() => toggleComplete(task.id)}
                        onArchive={() => archiveTask(task.id)}
                        onSpeak={() => speakTask(task)}
                      />
                    ))}
                    {!filteredTasks.length && <p className="text-slate-400">No tasks ready for the day.</p>}
                  </div>
                </PanelCard>

                <PanelCard title="Voice assistant">
                  <div className="space-y-4">
                    <p className="text-slate-400">Use voice commands for quick planning.</p>
                    <div className="flex flex-wrap gap-3">
                      <button
                        className="rounded-2xl bg-blue-600 px-4 py-3 hover:bg-blue-500"
                        onClick={listening ? stopListening : startListening}
                      >
                        {listening ? "Stop listening" : "Start listening"}
                      </button>
                      <button className="rounded-2xl bg-slate-800 px-4 py-3 hover:bg-slate-700" onClick={pauseSpeaking}>
                        Pause speech
                      </button>
                      <button className="rounded-2xl bg-slate-800 px-4 py-3 hover:bg-slate-700" onClick={stopSpeaking}>
                        Stop speech
                      </button>
                    </div>
                    <div className="space-y-2 rounded-3xl bg-slate-900/80 p-4">
                      {voiceLogs.slice(0, 3).map((log) => (
                        <div key={log.id} className="rounded-2xl border border-slate-700 bg-slate-950 p-3">
                          <p className="text-sm text-slate-300">{log.command}</p>
                          <p className="text-sm text-slate-400">{log.result}</p>
                        </div>
                      ))}
                      {!voiceLogs.length && <p className="text-slate-500">No voice activity yet.</p>}
                    </div>
                  </div>
                </PanelCard>
              </div>
            </section>
          )}

          {page === "tasks" && (
            <section className="space-y-6">
              <div className="flex flex-col gap-3 rounded-[28px] border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-3">
                    <input
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search tasks..."
                      className="min-w-[220px] rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none"
                    />
                    <select
                      value={sortMethod}
                      onChange={(event) => setSortMethod(event.target.value)}
                      className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none"
                    >
                      <option value="dateDesc">Newest</option>
                      <option value="dateAsc">Oldest</option>
                      <option value="dueAsc">Due date</option>
                      <option value="priority">Priority</option>
                    </select>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm hover:bg-emerald-500"
                      onClick={() => bulkComplete(selectedTaskIds)}
                    >
                      Bulk complete
                    </button>
                    <button
                      className="rounded-2xl bg-red-600 px-4 py-3 text-sm hover:bg-red-500"
                      onClick={() => bulkDelete(selectedTaskIds)}
                    >
                      Bulk delete
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {filteredTasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      selected={selectedTaskIds.includes(task.id)}
                      onSelect={() => toggleTaskSelection(task.id)}
                      onToggle={() => toggleComplete(task.id)}
                      onArchive={() => archiveTask(task.id)}
                      onDelete={() => deleteTask(task.id)}
                      onDuplicate={() => duplicateTask(task.id)}
                      onPriorityChange={(value) => setPriority(task.id, value)}
                      onCategoryChange={(value) => assignCategory(task.id, value)}
                      categories={categories}
                    />
                  ))}
                  {!filteredTasks.length && (
                    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-slate-400">
                      No matching tasks. Create a new task or broaden your search.
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          {page === "archive" && (
            <section className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {archivedTasks.map((task) => (
                  <div key={task.id} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-semibold">{task.title}</h3>
                        <p className="mt-2 text-slate-400">{task.description || "No description"}</p>
                      </div>
                      <span className={`inline-flex rounded-full px-3 py-1 text-sm ${PRIORITY_PALETTE[task.priority]?.classes}`}>
                        {PRIORITY_PALETTE[task.priority]?.label}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm hover:bg-emerald-500"
                        onClick={() => restoreTask(task.id)}
                      >
                        Restore
                      </button>
                      <button
                        className="rounded-2xl bg-red-600 px-4 py-2 text-sm hover:bg-red-500"
                        onClick={() => deleteArchivedTask(task.id)}
                      >
                        Delete forever
                      </button>
                    </div>
                  </div>
                ))}
                {!archivedTasks.length && (
                  <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-slate-400">
                    Archive is empty. Move completed work here to keep the workspace clean.
                  </div>
                )}
              </div>
            </section>
          )}

          {page === "pomodoro" && (
            <section className="space-y-6">
              <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[32px] border border-slate-800 bg-slate-900/80 p-8">
                  <h3 className="text-2xl font-semibold">Pomodoro session</h3>
                  <p className="mt-2 text-slate-400">Focus blocks and fast breaks to keep energy high.</p>
                  <div className="mt-8 flex items-center justify-between rounded-3xl bg-slate-950/90 p-8">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Active timer</p>
                      <p className="mt-4 text-6xl font-semibold">{formatTime(session.remaining)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Mode</p>
                      <p className="mt-3 text-xl">{session.type === "focus" ? "Focus" : "Break"}</p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      className="rounded-3xl bg-blue-600 px-5 py-3 hover:bg-blue-500"
                      onClick={() => startPomodoro(tasks[0]?.id || null)}
                    >
                      Start
                    </button>
                    <button className="rounded-3xl bg-slate-800 px-5 py-3 hover:bg-slate-700" onClick={pausePomodoro}>
                      Pause
                    </button>
                    <button className="rounded-3xl bg-red-600 px-5 py-3 hover:bg-red-500" onClick={resetPomodoro}>
                      Reset
                    </button>
                  </div>
                </div>

                <div className="rounded-[32px] border border-slate-800 bg-slate-900/80 p-6">
                  <h3 className="text-2xl font-semibold">Session history</h3>
                  <div className="mt-4 space-y-3">
                    {pomodoroSessions.slice(0, 6).map((sessionEntry) => (
                      <div key={sessionEntry.id} className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                        <p className="font-medium">{sessionEntry.type}</p>
                        <p className="text-sm text-slate-400">Completed at {new Date(sessionEntry.completedAt).toLocaleTimeString()}</p>
                      </div>
                    ))}
                    {!pomodoroSessions.length && <p className="text-slate-500">No sessions completed yet.</p>}
                  </div>
                </div>
              </div>
            </section>
          )}

          {page === "settings" && (
            <section className="grid gap-6 lg:grid-cols-2">
              <PanelCard title="Collaboration">
                <div className="space-y-4">
                  <button className="rounded-2xl bg-blue-600 px-4 py-3 hover:bg-blue-500" onClick={handleInviteCode}>
                    Generate invite code
                  </button>
                  <div className="rounded-3xl border border-slate-800 bg-slate-950/80 p-4">
                    <p className="text-slate-300">Collaborators</p>
                    <div className="mt-4 space-y-3">
                      {collaborators.map((collaborator) => (
                        <div key={collaborator.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3">
                          <div>
                            <p>{collaborator.name}</p>
                            <p className="text-sm text-slate-500">{collaborator.email}</p>
                          </div>
                          <button
                            className="rounded-2xl bg-red-600 px-3 py-2 text-sm hover:bg-red-500"
                            onClick={() =>
                              setCollaborators((current) =>
                                current.filter((item) => item.id !== collaborator.id)
                              )
                            }
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      {!collaborators.length && <p className="text-slate-500">No collaborators added yet.</p>}
                    </div>
                  </div>
                </div>
              </PanelCard>

              <PanelCard title="System settings">
                <div className="space-y-4">
                  <label className="flex flex-col gap-2 text-sm">
                    <span>Focus duration (minutes)</span>
                    <input
                      type="number"
                      min="15"
                      value={settings.pomodoroFocus / 60}
                      onChange={(event) =>
                        setSettings((current) => ({
                          ...current,
                          pomodoroFocus: Math.max(60, Number(event.target.value) * 60),
                        }))
                      }
                      className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-2 text-sm">
                    <span>Short break (minutes)</span>
                    <input
                      type="number"
                      min="1"
                      value={settings.shortBreak / 60}
                      onChange={(event) =>
                        setSettings((current) => ({
                          ...current,
                          shortBreak: Math.max(60, Number(event.target.value) * 60),
                        }))
                      }
                      className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-2 text-sm">
                    <span>Long break (minutes)</span>
                    <input
                      type="number"
                      min="5"
                      value={settings.longBreak / 60}
                      onChange={(event) =>
                        setSettings((current) => ({
                          ...current,
                          longBreak: Math.max(300, Number(event.target.value) * 60),
                        }))
                      }
                      className="rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-white outline-none"
                    />
                  </label>

                  <label className="flex items-center gap-3 text-sm">
                    <input
                      type="checkbox"
                      checked={settings.voiceEnabled}
                      onChange={(event) =>
                        setSettings((current) => ({ ...current, voiceEnabled: event.target.checked }))
                      }
                      className="h-5 w-5 rounded border-slate-700 bg-slate-900"
                    />
                    Enable voice commands
                  </label>
                </div>
              </PanelCard>
            </section>
          )}

          {statusMessage && (
            <div className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-4 text-slate-200">
              {statusMessage}
            </div>
          )}
        </main>
      </div>

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="w-full max-w-2xl rounded-[32px] border border-slate-800 bg-slate-950 p-8 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-semibold">Create task</h3>
              <button className="text-slate-400 hover:text-white" onClick={() => setCreateModalOpen(false)}>
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-5">
              <label className="space-y-2 text-sm text-slate-300">
                Title
                <input
                  value={taskForm.title}
                  onChange={(event) => handleTaskFormChange("title", event.target.value)}
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
                />
              </label>

              <label className="space-y-2 text-sm text-slate-300">
                Description
                <textarea
                  value={taskForm.description}
                  onChange={(event) => handleTaskFormChange("description", event.target.value)}
                  rows="4"
                  className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
                />
              </label>

              <div className="grid gap-4 md:grid-cols-3">
                <label className="space-y-2 text-sm text-slate-300">
                  Priority
                  <select
                    value={taskForm.priority}
                    onChange={(event) => handleTaskFormChange("priority", event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
                  >
                    {Object.entries(PRIORITY_PALETTE).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm text-slate-300">
                  Category
                  <select
                    value={taskForm.category}
                    onChange={(event) => handleTaskFormChange("category", event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm text-slate-300">
                  Due date
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(event) => handleTaskFormChange("dueDate", event.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
                  />
                </label>

                <label className="space-y-2 text-sm text-slate-300">
                  Due time
                  <input
                    type="time"
                    value={taskForm.dueTime}
                    onChange={(event) => handleTaskFormChange("dueTime", event.target.value)}
                    className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
                  />
                </label>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-end gap-3">
              <button
                className="rounded-3xl bg-slate-800 px-5 py-3 hover:bg-slate-700"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </button>
              <button className="rounded-3xl bg-blue-600 px-5 py-3 hover:bg-blue-500" onClick={handleCreateTask}>
                Create task
              </button>
            </div>
          </div>
        </div>
      )}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
          <div className="w-full max-w-2xl rounded-[32px] border border-slate-800 bg-slate-950 p-8 shadow-2xl">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold">Share invite code</h3>
                <p className="mt-2 text-slate-400">Send this code to collaborators to join your workspace.</p>
              </div>

              <div className="rounded-3xl border border-emerald-600/50 bg-emerald-950/30 p-6">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Your invite code</p>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <p className="text-3xl font-bold font-mono">{inviteCode}</p>
                  <button
                    className="rounded-2xl bg-emerald-600 px-4 py-3 hover:bg-emerald-500"
                    onClick={() => {
                      navigator.clipboard.writeText(inviteCode);
                      setStatusMessage("Invite code copied to clipboard!");
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Join with code</p>
                <div className="flex gap-3">
                  <input
                    value={joinCodeInput}
                    onChange={(event) => setJoinCodeInput(event.target.value)}
                    placeholder="Paste invite code here..."
                    className="flex-1 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none"
                  />
                  <button
                    className="rounded-2xl bg-blue-600 px-5 py-3 hover:bg-blue-500"
                    onClick={handleJoinWithCode}
                  >
                    Join
                  </button>
                </div>
              </div>

              <button
                className="w-full rounded-3xl bg-slate-800 px-5 py-3 hover:bg-slate-700"
                onClick={() => {
                  setInviteModalOpen(false);
                  setJoinCodeInput("");
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, accent }) {
  return (
    <div className={`rounded-[28px] border border-slate-800 bg-gradient-to-br ${accent} p-6 shadow-lg`}>
      <p className="text-sm uppercase tracking-[0.3em] text-slate-300">{label}</p>
      <p className="mt-4 text-4xl font-semibold">{value}</p>
    </div>
  );
}

function PanelCard({ title, children }) {
  return (
    <div className="rounded-[32px] border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
      <h3 className="text-xl font-semibold">{title}</h3>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function TaskCard({ task, selected, onSelect, onToggle, onArchive, onDelete, onDuplicate, onPriorityChange, onCategoryChange, categories }) {
  return (
    <article className="group rounded-[32px] border border-slate-800 bg-slate-900/80 p-5 transition hover:border-slate-700">
      <div className="flex items-start justify-between gap-4">
        <button
          onClick={onSelect}
          className={`h-5 w-5 rounded-full border border-slate-700 transition ${selected ? "bg-blue-500 ring-2 ring-blue-400" : "bg-slate-950"}`}
          aria-label="Select task"
        />

        <div className="flex-1">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className={`text-lg font-semibold ${task.completed ? "line-through text-slate-500" : ""}`}>{task.title}</h3>
            <span className={`inline-flex rounded-full px-3 py-1 text-xs ${PRIORITY_PALETTE[task.priority]?.classes}`}>
              {PRIORITY_PALETTE[task.priority]?.label}
            </span>
          </div>
          <p className="mt-3 text-slate-400">{task.description || "No description yet."}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-400">
            <span>{task.dueDate || "No due date"}</span>
            <span>·</span>
            <span>{categories.find((category) => category.id === task.category)?.name || "General"}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <select
          value={task.priority}
          onChange={(event) => onPriorityChange(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
        >
          {Object.entries(PRIORITY_PALETTE).map(([key, value]) => (
            <option key={key} value={key}>
              {value.label}
            </option>
          ))}
        </select>

        <select
          value={task.category}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="rounded-2xl border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm hover:bg-emerald-500" onClick={onToggle}>
          {task.completed ? "Mark pending" : "Complete"}
        </button>
        <button className="rounded-2xl bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700" onClick={onArchive}>
          Archive
        </button>
        <button className="rounded-2xl bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700" onClick={onDuplicate}>
          Duplicate
        </button>
        <button className="rounded-2xl bg-red-600 px-4 py-2 text-sm hover:bg-red-500" onClick={onDelete}>
          Delete
        </button>
      </div>
    </article>
  );
}

function TaskRow({ task, onToggle, onArchive, onSpeak }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h4 className={`text-lg font-semibold ${task.completed ? "line-through text-slate-500" : ""}`}>{task.title}</h4>
          <p className="mt-2 text-sm text-slate-400">{task.description || "No description provided."}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-slate-500">
            <span>{task.category}</span>
            <span>{task.dueDate || "No due"}</span>
          </div>
        </div>
        <div className="space-y-2 text-right">
          <button className="text-slate-400 hover:text-white" onClick={onToggle}>
            {task.completed ? "Undo" : "Done"}
          </button>
          <button className="text-slate-400 hover:text-white" onClick={onArchive}>
            Archive
          </button>
          <button className="text-slate-400 hover:text-white" onClick={onSpeak}>
            Read
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;