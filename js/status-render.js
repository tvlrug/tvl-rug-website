document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector("#homepageStatus")) {
    renderHomepageStatus();
  }

  if (document.querySelector("#serviceStatusCards")) {
    renderServiceStatusCards();
  }

  if (document.querySelector("#serviceStatusOverview")) {
    renderServiceStatusOverview();
  }
});

function getOverallLabel(status) {
  if (status === "good") return "Good service";
  if (status === "minor") return "Check before travel";
  if (status === "major") return "Major disruption";
  return "Service update";
}

function renderHomepageStatus() {
  const strip = document.querySelector("#homepageStatus");
  const text = document.querySelector("#homepageStatusText");
  const dot = document.querySelector("#homepageStatusDot");
  const label = document.querySelector("#homepageStatusLabel");
  const updated = document.querySelector("#homepageStatusUpdated");

  strip.className = `status-strip-inner status-${serviceStatus.overall}`;

  if (dot) {
    dot.className = `status-dot status-dot-${serviceStatus.overall}`;
  }

  if (label) {
    label.textContent = getOverallLabel(serviceStatus.overall);
  }

  if (text) {
    text.textContent = serviceStatus.routes.map(route => route.short).join(" · ");
  }

  if (updated) {
    updated.textContent = `Updated: ${serviceStatus.updated}`;
  }
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

  const major = serviceStatus.routes.some(route => route.status === "major");
  const minor = serviceStatus.routes.some(route => route.status === "minor");

  if (major) {
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
