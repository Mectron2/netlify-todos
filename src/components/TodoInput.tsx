import React, { useState } from "react";
import { Plus } from "lucide-react";

interface TodoInputProps {
    onAdd: (text: string) => Promise<void>;
    disabled?: boolean;
}

export function TodoInput({ onAdd, disabled }: TodoInputProps) {
    const [text, setText] = useState("");

    const handleAdd = async () => {
        if (!text.trim()) return;
        await onAdd(text);
        setText("");
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleAdd();
    };

    return (
        <div className="flex gap-3">
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="What needs to be done?"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={disabled}
            />
            <button
                onClick={handleAdd}
                disabled={disabled || !text.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
                <Plus size={20} />
                Add
            </button>
        </div>
    );
}
