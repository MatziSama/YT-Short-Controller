class ControllerBase {

    #video

    constructor() {
        this.#init();

        document.addEventListener("videoChanged", this.updateValues);
    }

    #init() {
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                const vid = document.querySelector("video.video-stream.html5-main-video");
                if (vid && !this.#video) {

                    if (isNaN(vid.duration)) return;

                    this.#video = true;
                    this.updateValues();

                    observer.disconnect();
                }
            })
        })

        observer.observe(document.body, {childList: true, subtree: true});
    }

    updateValues() {}

}

class Controller extends ControllerBase {

    #input
    #mainContainer
    #mover
    #actualTime
    #duration

    constructor() {
        super();
        this.#assemble();
    }

    #assemble() {
        let timeInput;
        let mover;
        let actual;
        let total;
        let mainContainer;

        mainContainer = new MakeElement("div", {id: "matzi-yt-short-controller", class: ["matzi"]});
        
        document.body.append(mainContainer);
        mainAssemble();
        moverBehavoiur();
        
        function mainAssemble() {
            mover = new MakeElement("div", {id: "matzi-yt-mover", class: ["matzi"]})
            const topDiv = new MakeElement("div", {class: ["matzi", "buttons-div"]})
            const timeContainer = new MakeElement("div", {class: ["matzi", "time-div"]})

            mainContainer.append(mover, topDiv, timeContainer);
            timerAssemble(timeContainer);
        }

        function timerAssemble(parent) {
            const timeShower = new MakeElement("div", {class: ["time-display"]})
            timeInput = new MakeElement("input", {id: "matzi-time-input", class: ["matzi"]})

            parent.append(timeShower, timeInput);

            timeInput.type = "range";
            timeInput.min = 0;
            timeInput.max = 100;
            timeInput.step = 1;

            timeNumbersAssemble(timeShower);
        }

        function timeNumbersAssemble(parent) {
            actual = new MakeElement("p", {id: "matzi-actualtime"})
            total = new MakeElement("p", {id: "matzi-totaltime"})

            parent.append(actual, total);

            actual.contentEditable = true;
        }

        function moverBehavoiur() {

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
        
                const newY = (mainContainer.offsetTop - (mY - e.clientY));
                const newX = (mainContainer.offsetLeft - (mX - e.clientX));
            
                if (newY > 0 && newY + 222 < document.body.clientHeight) mainContainer.style.top = newY + "px";
                
                if (newX > 0 && newX + 252 < document.body.clientWidth) mainContainer.style.left = newX + "px";
            
            
                mX = e.clientX;
                mY = e.clientY;
            }
        
            function dragMouseUp() {
                document.removeEventListener("mouseup", dragMouseUp);
                document.removeEventListener("mousemove", elementDrag);
        
                document.body.style.cursor = "auto";
                mover.style.cursor = "grab";
            }

        }
    }

}

/**
 * @returns {HTMLElement}
 */
class MakeElement {

    #id
    #classes
    #element

    /**
     * 
     * @param {Element} kind 
     * @param {object} object
     * @example new MakeElement("div", {id:"newElement", class: ["aClass", "anotherClass"]})
     */
    constructor(kind, object) {
        const spaceError = new Error("No spaces allowed");
        if (!kind) throw new Error("Kind of element required");
        if (kind.includes(" ")) throw spaceError;

        try {
            this.#element = document.createElement(kind);
        } catch (e) {
            console.error(e)
            return;
        }

        if (object) {
            if (object.id) {
                this.#id = object.id;
                if (typeof this.#id !== "string") throw new Error("Id must be a string");
                if (this.#id.includes(" ")) throw spaceError;

                this.#element.id = this.#id;
            }
            if (object.class) {
                this.#classes = object.class;
                if (typeof this.#classes !== "object") throw new Error("Class must be entered as array")
                this.#classes.forEach(cls => {
                    if (cls.includes(" ")) throw spaceError;
                    this.#element.classList.add(cls);
                });

            }
        }

        return this.#element;
    }

}

const controller = new Controller();