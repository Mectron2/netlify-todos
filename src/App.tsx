import React, { useState, useEffect } from "react";
import { CheckCircle, Circle, Trash2, Plus, Loader } from "lucide-react";

interface Todo {
    id: string;
    text: string;
    completed: boolean;
}

export default function TodoApp() {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [newTodo, setNewTodo] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        fetchTodos();
    }, []);

    const fetchTodos = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/.netlify/functions/get-todos");
            if (!response.ok) throw new Error("Failed to fetch todos");

            const data = (await response.json()) as { todos: Todo[] };
            setTodos(data.todos || []);
        } catch (err) {
            console.error(err);
            setError("Unable to load todos. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    const addTodo = async () => {
        if (!newTodo.trim()) return;

        setLoading(true);
        setError("");

        try {
            const response = await fetch("/.netlify/functions/create-todo", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: newTodo.trim() }),
            });

            if (!response.ok) throw new Error("Failed to create todo");

            const data = (await response.json()) as { todo: Todo };
            setTodos([...todos, data.todo]);
            setNewTodo("");
        } catch (err) {
            console.error(err);
            setError("Unable to add todo. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") addTodo();
    };

    const toggleTodo = async (id: string, currentStatus: boolean) => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/.netlify/functions/update-todo", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, completed: !currentStatus }),
            });

            if (!response.ok) throw new Error("Failed to update todo");

            setTodos((prev) =>
                prev.map((todo) =>
                    todo.id === id ? { ...todo, completed: !currentStatus } : todo
                )
            );
        } catch (err) {
            console.error(err);
            setError("Unable to update todo. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    const deleteTodo = async (id: string) => {
        setLoading(true);
        setError("");

        try {
            const response = await fetch("/.netlify/functions/delete-todo", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id }),
            });

            if (!response.ok) throw new Error("Failed to delete todo");

            setTodos((prev) => prev.filter((todo) => todo.id !== id));
        } catch (err) {
            console.error(err);
            setError("Unable to delete todo. Check console for details.");
        } finally {
            setLoading(false);
        }
    };

    const completedCount = todos.filter((t) => t.completed).length;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                        <h1 className="text-3xl font-bold text-white mb-2">My Todos</h1>
                        <p className="text-blue-100">
                            {completedCount} of {todos.length} completed
                        </p>
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
                                                <CheckCircle size={24} fill="currentColor" />
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
                            <strong>Note:</strong> This app requires Netlify Functions + Neon DB.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
