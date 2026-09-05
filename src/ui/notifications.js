const statusMessage = document.getElementById('statusMessage');

// Show a transient status message below the action buttons
export function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.classList.remove('hidden', 'text-green-500', 'text-red-500', 'text-blue-500');

    if (type === 'success') {
        statusMessage.classList.add('text-green-500');
    } else if (type === 'error') {
        statusMessage.classList.add('text-red-500');
    } else {
        statusMessage.classList.add('text-blue-500');
    }

    setTimeout(() => {
        statusMessage.classList.add('hidden');
    }, 4000);
}
