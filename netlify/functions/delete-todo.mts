import type { Handler } from '@netlify/functions';
import { prisma } from '../../lib/prisma';

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'DELETE') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { id } = JSON.parse(event.body || '{}');

        await prisma.todo.delete({
            where: { id: parseInt(id) }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Todo deleted', id }),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        console.error('Database error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to delete todo' })
        };
    }
};