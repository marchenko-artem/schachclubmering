document.addEventListener("DOMContentLoaded", function () {
  loadNews();
  // Вызовите эту функцию, чтобы загрузить и отобразить таблицу Termine
  loadTermine();

  const menuToggle = document.querySelector(".menu-toggle");
  const navList = document.querySelector(".nav-list");

  menuToggle.addEventListener("click", function () {
    navList.classList.toggle("active");
  });

  // Анимация появления секций при прокрутке
  const sections = document.querySelectorAll(".section");

  const revealSections = () => {
    sections.forEach((section) => {
      const sectionTop = section.getBoundingClientRect().top;
      if (sectionTop < window.innerHeight - 100) {
        section.classList.add("show");
      }
    });
  };

  function convertMarkdown(text) {
    return marked.parse(text);
  }

  // Функция для удаления HTML-тегов
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

  //   async function loadNews() {
  //     const url =
  //       "https://script.google.com/macros/s/AKfycbxQnVhEKok0dzophckOLB8ij4yiVUx-BVxh7Z3JB_EpXiXrFLNlzFEbr9gLStpYimNBrw/exec"; // Твой URL
  //     try {
  //       let response = await fetch(url);
  //       let news = await response.json();

  //       if (news.length === 0) {
  //         document.getElementById("news-container").innerHTML =
  //           "<p>Es gibt noch keine Neuigkeiten</p>";
  //         return;
  //       }

  //       // Сортируем новости по дате
  //       news.sort((a, b) => new Date(b.date) - new Date(a.date));

  //       const latestNews = news[0];
  //       // console.log("Последняя новость:", latestNews);

  //       // Проверяем, есть ли текст
  //       const textContent = latestNews.text ? latestNews.text : "Kein Text.";
  //       // console.log("Исходный текст (до обработки Markdown):", textContent);
  //       // console.log("Исходный текст перед обработкой:", textContent);
  //       const fullText = convertMarkdown(textContent);
  //       // console.log("текст (после обработки Markdown):", textContent);
  //       // console.log("Загруженные новости:", news);
  //       const plainText = stripHtml(fullText);
  //       fullText;
  //       const shortText =
  //         plainText.length > 120
  //           ? plainText.substring(0, 120) + "..."
  //           : plainText;

  //       let imagesHtml = "";
  //       if (latestNews.images && latestNews.images.length > 0) {
  //         latestNews.images.forEach((image, index) => {
  //           const imageUrl = convertGoogleDriveLink(image);
  //           imagesHtml += `<img src="${imageUrl}" class="news-image ${
  //             index === 0 ? "active" : ""
  //           }" alt="Bild">`;
  //         });
  //       }
  //       // <div class="full-text" style="display: none;"><div>${fullText}</div></div>
  //       const formattedDate = formatDate(latestNews.date);

  //       const newsHtml = `
  //             <div class="news-item">
  //                 <h3>${latestNews.title}</h3>
  //                 <small>${formattedDate}</small>
  //                <p class="news-text">
  //           <div class="full-text" style="display: none;">${fullText}</div>

  //                 <span class="short-text">${shortText}</span>

  //     <button class="toggle-text">Weiterlesen</button>
  // </p>

  //                 <div class="carouselwrapper">
  //                 <div class="news-carousel">
  //                     ${
  //                       latestNews.images.length > 1
  //                         ? `
  //                     <button class="prev">&#10094;</button>
  //                     <div class="carousel-images">${imagesHtml}</div>
  //                     <button class="next">&#10095;</button>
  //                     `
  //                         : imagesHtml
  //                     }
  //                 </div>
  //                 </div>

  //             </div>
  //         `;

  //       document.getElementById("news-container").innerHTML = newsHtml;

  //       setupCarousel();
  //     } catch (error) {
  //       console.error("Ошибка загрузки новостей:", error);
  //     }
  //   }

  // ЗАМЕНИ только эту функцию:
  // ЗАМЕНИ только эту функцию:
  async function loadNews() {
    const container = document.getElementById("news-container");
    const BASE_DIR = "nachrichten/"; // папка, где лежит news.html
    const NEWS_FILE = BASE_DIR + "news.html"; // путь к файлу новостей
    const FOTO_DIR = BASE_DIR + "foto/"; // папка с картинками

    try {
      const res = await fetch(NEWS_FILE, { cache: "no-store" });
      if (!res.ok)
        throw new Error(`HTTP ${res.status} при загрузке ${NEWS_FILE}`);

      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");

      const table =
        doc.querySelector("#news-table") || doc.querySelector("table");
      if (!table) {
        if (container)
          container.innerHTML = "<p>Es gibt noch keine Neuigkeiten</p>";
        return;
      }

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

      let rows = Array.from(table.querySelectorAll("tbody tr"));
      if (!rows.length)
        rows = Array.from(table.querySelectorAll("tr")).slice(1);

      const items = rows
        .map((tr, i) => {
          const cells = Array.from(tr.children);
          const getText = (ix) =>
            ix >= 0 && cells[ix] ? (cells[ix].textContent || "").trim() : "";
          const getHTML = (ix) =>
            ix >= 0 && cells[ix] ? (cells[ix].innerHTML || "").trim() : "";

          const id = getText(idx.id) || `row-${i + 1}`;
          const title = getText(idx.title);
          const text = getHTML(idx.text);
          const rawDate = getText(idx.date);
          const date = parseDateFlexible(rawDate);

          const images = idx.images
            .map((ix) => getText(ix))
            .filter(Boolean)
            .map(resolveLocalPath);

          return { id, title, text, date, images };
        })
        .filter((n) => n.title || n.text);

      if (!items.length) {
        if (container)
          container.innerHTML = "<p>Es gibt noch keine Neuigkeiten</p>";
        return;
      }

      items.sort((a, b) => {
        const at = a.date ? a.date.getTime() : -Infinity;
        const bt = b.date ? b.date.getTime() : -Infinity;
        return bt - at;
      });

      const latestNews = items[0];

      const textContent = latestNews.text || "Kein Text.";
      const fullText = convertMarkdown(textContent);
      const plainText = stripHtml(fullText);
      const shortText =
        plainText.length > 120
          ? plainText.substring(0, 120) + "..."
          : plainText;

      let imagesHtml = "";
      if (latestNews.images && latestNews.images.length > 0) {
        latestNews.images.forEach((image, index) => {
          imagesHtml += `<img src="${image}" class="news-image ${
            index === 0 ? "active" : ""
          }" alt="Bild"
                         onerror="this.style.display='none'; console.warn('Bild nicht gefunden:', this.src)">`;
        });
      }

      const formattedDate = formatDate(latestNews.date);

      const newsHtml = `
      <div class="news-item">
        <h3>${latestNews.title || ""}</h3>
        <small>${formattedDate || ""}</small>
        <p class="news-text">
          <div class="full-text" style="display: none;">${fullText}</div>
          <span class="short-text">${shortText}</span>
          <button class="toggle-text">Weiterlesen</button>
        </p>
        <div class="carouselwrapper">
          <div class="news-carousel">
            ${
              latestNews.images && latestNews.images.length > 1
                ? `
                <button class="prev">&#10094;</button>
                <div class="carousel-images">${imagesHtml}</div>
                <button class="next">&#10095;</button>
              `
                : imagesHtml
            }
          </div>
        </div>
      </div>
    `;

      if (container) container.innerHTML = newsHtml;
      if (typeof setupCarousel === "function") setupCarousel();
    } catch (error) {
      console.error("Ошибка загрузки новостей:", error);
      if (container)
        container.innerHTML = "<p>Fehler beim Laden der Neuigkeiten.</p>";
    }

    // ---- helpers ----

    function parseDateFlexible(s) {
      if (!s) return null;
      let str = String(s)
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/\u00A0/g, " ")
        .replace(/[\u2010-\u2015\u2212\u2043\uFE58]/g, "-")
        .replace(/\s+/g, " ")
        .trim();

      // yyyy-mm-dd | yyyy/mm/dd | yyyy.mm.dd  → делаем ЛОКАЛЬНУЮ дату!
      let m = str.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
      if (m) {
        const y = +m[1],
          mo = +m[2] - 1,
          d = +m[3];
        return new Date(y, mo, d); // ← без UTC-сдвига
      }

      // dd.mm.yyyy | dd-mm-yyyy | dd/mm/yyyy
      m = str.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/);
      if (m) {
        const d = +m[1],
          mo = +m[2] - 1,
          y = +m[3];
        return new Date(y, mo, d);
      }

      // fallback
      const nums = str.match(/\d+/g);
      if (nums && nums.length >= 3) {
        const [a, b, c] = nums.map(Number);
        if (a > 1900 && b <= 12 && c <= 31) return new Date(a, b - 1, c);
        if (c > 1900 && a <= 31 && b <= 12) return new Date(c, b - 1, a);
      }

      return null;
    }

    function resolveLocalPath(filename) {
      if (!filename) return "";
      let f = filename.trim();

      // уже URL или путь — оставить как есть
      if (
        /^https?:\/\//i.test(f) ||
        f.startsWith("/") ||
        f.startsWith("./") ||
        f.startsWith("../")
      ) {
        return f;
      }

      // если пользователь уже написал "foto/xxx.jpg" — просто приклеим к BASE_DIR
      if (f.startsWith("foto/")) {
        if (!/\.[a-z]{2,4}$/i.test(f)) f += ".jpg";
        return BASE_DIR + f; // nachrichten/foto/...
      }

      // если без расширения — добавим .jpg
      if (!/\.[a-z]{2,4}$/i.test(f)) {
        f += ".jpg";
      }

      // стандартный случай: имя файла -> nachrichten/foto/имя
      return FOTO_DIR + f; // nachrichten/foto/...
    }
  }

  // async function loadTermine() {
  //   const url =
  //     "https://script.google.com/macros/s/AKfycbzjboZFksAYaL8r2WKNdzAgs39QVpS7HW3Q7uB3aug-_54ajf0xiQMOjsC0eFcNyWb8Dg/exec";
  //   try {
  //     const response = await fetch(url + "?sheet=Daten"); // Добавляем параметр sheet=Termine
  //     //   const response = await fetch(url); // Добавляем параметр sheet=Termine

  //     const data = await response.json();

  //     //
  //     //
  //     const heute = new Date();

  //     const naechste = data
  //       .filter((row, index) => {
  //         if (index === 0 || !row.Datum) return false;
  //         const datum = new Date(row.Datum);
  //         return datum >= heute;
  //       })
  //       .sort((a, b) => new Date(a.Datum) - new Date(b.Datum))
  //       .slice(0, 3);

  //     let kurzHtml = `
  //            <table>
  //         <thead>
  //           <tr>
  //             <th>Datum</th>
  //             <th>Art</th>
  //             <th>Beschreibung</th>
  //           </tr>
  //         </thead>
  //         <tbody>
  //     `;

  //     naechste.forEach((row) => {
  //       const datum = new Date(row.Datum);
  //       const options = { day: "2-digit", month: "2-digit", year: "numeric" };
  //       const datumFormatted = datum.toLocaleDateString("de-DE", options); // → 30.10.2025

  //       kurzHtml += `
  //         <tr>
  //           <td>${datumFormatted}</td>
  //           <td>${row.Art}</td>
  //           <td>${row.Beschreibung}</td>
  //         </tr>
  //       `;
  //     });

  //     kurzHtml += "</tbody></table>";

  //     document.getElementById("naechste-termine").innerHTML = kurzHtml;

  //     //
  //     //

  //     if (!data || data.length === 0) {
  //       document.getElementById("termineContainer").innerHTML =
  //         "<p>Es gibt keine Termine.</p>";
  //       return;
  //     }

  //     let tableHtml = `
  //         <table>
  //           <thead>
  //             <tr>
  //               <th>Datum</th>
  //               <th>Art</th>
  //               <th>Beschreibung</th>
  //             </tr>
  //           </thead>
  //           <tbody>
  //       `;

  //     // Предполагаем, что первая строка содержит заголовки, поэтому начинаем со второй строки
  //     for (let i = 1; i < data.length; i++) {
  //       const row = data[i];

  //       let datumFormatted = row.Datum;
  //       if (row.Datum) {
  //         const datum = new Date(row.Datum);
  //         const options = { day: "2-digit", month: "2-digit", year: "numeric" };
  //         datumFormatted = datum.toLocaleDateString("de-DE", options);
  //       }

  //       tableHtml += `
  //         <tr>
  //           <td>${datumFormatted}</td>
  //           <td>${row.Art || ""}</td>
  //           <td>${row.Beschreibung || ""}</td>
  //         </tr>
  //       `;
  //     }

  //     tableHtml += `
  //           </tbody>
  //         </table>
  //       `;

  //     document.getElementById("termineContainer").innerHTML = tableHtml;
  //   } catch (error) {
  //     console.error("Ошибка загрузки данных о Terminen:", error);
  //     document.getElementById("termineContainer").innerHTML =
  //       "<p>Fehler beim Laden der Termine.</p>";
  //   }
  // }
  // ЗАМЕНИ только эту функцию:

  // ЗАМЕНИ только эту функцию:

  // ДИАГНОСТИЧЕСКАЯ ВЕРСИЯ — ВСТАВЬ ВМЕСТО loadTermine()

  // ── PROD: читает Termine из /termine.html, показывает ближайшие 3 и полную таблицу ──
  async function loadTermine() {
    const TERMINE_FILE = "termine.html"; // файл в корне проекта

    const kurzContainer = document.getElementById("naechste-termine");
    const fullContainer = document.getElementById("termineContainer");

    try {
      const res = await fetch(TERMINE_FILE, { cache: "no-store" });
      if (!res.ok)
        throw new Error(`HTTP ${res.status} beim Laden von ${TERMINE_FILE}`);

      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");

      // Берём #termine-table, если есть, иначе — первую таблицу
      const table =
        doc.querySelector("#termine-table") || doc.querySelector("table");
      if (!table) {
        const msg = "<p>Es gibt keine Termine.</p>";
        if (kurzContainer) kurzContainer.innerHTML = msg;
        if (fullContainer) fullContainer.innerHTML = msg;
        return;
      }

      // Нормализатор строки (убирает NBSP/zero-width, экзотические дефисы)
      const cleanStr = (s) =>
        String(s ?? "")
          .replace(/[\u200B-\u200D\uFEFF]/g, "")
          .replace(/\u00A0/g, " ")
          .replace(/[\u2010-\u2015\u2212\u2043\uFE58]/g, "-")
          .replace(/\s+/g, " ")
          .trim();

      // Заголовки и индексы колонок
      const headerCells = table.querySelectorAll("thead th").length
        ? Array.from(table.querySelectorAll("thead th"))
        : Array.from(
            table.querySelectorAll("tr:first-child th, tr:first-child td")
          );

      const headers = headerCells.map((h) =>
        cleanStr(h.textContent).toLowerCase()
      );
      const idxOf = (name) =>
        headers.findIndex((h) => h === cleanStr(name).toLowerCase());
      const idxByIncludes = (needle) =>
        headers.findIndex((h) => h.replace(/\s+/g, " ").includes(needle));

      let ix = {
        datum: idxOf("datum"),
        art: idxOf("art"),
        beschr: idxOf("beschreibung"),
      };
      if (ix.datum < 0) ix.datum = idxByIncludes("datum");
      if (ix.art < 0) ix.art = idxByIncludes("art");
      if (ix.beschr < 0) ix.beschr = idxByIncludes("beschreib");

      // Строки данных
      let rows = Array.from(table.querySelectorAll("tbody tr"));
      if (!rows.length)
        rows = Array.from(table.querySelectorAll("tr")).slice(1);

      const data = rows.map((tr) => {
        const cells = Array.from(tr.children);
        const get = (i) =>
          i >= 0 && cells[i] ? cleanStr(cells[i].textContent) : "";
        const raw = get(ix.datum);
        const date = parseDateFlexible(raw);

        return {
          Datum: raw,
          _date: date, // Date|null
          Art: get(ix.art),
          Beschreibung: get(ix.beschr),
        };
      });

      // Сравниваем только календарные даты (без времени/UTC)
      const today = new Date();
      const todayOnly = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      );

      let naechste = data
        .filter((r) => r._date instanceof Date && !isNaN(r._date))
        .filter((r) => {
          const d = new Date(
            r._date.getFullYear(),
            r._date.getMonth(),
            r._date.getDate()
          );
          return d.getTime() >= todayOnly.getTime();
        })
        .sort((a, b) => a._date - b._date)
        .slice(0, 3);

      // Fallback: если будущих нет — показываем первые 3 как есть
      if (naechste.length === 0 && data.length > 0) {
        naechste = data.slice(0, 3);
      }

      // Короткая таблица (ближайшие)
      if (kurzContainer) {
        let kurzHtml = `
        <table>
          <thead>
            <tr>
              <th>Datum</th>
              <th>Art</th>
              <th>Beschreibung</th>
            </tr>
          </thead>
          <tbody>
      `;
        if (naechste.length === 0) {
          kurzHtml += `<tr><td colspan="3">Keine zukünftigen Termine.</td></tr>`;
        } else {
          naechste.forEach((row) => {
            const d = row._date
              ? row._date.toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : row.Datum || "";
            kurzHtml += `
            <tr>
              <td>${d}</td>
              <td>${row.Art || ""}</td>
              <td>${row.Beschreibung || ""}</td>
            </tr>
          `;
          });
        }
        kurzHtml += `</tbody></table>`;
        kurzContainer.innerHTML = kurzHtml;
      }

      // Полная таблица (вся)
      if (fullContainer) {
        let tableHtml = `
        <table>
          <thead>
            <tr>
              <th>Datum</th>
              <th>Art</th>
              <th>Beschreibung</th>
            </tr>
          </thead>
          <tbody>
      `;

        const dataSorted = data.slice().sort((a, b) => {
          const at = a._date ? a._date.getTime() : Infinity;
          const bt = b._date ? b._date.getTime() : Infinity;
          return at - bt;
        });

        dataSorted.forEach((row) => {
          const d = row._date
            ? row._date.toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              })
            : row.Datum || "";
          tableHtml += `
          <tr>
            <td>${d}</td>
            <td>${row.Art || ""}</td>
            <td>${row.Beschreibung || ""}</td>
          </tr>
        `;
        });

        tableHtml += `</tbody></table>`;
        fullContainer.innerHTML = tableHtml;
      }
    } catch (error) {
      if (kurzContainer)
        kurzContainer.innerHTML = "<p>Fehler beim Laden der Termine.</p>";
      if (fullContainer)
        fullContainer.innerHTML = "<p>Fehler beim Laden der Termine.</p>";
    }

    // Локальный парсер дат: создаёт ЛОКАЛЬНУЮ дату (без UTC-сдвигов)
    function parseDateFlexible(s) {
      if (!s) return null;

      const str = String(s)
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .replace(/\u00A0/g, " ")
        .replace(/[\u2010-\u2015\u2212\u2043\uFE58]/g, "-")
        .replace(/\s+/g, " ")
        .trim();

      // yyyy-mm-dd | yyyy/mm/dd | yyyy.mm.dd
      let m = str.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
      if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));

      // dd.mm.yyyy | dd-mm-yyyy | dd/mm/yyyy
      m = str.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{4})$/);
      if (m) return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));

      // простой ISO-вид: yyyy-mm-dd
      if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
        const [y, mo, d] = str.split("-").map(Number);
        return new Date(y, mo - 1, d);
      }

      return null;
    }
  }

  //   <a href="all-news.html" class="news-button">Посмотреть все новости</a>

  // Функция для переключения текста
  document.addEventListener("click", function (event) {
    if (!event.target.classList.contains("toggle-text")) return;

    const newsItem = event.target.closest(".news-item");
    if (!newsItem) return;

    const shortText = newsItem.querySelector(".short-text");
    const fullText = newsItem.querySelector(".full-text");

    if (!shortText || !fullText) return;

    if (fullText.style.display === "none" || fullText.style.display === "") {
      shortText.style.display = "none";
      fullText.style.display = "block";
      event.target.textContent = "Ausblenden";
    } else {
      shortText.style.display = "block";
      fullText.style.display = "none";
      event.target.textContent = "Weiterlesen";
    }
  });

  // Карусель изображений
  function setupCarousel() {
    const images = document.querySelectorAll(".news-image");
    const prevButton = document.querySelector(".prev");
    const nextButton = document.querySelector(".next");

    if (!images.length || !prevButton || !nextButton) return;

    let currentIndex = 0;
    let intervalId;

    function showImage(index) {
      images.forEach((img, i) => img.classList.toggle("active", i === index));
    }

    function nextImage() {
      currentIndex = (currentIndex + 1) % images.length;
      showImage(currentIndex);
    }

    function prevImage() {
      currentIndex = (currentIndex - 1 + images.length) % images.length;
      showImage(currentIndex);
    }

    function startAutoSlide() {
      clearInterval(intervalId);
      intervalId = setInterval(nextImage, 7000);
    }

    prevButton.addEventListener("click", () => {
      prevImage();
      startAutoSlide();
    });

    nextButton.addEventListener("click", () => {
      nextImage();
      startAutoSlide();
    });

    showImage(currentIndex);
    startAutoSlide();
  }

  window.addEventListener("scroll", revealSections);
  revealSections(); // Проверка при загрузке страницы
});

function openParkingModal() {
  document.getElementById("parkingModal").style.display = "flex";
}

function closeParkingModal() {
  document.getElementById("parkingModal").style.display = "none";
}

// Закрытие при клике вне модального контента
window.addEventListener("click", function (event) {
  const modal = document.getElementById("parkingModal");
  if (event.target === modal) {
    closeParkingModal();
  }
});

//   Termine
document.getElementById("showModalBtn").addEventListener("click", function () {
  document.getElementById("scheduleModal").style.display = "block";
});

document.getElementById("closeModalBtn").addEventListener("click", function () {
  document.getElementById("scheduleModal").style.display = "none";
});

window.addEventListener("click", function (event) {
  const modal = document.getElementById("scheduleModal");
  if (event.target === modal) {
    modal.style.display = "none";
  }
});
// Termine endung
