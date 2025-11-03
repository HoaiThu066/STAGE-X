// This script adds interactive behaviour to seat selection and payment
// countdown.  It executes only when relevant elements are present.

document.addEventListener('DOMContentLoaded', () => {
    // Seat selection logic
    const seatContainer = document.getElementById('seat-container');
    if (seatContainer) {
        const selectedInput = document.getElementById('selected-seats-input');
        const totalSpan = document.getElementById('selected-total');
        const priceMap = JSON.parse(seatContainer.getAttribute('data-price-map'));
        const selected = new Set();
        seatContainer.addEventListener('click', (e) => {
            const target = e.target;
            if (!target.classList.contains('seat') || target.classList.contains('booked') || target.classList.contains('disabled')) return;
            const seatId = target.getAttribute('data-seat-id');
            const price = priceMap[seatId];
            if (selected.has(seatId)) {
                selected.delete(seatId);
                target.classList.remove('selected');
            } else {
                selected.add(seatId);
                target.classList.add('selected');
            }
            updateSelected();
        });
        function updateSelected() {
            // Build array of seat_id|price
            const arr = Array.from(selected).map(seatId => `${seatId}|${priceMap[seatId]}`);
            selectedInput.value = JSON.stringify(arr);
            // Update total
            let total = 0;
            selected.forEach(sid => { total += parseFloat(priceMap[sid]); });
            totalSpan.textContent = total.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
        }
    }
    // Payment countdown logic
    const countdownEl = document.getElementById('countdown');
    if (countdownEl) {
        // 15 minutes in seconds.  VNPay recommends a longer timeout
        // to avoid immediate expiry at the gateway.
        let remaining = 900;
        const bookingId = countdownEl.getAttribute('data-booking-id');
        const interval = setInterval(() => {
            remaining--;
            const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
            const seconds = String(remaining % 60).padStart(2, '0');
            countdownEl.textContent = `${minutes}:${seconds}`;
            if (remaining <= 0) {
                clearInterval(interval);
                // Redirect to cancel
                window.location.href = `index.php?pg=pay&cancel=1`;
            }
        }, 1000);
    }

    // Login modal logic removed.  A standalone login page is now used for authentication.
});