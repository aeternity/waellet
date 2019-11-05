import { extractHostName, detectBrowser } from './popup/utils/helper';
global.browser = require('webextension-polyfill');

if(typeof navigator.clipboard == 'undefined') {
    // redirectToWarning(extractHostName(window.location.href),window.location.href)
} else {
    sendToBackground('phishingCheck',{ hostname:extractHostName(window.location.href), href:window.location.href })    
}

let aepp = browser.runtime.getURL("aepp.js")
fetch(aepp) 
.then(res => res.text())
.then(res => {
    injectScript(res)
})
browser.runtime.connect(browser.runtime.id)
// Subscribe from postMessages from page
window.addEventListener("message", (data) => {
    browser.runtime.sendMessage(data)
    let method = "pageMessage";
    if(typeof data.method != "undefined") {
        method = data.method
    }
    // Handle message from page and redirect to background script
    if(!data.hasOwnProperty("resolve")) {
        sendToBackground(method,data).then(res => {
            if (method == 'aeppMessage') {
                res.resolve = true
                res.method = method
                window.postMessage(res, "*")
            }
        })
    }
}, false)


// Handle message from background and redirect to page
// browser.runtime.onMessage.addListener(({ data, method }, sender, sendResponse) => {
//     if(data.method == 'phishingCheck') {
//         if(data.blocked) {
//             redirectToWarning(data.params.hostname,data.params.href,data.extUrl)
//         }
//     }
// })

// chrome.runtime.connect(browser.runtime.id)

const readyStateCheckInterval = setInterval(function () {
    if (document.readyState === "complete") {
        clearInterval(readyStateCheckInterval)

        // Handle message from background and redirect to page
        chrome.runtime.onMessage.addListener(({ data }, sender) => {
            if(data.hasOwnProperty("method") && data.method == 'phishingCheck') {
                if(data.blocked) {
                    redirectToWarning(data.params.hostname,data.params.href,data.extUrl)
                }
            } else {
                window.postMessage(data, '*')
            }
        })
    }
}, 10)


const redirectToWarning = (hostname,href,extUrl = '') => {
    window.stop()
    let extensionUrl = 'chrome-extension'
    if(detectBrowser() == 'Firefox') {
        extensionUrl = 'moz-extension'
    }
    let redirectUrl = ''
    if(extUrl != '') {
        redirectUrl = `${extUrl}phishing/phishing.html#hostname=${hostname}&href=${href}`
    }else {
        redirectUrl = `${extensionUrl}://${browser.runtime.id}/phishing/phishing.html#hostname=${hostname}&href=${href}`
    }
    window.location.href = redirectUrl
    return
}

const injectScript = (content) => {
    try {
      const container = document.head || document.documentElement
      const scriptTag = document.createElement('script')
      scriptTag.setAttribute('async', false)
      scriptTag.textContent = content
      container.insertBefore(scriptTag, container.children[0])
    } catch (e) {
      console.error('Waellet script injection failed', e)
    }
}

function sendToBackground(method, params) {
    return new Promise((resolve,reject) => {
        browser.runtime.sendMessage({
            jsonrpc: "2.0",
            id: params.id || null,
            method,
            params
        }).then((res) => {
            resolve(res)
        })
    })
}

// Render
function render(data) {
    // @TODO create list with sdks and his transaction with ability to accept/decline signing
}

function clickSign({target, value}) {
    const [sdkId, tx] = target.id.split['-'];
    signResponse({value, sdkId, tx})
}

function signResponse({value, sdkId, tx}) {
    sendToBackground('txSign', {value, sdkId, tx})
}

chrome.runtime.onConnect.addListener(async (port) => {
    console.log(port)
})

chrome.runtime.sendMessage({
    jsonrpc: "2.0",
})