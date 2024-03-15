let gMasterHead = [];
let gMasterData = [];
let gDisplayedData = [];

let gStats;

$(function () {
  getStatusFromLocalStorage();

  /*read csv file automatically (CORS policy legal)*/
  async function autoLoadCSVData() {
    const _RESOPNSE = await fetch("./データ抽出用.csv");
    const _FILE_CONTENTS = await _RESOPNSE.text();
    gMasterData = csvTo2DArray(_FILE_CONTENTS);
    gMasterHead = JSON.parse(JSON.stringify(gMasterData[0]));
    gMasterData.shift();
    gDisplayedData = JSON.parse(JSON.stringify(gMasterData));
    console.log(gMasterData);
    initialzeTableContainer();
    generatePagination();
    displayNewTable();
  }
  autoLoadCSVData();

  /*read local file manually*/
  const PICKER_OPTS = {
    types: [
      {
        description: "Texts(.txt)",
        accept: {
          "text/*": [".txt"],
        },
      },
    ],
    multiple: false,
  };

  $("#load").on("click", async function () {
    let _start = 0;
    let _end = 0;

    [fileHandle] = await window.showOpenFilePicker(PICKER_OPTS);

    $("#message").html("Loading...");
    _start = performance.now(); //track start
    const _FILE = await fileHandle.getFile();
    const _FILE_CONTENTS = await _FILE.text();
    gMasterData = csvTo2DArray(_FILE_CONTENTS);
    gMasterHead = JSON.parse(JSON.stringify(gMasterData[0]));
    gMasterData.shift();
    gDisplayedData = JSON.parse(JSON.stringify(gMasterData));
    console.log(gMasterData);

    /* initialize and display table when file successfully loaded */
    initialzeTableContainer();
    generatePagination();
    displayNewTable();

    _end = performance.now(); //track end
    const _TIME = (_end - _start) | 0;
    $("#message").html("Data loaded successfully in " + _TIME / 1000 + "s");
  });
  /* read local file end */

  $("#search-in").on("change", function () {
    searchAll();
  });
});

/* csvTo2DArray(csvText)
 * convert csv txt to 2Darray
 * csvText: Loaded csvFile [string]
 */
function csvTo2DArray(csvText) {
  let _result = [];
  const _ROWS = csvText.split(/\n/g);
  for (var i = 0; i < _ROWS.length; i++) {
    const _COLS = _ROWS[i].split(",");
    if (_COLS[0]) {
      _result.push(_COLS);
    }
  }
  return _result;
}

/* initializeTableContainer()
 * #table-container内にtable,theadを生成する
 */
function initialzeTableContainer() {
  const _ELEM_DIV_TABLE_CONTAINER = $("#table-container");
  _ELEM_DIV_TABLE_CONTAINER.empty(); //初期化

  const _ELEM_TABLE = $("<table>").attr("id", "sortableTable");
  const _ELEM_THEAD = $("<thead>");
  const _ELEM_TR_HEADER_ROW = $("<tr>").addClass("sortable");

  //列検索の生成
  Object.keys(gMasterHead).forEach((key) => {
    const _ELEM_TH = $("<th>").attr("cols", key).text(gMasterHead[key]);
    const _ELEM_TH_CTRL = $(`<div class="single-ctrl">`);
    _ELEM_TH_CTRL.append(`<div class="indicator"></div>`);
    const _ELEM_DIV_MODAL = $(`<div class="single-filter-modal"></div>`);
    _ELEM_DIV_MODAL.append(
      `<input type="text" class="search-col-in" placeholder="この列を検索..." />`
    );
    _ELEM_DIV_MODAL.append(`<button class="reset-filters">リセット</button>`);
    _ELEM_DIV_MODAL.append(`<div class="single-filter-checkboxes"></div>`);

    const _ELEM_A_FILTER = $(`<a class="single-filter" tabindex="0"></a>`);
    _ELEM_A_FILTER.append(_ELEM_DIV_MODAL);
    _ELEM_TH_CTRL.append(_ELEM_A_FILTER);
    _ELEM_TH.append(_ELEM_TH_CTRL);
    _ELEM_TR_HEADER_ROW.append(_ELEM_TH);
    const _ELEM_LABEL = $("<label>").attr("cols", key);
    const _ELEM_INPUT_CHECKBOX = $(`<input type="checkbox">`)
      .attr("cols", key)
      .prop("checked", "true");
    _ELEM_LABEL.append(_ELEM_INPUT_CHECKBOX);
    _ELEM_LABEL.append(gMasterHead[key]);
    $("#toggle-cols-modal-div").append(_ELEM_LABEL);
  });
  //列検索の生成ここまで

  _ELEM_THEAD.append(_ELEM_TR_HEADER_ROW);
  _ELEM_TABLE.append(_ELEM_THEAD);
  _ELEM_DIV_TABLE_CONTAINER.append(_ELEM_TABLE);

  /*initialize checkbox-filter*/
  $(`div.single-filter-checkboxes`).empty(); //これいらない
  $.each($(`div.single-filter-checkboxes`), function (index, elem) {
    const _COLUMN_SET = new Set();
    gMasterData.forEach((rows) => {
      _COLUMN_SET.add(rows[index]);
    });
    const _COLUMN_ARRAY = Array.from(_COLUMN_SET).sort();
    _COLUMN_ARRAY.forEach((val) => {
      const _ELEM_LABEL = $("<label>");
      const _ELEM_INPUT_CHECKBOX = $(`<input type="checkbox">`)
        .attr("value", val)
        .prop("checked", "true");
      _ELEM_LABEL.append(_ELEM_INPUT_CHECKBOX);
      _ELEM_LABEL.append(val);
      $(elem).append(_ELEM_LABEL);
    });
  });

  /* attach on-events */
  $(`#toggle-cols-modal input[type="checkbox"]`).off();
  $(`#toggle-cols-modal input[type="checkbox"]`).on("change", function () {
    toggleVisibleColumn();
  });
  $(`th a.single-filter input`).on("change", function () {
    searchAll();
  });
  $(`th a.single-filter button.reset-filters`).on("click", function () {
    $(this).parent().find(`input[type="text"]`).val("");
    $.each($(this).parent().find(`input[type="checkbox"]`), function (i, e) {
      $(e).prop("checked", "true");
    });
    searchAll();
  });
}

