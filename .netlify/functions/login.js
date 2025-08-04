// File path: ./.netlify/functions/login.js

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_very_secret_jwt_key_please_change_this_for_production';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        sslmode: 'require',
        rejectUnauthorized: false
    }
});

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    try {
        const data = JSON.parse(event.body);
        const { email, password } = data;

        if (!email || !password) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Email and password are required.' }),
            };
        }

        const client = await pool.connect();
        try {
            const result = await client.query('SELECT id, username, email, password_hash FROM users WHERE email = $1', [email]);
            const user = result.rows[0];

            if (!user) {
                return {
                    statusCode: 401,
                    body: JSON.stringify({ message: 'Login failed: Invalid credentials.' }),
                };
            }

            const passwordMatch = await bcrypt.compare(password, user.password_hash);

            if (!passwordMatch) {
                return {
                    statusCode: 401,
                    body: JSON.stringify({ message: 'Login failed: Invalid credentials.' }),
                };
            }

            const tokenPayload = {
                userId: user.id,
                username: user.username,
                email: user.email
            };

            const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '1h' });

            return {
                statusCode: 200,
                body: JSON.stringify({
                    message: 'Login successful!',
                    token: token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email
                    }
                }),
            };

        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Login error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'An unexpected error occurred during login.' }),
        };
    }
};