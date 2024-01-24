let data;

document.addEventListener("DOMContentLoaded", function () {
  // CSVファイルのパス
  const csvFilePath = "./your-file.csv";

  function fetchAndParseCSV(csvFilePath) {
    return fetch(csvFilePath)
      .then((response) => response.text())
      .then((csvData) => {
        return new Promise((resolve, reject) => {
          Papa.parse(csvData, {
            header: true,
            skipEmptyLines: true,
            complete: (result) => {
              resolve(result.data);
            },
            error: (error) => {
              reject(error.message);
            },
          });
        });
      });
  }

  // CSVファイルを取得してオブジェクトに変換する
  fetchAndParseCSV(csvFilePath)
    .then((raw_data) => {
      data = raw_data;
      objectToSortableTable();
    })
    .catch((error) => console.error("Fatal Error:", error));
  $(`#disp-options input[type="checkbox"]`).on("change", function () {
    objectToSortableTable();
  });
});

// JavaScriptオブジェクトをHTMLのソート可能なテーブルに変換する関数 (jQuery DataTablesを使用)
function objectToSortableTable() {
  const tableContainer = $("#table-container");
  const table = $("<table>").attr("id", "sortable-table").addClass("display");
  const thead = $("<thead>");
  const tbody = $("<tbody>");

  let data_dc = JSON.parse(JSON.stringify(data));  //dataをディープコピーして使う

  data_dc.forEach((item) => {
    //delete item["sample"];
  });

  tableContainer.html("");

  const headerRow = $("<tr>");
  Object.keys(data_dc[0]).forEach((key) => {
    const th = $("<th>").text(key);
    headerRow.append(th);
  });
  thead.append(headerRow);

  data_dc.forEach((item) => {
    if (isDataToDisplay(item)) {
      const tr = $("<tr>");
      Object.values(item).forEach((value) => {
        const td = $("<td>").text(value);
        tr.append(td);
      });
      tbody.append(tr);
    }
  });
  table.append(thead);
  table.append(tbody);
  tableContainer.append(table);

  // DataTablesを有効にする
  new DataTable("#sortable-table");
}

function isDataToDisplay(item) {
  if ($(`#disp-${item}`).prop("checked")) {
    return true;
  }
  return false;
}
