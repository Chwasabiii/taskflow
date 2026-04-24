import { useCallback, useRef, useState } from "react";

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

const buildLog = (command, result) => ({
  id: createId(),
  timestamp: new Date().toISOString(),
  command,
  result,
});

export default function useVoiceAssistant({ tasks, createTask, toggleComplete, archiveTask, startPomodoro, setStatusMessage }) {
  const [listening, setListening] = useState(false);
  const [voiceLogs, setVoiceLogs] = useState([]);
  const recognitionRef = useRef(null);

  const parseCommand = useCallback(
    (phrase) => {
      const text = phrase.toLowerCase();

      if (text.includes("create task")) {
        return { action: "create", title: phrase.replace(/create task/i, "").trim() || "Voice task" };
      }

      if (text.includes("complete task")) {
        const title = phrase.replace(/complete task/i, "").trim();
        const match = tasks.find((task) => task.title.toLowerCase().includes(title.toLowerCase()));
        return { action: "complete", id: match?.id, title };
      }

      if (text.includes("archive task")) {
        const title = phrase.replace(/archive task/i, "").trim();
        const match = tasks.find((task) => task.title.toLowerCase().includes(title.toLowerCase()));
        return { action: "archive", id: match?.id, title };
      }

      if (text.includes("start pomodoro")) {
        const title = phrase.replace(/start pomodoro/i, "").trim();
        const match = tasks.find((task) => task.title.toLowerCase().includes(title.toLowerCase()));
        return { action: "pomodoro", id: match?.id };
      }

      if (text.includes("read tasks")) {
        return { action: "read" };
      }

      return { action: "unknown" };
    },
    [tasks]
  );

  const executeVoiceCommand = useCallback(
    (command, rawPhrase) => {
      let result = "Command not recognized.";

      switch (command.action) {
        case "create":
          createTask({
            title: command.title,
            description: "Created from voice command",
            priority: "medium",
            category: "general",
          });
          result = `Created task "${command.title}".`;
          break;
        case "complete":
          if (command.id) {
            toggleComplete(command.id);
            result = `Marked task completed.`;
          } else {
            result = `Could not find task to complete.`;
          }
          break;
        case "archive":
          if (command.id) {
            archiveTask(command.id);
            result = `Archived task.`;
          } else {
            result = `Could not find task to archive.`;
          }
          break;
        case "pomodoro":
          if (command.id) {
            startPomodoro(command.id);
            result = `Pomodoro timer started.`;
          } else {
            result = tasks.length ? "No matching task found." : "No tasks available.";
          }
          break;
        case "read":
          result = tasks.length
            ? tasks.map((task) => `${task.title} (${task.completed ? "done" : "pending"})`).join(". ")
            : "You have no tasks.";
          break;
        default:
          result = "Voice command did not match any action.";
          break;
      }

      setVoiceLogs((current) => [buildLog(rawPhrase, result), ...current]);
      setStatusMessage(result);
      return result;
    },
    [archiveTask, createTask, startPomodoro, tasks, toggleComplete, setStatusMessage]
  );

  const startListening = useCallback(() => {
    if (typeof window === "undefined" || !window.SpeechRecognition && !window.webkitSpeechRecognition) {
      setStatusMessage("Voice recognition not available in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      const command = parseCommand(transcript);
      executeVoiceCommand(command, transcript);
      setListening(false);
    };

    recognition.onerror = () => {
      setStatusMessage("Voice recognition error.");
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognition.start();
    recognitionRef.current = recognition;
    setListening(true);
    setStatusMessage("Listening...");
  }, [executeVoiceCommand, parseCommand, setStatusMessage]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
    setStatusMessage("Stopped listening.");
  }, [setStatusMessage]);

  const speakTask = useCallback((task) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(`${task.title}. ${task.description || "No description."}`);
    window.speechSynthesis.speak(utterance);
  }, []);

  const pauseSpeaking = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.pause();
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
  }, []);

  return {
    listening,
    voiceLogs,
    startListening,
    stopListening,
    speakTask,
    pauseSpeaking,
    stopSpeaking,
  };
}