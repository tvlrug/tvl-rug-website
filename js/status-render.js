document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector("#homepageStatus")) {
    renderHomepageStatus();
  }

  if (document.querySelector("#serviceStatusCards")) {
    renderServiceStatusCards();
  }

  updateRelativeTimes();

  setInterval(updateRelativeTimes, 60000);
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
          <span class="status-time" data-updated="${serviceStatus.updated}">
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

function updateRelativeTimes() {
  const updatedElements = document.querySelectorAll("[data-updated]");

  updatedElements.forEach(element => {
    const updatedDate = new Date(element.dataset.updated);
    const now = new Date();

    if (Number.isNaN(updatedDate.getTime())) {
      element.textContent = "Updated recently";
      return;
    }

    const diffMs = now - updatedDate;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);

    // 🟢 Better logic
    if (diffMinutes < 1) {
      element.textContent = "Updated just now";
    } 
    else if (diffMinutes < 60) {
      element.textContent = `Updated ${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
    } 
    else if (diffHours < 6) {
      element.textContent = `Updated ${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
    } 
    else {
      // 👇 fallback to actual time (much nicer UX)
      const time = updatedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      element.textContent = `Updated today at ${time}`;
    }
  });
}
