(function () {
  "use strict";

  var link = document.querySelector("[data-sponsorship-navigation]");
  if (!link) return;

  fetch("/sponsorship/progress")
    .then(function (response) {
      if (!response.ok) throw new Error("Sponsorship is unavailable");
      link.hidden = false;
    })
    .catch(function () {
      link.remove();
    });
})();
