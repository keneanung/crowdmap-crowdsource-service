import * as model from "./review-model.js";

(function () {
  "use strict";

  var state = {
    activeId: null,
    busyAction: null,
    changes: [],
    filter: "all",
    groups: new Map(),
    loadingChanges: false,
    previewing: false,
    previewedSelectionKey: null,
    rawVersion: "",
    search: "",
    selected: new Set(),
    stagedReview: null,
    transientConflicts: new Map(),
  };

  var elements = {
    apiKey: document.querySelector("#api-key"),
    adminActionHint: document.querySelector("#admin-action-hint"),
    apply: document.querySelector("#apply-update"),
    baselineVersion: document.querySelector("#baseline-version"),
    changeList: document.querySelector("#change-list"),
    conflictCount: document.querySelector("#conflict-count"),
    filters: document.querySelectorAll(".filter"),
    blink: document.querySelector("#blink-toggle"),
    differenceMode: document.querySelector("#difference-mode"),
    deleteSelected: document.querySelector("#delete-selected"),
    notice: document.querySelector("#notice"),
    pendingCount: document.querySelector("#pending-count"),
    previewDescription: document.querySelector("#preview-description"),
    previewSelected: document.querySelector("#show-selected"),
    reportFocus: document.querySelector("#report-focus"),
    previewTitle: document.querySelector("#preview-title"),
    comparisonSideBySide: document.querySelector("#comparison-side-by-side"),
    comparisonWipe: document.querySelector("#comparison-wipe"),
    queueStatus: document.querySelector("#queue-status"),
    refresh: document.querySelector("#refresh"),
    stageUpstream: document.querySelector("#stage-upstream"),
    search: document.querySelector("#search"),
    selectedCount: document.querySelector("#selected-count"),
    selectedLabel: document.querySelector("#selected-label"),
    showBaseline: document.querySelector("#show-baseline"),
    showAllDetails: document.querySelector("#show-all-details"),
    roomDiffDetails: document.querySelector("#room-diff-details"),
    roomDiffSummary: document.querySelector("#room-diff-summary"),
    roomDiffTitle: document.querySelector("#room-diff-title"),
    upstreamConflictCount: document.querySelector("#upstream-conflict-count"),
    wipePosition: document.querySelector("#wipe-position"),
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

  function selectionKey() {
    return Array.from(state.selected).sort().join(",");
  }

  function updateActions() {
    var count = state.selected.size;
    var hasApiKey = elements.apiKey.value.trim().length > 0;
    var busy = Boolean(state.busyAction) || state.loadingChanges || state.previewing;
    elements.selectedCount.textContent = String(count);
    elements.refresh.disabled = busy;
    elements.refresh.title = state.busyAction
      ? "Wait for the current administrator action to finish."
      : state.loadingChanges
        ? "Pending reports are being refreshed."
        : state.previewing
          ? "Wait for the current map preview to finish."
        : "Reload pending reports. Refreshing cancels a staged upstream review.";
    elements.previewSelected.disabled = busy || (!state.stagedReview && count === 0);
    elements.deleteSelected.disabled = busy || !hasApiKey || count === 0 || Boolean(state.stagedReview);
    elements.stageUpstream.disabled = busy || !hasApiKey || !state.rawVersion || Boolean(state.stagedReview);
    elements.selectedLabel.textContent = state.stagedReview ? "selected to keep" : "selected";
    elements.previewSelected.textContent = state.stagedReview
      ? "Preview reviewed result"
      : "Preview selected reports";
    elements.showBaseline.textContent = state.stagedReview
      ? "Staged upstream"
      : "Current baseline";
    elements.showBaseline.disabled = busy;
    elements.showBaseline.title = state.previewing
      ? "Wait for the current map preview to finish."
      : state.loadingChanges
        ? "Wait for pending reports to finish loading."
        : state.busyAction
          ? "Wait for the current administrator action to finish."
          : state.stagedReview
            ? "Preview the staged upstream map without additional reports."
            : "Preview the current baseline without pending reports.";
    elements.apply.disabled =
      busy ||
      !state.stagedReview ||
      state.previewedSelectionKey !== selectionKey() ||
      !model.canApply(state.rawVersion, elements.apiKey.value);

    elements.deleteSelected.title = busy
      ? "Wait for the current administrator action to finish."
      : !hasApiKey
        ? "Enter the map administrator API key first."
        : state.stagedReview
          ? "During baseline review, leave unwanted reports unselected so they are discarded on apply."
          : count === 0
            ? "Select one or more reports first."
            : "Permanently delete the selected reports without changing the baseline.";
    elements.stageUpstream.title = busy
      ? "Wait for the current administrator action to finish."
      : !hasApiKey
        ? "Enter the map administrator API key first."
        : !state.rawVersion
          ? "Wait for the current baseline version to load."
          : state.stagedReview
            ? "An upstream update is already staged."
            : "Load the configured upstream map for review.";
    elements.apply.title = busy
      ? "Wait for the current administrator action to finish."
      : !hasApiKey
        ? "Enter the map administrator API key first."
        : !state.stagedReview
          ? "Load an upstream update first."
          : state.previewedSelectionKey !== selectionKey()
            ? "Preview the reviewed result after changing the selection."
            : "Apply the staged upstream map with the selected reports.";

    elements.adminActionHint.textContent = state.previewing
      ? "A map preview is currently being generated."
      : busy
      ? "An administrator action is currently running."
      : !hasApiKey
        ? "Enter the map administrator API key to enable administrative actions."
        : state.stagedReview && state.previewedSelectionKey !== selectionKey()
          ? "The selection changed. Preview the reviewed result before applying it."
          : state.stagedReview
            ? "The preview matches the current selection. Apply it when the reviewed result is correct."
            : count === 0
              ? "Select reports to preview or delete, or load an upstream update to begin baseline review."
              : "Preview or delete the selected reports, or load an upstream update to begin baseline review.";
    elements.changeList.querySelectorAll(".change-preview").forEach(function (control) {
      control.disabled = busy;
    });
    elements.changeList.querySelectorAll(".change-select").forEach(function (control) {
      var change = state.changes.find(function (item) {
        return item.changeId === control.dataset.changeId;
      });
      control.disabled = busy || Boolean(state.stagedReview && change && change.upstreamResolved);
    });
  }

  function updateReportFocus() {
    var reports = state.changes.filter(function (change) {
      return typeof change.roomNumber === "number" &&
        (!state.stagedReview || state.selected.has(change.changeId));
    });
    var rooms = new Map();
    reports.forEach(function (change) {
      if (!rooms.has(change.roomNumber)) rooms.set(change.roomNumber, []);
      rooms.get(change.roomNumber).push(model.typeLabel(change.type));
    });
    elements.reportFocus.replaceChildren(new Option("Choose a reported room…", ""));
    rooms.forEach(function (types, roomNumber) {
      elements.reportFocus.add(new Option("Room " + roomNumber + " · " + types.join(", "), String(roomNumber)));
    });
    elements.reportFocus.disabled = rooms.size === 0;
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
      checkbox.className = "change-select";
      checkbox.dataset.changeId = change.changeId;
      checkbox.checked = state.selected.has(change.changeId);
      checkbox.disabled = Boolean(state.busyAction || state.loadingChanges || state.stagedReview && change.upstreamResolved);
      checkbox.title = state.stagedReview
        ? change.upstreamResolved
          ? "Already present in the staged upstream map; no additional selection is needed."
          : checkbox.checked
            ? "Selected to keep in addition to the staged upstream map."
            : "Not selected; this report will be discarded when the update is applied."
        : "Select this report for preview or deletion.";
      checkbox.setAttribute(
        "aria-label",
        state.stagedReview
          ? change.upstreamResolved
            ? model.typeLabel(change.type) + " is already present in the staged upstream map"
            : "Keep " + model.typeLabel(change.type) + " in addition to the staged upstream map"
          : "Select " + model.typeLabel(change.type) + " for preview or deletion",
      );
      checkbox.addEventListener("click", function (event) {
        event.stopPropagation();
        if (checkbox.checked) state.selected.add(change.changeId);
        else state.selected.delete(change.changeId);
        updateActions();
        updateReportFocus();
        renderList();
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
        badges.appendChild(
          makeBadge(
            "Upstream conflict · " + change.upstreamConflict.baselineVersion,
            "badge-danger",
          ),
        );
      if (change.upstreamResolved)
        badges.appendChild(makeBadge("Already upstream", "badge-success"));
      else if (state.stagedReview)
        badges.appendChild(makeBadge(
          state.selected.has(change.changeId) ? "Selected to keep" : "Will be discarded",
          state.selected.has(change.changeId) ? "badge-success" : "badge-danger",
        ));
      badges.appendChild(makeBadge(change.changeId.slice(-8), "badge-id"));
      content.append(heading, summary, badges);
      if (change.upstreamConflict) {
        var conflict = document.createElement("p");
        conflict.className = "upstream-conflict";
        conflict.textContent =
          "Baseline " +
          change.upstreamConflict.baselineVersion +
          ": " +
          change.upstreamConflict.reason;
        content.appendChild(conflict);
      }
      var relationships = model.relationshipDetails(change, state.groups);
      var relationshipDetailsElement;
      if (relationships.length > 0) {
        relationshipDetailsElement = document.createElement("details");
        relationshipDetailsElement.className = "relationship-details";
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
        relationshipDetailsElement.append(detailsSummary, relationshipList);
      }
      var previewButton = document.createElement("button");
      previewButton.type = "button";
      previewButton.className = "change-preview";
      previewButton.disabled = Boolean(state.busyAction || state.loadingChanges);
      previewButton.setAttribute(
        "aria-label",
        "Preview " +
          model.typeLabel(change.type) +
          " for " +
          model.changeSummary(change),
      );
      previewButton.appendChild(content);
      previewButton.addEventListener("click", async function () {
        state.previewing = true;
        if (state.stagedReview) {
          state.previewedSelectionKey = null;
        }
        updateActions();
        try {
          await previewChanges([change.changeId], change);
        } catch (error) {
          showNotice(error.message, true);
        } finally {
          state.previewing = false;
          updateActions();
        }
      });
      card.append(checkbox, previewButton);
      if (relationshipDetailsElement)
        card.appendChild(relationshipDetailsElement);
      elements.changeList.appendChild(card);
    });
  }

  async function previewChanges(ids, activeChange) {
    state.activeId = activeChange ? activeChange.changeId : null;
    elements.previewTitle.textContent = activeChange
      ? model.typeLabel(activeChange.type)
      : state.stagedReview
        ? "Reviewed result"
        : "Selected reports";
    elements.previewDescription.textContent = activeChange
      ? model.changeSummary(activeChange)
      : state.stagedReview
        ? ids.length + " selected reports added to the staged upstream preview."
        : ids.length + " selected reports applied to the baseline preview.";
    await window.CrowdmapReviewMap.show(
      ids,
      state.changes.filter(function (change) {
        return ids.includes(change.changeId);
      }),
      activeChange && activeChange.roomNumber,
      state.stagedReview && state.stagedReview.id,
    );
    renderList();
  }

  async function showStagedSelection() {
    var selectedChanges = state.changes.filter(function (change) {
      return state.selected.has(change.changeId);
    });
    elements.previewTitle.textContent = "Incoming upstream and reviewed result";
    elements.previewDescription.textContent =
      "The left pane is staged upstream; the right pane adds the selected reports.";
    state.previewedSelectionKey = null;
    updateActions();
    await window.CrowdmapReviewMap.show(
      Array.from(state.selected),
      selectedChanges,
      undefined,
      state.stagedReview.id,
    );
    state.previewedSelectionKey = selectionKey();
    updateActions();
  }

  function displayValue(value) {
    if (value === undefined) return "—";
    if (value === null) return "none";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  function addPropertyRow(container, label, before, after, roomNumber) {
    var row = document.createElement("button");
    row.type = "button";
    row.className = "property-diff-row";
    row.innerHTML = "<span></span><span></span>";
    row.children[0].textContent = label;
    row.children[1].textContent = displayValue(before) + " → " + displayValue(after);
    row.addEventListener("click", function () {
      window.CrowdmapReviewMap.focus(roomNumber);
    });
    container.appendChild(row);
  }

  function addSummaryRow(container, label, before, after, roomNumber) {
    var row = document.createElement("button");
    row.type = "button";
    row.className = "property-summary-row";
    var name = document.createElement("span");
    name.textContent = "Changed: " + label;
    var values = document.createElement("span");
    values.textContent = displayValue(before) + " → " + displayValue(after);
    row.append(name, values);
    row.addEventListener("click", function () {
      window.CrowdmapReviewMap.focus(roomNumber);
    });
    container.appendChild(row);
  }

  function renderRoomDiff(roomNumber) {
    var comparison = window.CrowdmapReviewMap.getRoomComparison(roomNumber);
    var before = comparison.baseline;
    var after = comparison.candidate;
    var relatedChanges = comparison.changes;
    elements.roomDiffDetails.replaceChildren();
    elements.roomDiffSummary.replaceChildren();
    elements.showAllDetails.disabled = !before && !after;
    elements.showAllDetails.textContent = "Show all details";
    elements.roomDiffDetails.hidden = true;
    elements.roomDiffTitle.textContent = "Room " + roomNumber;
    if (!before || !after) {
      var presence = document.createElement("p");
      presence.className = "property-presence " + (!before ? "addition" : "removal");
      presence.textContent = !before
        ? "Added in the candidate map."
        : "Removed from the candidate map.";
      elements.roomDiffSummary.appendChild(presence);
      return;
    }
    var changed = [];
    [
      ["name", "Name"],
      ["env", "Environment"],
      ["area", "Area"],
      ["x", "X coordinate"],
      ["y", "Y coordinate"],
      ["z", "Level"],
      ["weight", "Weight"],
      ["roomChar", "Symbol"],
      ["hash", "Hash"],
    ].forEach(function (field) {
      if (before[field[0]] !== after[field[0]]) {
        changed.push({
          key: field[0],
          label: field[1],
          before: before[field[0]],
          after: after[field[0]],
        });
      }
    });
    var exits = new Set(Object.keys(before.exits || {}).concat(Object.keys(after.exits || {})));
    exits.forEach(function (direction) {
      if ((before.exits || {})[direction] !== (after.exits || {})[direction]) {
        changed.push({
          key: "exit:" + direction,
          label: direction + " exit",
          before: (before.exits || {})[direction],
          after: (after.exits || {})[direction],
        });
      }
    });
    var userDataKeys = new Set(Object.keys(before.userData || {}).concat(Object.keys(after.userData || {})));
    var userDataChanges = Array.from(userDataKeys).filter(function (key) {
      return (before.userData || {})[key] !== (after.userData || {})[key];
    });
    changed.slice(0, 3).forEach(function (field) {
      addSummaryRow(elements.roomDiffSummary, field.label, field.before, field.after, roomNumber);
    });
    if (changed.length > 3) {
      var remaining = document.createElement("p");
      remaining.className = "property-summary-note";
      remaining.textContent = (changed.length - 3) + " more changed value" + (changed.length === 4 ? "." : "s.");
      elements.roomDiffSummary.appendChild(remaining);
    }
    if (changed.length === 0) {
      var noDirectDiff = document.createElement("p");
      noDirectDiff.className = "property-summary-note";
      noDirectDiff.textContent = relatedChanges.length
        ? "This report targets the room without changing a compact room property."
        : "No changed room properties are visible at this target.";
      elements.roomDiffSummary.appendChild(noDirectDiff);
    }
    var fullProperties = document.createElement("section");
    fullProperties.className = "full-property-list";
    var fullPropertiesTitle = document.createElement("h3");
    fullPropertiesTitle.textContent = "All room properties";
    fullProperties.appendChild(fullPropertiesTitle);
    [
      ["name", "Name"],
      ["env", "Environment"],
      ["area", "Area"],
      ["x", "X coordinate"],
      ["y", "Y coordinate"],
      ["z", "Level"],
      ["weight", "Weight"],
      ["roomChar", "Symbol"],
      ["hash", "Hash"],
    ].forEach(function (field) {
      addPropertyRow(fullProperties, field[1], before[field[0]], after[field[0]], roomNumber);
    });
    elements.roomDiffDetails.appendChild(fullProperties);
    var exitDetails = document.createElement("details");
    exitDetails.className = "property-details-list";
    var exitSummary = document.createElement("summary");
    exitSummary.textContent = exits.size + " exit" + (exits.size === 1 ? "" : "s");
    exitDetails.appendChild(exitSummary);
    Array.from(exits).sort().forEach(function (direction) {
      addPropertyRow(exitDetails, direction + " exit", (before.exits || {})[direction], (after.exits || {})[direction], roomNumber);
    });
    elements.roomDiffDetails.appendChild(exitDetails);
    if (userDataKeys.size) {
      var data = document.createElement("details");
      data.className = "property-details-list";
      var summary = document.createElement("summary");
      summary.textContent = userDataKeys.size + " user-data value" + (userDataKeys.size === 1 ? "" : "s");
      data.appendChild(summary);
      Array.from(userDataKeys).sort().forEach(function (key) {
        addPropertyRow(data, "User data · " + key, (before.userData || {})[key], (after.userData || {})[key], roomNumber);
      });
      elements.roomDiffDetails.appendChild(data);
    }
    var unchanged = ["name", "env", "area", "x", "y", "z", "weight", "roomChar", "hash"].filter(function (key) {
      return before[key] === after[key];
    }).length +
      Array.from(exits).filter(function (direction) {
        return (before.exits || {})[direction] === (after.exits || {})[direction];
      }).length +
      Array.from(userDataKeys).filter(function (key) {
        return (before.userData || {})[key] === (after.userData || {})[key];
      }).length;
    var note = document.createElement("p");
    note.className = "unchanged-note";
    note.textContent = "Unchanged properties: " + unchanged + " hidden.";
    elements.roomDiffSummary.appendChild(note);
    var detailsNote = document.createElement("p");
    detailsNote.className = "unchanged-note";
    detailsNote.textContent = "Long exit and user-data lists remain independently expandable.";
    elements.roomDiffDetails.appendChild(detailsNote);
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
    if (state.loadingChanges || state.busyAction && !["apply", "delete"].includes(state.busyAction))
      return;
    state.loadingChanges = true;
    updateActions();
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
      state.changes.forEach(function (change) {
        var conflict = state.transientConflicts.get(change.changeId);
        if (conflict) change.upstreamConflict = conflict;
      });
      state.rawVersion = response.headers.get("X-Map-Version-Raw") || "";
      state.stagedReview = null;
      state.selected.clear();
      state.previewedSelectionKey = null;
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
      updateReportFocus();
      await previewChanges([], null);
    } catch (error) {
      elements.queueStatus.textContent = error.message;
      showNotice(error.message, true);
    } finally {
      state.loadingChanges = false;
      updateActions();
    }
  }

  async function applyUpdate() {
    var selectedIds = Array.from(state.selected);
    var obsoleteIds = model.unselectedChangeIds(state.changes, state.selected);
    var keptCount = selectedIds.length;
    var removalCount = obsoleteIds.length;
    var confirmed = window.confirm(
      "Apply the reviewed upstream update, keep " + keptCount + " selected report" +
        (keptCount === 1 ? "" : "s") + ", and discard " + removalCount + " report" +
        (removalCount === 1 ? "" : "s") + "?",
    );
    if (!confirmed) return;

    state.busyAction = "apply";
    updateActions();
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
          obsoleteChanges: obsoleteIds,
          reviewId: state.stagedReview.id,
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
      var conflicts = Array.isArray(result.upstreamConflictDetails)
        ? result.upstreamConflictDetails
        : [];
      state.transientConflicts = new Map(
        conflicts.map(function (conflict) {
          return [
            conflict.changeId,
            {
              baselineVersion: result.baselineVersion,
              reason: conflict.reason,
            },
          ];
        }),
      );
      showNotice(
        "Baseline updated. " +
          automaticallyResolved +
          " report" +
          (automaticallyResolved === 1 ? " was" : "s were") +
          " resolved automatically; " +
          (result.upstreamConflicts || 0) +
          " upstream conflict" +
          (conflicts.length === 1 ? " was" : "s were") +
          " flagged for this review. They remain pending.",
        false,
      );
      state.stagedReview = null;
      await loadChanges();
    } catch (error) {
      showNotice(error.message, true);
    } finally {
      state.busyAction = null;
      elements.apply.textContent = "Apply reviewed upstream update";
      updateActions();
    }
  }

  async function deleteSelected() {
    if (!elements.apiKey.value) {
      showNotice("Enter the map administrator API key before deleting reports.", true);
      elements.apiKey.focus();
      return;
    }
    var selectedChanges = state.changes.filter(function (change) {
      return state.selected.has(change.changeId);
    });
    var reporterCount = selectedChanges.reduce(function (sum, change) {
      return sum + change.reporters;
    }, 0);
    var confirmed = window.confirm(
      "Permanently delete " + selectedChanges.length + " selected report" +
        (selectedChanges.length === 1 ? "" : "s") + " containing " +
        reporterCount + " reporter confirmation" + (reporterCount === 1 ? "" : "s") +
        "?\n\nThe baseline map will not be changed.",
    );
    if (!confirmed) return;
    state.busyAction = "delete";
    updateActions();
    elements.deleteSelected.textContent = "Deleting…";
    try {
      var response = await fetch("change/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": elements.apiKey.value,
        },
        body: JSON.stringify({ changeIds: Array.from(state.selected) }),
      });
      if (!response.ok) {
        var body = await response.json().catch(function () { return {}; });
        throw new Error(body.message || "Delete failed (HTTP " + response.status + ")");
      }
      var result = await response.json();
      showNotice(result.deleted + " pending report" + (result.deleted === 1 ? "" : "s") + " deleted. The baseline map was not changed.", false);
      await loadChanges();
    } catch (error) {
      showNotice(error.message, true);
    } finally {
      state.busyAction = null;
      elements.deleteSelected.textContent = "Delete selected reports";
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
  elements.deleteSelected.addEventListener("click", deleteSelected);
  elements.stageUpstream.addEventListener("click", async function () {
    if (!state.rawVersion) return;
    state.busyAction = "stage";
    updateActions();
    elements.stageUpstream.textContent = "Loading upstream…";
    try {
      var response = await fetch("change/review-upstream?version=" + encodeURIComponent(state.rawVersion), {
        headers: { "X-API-Key": elements.apiKey.value },
      });
      if (!response.ok) throw new Error("Could not stage upstream (HTTP " + response.status + ")");
      state.stagedReview = await response.json();
      var outcomes = new Map(state.stagedReview.reconciliation.map(function (item) { return [item.changeId, item]; }));
      state.changes.forEach(function (change) {
        var outcome = outcomes.get(change.changeId);
        change.upstreamConflict = outcome && outcome.status === "upstream-conflict"
          ? { baselineVersion: state.stagedReview.upstreamVersion, reason: outcome.reason }
          : undefined;
        change.upstreamResolved = Boolean(outcome && outcome.status === "resolved");
      });
      state.selected.clear();
      elements.upstreamConflictCount.textContent = String(
        state.changes.filter(function (change) { return Boolean(change.upstreamConflict); }).length,
      );
      elements.baselineVersion.textContent = state.stagedReview.upstreamVersion;
      await showStagedSelection();
      renderList();
      updateReportFocus();
      updateActions();
      showNotice(
        "Upstream " + state.stagedReview.upstreamVersion +
          " staged. Select reports to keep, then preview the reviewed result.",
        false,
      );
    } catch (error) {
      showNotice(error.message, true);
    } finally {
      state.busyAction = null;
      elements.stageUpstream.textContent = "Load upstream update";
      updateActions();
    }
  });
  elements.previewSelected.addEventListener("click", async function () {
    var previewedKey = selectionKey();
    state.previewing = true;
    if (state.stagedReview) {
      state.previewedSelectionKey = null;
    }
    updateActions();
    try {
      await previewChanges(Array.from(state.selected));
      if (state.stagedReview) state.previewedSelectionKey = previewedKey;
    } catch (error) {
      state.previewedSelectionKey = null;
      showNotice(error.message, true);
    } finally {
      state.previewing = false;
      updateActions();
    }
  });
  elements.reportFocus.addEventListener("change", function () {
    var roomNumber = Number(elements.reportFocus.value);
    if (Number.isInteger(roomNumber) && roomNumber > 0)
      window.CrowdmapReviewMap.focus(roomNumber);
  });
  elements.showBaseline.addEventListener("click", async function () {
    state.activeId = null;
    state.previewing = true;
    if (state.stagedReview) {
      state.previewedSelectionKey = null;
    }
    updateActions();
    elements.previewTitle.textContent = state.stagedReview
      ? "Staged upstream"
      : "Baseline map";
    elements.previewDescription.textContent = state.stagedReview
      ? "The staged upstream map without any additional pending reports."
      : "The current baseline without any pending reports.";
    try {
      await window.CrowdmapReviewMap.show([], [], undefined, state.stagedReview && state.stagedReview.id);
      if (state.stagedReview && state.selected.size === 0)
        state.previewedSelectionKey = "";
    } catch (error) {
      showNotice(error.message, true);
    } finally {
      state.previewing = false;
    }
    renderList();
    updateActions();
  });
  elements.differenceMode.addEventListener("change", function () {
    window.CrowdmapReviewMap.setDifferenceMode(elements.differenceMode.checked);
  });
  elements.comparisonSideBySide.addEventListener("click", function () {
    elements.comparisonSideBySide.classList.add("active");
    elements.comparisonWipe.classList.remove("active");
    elements.blink.disabled = true;
    elements.blink.textContent = "Blink candidate";
    elements.wipePosition.disabled = true;
    window.CrowdmapReviewMap.setWipeMode(false);
  });
  elements.comparisonWipe.addEventListener("click", function () {
    elements.comparisonWipe.classList.add("active");
    elements.comparisonSideBySide.classList.remove("active");
    elements.blink.disabled = false;
    elements.wipePosition.disabled = false;
    window.CrowdmapReviewMap.setWipeMode(true);
  });
  elements.wipePosition.addEventListener("input", function () {
    window.CrowdmapReviewMap.setWipe(Number(elements.wipePosition.value));
  });
  elements.blink.addEventListener("click", function () {
    elements.blink.textContent = window.CrowdmapReviewMap.toggleBlink()
      ? "Stop blinking"
      : "Blink candidate";
  });
  elements.showAllDetails.addEventListener("click", function () {
    elements.roomDiffDetails.hidden = !elements.roomDiffDetails.hidden;
    elements.showAllDetails.textContent = elements.roomDiffDetails.hidden
      ? "Show all details"
      : "Hide details";
  });
  window.addEventListener("crowdmapreview:roomselect", function (event) {
    renderRoomDiff(event.detail.roomId);
  });
  elements.apply.addEventListener("click", applyUpdate);
  elements.blink.disabled = true;
  elements.wipePosition.disabled = true;
  void loadChanges();
})();
