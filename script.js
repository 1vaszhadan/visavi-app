document.addEventListener("DOMContentLoaded", () => {
    // --- BASIC UI LOGIC (Scroll & Icons) ---
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const navHeight = navbar.offsetHeight;
                window.scrollTo({ top: target.offsetTop - navHeight, behavior: 'smooth' });
            }
        });
    });

    // --- DYNAMIC BOOKING SYSTEM ---
    const state = {
        step: 1,
        service: null,
        date: null,
        time: null,
        bookings: JSON.parse(localStorage.getItem('milou_bookings') || '[]')
    };

    const steps = document.querySelectorAll('.booking-step');
    const stepperItems = document.querySelectorAll('.step');

    // Function to go to specific step
    function goToStep(stepNum) {
        state.step = stepNum;
        steps.forEach(s => s.classList.remove('active'));

        const isSuccess = stepNum === 'success';
        const targetId = isSuccess ? 'stepSuccess' : `step${stepNum}`;
        document.getElementById(targetId).classList.add('active');

        // Update stepper UI
        stepperItems.forEach((s, idx) => {
            const stepIdx = idx + 1;
            s.classList.toggle('active', !isSuccess && stepIdx === stepNum);
            s.classList.toggle('completed', isSuccess || stepIdx < stepNum);
        });

        // Re-initialize icons for newly shown steps
        if (typeof lucide !== 'undefined') lucide.createIcons();

        if (stepNum === 2) renderCalendar();
        if (stepNum === 3) renderTimeSlots();
        if (stepNum === 4) renderSummary();
    }

    // Step 1: Service Selection
    document.querySelectorAll('.service-option').forEach(opt => {
        opt.addEventListener('click', () => {
            state.service = {
                id: opt.dataset.id,
                name: opt.querySelector('h3').textContent,
                price: opt.dataset.price,
                duration: opt.dataset.duration
            };
            goToStep(2);
        });
    });

    // Step 2: Calendar Logic
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthLabel = document.getElementById('currentMonth');
    let viewDate = new Date();

    function renderCalendar() {
        calendarGrid.innerHTML = '';
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        currentMonthLabel.textContent = new Intl.DateTimeFormat('uk-UA', { month: 'long', year: 'numeric' }).format(viewDate);

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Offset for weeks starting Monday (JS getDay is Sun=0)
        let offset = firstDay === 0 ? 6 : firstDay - 1;

        for (let i = 0; i < offset; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            calendarGrid.appendChild(empty);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let d = 1; d <= daysInMonth; d++) {
            const dayEl = document.createElement('div');
            dayEl.className = 'calendar-day';
            dayEl.textContent = d;

            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const thisDate = new Date(year, month, d);

            if (thisDate < today) {
                dayEl.classList.add('disabled');
            } else {
                dayEl.addEventListener('click', () => {
                    document.querySelectorAll('.calendar-day').forEach(el => el.classList.remove('active'));
                    dayEl.classList.add('active');
                    state.date = dateStr;
                    setTimeout(() => goToStep(3), 300);
                });
            }
            calendarGrid.appendChild(dayEl);
        }
    }

    document.getElementById('prevMonth').addEventListener('click', () => {
        viewDate.setMonth(viewDate.getMonth() - 1);
        renderCalendar();
    });
    document.getElementById('nextMonth').addEventListener('click', () => {
        viewDate.setMonth(viewDate.getMonth() + 1);
        renderCalendar();
    });

    // Step 3: Time Slots
    const timeSlotsGrid = document.getElementById('timeSlotsGrid');
    const slots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

    function renderTimeSlots() {
        timeSlotsGrid.innerHTML = '';
        slots.forEach(time => {
            const slotEl = document.createElement('div');
            slotEl.className = 'time-slot';
            slotEl.textContent = time;

            // Check if booked
            const isTaken = state.bookings.some(b => b.date === state.date && b.time === time);

            if (isTaken) {
                slotEl.classList.add('taken');
            } else {
                slotEl.addEventListener('click', () => {
                    document.querySelectorAll('.time-slot').forEach(el => el.classList.remove('active'));
                    slotEl.classList.add('active');
                    state.time = time;
                    setTimeout(() => goToStep(4), 300);
                });
            }
            timeSlotsGrid.appendChild(slotEl);
        });
    }

    // Step 4: Summary & Submission
    function renderSummary() {
        const summary = document.getElementById('bookingSummary');
        summary.innerHTML = `
            <h4>Деталі вашого візиту</h4>
            <div class="summary-item"><span>Послуга:</span> <strong>${state.service.name}</strong></div>
            <div class="summary-item"><span>Дата:</span> <strong>${state.date}</strong></div>
            <div class="summary-item"><span>Час:</span> <strong>${state.time}</strong></div>
            <div class="summary-item"><span>Вартість:</span> <strong>${state.service.price} ₴</strong></div>
        `;
    }

    const finalForm = document.getElementById('finalBookingForm');
    finalForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const newBooking = {
            id: Date.now(),
            service: state.service.name,
            date: state.date,
            time: state.time,
            customer: document.getElementById('custName').value,
            phone: document.getElementById('custPhone').value,
            comment: document.getElementById('custComment').value
        };

        // 1. Save to "Database" (localStorage)
        state.bookings.push(newBooking);
        localStorage.setItem('milou_bookings', JSON.stringify(state.bookings));

        // 2. Send to Telegram
        sendToTelegram(newBooking);

        goToStep('success');
    });

    async function sendToTelegram(booking) {
        const token = '8253804223:AAH0TfQsBUsFIMuU3cypJ6CVimPjlxfVKHg';
        const chatId = '1547286313';
        const message = `
🌟 **Новий запис!** 🌟
-------------------------
👤 **Клієнт**: ${booking.customer}
📞 **Телефон**: ${booking.phone}
💅 **Послуга**: ${booking.service}
📅 **Дата**: ${booking.date}
⏰ **Час**: ${booking.time}
💬 **Коментар**: ${booking.comment || 'немає'}
-------------------------
        `;

        try {
            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: message,
                    parse_mode: 'Markdown'
                })
            });
        } catch (err) {
            console.error('Telegram notification failed:', err);
        }
    }

    // Back Buttons
    document.querySelectorAll('.back-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (state.step > 1) goToStep(state.step - 1);
        });
    });
});
