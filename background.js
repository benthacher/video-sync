browser.pageAction.onClicked.addListener(async () => {
    const current = await browser.tabs.query({
        currentWindow: true,
        active: true,
    });

    browser.tabs.sendMessage(current[0].id, 'sync');
});