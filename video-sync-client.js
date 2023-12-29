let ws;
let video;
let canBroadcastPlay = true;
let canBroadcastPause = true;
console.log('content script injected!');

function sendMessage(msg) {
    ws?.send(JSON.stringify(msg));
}

function broadcastPlay() {
    if (!canBroadcastPlay) {
        return;
    }

    console.log('Broadcasting play...')
    sendMessage({ timestamp: video?.currentTime });
}

function broadcastPause() {
    if (!canBroadcastPause) {
        return;
    }

    console.log('Broadcasting pause...')
    sendMessage({ pause: true });
}

function broadcastVideoLoaded() {
    console.log('Broadcasting ready...')
    sendMessage({ ready: true });
}

function joinSession(sessionName) {
    console.log(`joining session "${sessionName}"`);
    sendMessage({ sessionName });
}

function init() {
    if (ws) {
        ws.close();
    }
    
    ws = new WebSocket('ws://71.192.170.86:9192');
    video = document.querySelector('video');

    if (!video) {
        console.log('no video found')
        return;
    }

    video.addEventListener('pause', broadcastPause);
    video.addEventListener('play', broadcastPlay);
    video.addEventListener('canplaythrough', broadcastVideoLoaded);

    ws.onmessage = ev => {
        let json;
        try {
            json = JSON.parse(ev.data);
        } catch (e) {
            console.error('Failed to parse JSON');
            return;
        }

        if ('timestamp' in json) {
            // while we're seeking, we can't broadcast play or pause
            canBroadcastPlay = canBroadcastPause = false;
            // pause video, set current time to given timestamp, then play
            console.log('seeking to timestamp...');

            video.pause();
            video.currentTime = json.timestamp;

            if (video.readyState > 3) {
                // if video is already ready (no buffering needed) just broadcast
                broadcastVideoLoaded();
            }
        } else if (json.play) {
            video.play();
            console.log('playing!');
            canBroadcastPause = true;
        } else if (json.pause) {
            video.pause();
            canBroadcastPlay = true;
        }
    };

    console.log('done initializing!');
}

window.addEventListener('load', init);

browser.runtime.onMessage.addListener(sessionName => {
    // message is always session name
    joinSession(sessionName);
});

// if document is already loaded, run init
if (document.readyState === "complete") {
    init();
}