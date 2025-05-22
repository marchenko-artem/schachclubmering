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

  async function loadNews() {
    const url =
      "https://script.google.com/macros/s/AKfycbxQnVhEKok0dzophckOLB8ij4yiVUx-BVxh7Z3JB_EpXiXrFLNlzFEbr9gLStpYimNBrw/exec"; // Твой URL
    try {
      let response = await fetch(url);
      let news = await response.json();

      if (news.length === 0) {
        document.getElementById("news-container").innerHTML =
          "<p>Es gibt noch keine Neuigkeiten</p>";
        return;
      }

      // Сортируем новости по дате
      news.sort((a, b) => new Date(b.date) - new Date(a.date));

      const latestNews = news[0];
      // console.log("Последняя новость:", latestNews);

      // Проверяем, есть ли текст
      const textContent = latestNews.text ? latestNews.text : "Kein Text.";
      // console.log("Исходный текст (до обработки Markdown):", textContent);
      // console.log("Исходный текст перед обработкой:", textContent);
      const fullText = convertMarkdown(textContent);
      // console.log("текст (после обработки Markdown):", textContent);
      // console.log("Загруженные новости:", news);
      const plainText = stripHtml(fullText);
      fullText;
      const shortText =
        plainText.length > 120
          ? plainText.substring(0, 120) + "..."
          : plainText;

      let imagesHtml = "";
      if (latestNews.images && latestNews.images.length > 0) {
        latestNews.images.forEach((image, index) => {
          const imageUrl = convertGoogleDriveLink(image);
          imagesHtml += `<img src="${imageUrl}" class="news-image ${
            index === 0 ? "active" : ""
          }" alt="Bild">`;
        });
      }
      // <div class="full-text" style="display: none;"><div>${fullText}</div></div>
      const formattedDate = formatDate(latestNews.date);

      const newsHtml = `
            <div class="news-item">
                <h3>${latestNews.title}</h3>
                <small>${formattedDate}</small>
               <p class="news-text">
          <div class="full-text" style="display: none;">${fullText}</div>

            
                <span class="short-text">${shortText}</span>   
    

    <button class="toggle-text">Weiterlesen</button>
</p>

                <div class="carouselwrapper">
                <div class="news-carousel">
                    ${
                      latestNews.images.length > 1
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

      document.getElementById("news-container").innerHTML = newsHtml;

      setupCarousel();
    } catch (error) {
      console.error("Ошибка загрузки новостей:", error);
    }
  }

  async function loadTermine() {
    const url =
      "https://script.google.com/macros/s/AKfycbzjboZFksAYaL8r2WKNdzAgs39QVpS7HW3Q7uB3aug-_54ajf0xiQMOjsC0eFcNyWb8Dg/exec";
    try {
      const response = await fetch(url + "?sheet=Daten"); // Добавляем параметр sheet=Termine
      //   const response = await fetch(url); // Добавляем параметр sheet=Termine

      const data = await response.json();

      //
      //
      const heute = new Date();

      const naechste = data
        .filter((row, index) => {
          if (index === 0 || !row.Datum) return false;
          const datum = new Date(row.Datum);
          return datum >= heute;
        })
        .sort((a, b) => new Date(a.Datum) - new Date(b.Datum))
        .slice(0, 3);

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

      naechste.forEach((row) => {
        const datum = new Date(row.Datum);
        const options = { day: "2-digit", month: "2-digit", year: "numeric" };
        const datumFormatted = datum.toLocaleDateString("de-DE", options); // → 30.10.2025

        kurzHtml += `
          <tr>
            <td>${datumFormatted}</td>
            <td>${row.Art}</td>
            <td>${row.Beschreibung}</td>
          </tr>
        `;
      });

      kurzHtml += "</tbody></table>";

      document.getElementById("naechste-termine").innerHTML = kurzHtml;

      //
      //

      if (!data || data.length === 0) {
        document.getElementById("termineContainer").innerHTML =
          "<p>Es gibt keine Termine.</p>";
        return;
      }

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

      // Предполагаем, что первая строка содержит заголовки, поэтому начинаем со второй строки
      for (let i = 1; i < data.length; i++) {
        const row = data[i];

        let datumFormatted = row.Datum;
        if (row.Datum) {
          const datum = new Date(row.Datum);
          const options = { day: "2-digit", month: "2-digit", year: "numeric" };
          datumFormatted = datum.toLocaleDateString("de-DE", options);
        }

        tableHtml += `
          <tr>
            <td>${datumFormatted}</td>
            <td>${row.Art || ""}</td>
            <td>${row.Beschreibung || ""}</td>
          </tr>
        `;
      }

      tableHtml += `
            </tbody>
          </table>
        `;

      document.getElementById("termineContainer").innerHTML = tableHtml;
    } catch (error) {
      console.error("Ошибка загрузки данных о Terminen:", error);
      document.getElementById("termineContainer").innerHTML =
        "<p>Fehler beim Laden der Termine.</p>";
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
