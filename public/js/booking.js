const bookingForm = document.querySelector('.booking-form');

if (bookingForm) {
    const maxPassengers = 8;
    let passengerCount = document.querySelectorAll('.passenger-card').length;
    let ticketPrice = 0;
    const selectedDayLabels = [...document.querySelectorAll('.days-display label')];
    const passengersList = document.getElementById('passengersList');
    const addPassengerButton = document.getElementById('addPassenger');
    const ticketRadios = [...document.querySelectorAll('input[name="ticketClass"]')];
    const selectedTicketName = document.getElementById('selectedTicketName');
    const passengerCountDisplay = document.getElementById('passengerCount');
    const pricePerTicket = document.getElementById('pricePerTicket');
    const totalAmount = document.getElementById('totalAmount');
    const bookingError = document.getElementById('booking-submit-error');

    const updateSummary = () => {
        passengerCountDisplay.textContent = passengerCount;
        pricePerTicket.textContent = `¥${ticketPrice.toLocaleString()}`;
        totalAmount.textContent = `¥${(ticketPrice * passengerCount).toLocaleString()}`;
    };

    const updatePassengerNumbers = () => {
        document.querySelectorAll('.passenger-card').forEach((card, index) => {
            card.querySelector('.passenger-number').textContent = `Passenger ${index + 1}`;
        });
    };

    const createRemoveButton = () => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn-remove-passenger';
        button.innerHTML = '<span class="remove-icon">×</span>';
        button.setAttribute('aria-label', 'Remove passenger');
        return button;
    };

    const syncRemoveButtons = () => {
        const cards = [...document.querySelectorAll('.passenger-card')];
        const firstHeader = cards[0]?.querySelector('.passenger-card-header');
        const firstRemoveButton = cards[0]?.querySelector('.btn-remove-passenger');

        if (cards.length > 1 && firstHeader && !firstRemoveButton) {
            firstHeader.appendChild(createRemoveButton());
        } else if (cards.length === 1 && firstRemoveButton) {
            firstRemoveButton.remove();
        }
    };

    const updateAddButtonState = () => {
        addPassengerButton.disabled = passengerCount >= maxPassengers;
        addPassengerButton.classList.toggle('disabled', addPassengerButton.disabled);
    };

    const addPassenger = () => {
        if (passengerCount >= maxPassengers) return;

        const index = Date.now();
        const card = document.createElement('div');
        card.className = 'passenger-card';
        card.dataset.passengerIndex = String(index);
        card.innerHTML = `
            <div class="passenger-card-header">
                <h3 class="passenger-number"></h3>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label for="firstName-${index}" class="form-label">First Name</label>
                    <input type="text" id="firstName-${index}" name="passengers[${index}][firstName]" class="form-input" required placeholder="Enter first name">
                </div>
                <div class="form-group">
                    <label for="lastName-${index}" class="form-label">Last Name</label>
                    <input type="text" id="lastName-${index}" name="passengers[${index}][lastName]" class="form-input" required placeholder="Enter last name">
                </div>
                <div class="form-group">
                    <label for="email-${index}" class="form-label">Email Address</label>
                    <input type="email" id="email-${index}" name="passengers[${index}][email]" class="form-input" required placeholder="your.email@example.com">
                </div>
                <div class="form-group">
                    <label for="phone-${index}" class="form-label">Phone Number</label>
                    <input type="tel" id="phone-${index}" name="passengers[${index}][phone]" class="form-input" required placeholder="+81 90-1234-5678">
                </div>
            </div>
        `;

        card.querySelector('.passenger-card-header').appendChild(createRemoveButton());
        passengersList.appendChild(card);
        passengerCount += 1;
        updatePassengerNumbers();
        updateSummary();
        updateAddButtonState();
        syncRemoveButtons();
    };

    const removePassenger = (card) => {
        if (passengerCount <= 1) return;

        card.remove();
        passengerCount -= 1;
        updatePassengerNumbers();
        updateSummary();
        updateAddButtonState();
        syncRemoveButtons();
    };

    const autoFillForm = () => {
        const firstNames = ['James', 'Olivia', 'William', 'Emily', 'Yuki', 'Haruto', 'Sakura', 'Akira'];
        const lastNames = ['Smith', 'Johnson', 'Tanaka', 'Suzuki', 'Yamamoto', 'Ito'];
        const randomItem = (items) => items[Math.floor(Math.random() * items.length)];

        document.querySelectorAll('.passenger-card').forEach((card) => {
            const firstName = randomItem(firstNames);
            const lastName = randomItem(lastNames);
            card.querySelector('input[name$="[firstName]"]').value = firstName;
            card.querySelector('input[name$="[lastName]"]').value = lastName;
            card.querySelector('input[name$="[email]"]').value = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`;
            card.querySelector('input[name$="[phone]"]').value = '+81 120-000-0000';
        });
    };

    selectedDayLabels.forEach((label) => {
        label.addEventListener('click', (event) => {
            event.preventDefault();
            selectedDayLabels.forEach((dayLabel) => {
                dayLabel.classList.remove('selected');
                dayLabel.querySelector('input').checked = false;
            });
            label.classList.add('selected');
            label.querySelector('input').checked = true;
        });
    });

    addPassengerButton.addEventListener('click', addPassenger);
    passengersList.addEventListener('click', (event) => {
        const removeButton = event.target.closest('.btn-remove-passenger');
        if (removeButton) removePassenger(removeButton.closest('.passenger-card'));
    });

    ticketRadios.forEach((radio) => {
        radio.addEventListener('change', () => {
            selectedTicketName.textContent = radio.dataset.name;
            ticketPrice = Number(radio.dataset.price);
            updateSummary();
        });
    });

    document.getElementById('autofill').addEventListener('click', (event) => {
        event.preventDefault();
        autoFillForm();
    });

    bookingForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        bookingError.hidden = true;

        const submitButton = bookingForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;

        const payload = {
            scheduleId: Number(bookingForm.elements.scheduleId.value),
            tripId: bookingForm.elements.tripId.value,
            ticketClass: bookingForm.querySelector('input[name="ticketClass"]:checked')?.value,
            selectedDay: bookingForm.querySelector('input[name="selectedDay"]:checked')?.value,
            passengers: [...bookingForm.querySelectorAll('.passenger-card')].map((card) => ({
                firstName: card.querySelector('input[name$="[firstName]"]').value,
                lastName: card.querySelector('input[name$="[lastName]"]').value,
                email: card.querySelector('input[name$="[email]"]').value,
                phone: card.querySelector('input[name$="[phone]"]').value
            }))
        };

        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Unable to create booking. Please check the form and try again.');
            }

            window.location.assign(`/trips/bookings/${encodeURIComponent(result.id)}`);
        } catch (error) {
            bookingError.textContent = error.message || 'Unable to create booking. Please try again.';
            bookingError.hidden = false;
            submitButton.disabled = false;
        }
    });

    const selectedRadio = document.querySelector('input[name="ticketClass"]:checked');
    if (selectedRadio) {
        selectedTicketName.textContent = selectedRadio.dataset.name;
        ticketPrice = Number(selectedRadio.dataset.price);
    }
    updateSummary();
    updateAddButtonState();
}
