(() => {
  "use strict";

  const config = window.PROJECT33_CONFIG || {};
  const FOUNDING_MEMBER_ENDPOINT =
    "https://project33-discord-counter.project33hq.workers.dev/founding-members";
  const FOUNDING_MEMBER_CACHE_KEY = "project33FoundingMemberCount";
  const $ = (selector, context = document) => context.querySelector(selector);
  const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

  const toast = $("#toast");
  let toastTimer;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3200);
  }

  // Official links
  $$("[data-x-link]").forEach((link) => {
    link.href = config.xUrl || "https://x.com/P33Official";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
  });

  const discordReady =
    typeof config.discordUrl === "string" &&
    /^https:\/\/(discord\.gg|discord\.com\/invite)\//i.test(config.discordUrl.trim());

  $$("[data-discord-link]").forEach((link) => {
    if (discordReady) {
      link.href = config.discordUrl.trim();
      link.target = "_blank";
      link.rel = "noopener noreferrer";
    } else {
      link.href = "#community";
      link.addEventListener("click", (event) => {
        event.preventDefault();
        document.querySelector("#community")?.scrollIntoView({ behavior: "smooth" });
        showToast("The official Discord invite has not been added to config.js yet.");
      });
    }
  });

  const discordStatus = $("#discord-status");
  if (discordStatus && !discordReady) {
    discordStatus.textContent = "Official Discord invite will appear here before the public launch.";
  }

  // Configurable token status
  const networkValue = $("#network-value");
  const supplyValue = $("#supply-value");
  const contractValue = $("#contract-value");
  if (networkValue) networkValue.textContent = config.network || "TO BE ANNOUNCED";
  if (supplyValue) supplyValue.textContent = config.totalSupply || "TO BE ANNOUNCED";
  if (contractValue) contractValue.textContent = config.contractAddress || "NOT DEPLOYED";

  // Live Founding Member count from the official Project 33 Discord.
  // config.currentMembers remains a safe fallback if the Worker is unavailable.
  const uniqueElements = (...groups) => [...new Set(groups.flat())];
  const memberCountElements = uniqueElements($$("[data-member-count]"), $$("#member-count"));
  const memberGoalElements = uniqueElements($$("[data-member-goal]"), $$("#member-goal"));
  const memberCounterStatusElements = uniqueElements($$("[data-member-counter-status]"), $$("#member-counter-status"));
  const progressFillElements = uniqueElements($$("[data-progress-fill]"), $$("#progress-fill"));
  const progressElements = uniqueElements($$("[data-progress-track]"), $$(".progress-track"));
  const fallbackMemberCount = Math.max(0, Number(config.currentMembers) || 0);
  const memberGoal = Math.max(1, Number(config.memberGoal) || 333);

  function setMemberCounterStatus(message, state = "checking") {
    memberCounterStatusElements.forEach((element) => {
      element.textContent = message;
      element.dataset.state = state;
    });
  }

  function setTextForAll(selector, text) {
    $$(selector).forEach((element) => { element.textContent = text; });
  }

  function updateLaunchState(count) {
    const reached = count >= memberGoal;
    const remaining = Math.max(0, memberGoal - count);
    document.body.classList.toggle("launch-threshold-reached", reached);

    setTextForAll("[data-launch-phase]", reached ? "LAUNCH STATE" : "PRE-LAUNCH");
    setTextForAll("[data-launch-heading]", reached ? "LAUNCH STATE ACTIVATED" : "BUILD THE FOUNDING 333");
    setTextForAll(
      "[data-launch-message]",
      reached
        ? "The Founding 333 threshold is complete. Project 33 is now in Launch State. Official launch details and tracker activation will still be announced separately."
        : "When the official Founding Member count reaches 333, Project 33 enters Launch State and the launch activation phase may begin."
    );
    setTextForAll("[data-launch-chip]", reached ? "FOUNDING 333 COMPLETE" : "FOUNDING 333 IN PROGRESS");
    setTextForAll("[data-launch-state-badge]", reached ? "LAUNCH STATE ACTIVE" : "LAUNCH GATE LOCKED");
    setTextForAll(
      "[data-members-remaining]",
      reached
        ? `${count.toLocaleString()} FOUNDING MEMBERS // THRESHOLD COMPLETE`
        : `${remaining.toLocaleString()} ${remaining === 1 ? "FOUNDING MEMBER" : "FOUNDING MEMBERS"} TO LAUNCH STATE`
    );
    setTextForAll("[data-launch-status-heading]", reached ? "Launch State active." : "Building the Founding 333.");
    setTextForAll(
      "[data-launch-status-message]",
      reached
        ? "The Founding 333 threshold has been reached. P33 is still not available until official deployment and trading details are announced through verified Project 33 channels."
        : "P33 has not launched and is not available for purchase. Project 33 enters Launch State at 333 Founding Members, but token deployment and trading still require a separate official announcement."
    );
  }

  function renderMemberCount(count, source = "fallback") {
    const normalizedCount = Math.max(0, Number(count) || 0);
    const memberPercent = Math.min(100, (normalizedCount / memberGoal) * 100);

    memberCountElements.forEach((element) => {
      element.textContent = normalizedCount.toLocaleString();
      element.dataset.source = source;
      element.title =
        source === "live"
          ? "Live count from the official Project 33 Discord"
          : source === "cached"
            ? "Last verified count from the official Project 33 Discord"
            : "Configured fallback count";
    });

    memberGoalElements.forEach((element) => {
      element.textContent = memberGoal.toLocaleString();
    });

    progressFillElements.forEach((element) => {
      element.style.width = `${memberPercent}%`;
    });

    progressElements.forEach((element) => {
      element.setAttribute("aria-valuemax", String(memberGoal));
      element.setAttribute("aria-valuenow", String(normalizedCount));
      element.setAttribute(
        "aria-label",
        `${normalizedCount.toLocaleString()} of ${memberGoal.toLocaleString()} founding members`
      );
    });

    updateLaunchState(normalizedCount);
  }

  function restoreCachedMemberCount() {
    try {
      const cachedValue = localStorage.getItem(FOUNDING_MEMBER_CACHE_KEY);
      if (!cachedValue) return false;

      const cached = JSON.parse(cachedValue);
      const cachedCount = Number(cached.count);
      if (!Number.isInteger(cachedCount) || cachedCount < 0) return false;

      renderMemberCount(cachedCount, "cached");
      setMemberCounterStatus(
        "Showing the last verified Discord count while live sync reconnects.",
        "cached"
      );
      return true;
    } catch {
      return false;
    }
  }

  async function updateFoundingMemberCount() {
    if (!memberCountElements.length) return;

    setMemberCounterStatus("Checking the official Project 33 Discord…", "checking");

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    const requestUrl =
      `${FOUNDING_MEMBER_ENDPOINT}?site_check=${Date.now()}`;

    try {
      const response = await fetch(requestUrl, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      const responseText = await response.text();
      let data;

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        throw new Error(
          `Counter returned non-JSON content (HTTP ${response.status})`
        );
      }

      if (!response.ok) {
        const workerMessage =
          typeof data.error === "string" ? `: ${data.error}` : "";
        throw new Error(
          `Counter request failed with HTTP ${response.status}${workerMessage}`
        );
      }

      const liveCount = Number(data.count);
      if (!Number.isInteger(liveCount) || liveCount < 0) {
        throw new Error("The Worker response does not contain a valid count");
      }

      renderMemberCount(liveCount, "live");
      setMemberCounterStatus(
        "Live count verified through the official Project 33 Discord.",
        "live"
      );

      localStorage.setItem(
        FOUNDING_MEMBER_CACHE_KEY,
        JSON.stringify({
          count: liveCount,
          updatedAt: data.updatedAt || new Date().toISOString(),
        })
      );
    } catch (error) {
      console.error("Project 33 Founding Member counter:", error);

      if (!restoreCachedMemberCount()) {
        renderMemberCount(fallbackMemberCount, "fallback");
        setMemberCounterStatus(
          "Discord live count is currently unavailable.",
          "error"
        );
      }
    } finally {
      window.clearTimeout(timeout);
    }
  }

  if (memberCountElements.length) {
    renderMemberCount(fallbackMemberCount, "fallback");
    updateFoundingMemberCount();

    window.setInterval(() => {
      if (!document.hidden) updateFoundingMemberCount();
    }, 300000);

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) updateFoundingMemberCount();
    });
  }


  // Header and mobile menu
  const header = $(".site-header");
  const menuButton = $(".menu-button");
  const nav = $("#site-nav");

  function updateHeader() {
    header?.classList.toggle("scrolled", window.scrollY > 20);
  }
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  menuButton?.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
  });

  $$("#site-nav a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuButton?.setAttribute("aria-expanded", "false");
      document.body.classList.remove("menu-open");
    });
  });

  // Reveal animations
  const revealItems = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("visible"));
  }

  const yearElement = $("#year");
  if (yearElement) yearElement.textContent = new Date().getFullYear();
})();