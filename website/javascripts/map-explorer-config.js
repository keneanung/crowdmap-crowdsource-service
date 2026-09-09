(function () {
  "use strict";

  var settingKey = "crowdmap-explorer";
  var legacySettingKey = "settings";

  function validThreshold(value) {
    return Number.isInteger(value) && value >= 0 ? value : null;
  }

  function storedThreshold() {
    try {
      var current = JSON.parse(localStorage.getItem(settingKey) || "{}");
      var threshold = validThreshold(current.timesSeen);
      if (threshold !== null) return threshold;

      var legacy = JSON.parse(localStorage.getItem(legacySettingKey) || "{}");
      threshold = validThreshold(legacy.timesSeen);
      if (threshold !== null) return threshold;
    } catch (_error) {
      // A malformed saved preference should never prevent the map from loading.
    }
    return 0;
  }

  function saveThreshold(timesSeen) {
    localStorage.setItem(settingKey, JSON.stringify({ timesSeen: timesSeen }));
  }

  var timesSeen = storedThreshold();
  window.MAP_CONFIG = {
    languages: [{ code: "en", flag: "gb" }],
    mapUrl: "map?format=binary&timesSeen=" + encodeURIComponent(String(timesSeen)),
    theme: "dark",
    title: "This service's current map",
  };

  var input = document.querySelector("#times-seen");
  input.value = String(timesSeen);
  input.addEventListener("change", function () {
    var next = Number(input.value);
    if (!validThreshold(next)) {
      input.value = String(timesSeen);
      return;
    }
    saveThreshold(next);
    window.location.reload();
  });
})();
