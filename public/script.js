const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");
const resultsContainer = document.getElementById("results");
const resultCount = document.getElementById("resultCount");
const filters = document.querySelectorAll(".filter");

let selectedType = "ALL";

/* =========================
   SEARCH
========================= */

async function search() {
  const query = searchInput.value.trim();

  // Empty search
  if (!query) {
    resultCount.textContent = "";

    resultsContainer.innerHTML = `
      <div class="initial-message">
        <div class="initial-icon">⌕</div>
        <h3>Search JPM</h3>
        <p>Enter a keyword to search JPM.</p>
      </div>
    `;

    return;
  }

  resultsContainer.innerHTML = `
    <div class="initial-message">
      <p>Searching...</p>
    </div>
  `;

  resultCount.textContent = "";

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

    displayResults(data, query);

  } catch (error) {
    console.error("Search error:", error);

    resultCount.textContent = "";

    resultsContainer.innerHTML = `
      <div class="no-results">
        Something went wrong while searching.
      </div>
    `;
  }
}


/* =========================
   DISPLAY RESULTS
========================= */

function displayResults(data, query) {
  let results = Array.isArray(data.results)
    ? [...data.results]
    : [];

  /*
    Product priority:
    When "All" is selected, product results
    appear before other content types.
  */
  if (selectedType === "ALL") {
    results.sort((a, b) => {
      const aProduct = a.contentType === "PRODUCT" ? 0 : 1;
      const bProduct = b.contentType === "PRODUCT" ? 0 : 1;

      return aProduct - bProduct;
    });
  }

  resultCount.textContent =
    `${results.length} result${results.length === 1 ? "" : "s"} for "${query}"`;

  if (results.length === 0) {
    resultsContainer.innerHTML = `
      <div class="no-results">
        No results found for "<strong>${escapeHtml(query)}</strong>".
        Try another keyword or select All.
      </div>
    `;

    return;
  }

  resultsContainer.innerHTML = "";

  results.forEach(item => {
    const card = createResultCard(item);
    resultsContainer.appendChild(card);
  });

  // Product Finder connection
  if (selectedType === "PRODUCT") {
    const productFinder = document.createElement("div");

    productFinder.className = "no-results";

    productFinder.innerHTML = `
      <strong>Need more product filters?</strong>
      <br>
      <a href="/products/finder">
        Open Product Finder →
      </a>
    `;

    resultsContainer.appendChild(productFinder);
  }
}


/* =========================
   CREATE RESULT CARD
========================= */

function createResultCard(item) {
  const card = document.createElement("article");

  card.className = "result-card";

  const type = item.contentType || "CONTENT";
  const title = item.title || item.name || "Untitled";

  const description =
    item.summary ||
    item.description ||
    item.metaDescription ||
    item.content ||
    "";

  const metadata = getMetadata(item);
  const linkText = getLinkText(type);

  card.innerHTML = `
    <div class="result-type">
      ${escapeHtml(getTypeLabel(type))}
    </div>

    <h2>
      ${escapeHtml(title)}
    </h2>

    ${
      metadata
        ? `<p><strong>${escapeHtml(metadata)}</strong></p>`
        : ""
    }

    ${
      description
        ? `<p>${escapeHtml(description)}</p>`
        : ""
    }

    ${
      item.url
        ? `
          <a
            href="${escapeHtml(item.url)}"
            ${isExternalUrl(item.url) ? 'target="_blank" rel="noopener noreferrer"' : ""}
          >
            ${escapeHtml(linkText)}
            ${isExternalUrl(item.url) ? " ↗" : " →"}
          </a>
        `
        : ""
    }
  `;

  return card;
}


/* =========================
   METADATA BY CONTENT TYPE
========================= */

function getMetadata(item) {
  switch (item.contentType) {

    case "PRODUCT":
      return [
        item.genericName,
        item.category
      ]
        .filter(Boolean)
        .join(" • ");

    case "NEWS":
      return formatDate(item.newsDate);

    case "PUBLICATION":
      const authors = Array.isArray(item.authors)
        ? item.authors.join(", ")
        : item.authors;

      return [
        authors,
        item.year
      ]
        .filter(Boolean)
        .join(" • ");

    case "PATENT":
      const inventors = Array.isArray(item.inventors)
        ? item.inventors.join(", ")
        : item.inventors;

      return inventors || "";

    case "PAGE":
      return item.breadcrumb || item.pageType || "";

    default:
      return "";
  }
}


/* =========================
   TYPE LABEL
========================= */

function getTypeLabel(type) {
  const labels = {
    PRODUCT: "Product",
    NEWS: "News",
    PUBLICATION: "Scientific Publication",
    PATENT: "Patent",
    PAGE: "Page"
  };

  return labels[type] || "Content";
}


/* =========================
   LINK TEXT
========================= */

function getLinkText(type) {
  const links = {
    PRODUCT: "View product",
    NEWS: "Read news",
    PUBLICATION: "View publication",
    PATENT: "View patent",
    PAGE: "View page"
  };

  return links[type] || "View more";
}


/* =========================
   DATE FORMAT
========================= */

function formatDate(date) {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(`${date}T00:00:00`);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
}


/* =========================
   EXTERNAL URL
========================= */

function isExternalUrl(url) {
  return /^https?:\/\//i.test(url);
}


/* =========================
   ESCAPE HTML
========================= */

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* =========================
   EVENTS
========================= */

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

    // Only search again if a keyword exists
    if (searchInput.value.trim()) {
      search();
    }
  });
});