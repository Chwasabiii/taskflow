import { useState, useCallback } from "react";

export default function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("taskflow_user");
  });
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("taskflow_user");
    return stored ? JSON.parse(stored) : null;
  });

  const signup = useCallback((email, password, name) => {
    const users = JSON.parse(localStorage.getItem("taskflow_users") || "[]");
    
    if (users.find((u) => u.email === email)) {
      throw new Error("Email already registered");
    }

    const newUser = {
      id: `user-${Date.now()}`,
      email,
      password,
      name,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem("taskflow_users", JSON.stringify(users));
    localStorage.setItem("taskflow_user", JSON.stringify(newUser));
    setUser(newUser);
    setIsAuthenticated(true);
    return newUser;
  }, []);

  const login = useCallback((email, password) => {
    const users = JSON.parse(localStorage.getItem("taskflow_users") || "[]");
    const foundUser = users.find((u) => u.email === email && u.password === password);

    if (!foundUser) {
      throw new Error("Invalid email or password");
    }

    localStorage.setItem("taskflow_user", JSON.stringify(foundUser));
    setUser(foundUser);
    setIsAuthenticated(true);
    return foundUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("taskflow_user");
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return {
    isAuthenticated,
    user,
    signup,
    login,
    logout,
  };
}