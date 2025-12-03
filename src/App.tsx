import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle, Circle, Trash2, Plus, Loader } from "lucide-react";

const AUTH_TOKEN_KEY = "todo.jwt";
const AUTH_USER_KEY = "todo.user";

type AuthMode = "login" | "register";

interface Todo {
    id: number;
    text: string;
    completed: boolean;
    userId?: number;
}

interface User {
    id: number;
    email: string;
}

export default function TodoApp() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [newTodo, setNewTodo] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [authEmail, setAuthEmail] = useState("");
    const [authPassword, setAuthPassword] = useState("");
    const [authMode, setAuthMode] = useState<AuthMode>("login");
    const [authError, setAuthError] = useState("");
    const [authLoading, setAuthLoading] = useState(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        try {
            const storedToken = window.localStorage.getItem(AUTH_TOKEN_KEY);
            const storedUser = window.localStorage.getItem(AUTH_USER_KEY);

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            }
        } catch (storageError) {
            console.error("Failed to parse auth data", storageError);
            window.localStorage.removeItem(AUTH_TOKEN_KEY);
            window.localStorage.removeItem(AUTH_USER_KEY);
        }
    }, []);

    const handleLogout = useCallback(() => {
        if (typeof window !== "undefined") {
            window.localStorage.removeItem(AUTH_TOKEN_KEY);
            window.localStorage.removeItem(AUTH_USER_KEY);
        }

        setToken(null);
        setUser(null);
        setTodos([]);
        setNewTodo("");
        setError("");
    }, []);

    const handleUnauthorized = useCallback(() => {
        handleLogout();
        setAuthMode("login");
        setAuthError("Session expired. Please log in again.");
    }, [handleLogout]);

    const authorizedFetch = useCallback(
        async (path: string, options: RequestInit = {}) => {
            if (!token) {
                throw new Error("Missing auth token");
            }

            const headers: Record<string, string> = {
                Authorization: `Bearer ${token}`,
            };

            if (options.headers instanceof Headers) {
                options.headers.forEach((value, key) => {
                    headers[key] = value;
                });
            } else if (Array.isArray(options.headers)) {
                options.headers.forEach(([key, value]) => {
                    headers[key] = value;
                });
            } else if (options.headers) {
                Object.assign(headers, options.headers as Record<string, string>);
            }

            if (options.body && !headers["Content-Type"]) {
                headers["Content-Type"] = "application/json";
            }

            const response = await fetch(path, {
                ...options,
                headers,
            });

            if (response.status === 401) {
                handleUnauthorized();
                throw new Error("Unauthorized");
            }

            return response;
        },
        [token, handleUnauthorized]
    );

    const fetchTodos = useCallback(async () => {
        if (!token) {
            setTodos([]);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response = await authorizedFetch("/.netlify/functions/get-todos");
            if (!response.ok) throw new Error("Failed to fetch todos");

            const data = (await response.json()) as { todos: Todo[] };
            setTodos(data.todos || []);
        } catch (err) {
            if (err instanceof Error && err.message === "Unauthorized") {
                return;
            }
            console.error(err);
            setError("Unable to load todos. Check console for details.");
        } finally {
            setLoading(false);
        }
    }, [token, authorizedFetch]);

    useEffect(() => {
        fetchTodos();
    }, [fetchTodos]);

    const addTodo = async () => {
        if (!newTodo.trim() || !token) return;

        setLoading(true);
        setError("");

        try {
            const response = await authorizedFetch("/.netlify/functions/create-todo", {
                method: "POST",
                body: JSON.stringify({ text: newTodo.trim() }),
            });

            if (!response.ok) throw new Error("Failed to create todo");

            const data = (await response.json()) as { todo: Todo };
            setTodos((prev) => [...prev, data.todo]);
            setNewTodo("");
        } catch (err) {
            if (err instanceof Error && err.message === "Unauthorized") return;
            console.error(err);
            setError("Unable to add todo. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    const toggleTodo = async (id: number, currentStatus: boolean) => {
        if (!token) return;

        setLoading(true);
        setError("");

        try {
            const response = await authorizedFetch("/.netlify/functions/update-todo", {
                method: "PUT",
                body: JSON.stringify({ id, completed: !currentStatus }),
            });

            if (!response.ok) throw new Error("Failed to update todo");

            setTodos((prev) =>
                prev.map((todo) =>
                    todo.id === id ? { ...todo, completed: !currentStatus } : todo
                )
            );
        } catch (err) {
            if (err instanceof Error && err.message === "Unauthorized") return;
            console.error(err);
            setError("Unable to update todo. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    const deleteTodo = async (id: number) => {
        if (!token) return;

        setLoading(true);
        setError("");

        try {
            const response = await authorizedFetch("/.netlify/functions/delete-todo", {
                method: "DELETE",
                body: JSON.stringify({ id }),
            });

            if (!response.ok) throw new Error("Failed to delete todo");

            setTodos((prev) => prev.filter((todo) => todo.id !== id));
        } catch (err) {
            if (err instanceof Error && err.message === "Unauthorized") return;
            console.error(err);
            setError("Unable to delete todo. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    const handleAuthSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!authEmail.trim() || !authPassword.trim()) {
            setAuthError("Email and password are required.");
            return;
        }

        setAuthLoading(true);
        setAuthError("");

        try {
            const endpoint = authMode === "login" ? "login" : "register";
            const response = await fetch(`/.netlify/functions/${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: authEmail.trim(), password: authPassword }),
            });

            const data = (await response.json()) as {
                token?: string;
                user?: User;
                error?: string;
            };

            if (!response.ok || !data.token || !data.user) {
                throw new Error(data.error || "Authentication failed");
            }

            setToken(data.token);
            setUser(data.user);
            window.localStorage.setItem(AUTH_TOKEN_KEY, data.token);
            window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
            setAuthEmail("");
            setAuthPassword("");
            setAuthError("");
        } catch (err) {
            console.error(err);
            setAuthError(
                err instanceof Error
                    ? err.message
                    : "Unable to authenticate. Check console for details."
            );
        } finally {
            setAuthLoading(false);
        }
    };

    const toggleAuthMode = () => {
        setAuthMode((prev) => (prev === "login" ? "register" : "login"));
        setAuthError("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") addTodo();
    };

    const completedCount = todos.filter((t) => t.completed).length;
    const authTitle = authMode === "login" ? "Welcome back" : "Create an account";
    const authSubtitle =
        authMode === "login"
            ? "Sign in to access and manage your todos."
            : "Register to start tracking todos securely.";

    const isAuthenticated = Boolean(token && user);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {!isAuthenticated ? (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                            <h1 className="text-3xl font-bold text-white mb-2">{authTitle}</h1>
                            <p className="text-blue-100">{authSubtitle}</p>
                        </div>

                        <form className="p-6 space-y-4" onSubmit={handleAuthSubmit}>
                            {authError && (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-800">{authError}</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700" htmlFor="email">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={authEmail}
                                    onChange={(e) => setAuthEmail(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="you@example.com"
                                    required
                                    disabled={authLoading}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700" htmlFor="password">
                                    Password
                                </label>
                                <input
                                    id="password"
                                    type="password"
                                    value={authPassword}
                                    onChange={(e) => setAuthPassword(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="••••••••"
                                    required
                                    disabled={authLoading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={authLoading}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                            >
                                {authLoading ? (
                                    <>
                                        <Loader className="animate-spin" size={18} />
                                        Processing...
                                    </>
                                ) : authMode === "login" ? (
                                    "Log in"
                                ) : (
                                    "Create account"
                                )}
                            </button>
                        </form>

                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 text-center text-sm text-gray-600">
                            {authMode === "login" ? "Need an account?" : "Already have an account?"}{" "}
                            <button
                                type="button"
                                onClick={toggleAuthMode}
                                className="text-blue-600 font-medium hover:underline"
                            >
                                {authMode === "login" ? "Create one" : "Sign in"}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">My Todos</h1>
                                <p className="text-blue-100">
                                    {completedCount} of {todos.length} completed
                                </p>
                            </div>
                            <div className="text-sm text-blue-100 text-right">
                                <p className="font-semibold">{user?.email}</p>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="underline hover:text-white focus:outline-none"
                                >
                                    Log out
                                </button>
                            </div>
                        </div>

                        <div className="p-6 border-b border-gray-200">
                            <div className="flex gap-3">
                                <input
                                    type="text"
                                    value={newTodo}
                                    onChange={(e) => setNewTodo(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="What needs to be done?"
                                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    disabled={loading}
                                />
                                <button
                                    onClick={addTodo}
                                    disabled={loading || !newTodo.trim()}
                                    className="px-6 py-3 bg-blue-600 text-white rounded-lg
                                    hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed
                                    flex items-center gap-2 transition-colors"
                                >
                                    <Plus size={20} />
                                    Add
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-800 text-sm">{error}</p>
                            </div>
                        )}

                        <div className="p-6">
                            {loading && todos.length === 0 ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader className="animate-spin text-blue-600" size={32} />
                                </div>
                            ) : todos.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-500 text-lg">No todos yet!</p>
                                    <p className="text-gray-400 text-sm mt-2">
                                        Add one above to get started
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {todos.map((todo) => (
                                        <div
                                            key={todo.id}
                                            className="flex items-center gap-3 p-4 rounded-lg
                                            hover:bg-gray-50 transition-colors group"
                                        >
                                            <button
                                                onClick={() => toggleTodo(todo.id, todo.completed)}
                                                disabled={loading}
                                                className="flex-shrink-0 text-blue-600 hover:text-blue-700
                                                disabled:opacity-50"
                                            >
                                                {todo.completed ? (
                                                    <CheckCircle size={24} />
                                                ) : (
                                                    <Circle size={24} />
                                                )}
                                            </button>

                                            <span
                                                className={`flex-1 text-lg ${
                                                    todo.completed
                                                        ? "line-through text-gray-400"
                                                        : "text-gray-800"
                                                }`}
                                            >
                                                {todo.text}
                                            </span>

                                            <button
                                                onClick={() => deleteTodo(todo.id)}
                                                disabled={loading}
                                                className="flex-shrink-0 text-red-500 hover:text-red-700
                                                opacity-0 group-hover:opacity-100 transition-opacity
                                                disabled:opacity-50"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                            <p className="text-sm text-gray-600">
                                <strong>Note:</strong> This app now requires JWT-authenticated Netlify
                                Functions + Neon DB.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
