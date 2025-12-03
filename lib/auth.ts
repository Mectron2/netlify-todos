import type { HandlerEvent } from "@netlify/functions";
import * as jwt from "jsonwebtoken";
import * as bcrypt from "bcryptjs";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
}

export interface AuthenticatedUser {
    id: number;
    email: string;
}

export class UnauthorizedError extends Error {
    constructor(message = "Unauthorized") {
        super(message);
        this.name = "UnauthorizedError";
    }
}

const parseAuthorizationHeader = (event: HandlerEvent) => {
    const header =
        event.headers.authorization ||
        // Some clients use capitalized header keys.
        (event.headers as Record<string, string | undefined>)?.Authorization;

    if (!header || !header.startsWith("Bearer ")) {
        return null;
    }

    return header.slice(7);
};

export const requireUser = (event: HandlerEvent): AuthenticatedUser => {
    const token = parseAuthorizationHeader(event);

    if (!token) {
        throw new UnauthorizedError();
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload & {
            sub: number;
            email: string;
        };

        if (!payload?.sub || !payload.email) {
            throw new UnauthorizedError();
        }

        return { id: Number(payload.sub), email: payload.email };
    } catch {
        throw new UnauthorizedError();
    }
};

export const createToken = (user: AuthenticatedUser) =>
    jwt.sign(
        { sub: user.id, email: user.email },
        JWT_SECRET,
        { expiresIn: "7d" },
    );

export const hashPassword = async (password: string) => {
    const trimmed = password.trim();
    if (!trimmed) {
        throw new Error("Password is required");
    }

    return bcrypt.hash(trimmed, 10);
};

export const verifyPassword = async (password: string, hash: string) =>
    bcrypt.compare(password, hash);
