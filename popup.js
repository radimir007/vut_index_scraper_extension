const subjectSelect = document.querySelector("header #subject")
const scrapeBtn = document.querySelector("header button")
const examsHolder = document.querySelector(".exams")
const resultsHolder = document.querySelector(".results")
const myPointsHolder = document.querySelector("#my-points")
const maxPointsHolder = document.querySelector("#max-points")
const completionHolder = document.querySelector("#completion")
const percentileHolder = document.querySelector("#percentile")
const avgPointsHolder = document.querySelector("#avg-points")
const resultsTable = document.querySelector("#results-table")
const contentHolder = document.querySelector(".content")
const noContentHolder = document.querySelector(".no-content")

const INDEX_URL = "https://www.vut.cz/studis/student.phtml?sn=el_index"

let subjects = [];
let examResults = []

resultsHolder.style.display = "none"

const addSubjects = () => {
  // clear old options
  subjectSelect.innerHTML = "";
  subjects = [];

  contentHolder.style.display = "block"
  noContentHolder.style.display = "none"

  // get subjects asynchronously
  chrome.runtime.sendMessage({ action: "getSubjects" }, (response) => {
    response.data.forEach(subject => {
      subjects.push(subject);
      subjectSelect.insertAdjacentHTML("beforeend", `
        <option value="${subject.details_link}">
          ${subject.subject_id}
        </option>
      `);
    });
  });
};

// only run once when the popup loads
document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({active: true, lastFocusedWindow: true})

  if (tab.url === INDEX_URL) {
    addSubjects()
  } else {
    showNoContent()

    noContentHolder.querySelector("a").addEventListener("click", (event) => {
      event.preventDefault()

      const url = event.target.href

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tabId = tabs[0].id;

        chrome.tabs.update(tabId, { url });

        // Listen for that tab to finish loading the new page
        const listener = (updatedTabId, changeInfo, updatedTab) => {
          if (updatedTabId === tabId && changeInfo.status === 'complete') {
            chrome.tabs.onUpdated.removeListener(listener); // clean up
            if (updatedTab.url === INDEX_URL) {
              addSubjects();
            }
          }
        };

        chrome.tabs.onUpdated.addListener(listener);
      });
    })
  }
});

const showNoContent = () => {
  contentHolder.style.display = "none"

  noContentHolder.insertAdjacentHTML("beforeend", `
    <h4>Nie ste na stránke indexu!</h4>
    <a href="${INDEX_URL}">Presmerovať na index</a>  
  `)
  noContentHolder.style.display = "block"
}

subjectSelect.addEventListener("change", () => {
  examsHolder.innerHTML = ""
  resultsHolder.style.display = "none"
  resultsTable.style.display = "none"
})

scrapeBtn.addEventListener("click", () => {
  const targetUrl = subjectSelect.value
  resultsHolder.style.display = "none"
  resultsTable.style.display = "none"

  chrome.runtime.sendMessage({ action: "openAndScrape", url: targetUrl });
})

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action == "scrapeResult")
  {
    examResults = message.data
    console.log(examResults)
    message.data.forEach((exam, index) => {
      examsHolder.insertAdjacentHTML("beforeend", `
        <li id="item-${index}">${exam.name}</li>  
      `)
    })
  }
})

examsHolder.addEventListener("click", (event) => {
  if (event.target.id.includes("item-")) {
    const examId = parseInt(event.target.id.split("-")[1])
    examsHolder.querySelectorAll("li").forEach((exam, id) => {
      if (id === examId) {
        exam.className = "active"
      } else {
        exam.className = ""
      }
    })

    const currentExam = examResults[examId]
    myPointsHolder.innerText = currentExam.my_points ?? "-"
    maxPointsHolder.innerText = currentExam.max_points ?? "-"
    completionHolder.innerText = currentExam.completion

    let percentile = 0;
    const allCount = parseInt(completionHolder.innerText)

    let allMarks = 0;

    resultsTable.innerHTML = ""

    currentExam.success_rate.forEach(item => {
      if (item.mark < currentExam.my_points) {
        percentile += item.count
      } else if (item.mark === currentExam.my_points) {
        percentile += item.count / 2
      }

      resultsTable.insertAdjacentHTML("beforeend", `
        <tr>
          <td>${item.mark}</td>
          <td colspan="3">${item.count}</td>
        </tr>  
      `)
      allMarks += item.mark * item.count
    })
    console.log("perc: " + percentile)
    percentileHolder.innerText = (percentile / allCount * 100) ? (percentile / allCount * 100).toFixed(2) + "%" : "-"
    avgPointsHolder.innerText = (allMarks / allCount) ? (allMarks / allCount).toFixed(2) : "-"

    resultsHolder.style.display = "grid"
    resultsTable.style.display = "table"
  }
})