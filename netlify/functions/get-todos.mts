import type { Handler } from '@netlify/functions';
import { prisma } from '../../lib/prisma';
import { requireUser, UnauthorizedError } from '../../lib/auth';

export const handler: Handler = async (event) => {
    try {
        const user = requireUser(event);

        const todos = await prisma.todo.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' }
        });

        return {
            statusCode: 200,
            body: JSON.stringify({ todos }),
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
            body: JSON.stringify({ error: 'Failed to fetch todos' }),
            headers: { 'Content-Type': 'application/json' }
        };
    }
};
