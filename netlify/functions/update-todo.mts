import type { Handler } from '@netlify/functions';
import { prisma } from '../../lib/prisma';
import { requireUser, UnauthorizedError } from '../../lib/auth';

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'PUT') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const user = requireUser(event);
        const { id, completed } = JSON.parse(event.body || '{}');
        const todoId = parseInt(id);

        if (Number.isNaN(todoId)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Valid id is required' })
            };
        }

        const existingTodo = await prisma.todo.findUnique({
            where: { id: todoId }
        });

        if (!existingTodo || existingTodo.userId !== user.id) {
            return {
                statusCode: 404,
                body: JSON.stringify({ error: 'Todo not found' })
            };
        }

        const todo = await prisma.todo.update({
            where: { id: todoId },
            data: { completed: Boolean(completed) }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ todo }),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        if (error instanceof UnauthorizedError) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Unauthorized' }),
                headers: { 'Content-Type': 'application/json' }
            };
        }

        console.error('Database error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to update todo' })
        };
    }
};
