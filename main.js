const draw = () => {
  let canvas = document.getElementById("tutorial");
  // プロットした時の画面の高さ。仮
  let plotWindowHeight = 500;
  // 画面の幅
  const width = 1280;
  // 画面の高さ
  const height = 780;

  // 町域情報取得API
  let allTownData = fetchTownApi(
    "https://geoapi.heartrails.com/api/json?method=getTowns&prefecture=%E6%9D%B1%E4%BA%AC%E9%83%BD"
  );
  allTownData.then(function (value) {
    // ここでプロミスオブジェクトの中身をああだこうだする。
    const townArray = value.response.location;
    // 町の座標だけを抜き出して配列を再生成
    // 町の座標の最大・最小の緯度経度を抽出
    locationXArray = townArray.map((obj) => {
      return Number(obj.x);
    });
    locationYArray = townArray.map((obj) => {
      return Number(obj.y);
    });
    let minLocationX = Math.min(...locationXArray);
    let maxLocationX = Math.max(...locationXArray);
    let minLocationY = Math.min(...locationYArray);
    let maxLocationY = Math.max(...locationYArray);
    // 表示させるウィンドウの幅
    let plotWindowWidth =
      (plotWindowHeight * (maxLocationX - minLocationX)) /
      (maxLocationY - minLocationY);
    console.log(plotWindowWidth);

    // 町の座標に点を打つ
    if (canvas.getContext) {
      let ctx = canvas.getContext("2d");
      townArray.forEach((element) => {
        console.log(element.x);
        const townX = pMap(
          element.x,
          minLocationX,
          maxLocationX,
          width / 2 - plotWindowWidth / 2,
          width / 2 + plotWindowWidth / 2
        );
        const townY = pMap(
          element.y,
          minLocationY,
          maxLocationY,
          height / 2 - plotWindowHeight / 2,
          height / 2 + plotWindowHeight / 2
        );
        ctx.fillRect(townX, townY, 2, 2);
      });
    }
  });

  // 不動産取引価格情報取得API
  /*
  fetchRealEstateApi(
    "https://www.land.mlit.go.jp/webland/api/TradeListSearch?from=20151&to=20152&area=13"
  );
  */
};

// 町域情報取得API
const fetchTownApi = async (url) => {
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

// 不動産取引価格情報取得API
async function fetchRealEstateApi(url) {
  const response = await fetch(url);
  const realEstates = await response.json();
  console.log(realEstates);
}

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
