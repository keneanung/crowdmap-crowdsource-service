(function () {
  "use strict";

  function validThreshold(value) {
    return Number.isInteger(value) && value >= 0 ? value : null;
  }

  function thresholdFromUrl() {
    var value = new URLSearchParams(window.location.search).get("timesSeen");
    if (value === null) return 0;
    return validThreshold(Number(value)) ?? 0;
  }

  var timesSeen = thresholdFromUrl();
  window.MAP_CONFIG = {
    languages: [{ code: "en", flag: "gb" }],
    mapUrl: "map?format=binary&timesSeen=" + encodeURIComponent(String(timesSeen)),
    theme: "dark",
    title: "This service's current map",
  };

  var input = document.querySelector("#times-seen");
  if (!input) return;
  input.value = String(timesSeen);
  function updateThreshold() {
    var value = input.value.trim();
    var next = Number(value);
    if (value === "" || validThreshold(next) === null) {
      input.value = String(timesSeen);
      return;
    }
    var url = new URL(window.location.href);
    url.searchParams.set("timesSeen", String(next));
    window.location.assign(url);
  }

  input.addEventListener("change", updateThreshold);
  if (input.form) {
    input.form.addEventListener("submit", function (event) {
      event.preventDefault();
      updateThreshold();
    });
  }
})();
