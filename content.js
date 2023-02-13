console.log("hello edge extension! with worker");

let texts = [];
let textBuff = "";
let prevRawText = "";
let prevText = "";
let audio = null;
let audio_urls = [];

const playAudio = (url) => {
    if(audio != null) {
        audio_urls.push(url);
        return;
    }

    audio = new Audio(url);

    audio.onended = () => {
        window.URL.revokeObjectURL(url);
        audio = null;

        if(audio_urls.length > 0) {
            playAudio(audio_urls.shift());
        }
    }

    audio.play();
};

const getLastNode = (nodes) => {
    if (nodes.length == 0) {
        return null;
    } else {
        return nodes[nodes.length - 1];
    }
};

const getElementIncludeShadowRoot = (selectors, root = null) => {
    let target = root ? document.querySelector(root) : document;

    if (target == null) {
        return null;
    }

    for (let i = 0; i < selectors.length; ++i) {
        const selector = selectors[i];
        const elem = getLastNode(target.querySelectorAll(selector));
        if (elem == null) {
            return null;
        }

        if (i != selectors.length - 1) {
            target = elem.shadowRoot;
            if (target == null) {
                return null;
            }
        } else { // last selector            
            return elem;
        }
    }

    return null;
}

const getTextWithout = (orig, selectors) => {
    let elem = orig.cloneNode(true);

    for(selector of selectors) {
        elem.querySelectorAll(selector).forEach(n => {
            n.remove();
        });
    }

    return elem.textContent;
}

const poshText = (text) => {
    textBuff += text;
};

const observeChat = () => {
    let chat = getElementIncludeShadowRoot([
        ".cib-serp-main",
        "#cib-conversation-main",
        "cib-chat-turn",
        "cib-message-group[source='bot']",
        "cib-message[type='text']",
        ".ac-textBlock"
    ], "#b_sydConvCont");

    if (chat != null) {
        let rawText = chat.innerText;
        let text = getTextWithout(chat, ["sup"]);

        if(rawText != prevRawText) {
            if(prevText.length > 0 && rawText.startsWith(prevRawText)) { 
                poshText(text.substring(prevText.length - 1));
            } else {
                poshText(text);
            }
    
            prevRawText = rawText;
            prevText = text;
        }
    }
};

const queryVoice = (text) => {
    if(text == null || text.length == 0) {
        return;
    }

    chrome.runtime.sendMessage(
        text,
        (response) => {
            if(response.url != null) {
                playAudio(response.url);
            } else {
                console.log(response);
            }
        }
    );
};

const observeText = () => {
    if(textBuff.length == 0) {
        return;
    }

    let index = Math.max(
        textBuff.lastIndexOf("。"), 
        textBuff.lastIndexOf("？")
    );

    if(index > 0) {
        queryVoice(textBuff.substring(0, index + 1));
        textBuff = textBuff.substring(index + 1);

    }
};

setInterval(observeChat, 500);
setInterval(observeText, 600);

console.log("Start observe");