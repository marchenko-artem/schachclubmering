function convertMarkdown(text) {
  return marked.parse(text);
}

function stripHtml(html) {
  let doc = new DOMParser().parseFromString(html, "text/html");
  return doc.body.textContent || "";
}

function convertGoogleDriveLink(link) {
  let match = link.match(/(?:\/d\/|id=)([-\w]{25,})/);
  return match ? `https://lh3.googleusercontent.com/d/${match[1]}` : link;
}

function formatDate(isoString) {
  let date = new Date(isoString);
  let day = String(date.getDate()).padStart(2, "0");
  let month = String(date.getMonth() + 1).padStart(2, "0");
  let year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

let currentPage = 1;
let newsData = [];
const pageSize = 10;

// async function loadNews() {
//   const url =
//     "https://script.google.com/macros/s/AKfycbxQnVhEKok0dzophckOLB8ij4yiVUx-BVxh7Z3JB_EpXiXrFLNlzFEbr9gLStpYimNBrw/exec";
//   try {
//     let response = await fetch(url);
//     newsData = await response.json();

//     if (newsData.length === 0) {
//       document.getElementById("news-container").innerHTML =
//         "<p>Es gibt noch keine Neuigkeiten</p>";
//       return;
//     }

//     newsData.sort((a, b) => new Date(b.date) - new Date(a.date));
//     displayNews();
//   } catch (error) {
//     console.error("Fehler beim Laden von Nachrichten:", error);
//     document.getElementById("news-container").innerHTML = "<p>Fehler</p>";
//   }
// }

// ЗАМЕНИ только эту функцию:
async function loadNews() {
  const container = document.getElementById("news-container");

  try {
    const res = await fetch("news.html", { cache: "no-store" });
    const html = await res.text();
    const doc = new DOMParser().parseFromString(html, "text/html");

    // Ищем таблицу: сначала #news-table, если нет — первый <table>
    const table =
      doc.querySelector("#news-table") || doc.querySelector("table");
    if (!table) {
      if (container)
        container.innerHTML = "<p>Es gibt noch keine Neuigkeiten</p>";
      newsData = [];
      updatePaginationButtons?.();
      return;
    }

    // Заголовки (thead th, либо первая строка)
    const headerCells = table.querySelectorAll("thead th").length
      ? Array.from(table.querySelectorAll("thead th"))
      : Array.from(
          table.querySelectorAll("tr:first-child th, tr:first-child td")
        );

    const headers = headerCells.map((h) => (h.textContent || "").trim());
    const idxOf = (name) =>
      headers.findIndex((h) => h.toLowerCase() === name.toLowerCase());

    const idx = {
      id: idxOf("ID"),
      title: idxOf("Artikeltitel"),
      text: idxOf("Text"),
      date: idxOf("Datum"),
      images: Array.from({ length: 10 }, (_, i) => idxOf(`Bild${i + 1}`)),
    };

    // Строки данных
    let rows = Array.from(table.querySelectorAll("tbody tr"));
    if (!rows.length) {
      // если нет <tbody>, берём все строки, кроме первой (с заголовками)
      rows = Array.from(table.querySelectorAll("tr")).slice(1);
    }

    newsData = rows
      .map((tr, i) => {
        const cells = Array.from(tr.children);
        const getText = (ix) =>
          ix >= 0 && cells[ix] ? (cells[ix].textContent || "").trim() : "";
        const getHTML = (ix) =>
          ix >= 0 && cells[ix] ? (cells[ix].innerHTML || "").trim() : "";

        const id = getText(idx.id) || `row-${i + 1}`;
        const title = getText(idx.title);
        const text = getHTML(idx.text); // разрешаем простой HTML/markdown-текст
        const rawDate = getText(idx.date);
        const date = parseDateFlexible(rawDate);

        const images = idx.images
          .map((ix) => getText(ix))
          .filter(Boolean)
          .map(resolveLocalPath);

        return { id, title, text, date, images };
      })
      .filter((n) => n.title || n.text);

    if (!newsData.length) {
      if (container)
        container.innerHTML = "<p>Es gibt noch keine Neuigkeiten</p>";
      updatePaginationButtons?.();
      return;
    }

    // Сортировка по дате (пустые в конец)
    newsData.sort((a, b) => {
      const at = a.date ? a.date.getTime() : -Infinity;
      const bt = b.date ? b.date.getTime() : -Infinity;
      return bt - at;
    });

    displayNews();
  } catch (error) {
    console.error("Fehler beim Laden von Nachrichten:", error);
    if (container) container.innerHTML = "<p>Fehler</p>";
    updatePaginationButtons?.();
  }

  // --- вспомогательные (локальные) ---
  function resolveLocalPath(filename) {
    if (!filename) return "";
    const f = filename.trim();

    // Если уже URL или абсолютный путь — оставляем как есть
    if (
      /^https?:\/\//i.test(f) ||
      f.startsWith("/") ||
      f.startsWith("./") ||
      f.startsWith("../")
    ) {
      return f;
    }

    // Если просто имя файла — добавляем префикс "foto/"
    return `foto/${f}`;
  }

  function parseDateFlexible(s) {
    if (!s) return null;
    const m = s.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/); // dd.mm.yyyy
    if (m) {
      const d = new Date(+m[3], +m[2] - 1, +m[1]);
      return isNaN(d) ? null : d;
    }
    const d = new Date(s); // ISO и т.п.
    return isNaN(d) ? null : d;
  }
}

