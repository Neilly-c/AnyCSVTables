let gMasterHead = [];
let gMasterData = [];
let gDisplayedData = [];

$(function () {
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
    DisplayNewTable();
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
    DisplayNewTable();

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
  Object.keys(gMasterHead).forEach((key) => {
    const _ELEM_TH = $("<th>").attr("cols", key).text(gMasterHead[key]);
    _ELEM_TH.append(`<div class="indicator"></div>`);
    const _ELEM_DIV_MODAL = $(`<div class="single-filter-modal"></div>`);
    _ELEM_DIV_MODAL.append(
      `<input type="text" class="search-col-in" placeholder="この列を検索..." />`
    );
    _ELEM_DIV_MODAL.append(`<div class="single-filter-checkboxes"></div>`);

    const _ELEM_A_FILTER = $(`<a class="single-filter" tabindex="0">F</a>`);
    _ELEM_A_FILTER.append(_ELEM_DIV_MODAL);
    _ELEM_TH.append(_ELEM_A_FILTER);
    _ELEM_TR_HEADER_ROW.append(_ELEM_TH);
    const _ELEM_LABEL = $("<label>").attr("cols", key);
    const _ELEM_INPUT_CHECKBOX = $(`<input type="checkbox">`)
      .attr("cols", key)
      .prop("checked", "true");
    _ELEM_LABEL.append(_ELEM_INPUT_CHECKBOX);
    _ELEM_LABEL.append(gMasterHead[key]);
    $("#cols-filter-modal-div").append(_ELEM_LABEL);
  });
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
  $(`#cols-filter-modal input[type="checkbox"]`).off();
  $(`#cols-filter-modal input[type="checkbox"]`).on("change", function () {
    filterCols();
  });
  $(`th a.single-filter input[type="text"].search-col-in,
     div.single-filter-checkboxes input[type="checkbox"]`).on(
    "change",
    function () {
      searchAll();
    }
  );
}

/** convert object to sortable table */
function DisplayNewTable() {
  const _ELEM_DIV_TABLE_CONTAINER = $("#table-container");

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
  _ELEM_DIV_TABLE_CONTAINER.append(_ELEM_TABLE);
  filterCols();

  $("div.indicator").off();

  $("div.indicator").on("click", function () {
    gSortCol = +$(this).parent().attr("cols");
    tSort($(this).parent());
  });
}

function generatePagination() {
  $("div#table-pagination").empty();
  const _PAGE_COUNT = ((gDisplayedData.length / 20) | 0) + 1;
  for (i = 0; i < _PAGE_COUNT; i++) {
    $("div#table-pagination").append(
      `<label id="page-${i + 1}"><input type="radio" name="radio-pagination"${
        i == 0 ? " checked" : ""
      }>${i + 1}</label>`
    );
  }
  $("div#table-pagination label").on("click", function () {
    DisplayNewTable();
  });
}

/*
 * filterCols()
 * 列表示設定を反映する
 * 表示設定の更新時と表の再生成時に実行する
 */
function filterCols() {
  $.each($("#cols-filter input"), function (index, element) {
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
 * 全文検索と相互作用がよくないので要改修
 */
function searchSingleCol() {
  let _hitCount = 0;
  let _regexps = [],
    meaning = 0;
  $.each(
    $(`th a.single-filter input[type="text"].search-col-in`),
    function (index, element) {
      const _V = $(element).val();
      _regexps.push(_V);
      if (_V) {
        meaning++;
      }
    }
  );
  if (!meaning) {
    //全文検索から来た時と直接列検索した時で処理が違うかもしれない
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
  DisplayNewTable();
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
  DisplayNewTable();

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
