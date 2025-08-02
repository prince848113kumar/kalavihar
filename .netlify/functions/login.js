// File path: netlify/functions/login.js

// Import necessary libraries
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database connection details from Netlify Environment Variables
// Netlify automatically sets DATABASE_URL when you create Netlify DB
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false // Required for Neon on some environments, especially Netlify
    }
});

/**
 * Main handler function for the Netlify serverless function for user login.
 * This function will be triggered by a POST request from the login form.
 */
exports.handler = async (event, context) => {
    // 1. Only allow POST requests for login
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405, // Method Not Allowed
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    try {
        // Parse the JSON data sent from the login form
        const data = JSON.parse(event.body);
        const { email, password } = data; // Expecting email and password from the form

        // 2. Basic Validation
        if (!email || !password) {
            return {
                statusCode: 400, // Bad Request
                body: JSON.stringify({ message: 'Email and password are required for login.' }),
            };
        }

        // 3. Connect to the database
        const client = await pool.connect();

        try {
            // 4. Find the user by email in the 'users' table
            const result = await client.query(
                'SELECT id, username, password_hash FROM users WHERE email = $1',
                [email]
            );
            const user = result.rows[0]; // Get the first row (user data)

            // 5. Check if user exists
            if (!user) {
                // If no user found with that email
                return {
                    statusCode: 401, // Unauthorized
                    body: JSON.stringify({ message: 'Invalid credentials (email not found).' }),
                };
            }

            // 6. Compare the provided password with the stored hashed password
            const passwordMatch = await bcrypt.compare(password, user.password_hash);

            // 7. Check if passwords match
            if (!passwordMatch) {
                // If passwords do not match
                return {
                    statusCode: 401, // Unauthorized
                    body: JSON.stringify({ message: 'Invalid credentials (incorrect password).' }),
                };
            }

            // 8. If login is successful
            // In a real application, you would typically generate and return a JSON Web Token (JWT)
            // or set up a session here for authentication across pages.
            // For this example, we'll just return a success message and basic user info.
            return {
                statusCode: 200, // OK
                body: JSON.stringify({
                    message: 'Login successful!',
                    user: {
                        id: user.id,
                        username: user.username,
                        email: email
                    }
                }),
            };

        } finally {
            // Always release the database client connection back to the pool
            client.release();
        }

    } catch (error) {
        // Log any server-side errors for debugging
        console.error('Login error:', error);
        
        // Return a generic error message to the client
        return {
            statusCode: 500, // Internal Server Error
            body: JSON.stringify({ message: 'An unexpected error occurred.', error: error.message }),
        };
    }
};