const chartText = "#cbd5e1";
const gridLine = "rgba(255,255,255,0.08)";

new Chart(document.getElementById("delayTrendChart"), {
  type: "line",
  data: {
    labels: ["06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00"],
    datasets: [{
      label: "Average delay (mins)",
      data: [3, 7, 5, 4, 6, 11, 8],
      tension: 0.35,
      fill: true
    }]
  },
  options: {
    plugins: { legend: { labels: { color: chartText } } },
    scales: {
      x: { ticks: { color: chartText }, grid: { color: gridLine } },
      y: { ticks: { color: chartText }, grid: { color: gridLine } }
    }
  }
});

new Chart(document.getElementById("operatorSplitChart"), {
  type: "doughnut",
  data: {
    labels: ["Northern", "TPE", "LNER connections", "Other"],
    datasets: [{
      data: [52, 24, 14, 10]
    }]
  },
  options: {
    plugins: { legend: { labels: { color: chartText } } }
  }
});

new Chart(document.getElementById("issueTypeChart"), {
  type: "bar",
  data: {
    labels: ["Delays", "Connections", "Cancellations", "Crowding", "Facilities"],
    datasets: [{
      label: "Passenger reports",
      data: [18, 14, 6, 9, 7]
    }]
  },
  options: {
    plugins: { legend: { labels: { color: chartText } } },
    scales: {
      x: { ticks: { color: chartText }, grid: { color: gridLine } },
      y: { ticks: { color: chartText }, grid: { color: gridLine } }
    }
  }
});

new Chart(document.getElementById("punctualityChart"), {
  type: "bar",
  data: {
    labels: ["Northern", "TPE", "Connections"],
    datasets: [
      {
        label: "On time",
        data: [84, 76, 68]
      },
      {
        label: "Delayed",
        data: [16, 24, 32]
      }
    ]
  },
  options: {
    plugins: { legend: { labels: { color: chartText } } },
    scales: {
      x: { ticks: { color: chartText }, grid: { color: gridLine } },
      y: { ticks: { color: chartText }, grid: { color: gridLine } }
    }
  }
});