/* convert object to sortable table
 * tbodyのみを再生成する
 */
function displayNewTable() {
  const _ELEM_TABLE = $("table#sortableTable");
  $("table#sortableTable tbody").remove();
  const _ELEM_TBODY = $("<tbody>");

  const _ELEM_INPUT_RADIO_PAGINATION = $(
    "div#table-pagination input[type='radio']"
  );
  let index = _ELEM_INPUT_RADIO_PAGINATION.index(
    _ELEM_INPUT_RADIO_PAGINATION.filter(":checked")
  );
  for (
    i = index * 20;
    i < Math.min(index * 20 + 20, gDisplayedData.length);
    i++
  ) {
    const _ITEM = gDisplayedData[i];
    const _ELEM_TR = $("<tr>");
    Object.values(_ITEM).forEach((value) => {
      const td = $("<td>").text(value);
      _ELEM_TR.append(td);
    });
    _ELEM_TBODY.append(_ELEM_TR);
  }
  _ELEM_TABLE.append(_ELEM_TBODY);
  toggleVisibleColumn();

  $("div.indicator").off();

  $("div.indicator").on("click", function () {
    gSortCol = +$(this).parent().parent().attr("cols");
    tSort($(this).parent().parent());
  });
  $(`tr`).on("dblclick", function () {
    showDetailModal(this);
  });
}

function generatePagination() {
  $("div#table-pagination").empty();
  const _PAGE_COUNT = ((gDisplayedData.length / 20) | 0) + 1;
  $("div#table-pagination").append(`<button id="rev-10">\<\<</button>`);
  for (i = 0; i < _PAGE_COUNT; i++) {
    $("div#table-pagination").append(
      `<label id="page-${i + 1}"><input type="radio" name="radio-pagination"${
        i == 0 ? " checked" : ""
      }>${i + 1}</label>`
    );
  }
  $("div#table-pagination").append(`<button id="fwd-10">\>\></button>`);
  $("div#table-pagination label:first").after(
    `<span id="dot-first" class="dot">...</span>`
  );
  $("div#table-pagination label:last").before(
    `<span id="dot-last" class="dot">...</span>`
  );
  displayPagination();
  $("div#table-pagination label").on("click", function () {
    displayPagination();
  });
}

function displayPagination() {
  let _radios = $("div#table-pagination input[type='radio']");
  let _si = _radios.index(_radios.filter(":checked"));
  $("div#table-pagination label, span.dot").attr("style", "");
  const _ARR_LABELS = $("div#table-pagination label").toArray();
  for (i = _si - 3; i < _si + 4; i++) {
    if (i >= 0 && i < _ARR_LABELS.length) {
      $(_ARR_LABELS[i]).css("display", "inline-block");
    }
    if (i == 1) {
      $("#dot-first").css("display", "none");
    }
    if (i == _ARR_LABELS.length - 2) {
      $("#dot-last").css("display", "none");
    }
  }
  displayNewTable();
}

/*
 * filterCols()
 * 列表示設定を反映する
 * 表示設定の更新時と表の再生成時に実行する
 */
function toggleVisibleColumn() {
  $.each($("#toggle-cols input"), function (index, element) {
    $.each($("tr"), function (i, e) {
      $($(e).children("th, td").toArray()[index]).attr(
        "style",
        $(element).prop("checked") ? "" : "display:none"
      );
    });
  });
}

/*
 * searchAll()
 */
function searchAll() {
  let _hitCount = 0;
  const _REGEXP = $("#search-in").val();
  if (_REGEXP === "") {
    $("#message").html(``);
    gDisplayedData = JSON.parse(JSON.stringify(gMasterData));
  } else {
    gDisplayedData = [];
    gMasterData.forEach((single) => {
      for (i = 0; i < single.length; i++) {
        if (single[i].match(_REGEXP)) {
          _hitCount++;
          gDisplayedData.push(single);
          break;
        }
      }
    });
    $("#message").html(`検索結果：${_hitCount}件`);
  }
  searchSingleCol();
}

