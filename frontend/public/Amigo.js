document.addEventListener("DOMContentLoaded", () => {
    console.log("Amigos.js cargado");

    // Tabs filtering
    const tabs = document.querySelectorAll('.tab-btn');
    const friendsList = document.getElementById('friendsList');
    const noFriendsMessage = document.getElementById('noFriendsMessage');

    function filterFriends(type) {
        // Aquí iría la lógica real de la BD en el futuro
        const cards = friendsList.querySelectorAll('.friend-card');

        let visible = 0;
        cards.forEach(card => {
            if (type === 'all' || 
                (type === 'online' && card.classList.contains('online')) || 
                (type === 'requests' && card.classList.contains('request'))) {
                card.style.display = 'block';
                visible++;
            } else {
                card.style.display = 'none';
            }
        });

        // Mostrar mensaje si no hay nada
        noFriendsMessage.style.display = (cards.length === 0 || visible === 0) ? 'block' : 'none';
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const type = tab.getAttribute('data-tab');
            filterFriends(type);
        });
    });

    // Iniciar en TODOS
    const allTab = document.querySelector('[data-tab="all"]');
    if (allTab) allTab.click();

    // Chat
    const chatOverlay = document.getElementById('chatOverlay');
    const closeChat = document.getElementById('closeChat');
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendMessage');
    const chatMessages = document.getElementById('chatMessages');
    const chatWith = document.getElementById('chatWith');

    function addMessage(text, sent = false) {
        const div = document.createElement('div');
        div.className = `message ${sent ? 'sent' : 'received'}`;
        const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        div.innerHTML = `<p>${text}</p><span class="message-time">${time}</span>`;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    document.querySelectorAll('.btn-chat').forEach(btn => {
        btn.addEventListener('click', function() {
            const friend = this.getAttribute('data-friend') || 'Amigo';
            chatWith.textContent = friend;
            chatMessages.innerHTML = '';
            addMessage(`¡Hola ${friend}! ¿Qué tal?`);
            chatOverlay.style.display = 'flex';
            chatInput.focus();
        });
    });

    closeChat?.addEventListener('click', () => {
        chatOverlay.style.display = 'none';
    });

    function send() {
        const text = chatInput.value.trim();
        if (!text) return;
        addMessage(text, true);
        chatInput.value = '';
        setTimeout(() => {
            addMessage('¡Sí! ¿Qué modo quieres jugar? 😄');
        }, 1300);
    }

    sendBtn?.addEventListener('click', send);
    chatInput?.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            send();
        }
    });
});
// Funcionalidad del botón AGREGAR
const addFriendInput = document.getElementById('addFriendInput');
const btnAddFriend = document.getElementById('btnAddFriend');

if (btnAddFriend && addFriendInput) {
    btnAddFriend.addEventListener('click', () => {
        const valor = addFriendInput.value.trim();

        if (valor === '') {
            alert('¡Escribe un nombre o código de amigo primero! 😅');
            return;
        }

        // Aquí iría la llamada real a la BD en el futuro
        // Por ahora simulamos que se envía la solicitud
        alert(`Solicitud enviada a: ${valor} 🎉\n(Esto se conectará a la BD más adelante)`);

        // Limpiar el input
        addFriendInput.value = '';

        // Opcional: enfocar de nuevo el input
        addFriendInput.focus();
    });

    // Permitir presionar Enter en el input
    addFriendInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            btnAddFriend.click();
        }
    });
}

