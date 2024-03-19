const draw = () => {
  let canvas = document.getElementById("tutorial");
  // プロットした時の画面の高さ。仮
  let plotWindowHeight = 400;
  // 画面の幅
  const width = 1280;
  // 画面の高さ
  const height = 780;

  // 町域情報をcsvから取得 -----------------------
  let townArray = getCsv("./positioncsv/13.csv");
  // 始めの要素はheadなのでいらない
  townArray.shift();
  // 配列を市区町村、x、yだけにする
  townArray = townArray.map((e) => {
    return { name: e[3], x: e[7], y: e[6] };
  });
  // 重複した市区町村を削除。残すのは先頭のひとつ
  townArray = townArray.filter(
    (element, index, self) =>
      self.findIndex((e) => e.name === element.name) === index
  );
  console.log(townArray);

  // 町の座標に点を打つ ------------------------

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

  // 町の座標に点を打つ
  if (canvas.getContext) {
    let ctx = canvas.getContext("2d");
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
      console.log(townY);
      // Y軸は反対に表示されるので反転させる
      townY = townY + (plotWindowHeight - townY) * 2;
      ctx.font = "16px sans-serif";
      ctx.fillText(element.name, townX, townY);
      ctx.fillRect(townX, townY, 10, 10);
    });
  }

  // 境界線（県境）を描画 ----------
  // 境界線データをローカルXMLから取り込んでJSONに変換
  // pending

  /*
    // 不動産取引価格情報取得API
    let allRealEstateData = fetchApi(
      "https://www.land.mlit.go.jp/webland/api/TradeListSearch?from=20151&to=20152&area=13"
    );
    allRealEstateData.then(function (value) {
      // ここでプロミスオブジェクトの中身をああだこうだする。
      console.log(value);
    });
  });
  */

  // 市区町村ごとのデータを作成。
  // 市区町村名・x軸・y軸・取引価格平均・面積平均
};

// APIから情報取得
const fetchApi = async (url) => {
  // setLoading(true);
  return await axios
    .get(url)
    .then(function (response) {
      return response.data;
    })
    .catch(function (error) {})
    .finally(() => {
      //  setLoading(false);
    });
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
function getCsv(url) {
  var txt = new XMLHttpRequest();
  txt.open("get", url, false);
  txt.send();

  //改行ごとに配列化
  var arr = txt.responseText.split("\n");

  //1次元配列を2次元配列に変換
  var res = [];
  for (var i = 0; i < arr.length; i++) {
    //空白行が出てきた時点で終了
    if (arr[i] == "") break;

    //","ごとに配列化
    res[i] = arr[i].split(",");

    for (var i2 = 0; i2 < res[i].length; i2++) {
      //数字の場合は「"」を削除
      if (res[i][i2].match(/\-?\d+(.\d+)?(e[\+\-]d+)?/)) {
        res[i][i2] = parseFloat(res[i][i2].replace('"', ""));
      }
    }
  }
  return res;
}
