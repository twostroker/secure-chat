document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const createBtn = document.getElementById('create-btn');
    const joinBtn = document.getElementById('join-btn');
    const createForm = document.getElementById('create-form');
    const joinForm = document.getElementById('join-form');
    const createSubmit = document.getElementById('create-submit');
    const joinSubmit = document.getElementById('join-submit');
    
    // Show create room form
    createBtn.addEventListener('click', function() {
        createForm.style.display = 'flex';
        joinForm.style.display = 'none';
    });
    
    // Show join room form
    joinBtn.addEventListener('click', function() {
        joinForm.style.display = 'flex';
        createForm.style.display = 'none';
    });
    
    // Handle room creation
    createSubmit.addEventListener('click', function() {
        const name = document.getElementById('create-name').value.trim();
        const room = document.getElementById('create-room').value.trim();
        const pass = document.getElementById('create-pass').value.trim();
        
        if (!name || !room || !pass) {
            alert('Please fill in all fields');
            return;
        }
        
        // Check if room exists
        const roomRef = database.ref(`rooms/${room}`);
        roomRef.once('value').then((snapshot) => {
            if (snapshot.exists()) {
                alert('Room name already exists. Please choose another name.');
                return;
            }
            
            // Create new room
            roomRef.set({
                passcode: pass,
                createdAt: Date.now(),
                participants: 1,
                creator: name
            }).then(() => {
                // Store user info in session storage
                sessionStorage.setItem('chat_name', name);
                sessionStorage.setItem('chat_room', room);
                sessionStorage.setItem('chat_pass', pass);
                sessionStorage.setItem('chat_isCreator', 'true');
                
                // Redirect to chat room
                window.location.href = `chat.html?room=${room}`;
            }).catch((error) => {
                alert('Error creating room: ' + error.message);
            });
        });
    });
    
    // Handle join room
    joinSubmit.addEventListener('click', function() {
        const name = document.getElementById('join-name').value.trim();
        const room = document.getElementById('join-room').value.trim();
        const pass = document.getElementById('join-pass').value.trim();
        
        if (!name || !room || !pass) {
            alert('Please fill in all fields');
            return;
        }
        
        // Check if room exists and verify passcode
        const roomRef = database.ref(`rooms/${room}`);
        roomRef.once('value').then((snapshot) => {
            if (!snapshot.exists()) {
                alert('Room does not exist');
                return;
            }
            
            const roomData = snapshot.val();
            
            // Verify passcode
            if (roomData.passcode !== pass) {
                alert('Incorrect passcode');
                return;
            }
            
            // Check if room is full
            if (roomData.participants >= 2) {
                alert('Room is full (max 2 participants)');
                return;
            }
            
            // Increment participant count
            roomRef.update({
                participants: roomData.participants + 1
            }).then(() => {
                // Store user info in session storage
                sessionStorage.setItem('chat_name', name);
                sessionStorage.setItem('chat_room', room);
                sessionStorage.setItem('chat_pass', pass);
                sessionStorage.setItem('chat_isCreator', 'false');
                
                // Redirect to chat room
                window.location.href = `chat.html?room=${room}`;
            }).catch((error) => {
                alert('Error joining room: ' + error.message);
            });
        });
    });
});