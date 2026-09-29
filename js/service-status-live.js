(() => {
  "use strict";

  const SUPABASE_URL = "https://lopkjhmahofslsyfxrxp.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_KBtZGWGCZxh5j34F-aaijQ_rAc0kA3K";

  const SERVICE_ORDER = ["TVL_NT", "TPE_MANCHESTER"];

  const STATUS_STYLE = {
    GOOD_SERVICE: { card: "success", icon: "bi-check-circle-fill", strip: "status-good", dot: "status-dot-good" },
    MINOR_DELAYS: { card: "warning", icon: "bi-exclamation-circle-fill", strip: "status-minor", dot: "status-dot-minor" },
    SEVERE_DELAYS: { card: "danger", icon: "bi-exclamation-triangle-fill", strip: "status-major", dot: "status-dot-major" },
    PART_CANCELLATIONS: { card: "danger", icon: "bi-x-circle-fill", strip: "status-major", dot: "status-dot-major" },
    MAJOR_DISRUPTION: { card: "danger", icon: "bi-exclamation-octagon-fill", strip: "status-major", dot: "status-dot-major" },
    SERVICE_SUSPENDED: { card: "danger", icon: "bi-slash-circle-fill", strip: "status-major", dot: "status-dot-major" },
    DATA_UNAVAILABLE: { card: "secondary", icon: "bi-question-circle-fill", strip: "status-minor", dot: "status-dot-minor" }
  };

  function styleFor(row) {
    if (row.is_data_stale) return STATUS_STYLE.DATA_UNAVAILABLE;
    return STATUS_STYLE[row.primary_status_code] || STATUS_STYLE.DATA_UNAVAILABLE;
  }

  function displayStatus(row) {
    if (row.is_data_stale) return "Live information unavailable";
    return row.status_label || row.primary_status_code || "Service status";
  }

  function formatTime(value) {
    if (!value) return "Unknown";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown";
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    }).format(date);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  async function fetchStatus() {
    if (!SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY === "PASTE_PUBLIC_PUBLISHABLE_KEY_HERE") {
      throw new Error("Supabase publishable key has not been configured.");
    }

    const url = new URL(`${SUPABASE_URL}/rest/v1/service_status`);
    url.searchParams.set("select", "*");
    url.searchParams.set("service_group_code", `in.(${SERVICE_ORDER.join(",")})`);

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
      },
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Supabase service-status request failed (${response.status}).`);
    }

    const rows = await response.json();
    rows.sort((a, b) => SERVICE_ORDER.indexOf(a.service_group_code) - SERVICE_ORDER.indexOf(b.service_group_code));
    return rows;
  }

  function renderServiceCards(rows) {
    const container = document.getElementById("serviceStatusCards");
    if (!container) return;

    if (!rows.length) {
      container.innerHTML = '<div class="col-12"><div class="alert alert-secondary mb-0">Live service status is temporarily unavailable.</div></div>';
      return;
    }

    container.innerHTML = rows.map((row) => {
      const style = styleFor(row);
      const status = displayStatus(row);

      return `
        <div class="col-lg-6">
          <article class="card h-100 border-${style.card}">
            <div class="card-body p-4">
              <div class="d-flex align-items-start justify-content-between gap-3 mb-3">
                <div>
                  <span class="badge text-bg-${style.card} mb-2">${escapeHtml(row.homepage_label)}</span>
                  <h2 class="h7 mb-1">${escapeHtml(row.service_group_name)}</h2>
                </div>
                <i class="bi ${style.icon} fs-3 text-${style.card}" aria-hidden="true"></i>
              </div>
              <h3 class="h6 text-${style.card}">${escapeHtml(status)}</h3>
              <dl class="row mb-3">
                <dt class="col-sm-3">Issue</dt>
                <dd class="col-sm-9">${escapeHtml(row.issue_text || "No current issue reported.")}</dd>
                <dt class="col-sm-3">Impact</dt>
                <dd class="col-sm-9">${escapeHtml(row.impact_text || "No significant impact currently reported.")}</dd>
                <dt class="col-sm-3">Advice</dt>
                <dd class="col-sm-9">${escapeHtml(row.advice_text || "Check your train before travelling.")}</dd>
              </dl>
              <p class="small text-secondary mb-0">Updated ${escapeHtml(formatTime(row.data_as_of_utc || row.calculated_utc))}</p>
            </div>
          </article>
        </div>`;
    }).join("");
  }

  function renderOverview(rows) {
    const element = document.getElementById("serviceStatusOverview");
    if (!element) return;
    element.textContent = rows.length
      ? rows.map((row) => `${row.homepage_label}: ${displayStatus(row)}`).join(" • ")
      : "Live service information is temporarily unavailable.";
  }

  function renderHomepage(rows) {
    const wrapper = document.getElementById("homepageStatus");
    const dot = document.getElementById("homepageStatusDot");
    const label = document.getElementById("homepageStatusLabel");
    const text = document.getElementById("homepageStatusText");
    const updated = document.getElementById("homepageStatusUpdated");
    if (!wrapper || !dot || !label || !text || !updated) return;

    if (!rows.length) {
      wrapper.className = "status-strip-inner status-minor";
      dot.className = "status-dot status-dot-minor";
      label.textContent = "Current service status";
      text.textContent = "Live information is temporarily unavailable.";
      updated.textContent = "Updated: unavailable";
      return;
    }

    const worst = [...rows].sort((a, b) => {
      const aa = a.is_data_stale ? 99 : (a.primary_severity ?? 0);
      const bb = b.is_data_stale ? 99 : (b.primary_severity ?? 0);
      return bb - aa;
    })[0];

    const style = styleFor(worst);
    wrapper.className = `status-strip-inner ${style.strip}`;
    dot.className = `status-dot ${style.dot}`;
    label.textContent = "Current service status";
    text.textContent = rows.map((row) => `${row.homepage_label}: ${displayStatus(row)}`).join(" • ");

    const newest = rows.map((row) => row.data_as_of_utc || row.calculated_utc).filter(Boolean).sort().at(-1);
    updated.textContent = `Updated: ${formatTime(newest)}`;
  }

  function renderFailure(error) {
    console.error("TVL-RUG service status:", error);
    renderServiceCards([]);
    renderOverview([]);
    renderHomepage([]);
  }

  async function initialise() {
    try {
      const rows = await fetchStatus();
      renderServiceCards(rows);
      renderOverview(rows);
      renderHomepage(rows);
    } catch (error) {
      renderFailure(error);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialise);
  } else {
    initialise();
  }
})();
