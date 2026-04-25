document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector("#homepageStatus")) {
    renderHomepageStatus();
  }

  if (document.querySelector("#serviceStatusCards")) {
    renderServiceStatusCards();
  }

});

function renderHomepageStatus() {
  const strip = document.querySelector("#homepageStatus");
  const text = document.querySelector("#homepageStatusText");

  strip.className = `status-strip-inner status-${serviceStatus.overall}`;
  text.textContent = serviceStatus.routes.map(route => route.short).join(" · ");
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