function displayNews() {
  const container = document.getElementById("news-container");
  container.innerHTML = "";

  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pageNews = newsData.slice(start, end);

  pageNews.forEach((news) => {
    const fullText = marked.parse(news.text || "Kein Text");
    const plainText = stripHtml(fullText);
    const shortText =
      plainText.length > 120 ? plainText.substring(0, 120) + "..." : plainText;
    const formattedDate = formatDate(news.date);

    let imagesHtml = "";
    if (news.images && news.images.length > 0) {
      news.images.forEach((image, index) => {
        const imageUrl = convertGoogleDriveLink(image);
        imagesHtml += `<img src="${imageUrl}" class="news-image ${
          index === 0 ? "active" : ""
        }" alt="Bild">`;
      });
    }

    const newsHtml = `
            <div class="news-item">
                <h3>${news.title}</h3>
                <p class="news-text">
                   <div class="short-text">${shortText}</div>
<div class="full-text">${fullText}</div>
                    <button class="toggle-text">Weiterlesen</button>
                </p>
                <small>${formattedDate}</small>
                <div class="news-carousel">
                    ${
                      news.images.length > 1
                        ? `
                    <button class="prev">&#10094;</button>
                    <div class="carousel-images">${imagesHtml}</div>
                    <button class="next">&#10095;</button>
                    `
                        : imagesHtml
                    }
                </div>
            </div>
        `;

    container.innerHTML += newsHtml;
  });

  setupToggleText();
  setupCarousel();
  updatePaginationButtons();
}

function setupToggleText() {
  document.querySelectorAll(".toggle-text").forEach((button) => {
    button.addEventListener("click", function () {
      const newsItem = this.closest(".news-item");
      newsItem.classList.toggle("expanded");

      this.textContent = newsItem.classList.contains("expanded")
        ? "Ausblenden"
        : "Weiterlesen";
    });
  });
}

function setupCarousel() {
  document.querySelectorAll(".news-carousel").forEach((carousel) => {
    const images = carousel.querySelectorAll(".news-image");
    const prevButton = carousel.querySelector(".prev");
    const nextButton = carousel.querySelector(".next");

    if (!images.length || !prevButton || !nextButton) return;

    let currentIndex = 0;
    function showImage(index) {
      images.forEach((img, i) => img.classList.toggle("active", i === index));
    }

    prevButton.addEventListener("click", () => {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      showImage(currentIndex);
    });

    nextButton.addEventListener("click", () => {
      currentIndex = (currentIndex + 1) % images.length;
      showImage(currentIndex);
    });

    showImage(currentIndex);
  });
}

function updatePaginationButtons() {
  document.getElementById("prevPage").disabled = currentPage === 1;
  document.getElementById("nextPage").disabled =
    currentPage * pageSize >= newsData.length;
}

document.getElementById("prevPage").addEventListener("click", () => {
  currentPage--;
  displayNews();
});

document.getElementById("nextPage").addEventListener("click", () => {
  currentPage++;
  displayNews();
});

function stripHtml(html) {
  return (
    new DOMParser().parseFromString(html, "text/html").body.textContent || ""
  );
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString("de-DE");
}

function convertGoogleDriveLink(link) {
  let match = link.match(/(?:\/d\/|id=)([-\w]{25,})/);
  return match ? `https://lh3.googleusercontent.com/d/${match[1]}` : link;
}

document.addEventListener("DOMContentLoaded", function () {
  loadNews();
  const menuToggle = document.querySelector(".menu-toggle");
  const navList = document.querySelector(".nav-list");

  menuToggle.addEventListener("click", function () {
    navList.classList.toggle("active");
  });

  const sections = document.querySelectorAll(".section");

  const revealSections = () => {
    sections.forEach((section) => {
      const sectionTop = section.getBoundingClientRect().top;
      if (sectionTop < window.innerHeight - 100) {
        section.classList.add("show");
      }
    });
  };

  window.addEventListener("scroll", revealSections);
  revealSections();
});
