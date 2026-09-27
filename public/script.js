 const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const resultsContainer = document.getElementById("results");
const resultCount = document.getElementById("resultCount");

const filters = document.querySelectorAll(".filter");

let selectedType = "ALL";

async function search() {
  const query = searchInput.value.trim();

  resultsContainer.innerHTML = "<p>Searching...</p>";

  try {
    let url = `/api/search?q=${encodeURIComponent(query)}`;

    if (selectedType !== "ALL") {
      url += `&type=${encodeURIComponent(selectedType)}`;
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Search request failed");
    }

    const data = await response.json();

    displayResults(data);

  } catch (error) {
    console.error(error);

    resultsContainer.innerHTML = `
      <div class="no-results">
        Something went wrong while searching.
      </div>
    `;

    resultCount.textContent = "";
  }
}

function displayResults(data) {

  resultCount.textContent =
    `${data.total} result${data.total === 1 ? "" : "s"} found`;

  if (data.total === 0) {
    resultsContainer.innerHTML = `
      <div class="no-results">
        No results found.
      </div>
    `;
    return;
  }

  resultsContainer.innerHTML = "";

  data.results.forEach(item => {

    const card = document.createElement("div");

    card.className = "result-card";

    const type = item.contentType || "CONTENT";

    const title = item.title || item.name || "Untitled";

    const description =
      item.summary ||
      item.description ||
      item.metaDescription ||
      item.content ||
      "";

    card.innerHTML = `
      <div class="result-type">
        ${escapeHtml(type)}
      </div>

      <h2>${escapeHtml(title)}</h2>

      <p>
        ${escapeHtml(description)}
      </p>

      ${
        item.url
          ? `<a href="${item.url}" target="_blank">View More →</a>`
          : ""
      }
    `;

    resultsContainer.appendChild(card);
  });
}

function escapeHtml(text) {

  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

searchButton.addEventListener("click", search);

searchInput.addEventListener("keydown", function(event) {

  if (event.key === "Enter") {
    search();
  }

});

filters.forEach(filter => {

  filter.addEventListener("click", function() {

    filters.forEach(button => {
      button.classList.remove("active");
    });

    this.classList.add("active");

    selectedType = this.dataset.type;

    search();

  });

});