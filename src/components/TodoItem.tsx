import { CheckCircle, Circle, Trash2 } from "lucide-react";
import { type Todo } from "../types";

interface TodoItemProps {
    todo: Todo;
    onToggle: (id: number, completed: boolean) => void;
    onDelete: (id: number) => void;
    disabled?: boolean;
}

export function TodoItem({ todo, onToggle, onDelete, disabled }: TodoItemProps) {
    return (
        <div className="flex items-center gap-3 p-4 rounded-lg hover:bg-gray-50 transition-colors group">
            <button
                onClick={() => onToggle(todo.id, todo.completed)}
                disabled={disabled}
                className="flex-shrink-0 text-blue-600 hover:text-blue-700 disabled:opacity-50"
            >
                {todo.completed ? <CheckCircle size={24} /> : <Circle size={24} />}
            </button>

            <span
                className={`flex-1 text-lg ${
                    todo.completed ? "line-through text-gray-400" : "text-gray-800"
                }`}
            >
                {todo.text}
            </span>

            <button
                onClick={() => onDelete(todo.id)}
                disabled={disabled}
                className="flex-shrink-0 text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
            >
                <Trash2 size={20} />
            </button>
        </div>
    );
}
