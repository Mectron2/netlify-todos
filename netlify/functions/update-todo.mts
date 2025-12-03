import type { Handler } from '@netlify/functions';
import { prisma } from '../../lib/prisma';

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'PUT') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { id, completed } = JSON.parse(event.body || '{}');

        const todo = await prisma.todo.update({
            where: { id: parseInt(id) },
            data: { completed }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ todo }),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        console.error('Database error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to update todo' })
        };
    }
};