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


  function themeItem(text, severity = "grey") {
    return { text, severity };
  }

  function renderCurrentThemes(payload) {
    const container = byId("trsCurrentThemes");
    if (!container) return;

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

    const nt = operatorByCode.get("NT");
    const tpe = operatorByCode.get("TPE");

    const themes = [];

    // 1. TPE disruption / delay theme.
    if (tpe) {
      const cancellations = Number(tpe.cancellations || 0);
      const delayed = Number(tpe.delayed || 0);

      if (cancellations > 0) {
        themes.push(
          themeItem(
            `TPE has ${cancellations} current cancellation${cancellations === 1 ? "" : "s"} affecting monitored Tees Valley services.`,
            "red"
          )
        );
      } else if (delayed > 0) {
        themes.push(
          themeItem(
            `TPE has ${delayed} currently delayed service${delayed === 1 ? "" : "s"} across the monitored route.`,
            "amber"
          )
        );
      } else if (Number(tpe.services || 0) > 0) {
        themes.push(
          themeItem(
            "TPE monitored services currently show no live cancellation or delay alert.",
            "green"
          )
        );
      }
    }

    // 2. Northern theme.
    if (nt) {
      const cancellations = Number(nt.cancellations || 0);
      const delayed = Number(nt.delayed || 0);

      if (cancellations > 0) {
        themes.push(
          themeItem(
            `Northern has ${cancellations} current cancellation${cancellations === 1 ? "" : "s"} on monitored local services.`,
            "red"
          )
        );
      } else if (delayed > 0) {
        themes.push(
          themeItem(
            `Northern has ${delayed} currently delayed local service${delayed === 1 ? "" : "s"} being monitored.`,
            "amber"
          )
        );
      } else if (Number(nt.services || 0) > 0) {
        themes.push(
          themeItem(
            "Northern local services are currently operating without a live RAPS disruption alert.",
            "green"
          )
        );
      }
    }

    // 3. Route-specific passenger impact. Prefer disruption, then monitoring.
    const disrupted = route.filter(
      (item) => item.state === "DISRUPTION"
    );

    const monitoring = route.filter(
      (item) => item.state === "MONITORING"
    );

    if (disrupted.length) {
      const names = disrupted.map((item) => item.name).join(", ");
      themes.push(
        themeItem(
          `Current route disruption is affecting ${names}.`,
          "red"
        )
      );
    } else if (monitoring.length) {
      const names = monitoring.map((item) => item.name).join(", ");
      themes.push(
        themeItem(
          `Live route monitoring is focused on ${names}.`,
          "amber"
        )
      );
    } else if (route.length) {
      themes.push(
        themeItem(
          "No monitored Tees Valley route point currently shows a RAPS disruption alert.",
          "green"
        )
      );
    }

    // 4. Darlington connection theme.
    const darlington = routeByCode.get("DAR");

    if (darlington) {
      if (darlington.state === "DISRUPTION") {
        themes.push(
          themeItem(
            `Allow extra time for Darlington connections: ${darlington.statusLabel || "live disruption is affecting the station."}`,
            "red"
          )
        );
      } else if (darlington.state === "MONITORING") {
        themes.push(
          themeItem(
            `Darlington connections are being monitored: ${darlington.statusLabel || "check onward connections before travel."}`,
            "amber"
          )
        );
      } else if (darlington.state === "NORMAL") {
        themes.push(
          themeItem(
            "Darlington is currently showing no live RAPS connection-risk alert.",
            "green"
          )
        );
      }
    }

    // De-duplicate and keep the panel compact.
    const uniqueThemes = [];
    const seen = new Set();

    for (const item of themes) {
      if (!item.text || seen.has(item.text)) continue;
      seen.add(item.text);
      uniqueThemes.push(item);

      if (uniqueThemes.length === 4) break;
    }

    if (!uniqueThemes.length) {
      uniqueThemes.push(
        themeItem(
          "Current passenger-facing themes are not available from the latest snapshot.",
          "grey"
        )
      );
    }

    container.innerHTML = "";

    uniqueThemes.forEach((item) => {
      const li = document.createElement("li");
      const dot = document.createElement("span");

      dot.className = `theme-severity ${item.severity}`;
      dot.setAttribute("aria-hidden", "true");

      li.appendChild(dot);
      li.appendChild(document.createTextNode(item.text));

      container.appendChild(li);
    });
  }


  function plannedSeverityRank(severity) {
    switch (severity) {
      case "DISRUPTION": return 2;
      case "MONITORING": return 1;
      default: return 0;
    }
  }

  function plannedSeverityPresentation(severity) {
    switch (severity) {
      case "DISRUPTION":
        return { css: "red", label: "Disruption" };
      case "MONITORING":
        return { css: "amber", label: "Monitoring" };
      default:
        return { css: "grey", label: "Advisory" };
    }
  }

  function formatPlannedDateRange(startValue, endValue) {
    const start = new Date(startValue);
    const end = new Date(endValue);

    const dateFmt = new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "2-digit",
      month: "short"
    });

    const timeFmt = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });

    const sameDay =
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();

    if (sameDay) {
      return `${dateFmt.format(start)}, ${timeFmt.format(start)}–${timeFmt.format(end)}`;
    }

    return `${dateFmt.format(start)}, ${timeFmt.format(start)} – ${dateFmt.format(end)}, ${timeFmt.format(end)}`;
  }

  async function fetchPlannedDisruption() {
    const url =
      `${SUPABASE_URL}/rest/v1/planned_disruption` +
      `?select=planned_disruption_id,title,start_utc,end_utc,affected_route,severity,passenger_message,source_name,source_url,is_active` +
      `&is_active=eq.true&order=start_utc.asc`;

    const response = await fetch(url, {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
      },
      cache: "no-store"
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(
        `Planned disruption feed failed (${response.status}): ${body}`
      );
    }

    return await response.json();
  }

  function renderPlannedDisruption(rows) {
    const now = new Date();
    const upcomingCutoff = new Date(
      now.getTime() + (7 * 24 * 60 * 60 * 1000)
    );

    const relevant = (Array.isArray(rows) ? rows : [])
      .filter((item) => {
        const end = new Date(item.end_utc);
        const start = new Date(item.start_utc);
        return end >= now && start <= upcomingCutoff;
      })
      .sort((a, b) => {
        const severityDiff =
          plannedSeverityRank(b.severity) -
          plannedSeverityRank(a.severity);

        if (severityDiff !== 0) return severityDiff;
        return new Date(a.start_utc) - new Date(b.start_utc);
      });

    const active = relevant.filter((item) => {
      const start = new Date(item.start_utc);
      const end = new Date(item.end_utc);
      return start <= now && now <= end;
    });

    let headline;
    let cardText;
    let cardPresentation;

    if (active.length) {
      const worst = active.reduce((current, item) =>
        plannedSeverityRank(item.severity) >
        plannedSeverityRank(current.severity)
          ? item
          : current
      );

      cardPresentation =
        plannedSeverityPresentation(worst.severity);

      headline =
        worst.severity === "DISRUPTION"
          ? "Engineering disruption"
          : "Engineering works";

      cardText =
        `${active.length} active planned work item${active.length === 1 ? "" : "s"} affecting monitored travel.`;
    } else if (relevant.length) {
      const next = relevant
        .slice()
        .sort((a, b) =>
          new Date(a.start_utc) - new Date(b.start_utc)
        )[0];

      cardPresentation = {
        css: "amber",
        label: "Upcoming"
      };

      headline = "Works upcoming";
      cardText =
        `${next.title} — ${formatPlannedDateRange(next.start_utc, next.end_utc)}.`;
    } else {
      cardPresentation = {
        css: "green",
        label: "No major works"
      };

      headline = "No major works";
      cardText =
        "No active or upcoming planned disruption is published for the next 7 days.";
    }

    setText("engineeringLiveTitle", headline);
    setText("engineeringLiveText", cardText);
    setStatusPill(
      "engineeringLivePill",
      cardPresentation.css,
      cardPresentation.label
    );

    const summary = byId("engineeringWorksSummary");
    const list = byId("engineeringWorksList");

    if (!summary || !list) return;

    if (!relevant.length) {
      summary.textContent =
        "No active or upcoming planned disruption is published for the next 7 days.";

      list.innerHTML =
        '<div class="engineering-live-item">' +
        '<strong>No major planned works currently listed</strong>' +
        '<p>The dashboard will show published engineering disruption here when available.</p>' +
        '</div>';

      return;
    }

    summary.textContent =
      `${relevant.length} planned work item${relevant.length === 1 ? "" : "s"} currently active or due within the next 7 days.`;

    list.innerHTML = "";

    relevant.slice(0, 3).forEach((item) => {
      const block = document.createElement("div");
      block.className = "engineering-live-item";

      const severity =
        plannedSeverityPresentation(item.severity);

      const title = document.createElement("strong");
      title.textContent = item.title;

      const meta = document.createElement("span");
      meta.className = "engineering-live-meta";
      meta.textContent =
        `${formatPlannedDateRange(item.start_utc, item.end_utc)} · ` +
        `${item.affected_route} · ${severity.label}`;

      const message = document.createElement("p");
      message.textContent = item.passenger_message;

      block.appendChild(title);
      block.appendChild(meta);
      block.appendChild(message);

      list.appendChild(block);
    });
  }

  async function loadPlannedDisruption() {
    try {
      const rows = await fetchPlannedDisruption();
      renderPlannedDisruption(rows);
    } catch (error) {
      console.error("TRS planned disruption load failed:", error);

      setText("engineeringLiveTitle", "Planned works unavailable");
      setText(
        "engineeringLiveText",
        "The planned disruption feed could not be loaded."
      );
      setStatusPill(
        "engineeringLivePill",
        "grey",
        "Unavailable"
      );

      setText(
        "engineeringWorksSummary",
        "Planned engineering information is temporarily unavailable."
      );

      const list = byId("engineeringWorksList");
      if (list) {
        list.innerHTML =
          '<div class="notice-box">Please check operator and National Rail journey planners.</div>';
      }
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
    renderOperationalCards(payload);
    renderCurrentThemes(payload);
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

    const themes = byId("trsCurrentThemes");
    if (themes) {
      themes.innerHTML =
        '<li><span class="theme-severity grey" aria-hidden="true"></span>' +
        'Current passenger-facing themes are unavailable.</li>';
    }
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
  loadPlannedDisruption();
  window.setInterval(refresh, REFRESH_MS);
  window.setInterval(loadPlannedDisruption, 15 * 60 * 1000);
})();
