const SLICE_NUMBER = 31;
const CUSTOM_ID = "matzi-yt-short-controller";

chrome.tabs.onUpdated.addListener(
    function(tabId, changeInfo, tab) {

        if (!tab.url.startsWith("https://www.youtube.com/shorts")) return;

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
    execScript(tab.id, addController);
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

function addController() { //working on page context

    if (document.getElementById("matzi-yt-short-controller")) return;

    const element = document.createElement("div");
    const mover = document.createElement("div");
    document.body.appendChild(element);
    element.appendChild(mover);
    document.body.style.height = "100vh";

    element.id = "matzi-yt-short-controller"; 
    element.classList.add("matzi")

    mover.id = "matzi-yt-mover";
    mover.classList.add("matzi");

    addElements();

    let mX, mY;

    mover.addEventListener("mousedown", dragMouseDown);

    function dragMouseDown(e) {
        mX = e.clientX;
        mY = e.clientY;

        document.addEventListener("mouseup", dragMouseUp);
        document.addEventListener("mousemove", elementDrag);

        document.body.style.cursor = "grabbing";
        mover.style.cursor = "grabbing";
    }

    function elementDrag(e) {

        const newY = (element.offsetTop - (mY - e.clientY));
        const newX = (element.offsetLeft - (mX - e.clientX));
    
        if (newY > 0 && newY + 222 < document.body.clientHeight) element.style.top = newY + "px";
        
        if (newX > 0 && newX + 252 < document.body.clientWidth) element.style.left = newX + "px";
    
    
        mX = e.clientX;
        mY = e.clientY;
    }

    function dragMouseUp() {
        document.removeEventListener("mouseup", dragMouseUp);
        document.removeEventListener("mousemove", elementDrag);

        document.body.style.cursor = "auto";
        mover.style.cursor = "grab";
    }

    function addElements() {

        const buttonsDiv = document.createElement("div");
        const timeDiv = document.createElement("div");

        element.append(buttonsDiv, timeDiv); //add the elements

        buttonsDiv.classList.add("matzi", "buttons-div");
        timeDiv.classList.add("matzi","time-div");

        addTimeCounter(timeDiv);
        inputElements(timeDiv);

    }

    function inputElements(elem) {
        const input = document.createElement("input");
        let video = document.querySelectorAll("video")[1];
        const timeText = document.getElementById("matzi-actualtime");
        const durationText = document.getElementById("matzi-totaltime");

        console.log(timeText);

        input.type = "range";
        input.min = "0";
        input.max = "100";
        input.step = "1";
        input.value = "0";

        input.id = "matzi-time-input";
        input.classList.add("matzi");
        elem.appendChild(input);
        
        try {
            video.addEventListener("timeupdate", addTimer);
        } catch (e) {
            const container = document.getElementById("page-manager");

            const observer = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    if (document.querySelectorAll("video")[1]) 
                    {
                        video = document.querySelectorAll("video")[1];
                        video.addEventListener("timeupdate", addTimer);
                        observer.disconnect();
                    }
                })
            })

            observer.observe(container, {childList: true, subtree: true});
        }

        input.addEventListener("input", (e) => {
            if (!video) {
                video = document.querySelectorAll("video")[1];
                video.removeEventListener("timeupdate", addTimer);
                video.addEventListener("timeupdate", addTimer);
            }
    
                updateVideo(input);
                timeText.innerText = Math.floor(video.currentTime);
             
        })

        function addTimer() {
            let time = video.currentTime;
            let percentage = time / video.duration;

            input.value = input.max * percentage;
            timeText.innerText = Math.floor(video.currentTime);
            durationText.innerText = parseInt(video.duration) || 0;
        }
    }

    /**
     * 
     * @param {HTMLDivElement} elem 
     */
    function addTimeCounter(elem) {
        const container = document.createElement("div");
        const actualTime = document.createElement("p");
        const totalTime = document.createElement("p");

        elem.appendChild(container);
        container.classList.add("time-display");

        container.append(actualTime, totalTime);

        actualTime.id = "matzi-actualtime";
        totalTime.id = "matzi-totaltime";

        actualTime.contentEditable = true;

        actualTime.addEventListener("focusin", (e) => {
            videoPause();
            const lastTime = parseFloat(actualTime.textContent);

            actualTime.addEventListener("focusout", handleFocus)
            document.addEventListener("keydown", handleKeys)

            /**
             * @param {FocusEvent} e
             */
            function handleFocus(e) {
                if (lastTime === parseFloat(actualTime.textContent)) return;

                const settedValue = parseInt(actualTime.textContent);
                const duration = getVideoDuration();

                settedValue < duration ? updateVideoByTime(settedValue) : actualTime.textContent = lastTime;

                actualTime.removeEventListener("focusout", handleFocus);
                document.removeEventListener("keydown", handleKeys)
                videoPlay();
            }

            /**
             * 
             * @param {KeyboardEvent} e 
             */
            function handleKeys(e) {
                if (e.key == " ") {
                    e.preventDefault(true);
                }

                if (e.key == "Enter") {
                    e.preventDefault(true);
                    actualTime.blur();
                }
            }
        })
    }

    /**
     * Change video duration from a input type range
     * @param {HTMLInputElement} input 
     */
    function updateVideo(input) {
        const video = document.querySelectorAll("video")[1];

        let min = input.min;
        let max = input.max;
        let value = input.value;

        video.currentTime = ((value - min) * 100 / (max - min)) / 100 * video.duration;
    }

    /**
     * Change video from a number (seconds)
     * @param {Number} time 
     */
    function updateVideoByTime(time) {
        const video = document.querySelectorAll("video")[1];

        if (time > video.duration) { 
            video.currentTime = video.duration;
            return;
        }

        video.currentTime = time;
    }

    function getVideoDuration() {
        const video = document.querySelectorAll("video")[1];

        return video.duration;
    }

    function videoPause() {
        const video = document.querySelectorAll("video")[1];

        video.pause();
    }

    function videoPlay() {
        const video = document.querySelectorAll("video")[1];

        video.play();
    }

} //working on page context

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