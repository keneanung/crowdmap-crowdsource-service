(function () {
  "use strict";

  var model = window.CrowdmapReviewModel;

  var state = {
    activeId: null,
    changes: [],
    filter: "all",
    groups: new Map(),
    rawVersion: "",
    search: "",
    selected: new Set(),
  };

  var elements = {
    apiKey: document.querySelector("#api-key"),
    apply: document.querySelector("#apply-update"),
    baselineVersion: document.querySelector("#baseline-version"),
    changeList: document.querySelector("#change-list"),
    conflictCount: document.querySelector("#conflict-count"),
    filters: document.querySelectorAll(".filter"),
    mapPreview: document.querySelector("#map-preview"),
    notice: document.querySelector("#notice"),
    pendingCount: document.querySelector("#pending-count"),
    previewDescription: document.querySelector("#preview-description"),
    previewMarked: document.querySelector("#show-marked"),
    previewTitle: document.querySelector("#preview-title"),
    queueStatus: document.querySelector("#queue-status"),
    refresh: document.querySelector("#refresh"),
    search: document.querySelector("#search"),
    selectedCount: document.querySelector("#selected-count"),
    showBaseline: document.querySelector("#show-baseline"),
    upstreamConflictCount: document.querySelector("#upstream-conflict-count"),
  };

  function isRelated(change) {
    return model.isRelated(change, state.groups);
  }

  function makeBadge(text, className) {
    var badge = document.createElement("span");
    badge.className = "badge" + (className ? " " + className : "");
    badge.textContent = text;
    return badge;
  }

  function visibleChanges() {
    return model.filterChanges(
      state.changes,
      state.groups,
      state.filter,
      state.search,
      state.selected,
    );
  }

  function updateActions() {
    var count = state.selected.size;
    elements.selectedCount.textContent = String(count);
    elements.previewMarked.disabled = count === 0;
    elements.apply.disabled = !model.canApply(
      state.rawVersion,
      elements.apiKey.value,
    );
  }

  function renderList() {
    elements.changeList.replaceChildren();
    var changes = visibleChanges();
    elements.queueStatus.textContent =
      changes.length + " of " + state.changes.length + " changes shown";
    if (changes.length === 0) {
      var empty = document.createElement("p");
      empty.className = "empty-state";
      empty.textContent =
        state.changes.length === 0
          ? "No pending changes."
          : "No changes match this view.";
      elements.changeList.appendChild(empty);
      return;
    }

    changes.forEach(function (change) {
      var card = document.createElement("div");
      card.className =
        "change-card" + (state.activeId === change.changeId ? " active" : "");
      card.dataset.changeId = change.changeId;

      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = state.selected.has(change.changeId);
      checkbox.setAttribute(
        "aria-label",
        "Mark " + model.typeLabel(change.type) + " as incorporated upstream",
      );
      checkbox.addEventListener("click", function (event) {
        event.stopPropagation();
        if (checkbox.checked) state.selected.add(change.changeId);
        else state.selected.delete(change.changeId);
        updateActions();
        if (state.filter === "selected") renderList();
      });

      var content = document.createElement("div");
      var heading = document.createElement("div");
      heading.className = "change-heading";
      var label = document.createElement("span");
      label.className = "change-type";
      label.textContent = model.typeLabel(change.type);
      heading.appendChild(label);
      var summary = document.createElement("p");
      summary.className = "change-summary";
      summary.textContent = model.changeSummary(change);
      var badges = document.createElement("div");
      badges.className = "badges";
      badges.appendChild(
        makeBadge(
          change.reporters +
            (change.reporters === 1 ? " reporter" : " reporters"),
        ),
      );
      if (isRelated(change))
        badges.appendChild(makeBadge("Related edits", "badge-warning"));
      if (change.upstreamConflict)
        badges.appendChild(makeBadge("Upstream conflict", "badge-danger"));
      badges.appendChild(makeBadge(change.changeId.slice(-8), "badge-id"));
      content.append(heading, summary, badges);
      if (change.upstreamConflict) {
        var conflict = document.createElement("p");
        conflict.className = "upstream-conflict";
        conflict.textContent = change.upstreamConflict.reason;
        content.appendChild(conflict);
      }
      var relationships = model.relationshipDetails(change, state.groups);
      if (relationships.length > 0) {
        var details = document.createElement("details");
        details.className = "relationship-details";
        var detailsSummary = document.createElement("summary");
        detailsSummary.textContent =
          "Why related · " +
          relationships.length +
          (relationships.length === 1 ? " change" : " changes");
        var relationshipList = document.createElement("ul");
        relationships.forEach(function (relationship) {
          var item = document.createElement("li");
          var related = relationship.change;
          item.textContent =
            model.typeLabel(related.type) +
            " · " +
            model.changeSummary(related) +
            " · " +
            related.changeId.slice(-8) +
            " — " +
            relationship.reason;
          relationshipList.appendChild(item);
        });
        details.append(detailsSummary, relationshipList);
        content.appendChild(details);
      }
      var previewButton = document.createElement("button");
      previewButton.type = "button";
      previewButton.className = "change-preview";
      previewButton.setAttribute(
        "aria-label",
        "Preview " +
          model.typeLabel(change.type) +
          " for " +
          model.changeSummary(change),
      );
      previewButton.appendChild(content);
      previewButton.addEventListener("click", function () {
        previewChanges([change.changeId], change);
      });
      card.append(checkbox, previewButton);
      elements.changeList.appendChild(card);
    });
  }

  function previewUrl(ids, roomNumber) {
    var params = new URLSearchParams();
    ids.forEach(function (id) {
      params.append("reviewInclude", id);
    });
    if (roomNumber !== undefined) params.set("loc", String(roomNumber));
    return "index.html?" + params.toString();
  }

  function previewChanges(ids, activeChange) {
    state.activeId = activeChange ? activeChange.changeId : null;
    elements.previewTitle.textContent = activeChange
      ? model.typeLabel(activeChange.type)
      : "Marked changes";
    elements.previewDescription.textContent = activeChange
      ? model.changeSummary(activeChange)
      : ids.length + " marked changes applied to the baseline preview.";
    elements.mapPreview.src = previewUrl(
      ids,
      activeChange && activeChange.roomNumber,
    );
    renderList();
  }

  function showNotice(message, isError) {
    elements.notice.textContent = message;
    elements.notice.classList.toggle("error", Boolean(isError));
    elements.notice.hidden = false;
    window.clearTimeout(showNotice.timeout);
    showNotice.timeout = window.setTimeout(function () {
      elements.notice.hidden = true;
    }, 6000);
  }

  async function loadChanges() {
    elements.refresh.disabled = true;
    elements.queueStatus.textContent = "Loading pending changes…";
    try {
      var response = await fetch("change?timesSeen=0", {
        headers: { Accept: "application/json" },
      });
      if (!response.ok)
        throw new Error(
          "Could not load changes (HTTP " + response.status + ")",
        );
      state.changes = await response.json();
      state.rawVersion = response.headers.get("X-Map-Version-Raw") || "";
      state.selected.clear();
      state.activeId = null;
      state.groups = model.groupChanges(state.changes);
      var relatedCount = state.changes.filter(isRelated).length;
      elements.pendingCount.textContent = String(state.changes.length);
      elements.conflictCount.textContent = String(relatedCount);
      elements.upstreamConflictCount.textContent = String(
        state.changes.filter(function (change) {
          return Boolean(change.upstreamConflict);
        }).length,
      );
      elements.baselineVersion.textContent = state.rawVersion || "Unavailable";
      renderList();
      updateActions();
    } catch (error) {
      elements.queueStatus.textContent = error.message;
      showNotice(error.message, true);
    } finally {
      elements.refresh.disabled = false;
    }
  }

  async function applyUpdate() {
    var selectedIds = Array.from(state.selected);
    var removal =
      selectedIds.length === 0
        ? " without removing any pending changes"
        : " and remove " +
          selectedIds.length +
          " incorporated change" +
          (selectedIds.length === 1 ? "" : "s");
    var confirmed = window.confirm(
      "Apply the newly published upstream baseline" + removal + "?",
    );
    if (!confirmed) return;

    elements.apply.disabled = true;
    elements.apply.textContent = "Applying…";
    try {
      var response = await fetch("change/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": elements.apiKey.value,
        },
        body: JSON.stringify({
          version: state.rawVersion,
          obsoleteChanges: selectedIds,
        }),
      });
      if (!response.ok) {
        var body = await response.json().catch(function () {
          return {};
        });
        throw new Error(
          body.message || "Update failed (HTTP " + response.status + ")",
        );
      }
      var result = await response.json().catch(function () {
        return {};
      });
      var automaticallyResolved = result.automaticallyResolved || 0;
      var conflicts = result.upstreamConflicts || 0;
      showNotice(
        "Baseline updated. " +
          automaticallyResolved +
          " report" +
          (automaticallyResolved === 1 ? " was" : "s were") +
          " resolved automatically; " +
          conflicts +
          " upstream conflict" +
          (conflicts === 1 ? " was" : "s were") +
          " flagged.",
        false,
      );
      await loadChanges();
      elements.mapPreview.src = "index.html?reviewBaseline=1";
    } catch (error) {
      showNotice(error.message, true);
    } finally {
      elements.apply.textContent = "Apply baseline update";
      updateActions();
    }
  }

  elements.search.addEventListener("input", function () {
    state.search = elements.search.value;
    renderList();
  });
  elements.filters.forEach(function (filter) {
    filter.addEventListener("click", function () {
      state.filter = filter.dataset.filter;
      elements.filters.forEach(function (item) {
        item.classList.toggle("active", item === filter);
      });
      renderList();
    });
  });
  elements.apiKey.addEventListener("input", updateActions);
  elements.refresh.addEventListener("click", loadChanges);
  elements.previewMarked.addEventListener("click", function () {
    previewChanges(Array.from(state.selected));
  });
  elements.showBaseline.addEventListener("click", function () {
    state.activeId = null;
    elements.previewTitle.textContent = "Baseline map";
    elements.previewDescription.textContent =
      "No pending changes are applied in this view.";
    elements.mapPreview.src = "index.html?reviewBaseline=1";
    renderList();
  });
  elements.apply.addEventListener("click", applyUpdate);
  loadChanges();
})();
