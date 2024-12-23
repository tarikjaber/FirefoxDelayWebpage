const defaults = {
    color: "#fff",
    textColor: "#808080",
    time: 7,
    text: "default text",
    fontSize: "2vw",
    runOn: String.raw`hckrnews\.com
    reddit\.com
    facebook\.com
    news\.ycombinator\.com
    youtube\.com`,
    delayLinks: false,
};

browser.storage.sync.get("settings").then(onGot, writeError);

let timeout;

function onGot(item) {
    const settings = item.settings || defaults;
    const color = settings.color ?? defaults.color;
    const textColor = settings.textColor ?? defaults.textColor;
    const time = settings.time ?? defaults.time;
    const text = settings.text ?? defaults.text;
    const fontSize = settings.fontSize ?? defaults.fontSize;
    const runOn = settings.runOn ?? defaults.runOn;
    const delayLinks = settings.delayLinks ?? defaults.delayLinks;

    const urlMatchesSettings = (url) =>
        runOn
            .split("\n")
            .map((s) => s.trim())
            .find((pattern) => RegExp(pattern).test(url));

    if (!urlMatchesSettings(document.URL) && (!delayLinks || !urlMatchesSettings(document.referrer))) {
        return;
    }

    function removeBlockingDiv() {
        timeout = setTimeout(() => {
            if (document.visibilityState === "visible") {
                document.getElementById("__dly_id__").remove();
                document.removeEventListener(
                    "visibilitychange",
                    handleVisibilityChange,
                    false
                );
            }
        }, time);
    }

    function handleVisibilityChange() {
        if (document.visibilityState === "visible") {
            removeBlockingDiv();
        } else {
            clearTimeout(timeout);
        }
    }

    const blocking_div = document.createElement("div");
    blocking_div.id = "__dly_id__";
    blocking_div.style.cssText = `background-color:${color};
    font-size:${fontSize};
    padding-top:7vh;
    position:fixed;
    top:0;
    left:0;
    width:100vw;
    height:10000px;
    text-align:center;
    z-index:999999999;
    line-height:normal;
    font-weight: normal;
    color:${textColor};`;
    blocking_div.appendChild(
        document.createTextNode(
            text === "default text"
            ? `Wait ${
                Math.round(time / 100) / 10
            } seconds for the page to load`
            : text
        )
    );
    document.documentElement.appendChild(blocking_div);

    document.addEventListener("visibilitychange", handleVisibilityChange, false);

    function handleYtPageChange() {
        const el = document.getElementById("__dly_id__");
        if (!el) {
            // on full reload el is already mounted
            document.documentElement.appendChild(blocking_div);
            setTimeout(() => {
                document.getElementById("__dly_id__").remove();
            }, time);

            // pause video to prevent audio in background
            const v = document.querySelector("video");
            if (v) {
                v.pause();
            }
        }
    }
    if (
        urlMatchesSettings("youtube.com") &&
        document.URL.includes("youtube.com")
    ) {
        window.addEventListener("yt-page-data-updated", handleYtPageChange, false);
    }

    if (!document.URL.includes("youtube.com")) {
        // an attempt to handle SPA page-changes
        lastSpaPath = new URL(document.URL).pathname;

        document.addEventListener(
            "mouseup",
            () =>
            setTimeout(() => {
                if (new URL(document.URL).pathname !== lastSpaPath) {
                    lastSpaPath = new URL(document.URL).pathname;
                    const el = document.getElementById("__dly_id__");
                    if (!el) {
                        document.documentElement.appendChild(blocking_div);
                        setTimeout(() => {
                            document.getElementById("__dly_id__").remove();
                        }, time);
                    }
                }
            }, 300),
            true
        );
    }

    removeBlockingDiv();
}

let lastSpaPath = "";

function writeError(error) {
    console.log(
        `The DelayWebpage had an error, please open an issue at https://github.com/tarikjaber/FirefoxDelayWebpage. The error was: \n\n ${error}`
    );
}
