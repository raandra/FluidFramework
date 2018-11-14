import { globalConfig } from "./globalConfig";
import { settingCollection } from "./pragueServerSettings";

function getCurrentTab(callback) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs && tabs.length !== 0) { callback(tabs[0]); }
    });
}
function sendCommand(commandValue: string) {
    getCurrentTab((tab) => {
        chrome.runtime.sendMessage({
            background: background.checked,
            batchOp: batchOp.checked,
            command: commandValue,
            docId: docName.value,
            server: serverDropDown.value,
            tab,
        });
        window.close();
    });
}

const docName = document.getElementById("doc_name") as HTMLInputElement;
const background = document.getElementById("background_cb") as HTMLInputElement;
const batchOp = document.getElementById("batch_ops_cb") as HTMLInputElement;
const fullView = document.getElementById("full_view_cb") as HTMLInputElement;
const debugView = document.getElementById("debug_view_cb") as HTMLInputElement;
const tabBtn = document.getElementById("tab_btn") as HTMLInputElement;
const jsonBtn = document.getElementById("json_btn") as HTMLInputElement;
const pragueMapBtn = document.getElementById("prague_btn") as HTMLInputElement;
const pragueFlatMapBtn = document.getElementById("prague_flat_btn") as HTMLInputElement;
const streamStartBtn = document.getElementById("prague_stream_start_btn") as HTMLInputElement;
const streamStopBtn = document.getElementById("prague_stream_stop_btn") as HTMLInputElement;
const serverDropDown = document.getElementById("server_dd") as HTMLSelectElement;

for (const i of Object.keys(settingCollection)) {
    const option = document.createElement("option") as HTMLOptionElement;
    option.value = i;
    option.text = i;
    serverDropDown.add(option);
}

serverDropDown.value = globalConfig.defaultServer;

// Initialize button command
tabBtn.onclick = () => sendCommand("Tab");
jsonBtn.onclick = () => sendCommand("JSON");
pragueMapBtn.onclick = () => sendCommand("PragueMap");
pragueFlatMapBtn.onclick = () => sendCommand("PragueFlatMap");
streamStartBtn.onclick = () => sendCommand("PragueStreamStart");
streamStopBtn.onclick = () => sendCommand("PragueStreamStop");
document.getElementById("prague_view_btn").onclick = () =>
    window.open(chrome.runtime.getURL("pragueView.html") + "?full=" + fullView.checked + "&debug="
        + debugView.checked + "&server=" + serverDropDown.value + "&docId=" + docName.value);

const bgPage = chrome.extension.getBackgroundPage();
const streamState = bgPage ? (bgPage.window as any).getStreamingState() : undefined;
if (streamState && streamState.enabled) {
    streamStartBtn.style.visibility = "hidden";

    docName.disabled = true;
    background.disabled = true;
    batchOp.disabled = true;

    docName.value = streamState.docId;
    background.checked = streamState.background;
    batchOp.checked = streamState.batchOp;

    serverDropDown.value = streamState.server;

    getCurrentTab((tab) => {
        document.getElementById("status").innerHTML = (streamState.pending ? "[PENDING] " : "") +
            "Streaming in tab " + streamState.tabId + (tab.id === streamState.tabId ? " (Current)" : "");
    });
} else {
    streamStopBtn.style.visibility = "hidden";

    // Sync from local storage
    chrome.storage.local.get("docName", (items) => {
        if (items.docName) {
            docName.value = items.docName;
        }
    });
    chrome.storage.local.get("background", (items) => {
        if (items.background !== undefined) {
            background.checked = items.background;
        }
    });
    chrome.storage.local.get("batchOp", (items) => {
        if (items.batchOp !== undefined) {
            batchOp.checked = items.batchOp;
        }
    });

    chrome.storage.local.get("server", (items) => {
        if (items.server !== undefined && settingCollection[items.server] !== undefined) {
            serverDropDown.value = items.server;
        }
    });
}

chrome.storage.local.get("fullView", (items) => {
    if (items.fullView !== undefined) {
        fullView.checked = items.fullView;
    }
});

chrome.storage.local.get("debugView", (items) => {
    if (items.debugView !== undefined) {
        debugView.checked = items.debugView;
    }
});

// Hook up input sync
docName.addEventListener("input", () => {
    chrome.storage.local.set({ docName: docName.value });
});
background.addEventListener("click", () => {
    chrome.storage.local.set({ background: background.checked });
});
batchOp.addEventListener("click", () => {
    chrome.storage.local.set({ batchOp: batchOp.checked });
});
fullView.addEventListener("click", () => {
    chrome.storage.local.set({ fullView: fullView.checked });
});
debugView.addEventListener("click", () => {
    chrome.storage.local.set({ debugView: debugView.checked });
});
serverDropDown.addEventListener("change", () => {
    chrome.storage.local.set({ server: serverDropDown.value });
});
