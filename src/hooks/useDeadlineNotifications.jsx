import { useEffect, useState } from "react";

export default function useDeadlineNotifications(tasks) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const checkDeadlines = () => {
      const now = new Date();
      const newNotifications = [];

      tasks.forEach((task) => {
        if (task.completed || !task.dueDate) return;

        const dueDate = new Date(task.dueDate);
        const timeUntilDue = dueDate - now;
        const hoursUntilDue = timeUntilDue / (1000 * 60 * 60);

        // Notify if deadline is within 24 hours
        if (hoursUntilDue > 0 && hoursUntilDue <= 24) {
          newNotifications.push({
            id: task.id,
            title: task.title,
            type: "warning",
            message: `Due in ${Math.round(hoursUntilDue)} hours`,
          });
        }
        // Notify if deadline has passed
        else if (hoursUntilDue <= 0) {
          newNotifications.push({
            id: task.id,
            title: task.title,
            type: "urgent",
            message: "Deadline passed",
          });
        }
      });

      setNotifications(newNotifications);
    };

    checkDeadlines();
    const interval = setInterval(checkDeadlines, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [tasks]);

  return notifications;
}