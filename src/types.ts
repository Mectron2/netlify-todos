export interface Todo {
    id: number;
    text: string;
    completed: boolean;
    userId?: number;
}

export interface User {
    id: number;
    email: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export type AuthMode = "login" | "register";
