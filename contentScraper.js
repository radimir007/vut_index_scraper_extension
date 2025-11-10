(() => {
    // your scraping logic here
    const firstTableWrapper = document.querySelectorAll(".main-content > .table-responsive-box")[0]
    const firstTable = firstTableWrapper.querySelector("table")

    let data = []

    firstTable.querySelectorAll("tr").forEach(row => {
        if (row.childElementCount > 1 && (row.childNodes[2].innerText != '' || row.childNodes[3].innerText != '') && row.childNodes[1].innerText == '')
        {
            const current = {
                name: row.childNodes[0].innerText,
                max_points: parseFloat(row.childNodes[3].innerText),
                my_points: null,
                completion: null,
                success_rate: null
            }

            if (row.childNodes[4].innerText != "") {
                current.my_points = parseFloat(row.childNodes[4].innerText)
            } else {
                let nextElem = row.nextSibling
                if (nextElem.nextSibling) {
                    while (nextElem.childElementCount === 1 && nextElem.nextSibling) {
                        nextElem = nextElem.nextSibling
                    }
                    
                    if (nextElem.childElementCount > 1) {
                        current.my_points = parseFloat(nextElem.childNodes[4].innerText)
                    }
                }
                
            }

            data.push(current)
        }
    })

    index = 0

    const graphs = document.querySelectorAll('[id^="js-graph-"]');

    graphs.forEach(graph => {
        if (index < data.length) {

            const columnData = graph.querySelectorAll("svg > g:nth-of-type(2) > g:nth-of-type(4) > g")
            console.log(columnData)
            let temp = []

            const yAxis = [...graph.querySelectorAll("svg > g:nth-of-type(2) > g:nth-of-type(3) > g")]
            const yAxisFilter = yAxis.filter((el) => el.querySelector("text").getAttribute("text-anchor") === "end")

            columnData.forEach((column, i) => {
                temp.push({
                    mark: parseInt(yAxisFilter[i].firstChild.textContent), 
                    count: parseInt(column.querySelector("g > g > text").innerHTML)
                })
                data[index].completion += temp[i].count
            })
        
            data[index++].success_rate = temp
        }
    })

  // send the data back to background
  chrome.runtime.sendMessage({ action: "scrapeResult", data });
})();
