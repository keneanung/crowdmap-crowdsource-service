(function () {
  "use strict";
  fetch("/project-context.json")
    .then(function (response) {
      if (!response.ok) throw new Error("Project context is unavailable");
      return response.json();
    })
    .then(function (context) {
      document.querySelectorAll("[data-project-navigation]").forEach(function (element) {
        if (!context.project) element.remove();
      });
      if (context.project) {
        var brand = document.querySelector(".site-navigation__brand");
        if (brand) brand.textContent = context.project.name;
      }
    })
    .catch(function () {});
})();
