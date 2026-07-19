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
  $("#network-value").textContent = config.network || "TO BE ANNOUNCED";
  $("#supply-value").textContent = config.totalSupply || "TO BE ANNOUNCED";
  $("#contract-value").textContent = config.contractAddress || "NOT DEPLOYED";

  // Live Founding Member count from the official Project 33 Discord.
  // config.currentMembers remains a safe fallback if the Worker is unavailable.
  const memberCountElement = $("#member-count");
  const memberGoalElement = $("#member-goal");
  const progressFill = $("#progress-fill");
  const progress = $(".progress-track");
  const fallbackMemberCount = Math.max(0, Number(config.currentMembers) || 0);
  const memberGoal = Math.max(1, Number(config.memberGoal) || 333);

  function renderMemberCount(count, source = "fallback") {
    const normalizedCount = Math.max(0, Number(count) || 0);
    const memberPercent = Math.min(100, (normalizedCount / memberGoal) * 100);

    if (memberCountElement) {
      memberCountElement.textContent = normalizedCount.toLocaleString();
      memberCountElement.dataset.source = source;
      memberCountElement.title =
        source === "live"
          ? "Live count from the official Project 33 Discord"
          : source === "cached"
            ? "Last verified count from the official Project 33 Discord"
            : "Configured fallback count";
    }

    if (memberGoalElement) {
      memberGoalElement.textContent = memberGoal.toLocaleString();
    }

    if (progressFill) {
      progressFill.style.width = `${memberPercent}%`;
    }

    if (progress) {
      progress.setAttribute("aria-valuemax", String(memberGoal));
      progress.setAttribute("aria-valuenow", String(normalizedCount));
      progress.setAttribute(
        "aria-label",
        `${normalizedCount.toLocaleString()} of ${memberGoal.toLocaleString()} founding members`
      );
      progress.setAttribute("aria-busy", source === "loading" ? "true" : "false");
    }
  }

  function restoreCachedMemberCount() {
    try {
      const cachedValue = localStorage.getItem(FOUNDING_MEMBER_CACHE_KEY);
      if (!cachedValue) return false;

      const cached = JSON.parse(cachedValue);
      if (!Number.isInteger(cached.count) || cached.count < 0) return false;

      renderMemberCount(cached.count, "cached");
      return true;
    } catch {
      return false;
    }
  }

  async function updateFoundingMemberCount() {
    if (!memberCountElement) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(FOUNDING_MEMBER_ENDPOINT, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Counter request failed with status ${response.status}`);
      }

      const data = await response.json();
      if (!Number.isInteger(data.count) || data.count < 0) {
        throw new Error("The counter returned an invalid member count");
      }

      renderMemberCount(data.count, "live");
      localStorage.setItem(
        FOUNDING_MEMBER_CACHE_KEY,
        JSON.stringify({
          count: data.count,
          updatedAt: data.updatedAt || new Date().toISOString(),
        })
      );
    } catch (error) {
      console.warn("Unable to refresh the Founding Member count:", error);

      if (!restoreCachedMemberCount()) {
        renderMemberCount(fallbackMemberCount, "fallback");
      }
    } finally {
      window.clearTimeout(timeout);
    }
  }

  renderMemberCount(fallbackMemberCount, "loading");
  restoreCachedMemberCount();
  updateFoundingMemberCount();

  window.setInterval(() => {
    if (!document.hidden) updateFoundingMemberCount();
  }, 300000);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) updateFoundingMemberCount();
  });

  // Countdown. launchDate represents Day 1; target is 33 days later.
  const countdownValue = $("#countdown-value");
  const countdownLabel = $("#countdown-label");
  let countdownInterval;

  function renderCountdown() {
    if (!config.launchDate) {
      countdownValue.textContent = "NOT STARTED";
      countdownLabel.textContent = "DAY 00 OF 33";
      return;
    }

    const start = new Date(config.launchDate);
    if (Number.isNaN(start.getTime())) {
      countdownValue.textContent = "DATE ERROR";
      countdownLabel.textContent = "CHECK CONFIG.JS";
      return;
    }

    const now = new Date();
    const end = new Date(start.getTime() + 33 * 24 * 60 * 60 * 1000);
    const elapsed = now.getTime() - start.getTime();
    const remaining = end.getTime() - now.getTime();

    if (elapsed < 0) {
      const untilStart = start.getTime() - now.getTime();
      const days = Math.floor(untilStart / 86400000);
      const hours = Math.floor((untilStart % 86400000) / 3600000);
      const minutes = Math.floor((untilStart % 3600000) / 60000);
      countdownValue.textContent = `${String(days).padStart(2, "0")}D ${String(hours).padStart(2, "0")}H ${String(minutes).padStart(2, "0")}M`;
      countdownLabel.textContent = "COUNTDOWN BEGINS SOON";
      return;
    }

    if (remaining <= 0) {
      countdownValue.textContent = "DAY 33";
      countdownLabel.textContent = "LAUNCH PHASE";
      return;
    }

    const day = Math.min(33, Math.floor(elapsed / 86400000) + 1);
    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    countdownValue.textContent =
      `${String(days).padStart(2, "0")}D ${String(hours).padStart(2, "0")}H ${String(minutes).padStart(2, "0")}M ${String(seconds).padStart(2, "0")}S`;
    countdownLabel.textContent = `DAY ${String(day).padStart(2, "0")} OF 33`;
  }

  renderCountdown();
  countdownInterval = setInterval(renderCountdown, 1000);

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

  $("#year").textContent = new Date().getFullYear();
})();