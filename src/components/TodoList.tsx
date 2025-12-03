import { useEffect, useState, useCallback } from "react";
import { Loader } from "lucide-react";
import { type Todo } from "../types";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { TodoItem } from "./TodoItem";
import { TodoInput } from "./TodoInput";

export function TodoList() {
    const { user, logout } = useAuth();
    const [todos, setTodos] = useState<Todo[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const fetchTodos = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await api.todos.list();
            setTodos(data);
        } catch (err) {
            console.error(err);
            setError("Unable to load todos.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTodos();
    }, [fetchTodos]);

    const handleAddTodo = async (text: string) => {
        setLoading(true);
        try {
            const newTodo = await api.todos.create(text);
            setTodos((prev) => [...prev, newTodo]);
        } catch (err) {
            console.error(err);
            setError("Unable to add todo.");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleTodo = async (id: number, currentStatus: boolean) => {
        setLoading(true);
        try {
            await api.todos.update(id, !currentStatus);
            setTodos((prev) =>
                prev.map((todo) =>
                    todo.id === id ? { ...todo, completed: !currentStatus } : todo
                )
            );
        } catch (err) {
            console.error(err);
            setError("Unable to update todo.");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTodo = async (id: number) => {
        setLoading(true);
        try {
            await api.todos.delete(id);
            setTodos((prev) => prev.filter((todo) => todo.id !== id));
        } catch (err) {
            console.error(err);
            setError("Unable to delete todo.");
        } finally {
            setLoading(false);
        }
    };

    const completedCount = todos.filter((t) => t.completed).length;

    return (
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
                        onClick={logout}
                        className="underline hover:text-white focus:outline-none"
                    >
                        Log out
                    </button>
                </div>
            </div>

            <div className="p-6 border-b border-gray-200">
                <TodoInput onAdd={handleAddTodo} disabled={loading} />
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
                            <TodoItem
                                key={todo.id}
                                todo={todo}
                                onToggle={handleToggleTodo}
                                onDelete={handleDeleteTodo}
                                disabled={loading}
                            />
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
    );
}
