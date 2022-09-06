const perfEntries = performance.getEntriesByType("navigation");
const [p] = perfEntries;

if(chrome && chrome.runtime && chrome.runtime.sendMessage) {
    chrome.runtime.sendMessage(
      "bgcbofohalbnkefbklialogedhdfjmle",
      {type: p.type}
    );
  }