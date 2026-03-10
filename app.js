const tg = window.Telegram.WebApp;

tg.expand();
tg.ready();

const sections = {
    register: {
        title: "Як зареєструватись?",
        content: `
            <div class="info-list">
                <p>1. Відвідайте офіційний ресурс VISAVI.</p>
                <p>2. Натисніть кнопку "Створити акаунт".</p>
                <p>3. Вкажіть дійсні дані для верифікації.</p>
                <p>4. Підтвердіть реєстрацію через e-mail або Telegram.</p>
            </div>
        `
    },
    sit: {
        title: "За стіл VISAVI",
        content: `
            <div class="info-list">
                <p>1. Оберіть стіл з логотипом VISAVI у лобі.</p>
                <p>2. Перевірте ліміти та вільні місця.</p>
                <p>3. Натисніть 'Сісти' та підтвердіть бай-ін.</p>
                <p>4. Насолоджуйтесь грою преміум-класу.</p>
            </div>
        `
    },
    payment: {
        title: "Поповнення балансу",
        content: `
            <div class="payment-options">
                <button class="pay-btn" onclick="processPayment('stars')">💎 Оплатити Stars</button>
                <button class="pay-btn" onclick="processPayment('crypto')">⚡ Оплатити Crypto</button>
                <p style="text-align: center; margin-top: 1rem; opacity: 0.6; font-size: 0.8rem;">Оберіть зручний для вас варіант вище</p>
            </div>
        `
    },
    guide: {
        title: "Крипто-інструкція",
        content: `
            <div class="info-list">
                <p>1. Зайдіть у @wallet в Telegram.</p>
                <p>2. Натисніть 'Купити' та оберіть P2P або карту.</p>
                <p>3. Оберіть USDT або TON.</p>
                <p>4. Тепер ви можете поповнити баланс VISAVI в один клік.</p>
            </div>
        `
    }
};

function openSection(id) {
    const section = sections[id];
    document.getElementById('modal-title').innerText = section.title;
    document.getElementById('modal-body').innerHTML = section.content;
    document.getElementById('modal-container').classList.remove('hidden');
    tg.HapticFeedback.impactOccurred('medium');
}

function closeModal() {
    document.getElementById('modal-container').classList.add('hidden');
}

function processPayment(method) {
    tg.HapticFeedback.notificationOccurred('success');
    tg.sendData(JSON.stringify({ action: "payment", method: method }));
    tg.close();
}

// Close on background click
document.getElementById('modal-container').addEventListener('click', (e) => {
    if (e.target.id === 'modal-container') closeModal();
});
