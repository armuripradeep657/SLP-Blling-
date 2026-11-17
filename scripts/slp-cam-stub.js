/* slp-cam-stub.js — a fake CAMERA for the E2E camera suite (no real webcam
 * in the sandbox). Loaded as a Playwright init script on every document:
 *   1. deletes the native BarcodeDetector → the app takes the ZXING fallback
 *      decode path (the same path real non-Chrome phones take)
 *   2. replaces getUserMedia with a canvas "camera" that keeps drawing the
 *      Code 128 of localStorage 'slp-e2e-cam-code' — canvas.captureStream()
 *      feeds the <video> exactly like a webcam and ZXing decodes the frames.
 * The Code 128 width table below is EXTRACTED from node_modules/jsbarcode
 * (the app's own renderer) — spec-correct by construction. */
(function () {
  try { delete window.BarcodeDetector; } catch (e) { window.BarcodeDetector = undefined; }

  var CODE128 = ["212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213", "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132", "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211", "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313", "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331", "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111", "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214", "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111", "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141", "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141", "114131", "311141", "411131", "211412", "211214", "211232", "2331112"];

  function bars(text) {
    var vals = [104]; // Code 128-B start
    for (var i = 0; i < text.length; i++) {
      var c = text.charCodeAt(i) - 32;
      if (c < 0 || c > 94) c = 0;
      vals.push(c);
    }
    var sum = 104;
    for (var j = 1; j < vals.length; j++) sum += vals[j] * j;
    vals.push(sum % 103);
    vals.push(106);
    return vals.map(function (v) { return CODE128[v]; }).join('');
  }

  function draw(canvas, text) {
    var seq = bars(text);
    var ctx = canvas.getContext('2d');
    var W = canvas.width, H = canvas.height;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    var quiet = Math.floor(W * 0.08);
    var units = 0;
    for (var k = 0; k < seq.length; k++) units += parseInt(seq[k], 10);
    var unit = (W - 2 * quiet) / units;
    var x = quiet;
    ctx.fillStyle = '#000000';
    for (var i = 0; i < seq.length; i++) {
      var w = parseInt(seq[i], 10) * unit;
      if (i % 2 === 0) ctx.fillRect(Math.round(x), Math.floor(H * 0.22), Math.max(1, Math.round(w)), Math.floor(H * 0.56));
      x += w;
    }
  }

  var orig = navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    ? navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
    : null;

  navigator.mediaDevices.getUserMedia = function (constraints) {
    var wantsCam = constraints && constraints.video;
    if (!wantsCam) return orig ? orig(constraints) : Promise.reject(new DOMException('no media', 'NotFoundError'));
    var mode = null;
    try { mode = localStorage.getItem('slp-e2e-cam-mode'); } catch (e) { /* default */ }
    if (mode === 'denied') {
      return Promise.reject(new DOMException('Permission denied', 'NotAllowedError'));
    }
    var canvas = document.createElement('canvas');
    canvas.width = 720;
    canvas.height = 480;
    var current = null;
    var render = function () {
      var code = null;
      try { code = localStorage.getItem('slp-e2e-cam-code'); } catch (e) { /* none */ }
      if (code && code !== current) {
        current = code;
        draw(canvas, code);
      }
    };
    render();
    var timer = setInterval(render, 100);
    var stream = canvas.captureStream(20);
    window.__camStream = stream; // the suite checks the tracks END after a scan
    var track = stream.getTracks()[0];
    var stop = track.stop.bind(track);
    track.stop = function () { clearInterval(timer); return stop(); };
    return Promise.resolve(stream);
  };
})();
