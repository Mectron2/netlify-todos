import type { Handler } from '@netlify/functions';
import { prisma } from '../../lib/prisma';
import { requireUser, UnauthorizedError } from '../../lib/auth';

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const user = requireUser(event);
        const { text } = JSON.parse(event.body || '{}');

        if (!text?.trim()) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Text is required' })
            };
        }

        const todo = await prisma.todo.create({
            data: { text: text.trim(), userId: user.id }
        });

        return {
            statusCode: 201,
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
            body: JSON.stringify({ error: 'Failed to create todo' })
        };
    }
};
