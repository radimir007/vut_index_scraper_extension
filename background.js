let subjects = [];

const getSubjectDetails = (link, sendResponse) => {
  const url = link;

  // create tab
  chrome.tabs.create({ url: url, active: false }, (tab) => {
    // wait for tab to finish loading
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === tab.id && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);

        // inject content script
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["contentScraper.js"],
        }, () => {
          // now content script will run and send us a message back
        });
      }
    });

    // listen for message from content script
    chrome.runtime.onMessage.addListener(function dataListener(response, sender2, sendResponse2) {
      if (response.action === "scrapeResult") {
        chrome.runtime.onMessage.removeListener(dataListener);
        sendResponse({ data: response.data });

        // optional: close tab after scraping
        chrome.tabs.remove(tab.id);
      }
    });
  });

  // keep message channel open
  return true;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.action) {
    case "storeSubjects":
      subjects = message.data;
      break;

    case "getSubjects":
      sendResponse({ data: subjects });
      break;
    
    case "openAndScrape":
      getSubjectDetails(message.url, sendResponse)
      break;
  }
});
