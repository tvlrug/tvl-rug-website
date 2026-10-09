(() => {
  "use strict";

  /*
    TVL-RUG Train Running System
    Live dashboard renderer - v0.2

    IMPORTANT:
    - Use the CORRECT Supabase project URL below.
    - Paste the PUBLIC/PUBLISHABLE key only.
    - NEVER place the secret/service_role key in browser JavaScript.
  */

  const SUPABASE_URL = "https://lkmslxzqfhkyzununlow.supabase.co";
  const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_nVKIKH6qMxq23CCZG15RBg_5_iNtxzf";

  const REFRESH_MS = 60_000;
  const HISTORY_ROWS = 180;

  const charts = {};

  function byId(id) {
    return document.getElementById(id);
  }

  function setText(id, value) {
    const el = byId(id);
    if (el) el.textContent = value;
  }

  function formatLondonDateTime(value) {
    if (!value) return "Unknown";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Unknown";

    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(date);
  }

  function formatLondonTime(value) {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "";

    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/London",
      hour: "2-digit",
      minute: "2-digit"
    }).format(date);
  }

  function numberOrDash(value, suffix = "") {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
      return "—";
    }
    return `${Number(value)}${suffix}`;
  }

  function supabaseHeaders() {
    if (
      !SUPABASE_PUBLISHABLE_KEY ||
      SUPABASE_PUBLISHABLE_KEY === "PASTE_PUBLIC_PUBLISHABLE_KEY_HERE"
    ) {
      throw new Error("Supabase public publishable key has not been configured.");
    }

    return {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
    };
  }

  async function fetchLatestSnapshot() {
    const url = new URL(`${SUPABASE_URL}/rest/v1/trs_snapshot`);
    url.searchParams.set(
      "select",
      "snapshot_id,generated_utc,data_as_of_utc,is_data_stale,payload"
    );
    url.searchParams.set("order", "generated_utc.desc");
    url.searchParams.set("limit", "1");

    const response = await fetch(url, {
      headers: supabaseHeaders(),
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Latest TRS snapshot request failed (${response.status}).`);
    }

    const rows = await response.json();
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new Error("No TRS snapshots have been published yet.");
    }

    return rows[0];
  }

  async function fetchSnapshotHistory() {
    const url = new URL(`${SUPABASE_URL}/rest/v1/trs_snapshot`);
    url.searchParams.set(
      "select",
      "generated_utc,payload"
    );
    url.searchParams.set("order", "generated_utc.asc");
    url.searchParams.set("limit", String(HISTORY_ROWS));

    const response = await fetch(url, {
      headers: supabaseHeaders(),
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`TRS history request failed (${response.status}).`);
    }

    return response.json();
  }

  function chartDefaults() {
    Chart.defaults.color = "#d7dde7";
    Chart.defaults.borderColor = "rgba(255,255,255,0.08)";
    Chart.defaults.font.family =
      'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  }

  function destroyChart(name) {
    if (charts[name]) {
      charts[name].destroy();
      charts[name] = null;
    }
  }

  function renderDelayTrend(rows) {
    const canvas = byId("delayTrendChart");
    if (!canvas) return;

    const todayLondon = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/London",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());

    const points = rows
      .map((row) => {
        const generated = row.generated_utc;
        const date = new Date(generated);

        const localDate = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Europe/London",
          year: "numeric",
          month: "2-digit",
          day: "2-digit"
        }).format(date);

        return {
          generated,
          localDate,
          averageDelayMinutes:
            row.payload?.summary?.averageDelayMinutes ?? null
        };
      })
      .filter(
        (x) =>
          x.localDate === todayLondon &&
          x.averageDelayMinutes !== null &&
          x.averageDelayMinutes !== undefined
      );

    destroyChart("delay");

    charts.delay = new Chart(canvas, {
      type: "line",
      data: {
        labels: points.map((x) => formatLondonTime(x.generated)),
        datasets: [{
          label: "Average delay (mins)",
          data: points.map((x) => x.averageDelayMinutes),
          fill: true,
          tension: 0.35,
          pointRadius: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: "index"
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Minutes"
            }
          }
        }
      }
    });
  }

  function renderOperatorSplit(payload) {
    const canvas = byId("operatorSplitChart");
    if (!canvas) return;

    const operators = Array.isArray(payload.operators)
      ? payload.operators
      : [];

    destroyChart("operatorSplit");

    charts.operatorSplit = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: operators.map((x) => x.name || x.code),
        datasets: [{
          data: operators.map((x) => x.services || 0)
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }

  function renderPunctuality(payload) {
    const canvas = byId("punctualityChart");
    if (!canvas) return;

    const operators = Array.isArray(payload.operators)
      ? payload.operators
      : [];

    destroyChart("punctuality");

    charts.punctuality = new Chart(canvas, {
      type: "bar",
      data: {
        labels: operators.map((x) => x.name || x.code),
        datasets: [
          {
            label: "Within 3 minutes",
            data: operators.map((x) => x.within3 || 0)
          },
          {
            label: "Delayed",
            data: operators.map((x) => x.delayed || 0)
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { stacked: false },
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        }
      }
    });
  }

  function renderFeedHealth(payload) {
    const canvas = byId("feedHealthChart");
    if (!canvas) return;

    const summary = payload.summary || {};
    const monitored = Number(summary.servicesMonitored || 0);
    const timed = Number(summary.servicesWithTiming || 0);
    const noTiming = Math.max(monitored - timed, 0);

    destroyChart("feedHealth");

    charts.feedHealth = new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: ["Live timing available", "No current timing"],
        datasets: [{
          data: [timed, noTiming]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }


  const ROUTE_STATIONS = [
    { code: "SLB", id: "stationSaltburn" },
    { code: "RCC", id: "stationRedcar" },
    { code: "MBR", id: "stationMiddlesbrough" },
    { code: "TBY", id: "stationThornaby" },
    { code: "DAR", id: "stationDarlington" }
  ];

  const ROUTE_LINES = [
    { from: "SLB", to: "RCC", id: "lineSaltburnRedcar" },
    { from: "RCC", to: "MBR", id: "lineRedcarMiddlesbrough" },
    { from: "MBR", to: "TBY", id: "lineMiddlesbroughThornaby" },
    { from: "TBY", to: "DAR", id: "lineThornabyDarlington" }
  ];

  function routeStateClass(state) {
    switch (state) {
      case "NORMAL": return "trs-normal";
      case "MONITORING": return "trs-monitoring";
      case "DISRUPTION": return "trs-disruption";
      default: return "trs-unavailable";
    }
  }

  function applyRouteState(element, state) {
    if (!element) return;
    element.classList.remove("active","warning","hotspot","pulse","trs-normal","trs-monitoring","trs-disruption","trs-unavailable");
    element.classList.add(routeStateClass(state));
    if (element.classList.contains("station")) element.classList.add("trs-pulse");
  }

  function renderRoute(payload) {
    const route = Array.isArray(payload.route) ? payload.route : [];
    const routeByCode = new Map(route.map((item) => [item.code, item]));

    ROUTE_STATIONS.forEach((station) => {
      const element = byId(station.id);
      const item = routeByCode.get(station.code);
      applyRouteState(element, item?.state || "UNAVAILABLE");
      if (element && item) {
        const groups = Array.isArray(item.serviceGroups) ? item.serviceGroups.join(", ") : "";
        element.title = `${item.name}: ${item.statusLabel || item.state}` + (groups ? ` | ${groups}` : "");
      }
    });

    ROUTE_LINES.forEach((line) => {
      const element = byId(line.id);
      const from = routeByCode.get(line.from);
      const to = routeByCode.get(line.to);
      let state = "UNAVAILABLE";
      if (from && to) {
        if (from.state === "UNAVAILABLE" || to.state === "UNAVAILABLE") {
          state = "UNAVAILABLE";
        } else {
          const severity = Math.max(Number(from.severity ?? 9), Number(to.severity ?? 9));
          state = severity <= 0 ? "NORMAL" : severity === 1 ? "MONITORING" : "DISRUPTION";
        }
      }
      applyRouteState(element, state);
    });

    const indicator = byId("routeLiveIndicator");
    if (indicator) {
      const unavailable = !route.length || route.some((item) => item.state === "UNAVAILABLE");
      indicator.innerHTML = unavailable ? "<span></span> RAPS route data delayed" : "<span></span> Live RAPS route view";
    }
  }

  function renderSnapshot(row) {
    const payload = row.payload || {};
    const summary = payload.summary || {};
    const operators = Array.isArray(payload.operators)
      ? payload.operators
      : [];

    const stale = Boolean(row.is_data_stale || payload.isDataStale);

    setText(
      "trsLiveState",
      stale ? "RAPS data delayed" : "Live RAPS dashboard"
    );

    setText(
      "trsSystemSummary",
      stale
        ? "The latest RAPS snapshot is older than the configured live-data threshold."
        : "Live operational metrics are generated by TVL-RUG RAPS and published automatically."
    );

    setText(
      "trsSystemStatus",
      stale ? "Status: Data delayed" : "Status: Live operational"
    );

    setText(
      "trsRefreshMode",
      "Refresh mode: RAPS / Supabase"
    );

    setText(
      "trsLastUpdated",
      `Last updated: ${formatLondonDateTime(
        row.data_as_of_utc || payload.dataAsOfUtc || row.generated_utc
      )}`
    );

    setText("miniServices", summary.servicesMonitored ?? "—");
    setText("miniOperators", operators.length);
    setText("miniAlerts", summary.totalCancellations ?? 0);

    setText(
      "kpiWithin3",
      summary.within3Percent === null ||
      summary.within3Percent === undefined
        ? "—"
        : `${Number(summary.within3Percent).toFixed(1)}%`
    );

    setText(
      "kpiWithin3Note",
      `${summary.servicesWithin3 ?? 0} of ${
        summary.servicesWithTiming ?? 0
      } services with live timing`
    );

    setText(
      "kpiAverageDelay",
      summary.averageDelayMinutes === null ||
      summary.averageDelayMinutes === undefined
        ? "—"
        : `${Number(summary.averageDelayMinutes).toFixed(2)}m`
    );

    setText("kpiCancellations", summary.totalCancellations ?? 0);
    setText(
      "kpiCancellationNote",
      `${summary.partCancellations ?? 0} part / ${
        summary.fullCancellations ?? 0
      } full`
    );
    setText("kpiServices", summary.servicesMonitored ?? "—");

    renderOperatorSplit(payload);
    renderPunctuality(payload);
    renderFeedHealth(payload);
    renderRoute(payload);
  }

  function renderError(error) {
    console.error(error);

    setText("trsLiveState", "Live dashboard unavailable");
    setText(
      "trsSystemSummary",
      "The public TRS snapshot could not be loaded. Please check again shortly."
    );
    setText("trsSystemStatus", "Status: Data unavailable");
    setText("trsLastUpdated", "Last updated: unavailable");
  }

  async function refresh() {
    try {
      const [latest, history] = await Promise.all([
        fetchLatestSnapshot(),
        fetchSnapshotHistory()
      ]);

      renderSnapshot(latest);
      renderDelayTrend(history);
    } catch (error) {
      renderError(error);
    }
  }

  chartDefaults();
  refresh();
  window.setInterval(refresh, REFRESH_MS);
})();