/*
 * searchSingleCol()
 * 240301
 * 個別の列検索を実行する
 * 全ての列に対して検索条件を総ざらいし、検索条件がなければ全件表示
 * 検索条件があれば一行ずつ照合する
 * 全文検索と相互作用がよくないので現状単体で走らせられない
 */
function searchSingleCol() {
  let _hitCount = 0;
  let _regexps = [],
    meaning = 0;
  $.each($(`th a.single-filter`), function (index, element) {
    const _I = $(element).find(`input[type="text"]`).val();
    let _c = "";
    const _C_CHECKED = $(element).find(`input[type="checkbox"]:checked`);
    if ($(element).find(`input[type="checkbox"]`).length != _C_CHECKED.length) {
      let _c_values = [];
      $.each(_C_CHECKED, function (i, e) {
        _c_values.push("^" + $(e).attr("value") + "$");
      });
      _c = generateOrRegex(_c_values, true);
    }
    _regexps.push(generateAndRegex([_I, _c], false));
    if (_I || _c) {
      $(element).addClass("active");
      meaning++;
    } else {
      $(element).removeClass("active");
    }
  });
  if (!meaning) {
    //全文検索から来た時と直接列検索した時、処理の差があるかどうかわからない
  } else {
    let _copyOfDisplayedData = JSON.parse(JSON.stringify(gDisplayedData));
    gDisplayedData = [];
    _copyOfDisplayedData.forEach((single) => {
      for (i = 0; i < single.length; i++) {
        if (!single[i].match(_regexps[i])) {
          break;
        } else if (i + 1 == single.length) {
          _hitCount++;
          gDisplayedData.push(single);
        }
      }
    });
    $("#message").html(`検索結果：${_hitCount}件`);
  }
  generatePagination();
  displayNewTable();
}

function tSort(trigger) {
  let start = 0;
  let end = 0;
  $("#message").html("sort running...");
  start = performance.now(); //track start

  gDisplayedData = JSON.parse(JSON.stringify(gMasterData));
  if ($(trigger).hasClass("ascending")) {
    $("th").removeClass("ascending");
    $("th").removeClass("descending");
    gDisplayedData.sort(sortArrStrD);
    $(trigger).addClass("descending");
  } else {
    $("th").removeClass("ascending");
    $("th").removeClass("descending");
    gDisplayedData.sort(sortArrStrA);
    $(trigger).addClass("ascending");
  }
  displayNewTable();

  end = performance.now(); //track end
  const time = (end - start) | 0;
  $("#message").html("Data sort complete in " + time / 1000 + "s");
}

//ソート対象にする列番号
let gSortCol = 0;

function sortArrStrA(a, b) {
  a = a[gSortCol].toString();
  b = b[gSortCol].toString();
  if (a < b) {
    return -1;
  } else if (a > b) {
    return 1;
  }
  return 0;
}

function sortArrStrD(a, b) {
  return -sortArrStrA(a, b);
}

function showDetailModal(tr) {
  $(`div#detail-modal-content`).empty();
  $.each($(tr).find(`td`), function (index, element) {
    const _HEAD = gMasterHead[index];
    const _CONTENT = $(element).html();
    $(`div#detail-modal-content`).append(
      `<p><span style="font-weight:bold;">${_HEAD}</span> ： <span>${_CONTENT}</span></p>`
    );
    $(`div#detail-modal-back`).css("display", "block");
  });
}
function hideDetailModal() {
  $(`div#detail-modal-back`).css("display", "none");
}

function generateOrRegex(strings, isReturnRegEx) {
  const nonEmptyStrings = strings.filter((str) => str !== ""); // 空文字列をフィルタリング
  if (nonEmptyStrings.length === 0) {
    return new RegExp(""); // 空の正規表現を返す
  }
  const regexString = nonEmptyStrings.join("|");
  return isReturnRegEx ? regexString : new RegExp(regexString, "g");
}

function generateAndRegex(strings, isReturnRegEx) {
  const nonEmptyStrings = strings.filter((str) => str !== ""); // 空文字列をフィルタリング
  if (nonEmptyStrings.length === 0) {
    return new RegExp(""); // 空の正規表現を返す
  }
  const regexString = nonEmptyStrings.map((str) => `(?=.*${str})`).join("");
  return isReturnRegEx ? regexString : new RegExp(regexString);
}

/* localStorage */
function getStatusFromLocalStorage() {
  gStats = window.localStorage.getItem("TKenLib");
  if (!gStats) {
    return (gStats = {});
  }
  return JSON.parse(currentStatus);
}

function setItemToLocalStorage() {
  window.localStorage.setItem("TKenLib", gStats);
}

function resetLocalStorage() {
  window.localStorage.removeItem("TKenLib");
}
/* localStorage end */
