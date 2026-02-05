import jwt from 'jsonwebtoken';

export const generateToken = (userId: number, email: string) => {
    // We use the non-null assertion (!) because we will ensure JWT_SECRET is checked at startup
    return jwt.sign(
        { id: userId, email },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
    );
};

export const verifyToken = (token: string) => {
    return jwt.verify(token, process.env.JWT_SECRET!);
};
