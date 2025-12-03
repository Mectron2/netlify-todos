import React, { useState } from "react";
import { Loader } from "lucide-react";
import { api } from "../services/api";
import { useAuth } from "../hooks/useAuth";
import { type AuthMode } from "../types";

export function AuthForm() {
    const { login } = useAuth();
    const [mode, setMode] = useState<AuthMode>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim() || !password.trim()) {
            setError("Email and password are required.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            const response =
                mode === "login"
                    ? await api.auth.login(email.trim(), password)
                    : await api.auth.register(email.trim(), password);

            login(response.token, response.user);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setMode((prev) => (prev === "login" ? "register" : "login"));
        setError("");
    };

    const title = mode === "login" ? "Welcome back" : "Create an account";
    const subtitle =
        mode === "login"
            ? "Sign in to access and manage your todos."
            : "Register to start tracking todos securely.";

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
                <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
                <p className="text-blue-100">{subtitle}</p>
            </div>

            <form className="p-6 space-y-4" onSubmit={handleSubmit}>
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800">{error}</p>
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="email">
                        Email
                    </label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="you@example.com"
                        required
                        disabled={loading}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700" htmlFor="password">
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="••••••••"
                        required
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                    {loading ? (
                        <>
                            <Loader className="animate-spin" size={18} />
                            Processing...
                        </>
                    ) : mode === "login" ? (
                        "Log in"
                    ) : (
                        "Create account"
                    )}
                </button>
            </form>

            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 text-center text-sm text-gray-600">
                {mode === "login" ? "Need an account?" : "Already have an account?"}{" "}
                <button
                    type="button"
                    onClick={toggleMode}
                    className="text-blue-600 font-medium hover:underline"
                >
                    {mode === "login" ? "Create one" : "Sign in"}
                </button>
            </div>
        </div>
    );
}
