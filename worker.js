//const speaker = 5; // zunda sexy
const speaker = 3; // zunda normal 
const speedScale = 1.25;

chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
    fetch(encodeURI(`http://localhost:50021/audio_query?text=${data}&speaker=${speaker}`), {
        method: 'POST',
        headers: {
            Accept: "application/json",
        },
    })
    .then(response => {
        if (response.status != 200) {
            return Promise.reject(`failed audio_query\n${response.status}\n${response.url}`);
        }

        return response.json();
    })
    .then(json => {
        json.speedScale = speedScale;

        return fetch(`http://localhost:50021/synthesis?speaker=${speaker}`, {
            method: 'POST',
            headers: {
                Accept: "audio/wav",
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(json),
        });
    })
    .then(response => {
        if (response.status != 200) {
            return Promise.reject(`failed synthesize\n${response.status}\n${response.url}`);
        }

        return response.blob()
    })
    .then(blob => {
        let fr = new FileReader();

        fr.onload = () => {
            sendResponse({
                url: fr.result
            });
        };
    
        fr.readAsDataURL(blob); 
    })
    .catch(error => {
        sendResponse({
            err: error
        });
    });

    return true;
});

// https://github.com/VOICEVOX/voicevox_engine/issues/392
chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [1],
    addRules: [
        {
            id: 1,
            priority: 1,
            action: {
                type: 'modifyHeaders',
                requestHeaders: [
                    { 'header': 'Origin', 'operation': 'remove' },
                ],
            },
            condition: {
                urlFilter: 'localhost:50021/*',
                initiatorDomains: [chrome.runtime.id], // chrome-extension://{chrome.runtime.id}
            },
        },
    ],
});
