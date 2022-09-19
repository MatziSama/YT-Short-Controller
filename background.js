const SLICE_NUMBER = 31;
const CUSTOM_ID = "matzi-yt-short-controller";

chrome.tabs.onUpdated.addListener(
    function(tabId, changeInfo, tab) {

        if (!tab.url.startsWith("https://www.youtube.com/shorts")) {
            
            if (execScript(tab.id, removeController)) {
                removeController();
            }

            return;
        }

        injectScript(tab.id);
        injectController(tab.id);

        const keys = Object.keys(changeInfo);

        if (!keys.includes("url")) return;
      
        initialize(tab);
    }
  );

chrome.runtime.onMessageExternal.addListener(
    function(request, sender, sendResponse) {
      if (!request.type) return;
      if (request.type !== "reload") return;

      initialize();
    }
);

/**
 * Initialize the program
 * @param {Object} t Chrome tab object
 */
async function initialize(t) {
    
    let tab;

    if (t) tab = t;
    else {
        const shortTab = await chrome.tabs.query({active: true, url: "https://www.youtube.com/shorts/*"});
        if (!shortTab) throw new Error("There's no one shorts page");

        tab = shortTab[0];
    }

    function script() {
        const event = new CustomEvent("videoChanged");
        document.dispatchEvent(event);
    }
    
    execScript(tab.id, script);
    execScript(tab.id, injectCss, chrome.runtime.getURL("controller-style.css"));

}

/**
 * @param {String} id Tab's id to execute script
 * @param {Function} func Function to execute
 * @returns {Boolean} true if there's no erros on execution. Otherwise, false
 */
async function execScript(id, func, ...args) {
    if (!id || !func) return;
    if ((typeof id !== 'number') || (typeof func !== "function")) return;

    try {

        if (args.length === 0) {
            chrome.scripting.executeScript({
                target: {tabId: id},
                func: func
            })
        } else {
            chrome.scripting.executeScript({
                target: {tabId: id},
                func: func,
                args: args
            }) 
        }
        

        return true;
    } catch (error) {
        return false;
    }
}

async function getTab() {

    const res = await chrome.tabs.query({url: "https://www.youtube.com/shorts/*"});
    return res;

}

function removeController() {
    document.getElementById("matzi-yt-short-controller").remove();
}

/**
 * 
 * @param {String} url 
 */
function injectCss(url) {

    if (document.getElementById("matzi-yt-controller-link")) return;

    const style = document.createElement("link");
    document.head.appendChild(style);
    
    style.id = "matzi-yt-controller-link";
    style.rel = "stylesheet";
    style.href = url;
}

function injectScript(id) {

    function script(url) {
        if (document.querySelector("#matzi-reload-script")) return;

        const script = document.createElement("script");
        document.head.appendChild(script);

        script.src = url;
        script.id = "matzi-reload-script"
    }

    execScript(id, script, chrome.runtime.getURL("script.js"))

}

function injectController(id) {

    function script(url) {
        if (document.querySelector("#matzi-controller-script")) return;
        
        const script = document.createElement("script");
        document.head.appendChild(script);
        
        script.src = url;
        script.id = "matzi-controller-script"
    }

    execScript(id, script, chrome.runtime.getURL('controller.js'));

}

function isControllerUp() {
    if (document.querySelector("#matzi-yt-short-controller")) return true;
    else return false;
}