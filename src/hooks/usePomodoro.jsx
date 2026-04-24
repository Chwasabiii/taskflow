import { useCallback, useEffect, useRef, useState } from "react";

const defaultSettings = {
  focus: 1500,
  shortBreak: 300,
  longBreak: 900,
  cyclesBeforeLongBreak: 4,
};

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
const nowIso = () => new Date().toISOString();

export default function usePomodoro(settings = {}) {
  const mergedSettings = { ...defaultSettings, ...settings };
  const [session, setSession] = useState({
    status: "idle",
    type: "focus",
    remaining: mergedSettings.focus,
    taskId: null,
    cycles: 0,
  });
  const [pomodoroSessions, setPomodoroSessions] = useState([]);
  const timerRef = useRef(null);

  const completeSession = useCallback(() => {
    setPomodoroSessions((current) => [
      {
        id: createId(),
        taskId: session.taskId,
        type: session.type,
        duration: mergedSettings[session.type] || mergedSettings.focus,
        completedAt: nowIso(),
      },
      ...current,
    ]);

    const nextCycles = session.type === "focus" ? session.cycles + 1 : session.cycles;
    const nextType =
      session.type === "focus"
        ? nextCycles % mergedSettings.cyclesBeforeLongBreak === 0
          ? "longBreak"
          : "shortBreak"
        : "focus";
    const nextRemaining =
      nextType === "focus"
        ? mergedSettings.focus
        : nextType === "shortBreak"
        ? mergedSettings.shortBreak
        : mergedSettings.longBreak;

    setSession({
      status: "running",
      type: nextType,
      remaining: nextRemaining,
      taskId: session.taskId,
      cycles: nextCycles,
    });
  }, [mergedSettings, session]);

  const startPomodoro = useCallback(
    (taskId) => {
      setSession({
        status: "running",
        type: "focus",
        remaining: mergedSettings.focus,
        taskId,
        cycles: 0,
      });
    },
    [mergedSettings.focus]
  );

  const pausePomodoro = useCallback(() => {
    setSession((current) => ({ ...current, status: "paused" }));
  }, []);

  const resetPomodoro = useCallback(() => {
    setSession({
      status: "idle",
      type: "focus",
      remaining: mergedSettings.focus,
      taskId: null,
      cycles: 0,
    });
  }, [mergedSettings.focus]);

  useEffect(() => {
    if (session.status !== "running") return;

    timerRef.current = setInterval(() => {
      setSession((current) => {
        if (current.status !== "running") return current;
        if (current.remaining <= 1) {
          completeSession();
          return current;
        }
        return { ...current, remaining: current.remaining - 1 };
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [session.status, completeSession]);

  const formatTime = useCallback((seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  }, []);

  return {
    session,
    pomodoroSessions,
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    completeSession,
    formatTime,
  };
}