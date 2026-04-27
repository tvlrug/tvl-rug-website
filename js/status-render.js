document.addEventListener("DOMContentLoaded", () => {
  applyEngineeringEscalation();

  if (document.querySelector("#homepageStatus")) {
    renderHomepageStatus();
  }

  if (document.querySelector("#homepageEngineeringBanner")) {
    renderHomepageEngineeringBanner();
  }

  if (document.querySelector("#serviceStatusCards")) {
    renderServiceStatusCards();
  }

  if (document.querySelector("#serviceStatusOverview")) {
    renderServiceStatusOverview();
  }

  if (document.querySelector("#engineeringWorksContainer")) {
    renderEngineeringWorks();
  }
});

function todayOnly(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDate(dateString) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function daysUntil(startDate) {
  const today = todayOnly();
  const start = todayOnly(parseDate(startDate));
  return Math.ceil((start - today) / 86400000);
}

function isEngineeringActive(work) {
  const today = todayOnly();
  const start = todayOnly(parseDate(work.startDate));
  const end = todayOnly(parseDate(work.endDate));

  return today >= start && today <= end;
}

function isEngineeringSoon(work) {
  const days = daysUntil(work.startDate);
  return days >= 0 && days <= 5;
}

function getVisibleEngineeringWorks() {
  if (!serviceStatus.engineeringWorks) return [];

  return serviceStatus.engineeringWorks.filter(work =>
    isEngineeringActive(work) || isEngineeringSoon(work)
  );
}

function applyEngineeringEscalation() {
  const activeWorks = serviceStatus.engineeringWorks?.some(isEngineeringActive);

  if (activeWorks) {
    serviceStatus.overall = "major";
  }
}

function getOverallLabel(status) {
  if (status === "good") return "Good service";
  if (status === "minor") return "Disruption possible";
  if (status === "major") return "Engineering works active";
  return "Service update";
}

function renderHomepageStatus() {
  const strip = document.querySelector("#homepageStatus");
  const text = document.querySelector("#homepageStatusText");
  const dot = document.querySelector("#homepageStatusDot");
  const label = document.querySelector("#homepageStatusLabel");
  const updated = document.querySelector("#homepageStatusUpdated");

  strip.className = `status-strip-inner status-${serviceStatus.overall}`;

  if (dot) dot.className = `status-dot status-dot-${serviceStatus.overall}`;
  if (label) label.textContent = getOverallLabel(serviceStatus.overall);
  if (text) text.textContent = serviceStatus.routes.map(route => route.short).join(" · ");
  if (updated) updated.textContent = `Updated: ${serviceStatus.updated}`;
}

function renderHomepageEngineeringBanner() {
  const banner = document.querySelector("#homepageEngineeringBanner");
  const visibleWorks = getVisibleEngineeringWorks();

  if (!banner) return;

  if (visibleWorks.length === 0) {
    banner.closest(".engineering-strip").style.display = "none";
    return;
  }

  const nextWork = visibleWorks[0];
  const active = isEngineeringActive(nextWork);

  banner.innerHTML = `
    <div class="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
      <div>
        <i class="bi bi-tools me-2"></i>
        <strong>${active ? "Engineering works active" : "Upcoming engineering works"}</strong>
        <span class="engineering-strip-text">
          ${nextWork.date}: ${nextWork.route} — ${nextWork.title}
        </span>
      </div>

      <a href="service-status.html" class="btn btn-outline-tvl btn-sm">
        View details
      </a>
    </div>
  `;
}

function renderServiceStatusCards() {
  const container = document.querySelector("#serviceStatusCards");

  container.innerHTML = serviceStatus.routes.map(route => `
    <div class="col-lg-6">
      <div class="status-route-card status-${route.status} status-card-animate">
        <div class="status-header">
          <span class="status-label">
            <i class="bi ${route.icon} status-icon ${route.status !== "good" ? "status-pulse" : ""}"></i>
            ${route.label}
          </span>
          <span class="status-time">
            Updated: ${serviceStatus.updated}
          </span>
        </div>

        <h2>${route.title}</h2>

        <p class="status-row"><strong>Issue:</strong> ${route.issue}</p>
        <p class="status-row"><strong>Impact:</strong> ${route.impact}</p>
        <p class="status-row"><strong>Advice:</strong> ${route.advice}</p>
      </div>
    </div>
  `).join("");
}

function renderServiceStatusOverview() {
  const overview = document.querySelector("#serviceStatusOverview");
  const activeWorks = serviceStatus.engineeringWorks?.some(isEngineeringActive);
  const minor = serviceStatus.routes.some(route => route.status === "minor");
  const major = serviceStatus.routes.some(route => route.status === "major");

  if (activeWorks) {
    overview.textContent =
      "Engineering works are currently active on part of the wider route. Rail replacement buses may be in operation. Passengers should check before travelling and allow extra time.";
  } else if (major) {
    overview.textContent =
      "Major disruption is currently affecting one or more monitored service groups. Passengers should check official operator and National Rail information before travelling.";
  } else if (minor) {
    overview.textContent =
      "No major disruption is currently reported, but passengers should check before travelling on longer-distance services or where alterations may apply.";
  } else {
    overview.textContent =
      "Services are currently reported as operating normally across the monitored routes.";
  }
}

function renderEngineeringWorks() {
  const container = document.querySelector("#engineeringWorksContainer");

  if (!container) return;

  if (!serviceStatus.engineeringWorks || serviceStatus.engineeringWorks.length === 0) {
    container.innerHTML = `
      <div class="col-12">
        <div class="card p-4">
          <p class="mb-0">No planned engineering works currently listed.</p>
        </div>
      </div>
    `;
    return;
  }

  container.innerHTML = serviceStatus.engineeringWorks.map(work => `
    <div class="col-md-6">
      <div class="card p-4 h-100 engineering-card">
        <span class="badge-news mb-2">${work.date}</span>
        <h3 class="h5">${work.route}</h3>
        <p class="news-meta mb-2">${work.title}</p>
        <p class="mb-1"><strong>Impact:</strong> ${work.impact}</p>
        <p class="mb-0"><strong>Advice:</strong> ${work.advice}</p>
      </div>
    </div>
  `).join("");
}
