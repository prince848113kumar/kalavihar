// File path: ./.netlify/functions/register.js

// Import necessary libraries
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// --- NEW: Debugging line to check the environment variable ---
console.log('DATABASE_URL from env:', process.env.DATABASE_URL ? 'URL exists' : 'URL is undefined/empty');
// --- End of NEW ---

// Database connection details from Netlify Environment Variables
// Netlify automatically sets DATABASE_URL when you create Netlify DB
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // Add these SSL configurations for Neon DB, which requires a secure connection.
    ssl: {
        // Neon DB requires an SSL connection. 'require' mode enforces it.
        sslmode: 'require',
        // In some serverless environments, this is needed to prevent certificate verification errors.
        // It's a trade-off between security and connectivity, but often necessary for these setups.
        rejectUnauthorized: false
    }
});

/**
 * Main handler function for the Netlify serverless function.
 * This function will be triggered by a POST request from the registration form.
 */
exports.handler = async (event, context) => {
    // Check if the request is a POST request.
    // We only want to process POST requests for registration.
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405, // Method Not Allowed
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    try {
        // Parse the JSON data sent from the registration form
        const data = JSON.parse(event.body);
        const { username, email, password } = data;

        // Basic validation to ensure all required fields are present
        if (!username || !email || !password) {
            return {
                statusCode: 400, // Bad Request
                body: JSON.stringify({ message: 'All fields (username, email, password) are required.' }),
            };
        }

        // Hash the password before storing it in the database (CRITICAL SECURITY STEP!)
        // 'bcryptjs' is used here. We generate a salt and then hash the password.
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Connect to the database
        const client = await pool.connect();

        try {
            // Check if a user with the same email already exists to prevent duplicates
            const checkUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
            if (checkUser.rows.length > 0) {
                return {
                    statusCode: 409, // Conflict (User already exists)
                    body: JSON.stringify({ message: 'User with this email already exists.' }),
                };
            }

            // Insert the new user into the 'users' table
            await client.query(
                'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)',
                [username, email, hashedPassword]
            );

            // Return a success response
            return {
                statusCode: 200, // OK
                body: JSON.stringify({ message: 'Registration successful!', user: { username, email } }),
            };
        } finally {
            // Always release the database client connection back to the pool
            client.release();
        }

    } catch (error) {
        // Log any server-side errors for debugging
        console.error('Registration error:', error);
        
        // Return a generic error message to the client
        return {
            statusCode: 500, // Internal Server Error
            body: JSON.stringify({ message: 'An unexpected error occurred.', error: error.message }),
        };
    }
};