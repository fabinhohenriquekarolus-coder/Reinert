(function () {
  var host = document.getElementById("hero3d");
  if (!host || !window.Promise) return;
  var net = navigator.connection;
  if (net && (net.saveData || /2g/.test(net.effectiveType || ""))) return;
  try {
    var probe = document.createElement("canvas");
    if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) return;
  } catch (e) {
    return;
  }

  function load(src) {
    return new Promise(function (ok, fail) {
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = ok;
      s.onerror = fail;
      document.head.appendChild(s);
    });
  }

  function boot() {
    load(host.dataset.three)
      .then(function () { return load(host.dataset.scene); })
      .then(function () {
        var scene = window.createWeldScene(host, { hfov: 50 });
        scene.autoplay(3);
        scene.onFirstFrame(function () {
          host.classList.add("is-live");
          var img = host.querySelector("img");
          if (img) img.alt = host.dataset.alt;
        });
      })
      .catch(function () {});
  }

  function idle() {
    if ("requestIdleCallback" in window) requestIdleCallback(boot, { timeout: 2500 });
    else setTimeout(boot, 1200);
  }
  if (document.readyState === "complete") idle();
  else window.addEventListener("load", idle);
})();
