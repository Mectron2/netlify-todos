import { type AuthResponse, type Todo } from "../types";

const AUTH_TOKEN_KEY = "todo.jwt";

export const getAuthToken = () => {
    if (typeof window !== "undefined") {
        return window.localStorage.getItem(AUTH_TOKEN_KEY);
    }
    return null;
};

export const setAuthToken = (token: string) => {
    if (typeof window !== "undefined") {
        window.localStorage.setItem(AUTH_TOKEN_KEY, token);
    }
};

export const removeAuthToken = () => {
    if (typeof window !== "undefined") {
        window.localStorage.removeItem(AUTH_TOKEN_KEY);
    }
};

interface FetchOptions extends RequestInit {
    headers?: Record<string, string>;
}

const authorizedFetch = async (path: string, options: FetchOptions = {}) => {
    const token = getAuthToken();

    if (!token) {
        throw new Error("Missing auth token");
    }

    const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
    };

    const response = await fetch(path, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        removeAuthToken();
        throw new Error("Unauthorized");
    }

    return response;
};

export const api = {
    auth: {
        login: async (email: string, password: string): Promise<AuthResponse> => {
            const response = await fetch("/.netlify/functions/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Login failed");
            }

            return data as AuthResponse;
        },

        register: async (email: string, password: string): Promise<AuthResponse> => {
            const response = await fetch("/.netlify/functions/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Registration failed");
            }

            return data as AuthResponse;
        },
    },

    todos: {
        list: async (): Promise<Todo[]> => {
            const response = await authorizedFetch("/.netlify/functions/get-todos");
            if (!response.ok) throw new Error("Failed to fetch todos");
            const data = await response.json();
            return data.todos || [];
        },

        create: async (text: string): Promise<Todo> => {
            const response = await authorizedFetch("/.netlify/functions/create-todo", {
                method: "POST",
                body: JSON.stringify({ text }),
            });
            if (!response.ok) throw new Error("Failed to create todo");
            const data = await response.json();
            return data.todo;
        },

        update: async (id: number, completed: boolean): Promise<void> => {
            const response = await authorizedFetch("/.netlify/functions/update-todo", {
                method: "PUT",
                body: JSON.stringify({ id, completed }),
            });
            if (!response.ok) throw new Error("Failed to update todo");
        },

        delete: async (id: number): Promise<void> => {
            const response = await authorizedFetch("/.netlify/functions/delete-todo", {
                method: "DELETE",
                body: JSON.stringify({ id }),
            });
            if (!response.ok) throw new Error("Failed to delete todo");
        },
    },
};
