const predmety = [];


function saveSubjects() {
  const indexy = document.querySelectorAll(".main-content > .table-responsive-box");

  indexy.forEach(item => {
    const tableBody = item.querySelector("table tbody");
    tableBody.querySelectorAll("tr").forEach(node => {
      const current = {
        subject_id: node.childNodes[1].innerText,
        subject_name: node.childNodes[3].innerText,
        details_link: node.childNodes[3].firstChild.href,
        credits: parseInt(node.childNodes[9].innerText),
        details: {}
      };
      predmety.push(current);
    });
  });

  // Store subjects in background
  chrome.runtime.sendMessage({ action: "storeSubjects", data: predmety });
}

if (location.href == "https://www.vut.cz/studis/student.phtml?sn=el_index")
{
  // Wait for page fully loaded
  if (document.readyState === "complete") {
    saveSubjects();
  } else {
    window.addEventListener("load", () => {
      saveSubjects();
    });
  }
}
