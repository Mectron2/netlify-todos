import { AuthProvider } from "./context/AuthProvider";
import { useAuth } from "./hooks/useAuth";
import { AuthForm } from "./components/AuthForm";
import { TodoList } from "./components/TodoList";

function AppContent() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {!isAuthenticated ? <AuthForm /> : <TodoList />}
            </div>
        </div>
    );
}

export default function TodoApp() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}