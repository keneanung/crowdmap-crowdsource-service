(function () {
  "use strict";

  var raised = document.querySelector("#sponsorship-raised");
  var goal = document.querySelector("#sponsorship-goal");
  var progress = document.querySelector("#sponsorship-progress");
  var link = document.querySelector("#sponsorship-link");
  var status = document.querySelector("#sponsorship-status");

  function money(amount, currency) {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency }).format(amount);
  }

  fetch("/sponsorship/progress")
    .then(function (response) {
      if (!response.ok) throw new Error("Sponsorship is unavailable");
      return response.json();
    })
    .then(function (data) {
      raised.textContent = money(data.raised, data.currency);
      goal.textContent = money(data.goal, data.currency);
      progress.max = data.goal;
      progress.value = Math.min(data.raised, data.goal);
      progress.setAttribute("aria-valuetext", money(data.raised, data.currency) + " raised of " + money(data.goal, data.currency));
      link.href = data.profileUrl;
      link.hidden = false;
      status.textContent = "This month’s goal";
    })
    .catch(function () {
      document.querySelector("main").hidden = true;
    });
})();
