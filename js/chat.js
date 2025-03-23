// chat.js

import { database, ref, set, push, onChildAdded, onChildRemoved, serverTimestamp } from './firebase.js';

document.addEventListener('DOMContentLoaded', function () {
    // Get user data from session storage
    const username = sessionStorage.getItem('chat_name');
    const roomName = sessionStorage.getItem('chat_room');
    const passcode = sessionStorage.getItem('chat_pass');
    const isCreator = sessionStorage.getItem('chat_isCreator') === 'true';

    // Check if user has valid session
    if (!username || !roomName || !passcode) {
        alert('Invalid session. Redirecting to home page.');
        window.location.href = 'index.html';
        return;
    }

    // Update room name display
    document.getElementById('room-name').textContent = `Room: ${roomName}`;

    // Firebase references
    const roomRef = ref(database, `rooms/${roomName}`);
    const messagesRef = ref(database, `messages/${roomName}`);

    // UI Elements
    const messageContainer = document.getElementById('message-container');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const imageBtn = document.getElementById('image-btn');
    const videoBtn = document.getElementById('video-btn');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');

    let selectedFile = null;
    let selectedFileType = null;
    let messageDeleteTimers = {};

    // Check if room exists
    onChildAdded(roomRef, (snapshot) => {
        if (!snapshot.exists()) {
            alert('Room does not exist. Redirecting to home page.');
            window.location.href = 'index.html';
            return;
        }
    });

    // Add user disconnect handler
    onDisconnect(roomRef).update({
        participants: serverTimestamp.increment(-1)
    });

    // Listen for messages
    onChildAdded(messagesRef, (snapshot) => {
        const message = snapshot.val();
        const messageId = snapshot.key;

        // Display message
        displayMessage(message, messageId);

        // Schedule message deletion (3 minutes)
        scheduleMessageDeletion(messageId);
    });

    // Listen for message deletions
    onChildRemoved(messagesRef, (snapshot) => {
        const messageId = snapshot.key;
        const messageElement = document.getElementById(`message-${messageId}`);
        if (messageElement) {
            messageElement.remove();
        }

        // Clear timer if exists
        if (messageDeleteTimers[messageId]) {
            clearTimeout(messageDeleteTimers[messageId]);
            delete messageDeleteTimers[messageId];
        }
    });

    // Send button click handler
    sendBtn.addEventListener('click', sendMessage);

    // Enter key press handler
    messageInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Image button click handler
    imageBtn.addEventListener('click', function () {
        fileInput.setAttribute('accept', 'image/*');
        fileInput.click();
    });

    // Video button click handler
    videoBtn.addEventListener('click', function () {
        fileInput.setAttribute('accept', 'video/*');
        fileInput.click();
    });

    // File selection handler
    fileInput.addEventListener('change', function (e) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('File is too large. Maximum size is 5MB.');
                return;
            }

            selectedFile = file;
            selectedFileType = file.type.startsWith('image/') ? 'image' : 'video';

            // Show preview
            previewContainer.innerHTML = '';
            previewContainer.style.display = 'block';

            const reader = new FileReader();
            reader.onload = function (e) {
                if (selectedFileType === 'image') {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.className = 'preview-image';
                    previewContainer.appendChild(img);
                } else {
                    const video = document.createElement('video');
                    video.src = e.target.result;
                    video.className = 'preview-video';
                    video.muted = true;
                    video.autoplay = true;
                    video.loop = true;
                    previewContainer.appendChild(video);
                }

                // Add clear button
                const clearBtn = document.createElement('button');
                clearBtn.className = 'clear-preview';
                clearBtn.innerHTML = '×';
                clearBtn.addEventListener('click', function (e) {
                    e.stopPropagation();
                    clearPreview();
                });
                previewContainer.appendChild(clearBtn);
            };
            reader.readAsDataURL(file);
        }
    });

    // Cancel button click handler
    cancelBtn.addEventListener('click', function () {
        if (confirm('Are you sure you want to end this chat? All messages will be deleted.')) {
            // Send system message
            push(messagesRef, {
                type: 'system',
                text: 'Chat room has been closed',
                timestamp: serverTimestamp()
            });

            // Delete room and messages after short delay
            setTimeout(() => {
                set(messagesRef, null);
                set(roomRef, null);

                // Redirect to home page
                window.location.href = 'index.html';
            }, 1000);
        }
    });

    // Anti-screenshot detection
    document.addEventListener('keydown', function (e) {
        // Detect common screenshot key combinations
        if (e.key === 'PrintScreen' ||
            (e.ctrlKey && e.key === 'p') ||
            (e.ctrlKey && e.shiftKey && e.key === 'p') ||
            (e.metaKey && e.shiftKey && e.key === '3') ||
            (e.metaKey && e.shiftKey && e.key === '4')) {
            showSecurityAlert();
            e.preventDefault();
            return false;
        }
    });

    // Display security alert
    function showSecurityAlert() {
        const alert = document.getElementById('security-alert');
        alert.style.display = 'block';
        setTimeout(() => {
            alert.style.display = 'none';
        }, 3000);
    }

    // Send message function
    function sendMessage() {
        const messageText = messageInput.value.trim();

        if (!messageText && !selectedFile) {
            return;
        }

        if (selectedFile) {
            sendFileMessage();
        } else {
            // Send text message
            const message = {
                type: 'text',
                text: messageText,
                sender: username,
                timestamp: serverTimestamp()
            };

            push(messagesRef, message);
            messageInput.value = '';
        }
    }

    // Send file message function
    function sendFileMessage() {
        const reader = new FileReader();
        reader.onload = function (e) {
            const message = {
                type: selectedFileType,
                text: e.target.result,
                sender: username,
                timestamp: serverTimestamp()
            };

            push(messagesRef, message);
            messageInput.value = '';
            clearPreview();
        };
        reader.readAsDataURL(selectedFile);
    }

    // Clear preview function
    function clearPreview() {
        previewContainer.innerHTML = '';
        previewContainer.style.display = 'none';
        selectedFile = null;
        selectedFileType = null;
    }

    // Display message function
    function displayMessage(message, messageId) {
        const messageDiv = document.createElement('div');
        messageDiv.id = `message-${messageId}`;
        messageDiv.classList.add('message');
        messageDiv.classList.add('expiring');

        if (message.type === 'system') {
            messageDiv.classList.add('system');
            messageDiv.textContent = message.text;
        } else {
            messageDiv.classList.add(message.sender === username ? 'sent' : 'received');

            // Create sender element
            const senderDiv = document.createElement('div');
            senderDiv.classList.add('sender');
            senderDiv.textContent = message.sender;
            messageDiv.appendChild(senderDiv);

            // Create content based on message type
            if (message.type === 'text') {
                messageDiv.innerHTML += message.text;
            } else if (message.type === 'image') {
                const img = document.createElement('img');
                img.src = message.text;
                img.classList.add('image-content');
                messageDiv.appendChild(img);
            } else if (message.type === 'video') {
                const video = document.createElement('video');
                video.src = message.text;
                video.classList.add('video-content');
                video.controls = true;
                messageDiv.appendChild(video);
            }

            // Create timestamp element
            const timestamp = new Date(message.timestamp);
            const timeDiv = document.createElement('div');
            timeDiv.classList.add('timestamp');
            timeDiv.textContent = timestamp.toLocaleTimeString();
            messageDiv.appendChild(timeDiv);
        }

        // Append message to container
        messageContainer.appendChild(messageDiv);

        // Scroll to bottom
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }

    // Schedule message deletion (3 minutes)
    function scheduleMessageDeletion(messageId) {
        const timer = setTimeout(() => {
            set(ref(database, `messages/${roomName}/${messageId}`), null);
        }, 3 * 60 * 1000); // 3 minutes

        messageDeleteTimers[messageId] = timer;
    }

    // Handle page leave/refresh
    window.addEventListener('beforeunload', function (e) {
        set(roomRef, {
            participants: serverTimestamp.increment(-1)
        });

        // Show confirmation message
        const confirmationMessage = 'Leaving will end your session. Are you sure?';
        e.returnValue = confirmationMessage;
        return confirmationMessage;
    });
});