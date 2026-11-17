"""Generate scripts/slp-cam-stub.js with a SPEC-CORRECT Code 128 table
extracted from node_modules/jsbarcode (the app's own barcode renderer), so
the fake camera's frames decode in ZXing exactly like real prints."""
import re

const_path = 'node_modules/jsbarcode/src/barcodes/CODE128/constants.js'
src = open(const_path).read()
m = re.search(r'export const BARS = \[(.*?)\];', src, re.S)
nums = [int(n) for n in re.findall(r'\d+', m.group(1))]
assert len(nums) == 107, len(nums)

def widths(binary):
    s = str(binary)
    out = []
    cur, c = 1, s[0]
    for ch in s[1:]:
        if ch == c:
            cur += 1
        else:
            out.append(str(cur)); cur, c = 1, ch
    out.append(str(cur))
    return ''.join(out)

table = [widths(b) for b in nums]
print('sample:', table[0], table[104], table[106])

stub_head = '''/* slp-cam-stub.js — a fake CAMERA for the E2E camera suite (no real webcam
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

  var CODE128 = %s;

  function bars(text) {
    var vals = [104]; // Code 128-B start
    for (var i = 0; i < text.length; i++) {
      var c = text.charCodeAt(i) - 32;
      if (c < 0 || c > 94) c = 0;
      vals.push(c);
    }
    var sum = 104;
    for (var j = 1; j < vals.length; j++) sum += vals[j] * j;
    vals.push(sum %% 103);
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
      if (i %% 2 === 0) ctx.fillRect(Math.round(x), Math.floor(H * 0.22), Math.max(1, Math.round(w)), Math.floor(H * 0.56));
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
''' % (repr(table).replace("'", '"'))

open('scripts/slp-cam-stub.js', 'w').write(stub_head)
print('stub regenerated with verified table')

# point the camera suite at the persistent stub (survives /tmp cleanup)
suite = open('scripts/shot-v35-camera.mjs').read()
suite = suite.replace("await page.addInitScript({ path: '/tmp/slp-cam-stub.js' });",
                      "await page.addInitScript({ path: 'scripts/slp-cam-stub.js' });")
open('scripts/shot-v35-camera.mjs', 'w').write(suite)
print('camera suite now uses scripts/slp-cam-stub.js')
