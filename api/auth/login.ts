import { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb } from '../_lib/db.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS configuration
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const sql = getDb();
        if (!sql) {
            throw new Error('Database not configured');
        }

        // Query the users table for matching email and password (plaintext matching prototype)
        const users = await sql`
      SELECT id, email FROM users
      WHERE email = ${email} AND password = ${password}
      LIMIT 1
    `;

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // In a real app we would use JWT or similar. Here we'll return a basic token.
        const mockToken = Buffer.from(`${user.email}:${Date.now()}`).toString('base64');

        return res.status(200).json({
            success: true,
            token: mockToken,
            user: {
                id: user.id,
                email: user.email
            }
        });
    } catch (error: any) {
        console.error('Login error:', error);
        return res.status(500).json({
            error: 'An error occurred during authentication',
            details: error.message
        });
    }
}
