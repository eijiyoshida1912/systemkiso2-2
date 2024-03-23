// 初期表示
const init = (pref) => {
  // selectの値を取得
  const select = document.getElementById("select");
  select.addEventListener("change", (e) => {
    // 変更したら各種csv,apiを呼びなおす
    draw(String(e.target.value));
  });
  draw(pref);
};

const draw = (pref) => {
  const loading = document.getElementById("loading");
  loading.classList.remove("disable");
  let canvas = document.getElementById("tutorial");
  let ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // プロットした時の画面の高さ。仮
  let plotWindowHeight = 400;
  // 画面の幅
  const width = 1280;
  // 画面の高さ
  const height = 780;

  // 町域情報をcsvから取得 -----------------------
  const townArray = getTownCsv(pref);

  // 不動産取引価格情報取得API
  let allRealEstateData = fetchApi(
    "https://www.land.mlit.go.jp/webland/api/TradeListSearch?from=20151&to=20152&area=" +
      pref
  );
  allRealEstateData.then(function (value) {
    loading.classList.add("disable");

    // 市区町村ごとのデータを作成。
    // 市区町村名・x軸・y軸・取引価格平均・面積平均

    // 市区町村ごとの取引価格平均を出す
    // TradePriceをMunicipality単位で合算
    // Municipalityごとの配列を作る
    // 全てのデータ
    const allDataArray = value.data;

    // 市区町村ごとに処理
    townArray.forEach((town) => {
      // 町を検索
      const townData = allDataArray.filter((v) => {
        return v.Municipality.indexOf(town.name) != -1;
      });
      // 町の取引価格合計
      let townTradePriceTotal = townData.reduce(function (sum, element) {
        return sum + parseInt(element.TradePrice);
      }, 0);
      // 町の面積合計
      let townAreaTotal = townData.reduce(function (sum, element) {
        return sum + parseInt(element.Area);
      }, 0);

      const thisTown = townArray.find((v) => {
        return v.name == town.name;
      });
      // 町の取引価格平均を町データオブジェクトに追加
      thisTown.priceAverage = townTradePriceTotal / townData.length;
      thisTown.areaAverage = townAreaTotal / townData.length;
    });

    // 描画 ------------------------

    // 町の座標だけを抜き出して配列を再生成
    // 町の座標の最大・最小の緯度経度を抽出
    const minLocationX = Math.min(...townArray.map((p) => p.x));
    const maxLocationX = Math.max(...townArray.map((p) => p.x));
    const minLocationY = Math.min(...townArray.map((p) => p.y));
    const maxLocationY = Math.max(...townArray.map((p) => p.y));

    // 表示させるウィンドウの幅
    const plotWindowWidth =
      (plotWindowHeight * (maxLocationX - minLocationX)) /
      (maxLocationY - minLocationY);

    // 境界線（県境）を描画
    //let borderArray = getCsv("./borderxml/border13.csv");
    let borderArray = getCsv("./borderxml/border" + pref + ".csv");
    borderArray.forEach((v) => {
      const borderX = pMap(
        v[1],
        minLocationX,
        maxLocationX,
        width / 2 - plotWindowWidth / 2,
        width / 2 + plotWindowWidth / 2
      );
      let borderY = pMap(
        v[0],
        minLocationY,
        maxLocationY,
        height / 2 - plotWindowHeight / 2,
        height / 2 + plotWindowHeight / 2
      );
      // Y軸は反対に表示されるので反転させる
      borderY = borderY + (plotWindowHeight - borderY) * 2;
      ctx.fillStyle = "#512354";
      ctx.fillRect(borderX, borderY, 1, 1);
    });

    // 町の座標に点を打つ
    if (canvas.getContext) {
      townArray.forEach((element) => {
        const townX = pMap(
          element.x,
          minLocationX,
          maxLocationX,
          width / 2 - plotWindowWidth / 2,
          width / 2 + plotWindowWidth / 2
        );
        let townY = pMap(
          element.y,
          minLocationY,
          maxLocationY,
          height / 2 - plotWindowHeight / 2,
          height / 2 + plotWindowHeight / 2
        );
        // Y軸は反対に表示されるので反転させる
        townY = townY + (plotWindowHeight - townY) * 2;
        ctx.font = "12px sans-serif";
        ctx.fillStyle = "#efaaf3";
        ctx.textAlign = "center";
        ctx.fillText(element.name, townX, townY + 15);
        // 価格平均
        ctx.fillStyle = "#1a9a8b";
        ctx.fillRect(townX - 5, townY, 10, -element.priceAverage / 500000);
        // 面積平均
        ctx.fillStyle = "#e9262c";
        ctx.fillRect(townX + 5, townY, 10, -element.areaAverage / 3);
      });
    }
  });
};

// APIから情報取得
const fetchApi = async (url) => {
  return await axios
    .get(url)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {})
    .finally(() => {});
};

// processingのmap関数
const pMap = (value, fromMin, fromMax, toMin, toMax) => {
  let result = 0;
  result =
    value <= fromMin
      ? toMin
      : value >= fromMax
      ? toMax
      : (() => {
          let ratio = (toMax - toMin) / (fromMax - fromMin);
          return (value - fromMin) * ratio + toMin;
        })();
  return result;
};

//CSVファイルを文字列で取得
const getCsv = (url) => {
  let txt = new XMLHttpRequest();
  txt.open("get", url, false);
  txt.send();

  //改行ごとに配列化
  let arr = txt.responseText.split("\n");

  //1次元配列を2次元配列に変換
  let res = [];
  for (let i = 0; i < arr.length; i++) {
    //空白行が出てきた時点で終了
    if (arr[i] == "") break;

    //","ごとに配列化
    res[i] = arr[i].split(",");

    for (let i2 = 0; i2 < res[i].length; i2++) {
      //数字の場合は「"」を削除
      if (res[i][i2].match(/\-?\d+(.\d+)?(e[\+\-]d+)?/)) {
        res[i][i2] = parseFloat(res[i][i2].replace('"', ""));
      }
    }
  }
  return res;
};

// 都道府県を指定して町の緯度経度情報を取得
const getTownCsv = (prefecture) => {
  let townArray = getCsv("./positioncsv/" + prefecture + ".csv");
  // 始めの要素はheadなのでいらない
  townArray.shift();
  // 配列を市区町村、x、yだけにする
  console.log(townArray);
  townArray = townArray.map((e) => {
    return { name: e[3].replaceAll('"', ""), x: e[7], y: e[6] };
  });
  // 重複した市区町村を削除。残すのは先頭のひとつ
  townArray = townArray.filter(
    (element, index, self) =>
      self.findIndex((e) => e.name === element.name) === index
  );

  return townArray;
};
