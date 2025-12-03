import type { Handler } from '@netlify/functions';
import { prisma } from '../../lib/prisma';
import { createToken, verifyPassword } from '../../lib/auth';

export const handler: Handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { email, password } = JSON.parse(event.body || '{}');
        const normalizedEmail = (email || '').trim().toLowerCase();

        if (!normalizedEmail || !password) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Email and password are required' })
            };
        }

        const user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (!user) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Invalid credentials' })
            };
        }

        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
            return {
                statusCode: 401,
                body: JSON.stringify({ error: 'Invalid credentials' })
            };
        }

        const token = createToken({ id: user.id, email: user.email });

        return {
            statusCode: 200,
            body: JSON.stringify({
                token,
                user: { id: user.id, email: user.email }
            }),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        console.error('Login error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to login' })
        };
    }
};
