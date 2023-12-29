document.querySelector('#join-session-button').onclick = async () => {
    const current = await browser.tabs.query({
        currentWindow: true,
        active: true,
    });

    const sessionName = document.querySelector('#session-name').value;

    if (sessionName.length == 0) {
        return;
    }

    browser.tabs.sendMessage(current[0].id, sessionName);
}