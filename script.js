$(function() {

  /*read local file*/
  const pickerOpts = {
    types: [
      {
        description: 'Texts(.txt)',
        accept: {
          'text/*': ['.txt']
        }
      }
    ],
    multiple: false,
  }

  let start = 0;
  let end = 0;
  $("#load").click(async function() {

    [fileHandle] = await window.showOpenFilePicker(pickerOpts);

    $("#message").html("Loading...");
    start = performance.now();			//track start
    const file = await fileHandle.getFile();
    const fileContents = await file.text();
    const fileCSV = csvTo2DArray(fileContents);
    console.log(fileCSV);
    objectToSortableTable(fileCSV);

    end = performance.now();			//track end
    const time = (end - start) | 0;
    $("#message").html("Data is successfully loaded in " + (time / 1000) + "s");
  });
  /* read local file end */

  /** convert csv txt to 2Darray */

  function csvTo2DArray(csvText) {
    csvText = csvText.replace(/\"([^\"]*?)\n([^\"]*?)\"/g, '"$1$2"');
    var rows = csvText.split(/\n|\r/g); //カバーしきれてないのでexcel側で何とかしてください
    var result = [["CC/AK番号", "品番", "品目テキスト", "M#", "製造拠点", "製造場所", "Production Method", "Lifecycle Phase", "Use Status(FL)", "Use Status(FR)", "Use Status(Synthetic)", "Item Number", "Item Description", "Recipe Division", "Use Category", "Create User", "Create User_", "担当者", "カテゴリー", "検索用フリーワード", "粉砕", "圧搾", "固液抽出", "液液抽出", "抽出溶剤", "水蒸気蒸留", "SCC", "超臨界", "分子蒸留", "単蒸留・精留", "固液分離", "活性炭処理", "樹脂処理", "酵素", "加熱", "濃縮(カラム以外)", "カラム濃縮", "殺菌", "除菌", "それ以外", "GF番号", "トラブル", "備考"]];
    for (var i = 12; i < rows.length; i++) {  //ハードコーディングしてます。構造変わった時注意。
      var cols = rows[i].split(',');
      if (cols.length == 43) {
        result.push(cols);
      }
    }

    return result;
  }
  /** convert end */

  /** convert object to sortable table */
  function objectToSortableTable(csv) {
    const tableContainer = $("#table-container");
    const table = $("<table>").attr("id", "sortableTable");
    const thead = $("<thead>");
    const tbody = $("<tbody>");

    let data_dc = JSON.parse(JSON.stringify(csv));  //dataをディープコピーして使う

    data_dc.forEach((item) => {
      //delete item["sample"];
    });

    tableContainer.html("");

    const headerRow = $("<tr>").addClass("sortable");
    Object.keys(data_dc[0]).forEach((key) => {
      const th = $("<th>").attr("cols", key).text(data_dc[0][key]);
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

    $("th").on("click", function() { tSort() });
  }
  /** convert end */

  function isDataToDisplay(item) {
    return true;
  }
});

function tSort() {
  //===============================================================
  //  ソート実行
  //===============================================================

  // 「ts_A_1」形式 [1]:A-昇順,D-降順  [2]:列番号
  var wSortKey = ["", "A", "1"];

  let wTABLE = $("#sortableTable")[0];
  let wTR = wTABLE.rows;
  let wItem = [];              // クリックされた列の値
  let wItemSort = [];              // クリックされた列の値（項目ソート後）
  let wMoveRow = [];              // 元の行位置（行削除考慮位置）
  var wNotNum = 0;               // 1 : 数字でない
  var wStartRow = 1; // ソートを開始する行はボタンの次の行

  // ------------------------------------------------------
  //  クリックされた列の値を取得する
  // ------------------------------------------------------
  for (var i = wStartRow; i < wTR.length; i++) {
    var j = i - wStartRow;
    wItem[j] = wTR[i].cells[wSortKey[2]].innerText.toString();

    if (wItem[j].match(/^[-]?[0-9,\.]+$/)) {
    } else {
      wNotNum = 1;
    }

  }
  // ソート用に配列をコピー
  wItemSort = wItem.slice(0, wItem.length);

  // ------------------------------------------------------
  //  列の値でソートを実行
  // ------------------------------------------------------
  if (wSortKey[1] == 'A') {
    if (wNotNum == 0) {
      wItemSort.sort(sortNumA);           // 数値で昇順
    } else {
      wItemSort.sort(sortStrA);           // 文字で昇順
    }
  } else {
    if (wNotNum == 0) {
      wItemSort.sort(sortNumD);           // 数値で降順
    } else {
      wItemSort.sort(sortStrD);           // 文字で降順
    }
  }

  // ------------------------------------------------------
  //  行の入れ替え順を取得
  //    ソート前後の列の値を比較して行の移動順を確定
  //    配列を削除して前詰めしている（移動時も同じ動き）
  // ------------------------------------------------------
  for (var i = 0; i < wItemSort.length; i++) {
    for (var j = 0; j < wItem.length; j++) {
      if (wItemSort[i] == wItem[j]) {
        wMoveRow[i] = j + wStartRow;
        wItem.splice(j, 1);
        break;
      }
    }
  }

  // ------------------------------------------------------
  //  ソート順に行を移動
  // ------------------------------------------------------
  for (var i = 0; i < wMoveRow.length; i++) {


    var wMoveTr = wTABLE.rows[wMoveRow[i]];                  // 移動対象
    var wLastTr = wTABLE.rows[wTABLE.rows.length - 1];   // 最終行

    // 最終行にコピーしてから移動元を削除
    wLastTr.parentNode.insertBefore(wMoveTr.cloneNode(true), wLastTr.nextSibling);
    wTABLE.deleteRow(wMoveRow[i]);

  }

  // ------------------------------------------------------
  //  クリックされたソートボタンの色付け
  // ------------------------------------------------------
  var elmImg = document.getElementsByClassName('tsImg');
  for (var i = 0; i < elmImg.length; i++) {

    if (elmImg[i].id == argObj.id) {
      elmImg[i].style.backgroundColor = '#ffff00';
    } else {
      elmImg[i].style.backgroundColor = '';
    }

  }

}

function sortNumA(a, b) {
  //===============================================================
  //  数字のソート関数（昇順）
  //===============================================================
  a = parseInt(a.replace(/,/g, ''));
  b = parseInt(b.replace(/,/g, ''));
  return a - b;
}

function sortNumD(a, b) {
  //===============================================================
  //  数字のソート関数（降順）
  //===============================================================
  a = parseInt(a.replace(/,/g, ''));
  b = parseInt(b.replace(/,/g, ''));
  return b - a;
}

function sortStrA(a, b) {
  //===============================================================
  //  文字のソート関数（昇順）
  //===============================================================
  a = a.toString();
  b = b.toString();
  if (a < b) { return -1; }
  else if (a > b) { return 1; }
  return 0;
}

function sortStrD(a, b) {
  //===============================================================
  //  文字のソート関数（降順）
  //===============================================================
  a = a.toString();
  b = b.toString();
  if (b < a) { return -1; }
  else if (b > a) { return 1; }
  return 0;
}
