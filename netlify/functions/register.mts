import type { Handler } from '@netlify/functions';
import { prisma } from '../../lib/prisma';
import { createToken, hashPassword } from '../../lib/auth';

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

        const existing = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        if (existing) {
            return {
                statusCode: 409,
                body: JSON.stringify({ error: 'User already exists' })
            };
        }

        const passwordHash = await hashPassword(password);

        const user = await prisma.user.create({
            data: { email: normalizedEmail, passwordHash }
        });

        const token = createToken({ id: user.id, email: user.email });

        return {
            statusCode: 201,
            body: JSON.stringify({
                token,
                user: { id: user.id, email: user.email }
            }),
            headers: { 'Content-Type': 'application/json' }
        };
    } catch (error) {
        console.error('Registration error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to register' })
        };
    }
};
