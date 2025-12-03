import type { Handler } from '@netlify/functions';
import { prisma } from '../../lib/prisma';

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { text } = JSON.parse(event.body || '{}');

        if (!text?.trim()) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Text is required' })
            };
        }

        const todo = await prisma.todo.create({
            data: { text: text.trim() }
        });

        return {
            statusCode: 201,
            body: JSON.stringify({ todo }),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        console.error('Database error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to create todo' })
        };
    }
};