class Controller {

    #video

    constructor() {
        this.#init();

        document.addEventListener("videoChanged", this.updateControls);
    }

    #init() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (document.querySelector("video.video-stream.html5-main-video") && !this.#video) {
                    this.#video = document.querySelector("video.video-stream.html5-main-video");
                    observer.disconnect();
                    return;
                }
            })
        })

        observer.observe(document.body, {childList: true, subtree: true});
    }

    /**
     * 
     * @param {HTMLVideoElement} video 
     */
    update(video) {
        this.#video = video;
    }

    updateControls() {
        console.log("Updated controls!");
    }

    getVideo() {
        return this.#video;
    }

}

const controller = new Controller();