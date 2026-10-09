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

    Chart.defaults.plugins.legend.labels.usePointStyle = true;
    Chart.defaults.plugins.legend.labels.boxWidth = 10;
    Chart.defaults.plugins.legend.labels.boxHeight = 10;
    Chart.defaults.plugins.legend.labels.padding = 16;
  }

  const CHART_COLORS = {
    blue: "#36a2eb",
    blueFill: "rgba(54,162,235,0.28)",
    green: "#46d17a",
    greenFill: "rgba(70,209,122,0.32)",
    amber: "#f3b633",
    amberFill: "rgba(243,182,51,0.32)",
    red: "#ef5f68",
    redFill: "rgba(239,95,104,0.34)",
    pink: "#ff6384",
    orange: "#ff9f40",
    yellow: "#ffcd56",
    grey: "#667085",
    greyLight: "#aab3c0"
  };

  function operatorColor(code, index) {
    const map = {
      NT: CHART_COLORS.blue,
      TPE: CHART_COLORS.pink,
      LNER: CHART_COLORS.orange,
      GC: CHART_COLORS.yellow
    };
    return map[code] || [
      CHART_COLORS.blue,
      CHART_COLORS.pink,
      CHART_COLORS.orange,
      CHART_COLORS.yellow,
      CHART_COLORS.greyLight
    ][index % 5];
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
          borderColor: CHART_COLORS.blue,
          backgroundColor: CHART_COLORS.blueFill,
          pointBackgroundColor: CHART_COLORS.blue,
          pointBorderColor: CHART_COLORS.blue,
          pointHoverRadius: 5,
          borderWidth: 2.5,
          fill: true,
          tension: 0.35,
          pointRadius: points.length > 18 ? 0 : 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: "index"
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) =>
                `Average delay: ${Number(context.raw ?? 0).toFixed(2)} min`
            }
          }
        },
        scales: {
          x: {
            grid: {
              color: "rgba(255,255,255,0.05)"
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(255,255,255,0.08)"
            },
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
          data: operators.map((x) => x.services || 0),
          backgroundColor: operators.map((x, index) =>
            operatorColor(x.code, index)
          ),
          borderColor: "#20242b",
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "52%",
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = Number(context.raw || 0);
                const total = operators.reduce(
                  (sum, item) => sum + Number(item.services || 0),
                  0
                );
                const pct = total
                  ? (100 * value / total).toFixed(1)
                  : "0.0";
                return `${context.label}: ${value} (${pct}%)`;
              }
            }
          }
        }
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
            data: operators.map((x) => x.within3 || 0),
            backgroundColor: CHART_COLORS.green,
            borderColor: CHART_COLORS.green,
            borderWidth: 1,
            borderRadius: 4
          },
          {
            label: "Delayed",
            data: operators.map((x) => x.delayed || 0),
            backgroundColor: CHART_COLORS.red,
            borderColor: CHART_COLORS.red,
            borderWidth: 1,
            borderRadius: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) =>
                `${context.dataset.label}: ${Number(context.raw || 0)} service(s)`
            }
          }
        },
        scales: {
          x: {
            stacked: false,
            grid: {
              display: false
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: "rgba(255,255,255,0.08)"
            },
            ticks: {
              precision: 0,
              stepSize: 1
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
          data: [timed, noTiming],
          backgroundColor: [
            CHART_COLORS.green,
            CHART_COLORS.grey
          ],
          borderColor: "#20242b",
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "52%",
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) =>
                `${context.label}: ${Number(context.raw || 0)} service(s)`
            }
          }
        }
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


  function setStatusPill(id, cssClass, label) {
    const el = byId(id);
    if (!el) return;

    el.classList.remove("green", "amber", "red", "grey");
    el.classList.add(cssClass);
    el.textContent = label;
  }

  function operatorOperationalState(operator) {
    if (!operator) {
      return {
        css: "grey",
        label: "Unavailable",
        title: "Live data unavailable",
        text: "No current RAPS operator data is available."
      };
    }

    const services = Number(operator.services || 0);
    const delayed = Number(operator.delayed || 0);
    const cancellations = Number(operator.cancellations || 0);

    if (services === 0) {
      return {
        css: "grey",
        label: "No current services",
        title: "No current services",
        text: "No monitored services are currently within the live window."
      };
    }

    if (cancellations > 0) {
      return {
        css: "red",
        label: cancellations === 1 ? "1 cancellation" : `${cancellations} cancellations`,
        title: "Service disruption",
        text:
          `${cancellations} cancellation${cancellations === 1 ? "" : "s"} ` +
          `and ${delayed} delayed service${delayed === 1 ? "" : "s"} ` +
          `across ${services} currently monitored service${services === 1 ? "" : "s"}.`
      };
    }

    if (delayed > 0) {
      return {
        css: "amber",
        label: "Monitoring",
        title: "Delays being monitored",
        text:
          `${delayed} of ${services} currently monitored service${services === 1 ? "" : "s"} ` +
          `${delayed === 1 ? "is" : "are"} outside 3 minutes.`
      };
    }

    return {
      css: "green",
      label: "Good service",
      title: "Good service",
      text:
        `${services} currently monitored service${services === 1 ? "" : "s"} ` +
        `with no live delay or cancellation alert.`
    };
  }

  function routeOperationalState(item, defaultName = "Route") {
    if (!item || item.state === "UNAVAILABLE") {
      return {
        css: "grey",
        label: "Unavailable",
        title: "Live data unavailable",
        text: `${defaultName} live route data is currently unavailable.`
      };
    }

    if (item.state === "DISRUPTION") {
      return {
        css: "red",
        label: "Disruption",
        title: "Disruption affecting route",
        text: item.statusLabel || `${defaultName} is currently affected by disruption.`
      };
    }

    if (item.state === "MONITORING") {
      return {
        css: "amber",
        label: "Monitoring",
        title: "Route being monitored",
        text: item.statusLabel || `${defaultName} currently requires monitoring.`
      };
    }

    return {
      css: "green",
      label: "Normal",
      title: "Normal",
      text: item.statusLabel || `${defaultName} is operating normally.`
    };
  }

  function renderOperationalCards(payload) {
    const operators = Array.isArray(payload.operators)
      ? payload.operators
      : [];

    const route = Array.isArray(payload.route)
      ? payload.route
      : [];

    const operatorByCode = new Map(
      operators.map((item) => [item.code, item])
    );

    const routeByCode = new Map(
      route.map((item) => [item.code, item])
    );

    const northern = operatorOperationalState(
      operatorByCode.get("NT")
    );

    const tpe = operatorOperationalState(
      operatorByCode.get("TPE")
    );

    const darlington = routeOperationalState(
      routeByCode.get("DAR"),
      "Darlington"
    );

    setText("northernLiveTitle", northern.title);
    setText("northernLiveText", northern.text);
    setStatusPill("northernLivePill", northern.css, northern.label);

    setText("tpeLiveTitle", tpe.title);
    setText("tpeLiveText", tpe.text);
    setStatusPill("tpeLivePill", tpe.css, tpe.label);

    setText("connectionsLiveTitle", darlington.title);
    setText("connectionsLiveText", darlington.text);
    setStatusPill(
      "connectionsLivePill",
      darlington.css,
      darlington.label
    );

    setText(
      "boardNorthernText",
      northern.text
    );
    setStatusPill(
      "boardNorthernPill",
      northern.css,
      northern.label
    );

    setText(
      "boardTpeText",
      tpe.text
    );
    setStatusPill(
      "boardTpePill",
      tpe.css,
      tpe.label
    );

    setText(
      "boardConnectionsText",
      darlington.text
    );
    setStatusPill(
      "boardConnectionsPill",
      darlington.css,
      darlington.label
    );

    const usableRoute = route.filter(
      (item) => item.state !== "UNAVAILABLE"
    );

    let corridor;

    if (!usableRoute.length) {
      corridor = {
        css: "grey",
        label: "Unavailable",
        text: "Live route intelligence is currently unavailable."
      };
    } else {
      const worst = Math.max(
        ...usableRoute.map((item) => Number(item.severity || 0))
      );

      const affected = usableRoute.filter(
        (item) => Number(item.severity || 0) === worst
      );

      const names = affected.map((item) => item.name).join(", ");

      if (worst >= 2) {
        corridor = {
          css: "red",
          label: "Disruption",
          text: `Highest live route severity is disruption at ${names}.`
        };
      } else if (worst === 1) {
        corridor = {
          css: "amber",
          label: "Monitoring",
          text: `Live route monitoring is currently focused on ${names}.`
        };
      } else {
        corridor = {
          css: "green",
          label: "Normal",
          text: "No live route section is currently showing a RAPS disruption alert."
        };
      }
    }

    setText("boardCorridorText", corridor.text);
    setStatusPill(
      "boardCorridorPill",
      corridor.css,
      corridor.label
    );
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
    renderOperationalCards(payload);
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

    [
      ["northernLiveTitle", "Live data unavailable"],
      ["northernLiveText", "Northern live status could not be loaded."],
      ["tpeLiveTitle", "Live data unavailable"],
      ["tpeLiveText", "TPE live status could not be loaded."],
      ["connectionsLiveTitle", "Live data unavailable"],
      ["connectionsLiveText", "Darlington live route status could not be loaded."],
      ["boardNorthernText", "Live data unavailable."],
      ["boardTpeText", "Live data unavailable."],
      ["boardConnectionsText", "Live data unavailable."],
      ["boardCorridorText", "Live route intelligence unavailable."]
    ].forEach(([id, value]) => setText(id, value));

    [
      "northernLivePill",
      "tpeLivePill",
      "connectionsLivePill",
      "boardNorthernPill",
      "boardTpePill",
      "boardConnectionsPill",
      "boardCorridorPill"
    ].forEach((id) => setStatusPill(id, "grey", "Unavailable"));
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
