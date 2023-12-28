let ws;
let video;

function broadcastPlay() {
    ws.send(JSON.stringify({
        timestamp: video.currentTime
    }));
}

function broadcastPause() {
    ws.send(JSON.stringify({
        pause: true
    }));
}

function insertControlListeners() {
    video.addEventListener('pause', broadcastPause);
    video.addEventListener('play', broadcastPlay);
}

function removeControlListeners() {
    video.removeEventListener('pause', broadcastPause);
    video.removeEventListener('play', broadcastPlay);
}

function init() {
    ws = new WebSocket('ws://71.192.170.86:9192');

    ws.onmessage = ev => {
        let json;
        try {
            json = JSON.parse(ev.data);
        } catch (e) {
            console.error('Failed to parse JSON');
            return;
        }

        // remove control listeners here so that the pauses and plays aren't broadcasted
        removeControlListeners();

        if ('timestamp' in json) {
            // pause video, set current time to given timestamp, then play
            console.log('seeking to timestamp...');

            function notifyReady() {
                video.pause();
                video.currentTime = json.timestamp;
                ws.send(JSON.stringify({
                    'ready': true
                }));
                console.log('video buffered!');
                video.removeEventListener('playing', notifyReady);
            }

            // when the video actually plays, pause it and rewind, notify the server, then remove the event listener from the video
            video.addEventListener('playing', notifyReady);

            video.pause();
            video.currentTime = json.timestamp;
            video.play();
        } else if (json.play) {
            video.play();
            setTimeout(insertControlListeners, 500);
            console.log('playing!');
        } else if (json.pause) {
            video.pause();
            insertControlListeners();
        }
    };

    video = document.querySelector('video');

    insertControlListeners();

    browser.runtime.onMessage.addListener(() => {
        if (ws.readyState === WebSocket.OPEN) {
            const dataString = JSON.stringify({
                timestamp: video.currentTime
            });
            console.log('sending timestamp from content script...', dataString)
            ws.send(dataString);
        }
    });

    console.log('loaded content script!')
}

window.addEventListener('load', init);

// if document is already loaded, run init
if (document.readyState === "complete") {
    init();
}