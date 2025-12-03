import type { Handler } from '@netlify/functions';
import { prisma } from '../../lib/prisma';

export const handler: Handler = async () => {
    try {
        const todos = await prisma.todo.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ todos }),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        console.error('Database error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to fetch todos' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }
};