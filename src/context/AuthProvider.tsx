import {useState, useCallback, type ReactNode} from "react";
import { type User } from "../types";
import { getAuthToken, removeAuthToken, setAuthToken } from "../services/api";
import { AuthContext } from "./AuthContext";

const AUTH_USER_KEY = "todo.user";

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setTokenState] = useState<string | null>(() => getAuthToken());
    const [user, setUser] = useState<User | null>(() => {
        if (typeof window === "undefined") return null;
        try {
            const storedUser = window.localStorage.getItem(AUTH_USER_KEY);
            return storedUser ? JSON.parse(storedUser) : null;
        } catch (e) {
            console.error("Failed to parse stored user", e);
            return null;
        }
    });

    const logout = useCallback(() => {
        setTokenState(null);
        setUser(null);
        removeAuthToken();
        window.localStorage.removeItem(AUTH_USER_KEY);
    }, []);

    const login = useCallback((newToken: string, newUser: User) => {
        setTokenState(newToken);
        setUser(newUser);
        setAuthToken(newToken);
        window.localStorage.setItem(AUTH_USER_KEY, JSON.stringify(newUser));
    }, []);

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                login,
                logout,
                isAuthenticated: !!token && !!user,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
