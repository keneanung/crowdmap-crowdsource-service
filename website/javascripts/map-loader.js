(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  var include = params.getAll("reviewInclude");
  var baselineOnly = params.get("reviewBaseline") === "1";
  var reviewMode = baselineOnly || include.length > 0;
  var status;

  if (reviewMode) {
    status = document.createElement("div");
    status.className = "review-map-status";
    status.textContent = "Loading review preview…";
    document.querySelector(".map-container").appendChild(status);
  }

  function configuredThreshold() {
    try {
      var settings = JSON.parse(localStorage.getItem("settings") || "{}");
      return Number.isInteger(settings.timesSeen) && settings.timesSeen >= 0
        ? settings.timesSeen
        : 0;
    } catch (_error) {
      return 0;
    }
  }

  var query = new URLSearchParams();
  query.set(
    "timesSeen",
    baselineOnly ? "2147483647" : reviewMode ? "0" : String(configuredThreshold()),
  );
  include.forEach(function (changeId) {
    query.append("include", changeId);
  });

  function loadRendererBundle() {
    var bundle = document.createElement("script");
    bundle.src = "javascripts/bundle.js";
    bundle.addEventListener("load", function () {
      if (!reviewMode) return;
      var reviewLink = document.querySelector(".review-link");
      if (reviewLink) reviewLink.style.display = "none";
      var roomNumber = Number(params.get("loc"));
      if (Number.isInteger(roomNumber) && roomNumber > 0) {
        window.controls.findRoom(roomNumber);
      }
      status.textContent = baselineOnly
        ? "Baseline only"
        : include.length + (include.length === 1 ? " selected change" : " selected changes");
    });
    bundle.addEventListener("error", function () {
      if (status) status.textContent = "The map renderer could not be loaded.";
    });
    document.body.appendChild(bundle);
  }

  var mapData = document.createElement("script");
  mapData.src = "map/renderer?" + query.toString();
  mapData.addEventListener("load", loadRendererBundle);
  mapData.addEventListener("error", function () {
    if (status) {
      status.textContent = "Preview unavailable: map data could not be loaded.";
    } else {
      document.querySelector(".map-container").textContent =
        "Map unavailable: map data could not be loaded.";
    }
  });
  document.body.appendChild(mapData);
})();
