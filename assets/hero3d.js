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
        var btn = host.querySelector(".w3d-btn");
        var ctl = scene.autoplay(3);
        var label = function () {
          btn.textContent = ctl.isPaused() ? "Reproduzir animação" : "Pausar animação";
        };
        scene.onFirstFrame(function () {
          host.classList.add("is-live");
          var img = host.querySelector("img");
          if (img) img.alt = host.dataset.alt;
          var fig = host.closest(".hero-fig");
          if (fig) {
            Array.prototype.forEach.call(fig.querySelectorAll("[data-spec]"), function (d) {
              d.hidden = d.getAttribute("data-spec") !== "cena";
            });
          }
          label();
          btn.hidden = false;
        });
        btn.addEventListener("click", function () {
          ctl.toggle();
          label();
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
