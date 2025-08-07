// File path: cart.js

document.addEventListener('DOMContentLoaded', function() {
    // Function to get the current cart from local storage
    function getCart() {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    }

    // Function to save the cart to local storage
    function saveCart(cart) {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    // Function to update the cart count display in the header
    function updateCartCount() {
        const cart = getCart();
        const cartCountElement = document.getElementById('cart-count'); // The span where we will show the count
        if (cartCountElement) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCountElement.textContent = totalItems > 0 ? totalItems : '';
        }
    }

    // Function to add a product to the cart
    window.addToCart = function(productId, productName, productPrice) {
        let cart = getCart();
        const existingItem = cart.find(item => item.id === productId);

        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({
                id: productId,
                name: productName,
                price: productPrice,
                quantity: 1
            });
        }
        saveCart(cart);
        updateCartCount();
        alert(`${productName} has been added to your cart!`);
    }

    // Function to render cart items on cart.html page
    window.renderCartItems = function() {
        const cart = getCart();
        const container = document.getElementById('cart-items-container');
        const totalElement = document.getElementById('cart-total');
        let totalAmount = 0;

        if (!container) return;

        container.innerHTML = ''; // Clear previous content

        if (cart.length === 0) {
            container.innerHTML = '<p class="text-center text-gray-500">Your cart is empty.</p>';
            totalElement.textContent = '₹0';
            return;
        }

        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            totalAmount += itemTotal;
            container.innerHTML += `
                <div class="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div class="flex items-center space-x-4">
                        <img src="${item.image}" alt="${item.name}" class="w-16 h-16 object-cover rounded-md">
                        <div>
                            <p class="font-medium text-gray-900">${item.name}</p>
                            <p class="text-sm text-gray-500">Qty: ${item.quantity} x ₹${item.price}</p>
                        </div>
                    </div>
                    <span class="font-bold text-gray-900">₹${itemTotal.toFixed(2)}</span>
                </div>
            `;
        });

        totalElement.textContent = `₹${totalAmount.toFixed(2)}`;
    }

    // Initial update of the cart count when the page loads
    updateCartCount();
});