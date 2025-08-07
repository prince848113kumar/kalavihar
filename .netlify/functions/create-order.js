const { Client } = require('pg');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: "Method Not Allowed" })
        };
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });

    try {
        await client.connect();
        const { userId, totalAmount, items, shippingAddress, contactNumber } = JSON.parse(event.body);

        const text = `
            INSERT INTO orders(user_id, total_amount, items, shipping_address, contact_number)
            VALUES($1, $2, $3, $4, $5)
            RETURNING *;
        `;
        const values = [userId, totalAmount, JSON.stringify(items), shippingAddress, contactNumber];

        const res = await client.query(text, values);
        await client.end();

        return {
            statusCode: 200,
            body: JSON.stringify({ 
                message: "Order created successfully!",
                order: res.rows[0]
            })
        };
    } catch (error) {
        await client.end();
        console.error('Error creating order:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: "Failed to create order.", error: error.message })
        };
    }
};