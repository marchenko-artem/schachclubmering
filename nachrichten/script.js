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

// function formatDate(isoString) {
//   const date = new Date(isoString);
//   return date.toLocaleDateString("de-DE");
// }

// async function loadNews() {
// const url = "https://script.google.com/macros/s/AKfycbxQnVhEKok0dzophckOLB8ij4yiVUx-BVxh7Z3JB_EpXiXrFLNlzFEbr9gLStpYimNBrw/exec"; // Твой URL
// try {
//     let response = await fetch(url);
//     let news = await response.json();

//     if (news.length === 0) {
//         document.getElementById("news-container").innerHTML = "<p>Новостей пока нет.</p>";
//         return;
//     }

//     // Сортируем новости по дате
//     news.sort((a, b) => new Date(b.date) - new Date(a.date));

//     const latestNews = news[0];
//     // console.log("Последняя новость:", latestNews);

//     // Проверяем, есть ли текст
//     const textContent = latestNews.text ? latestNews.text : "Нет текста для отображения.";
//     // console.log("Исходный текст (до обработки Markdown):", textContent);
//     // console.log("Исходный текст перед обработкой:", textContent);
//     const fullText = convertMarkdown(textContent);
//     // console.log("текст (после обработки Markdown):", textContent);
//     // console.log("Загруженные новости:", news);
//     const plainText = stripHtml(fullText);fullText
//     const shortText = plainText.length > 120 ? plainText.substring(0, 120) + "..." : plainText;

//     let imagesHtml = "";
//     if (latestNews.images && latestNews.images.length > 0) {
//         latestNews.images.forEach((image, index) => {
//             const imageUrl = convertGoogleDriveLink(image);
//             imagesHtml += `<img src="${imageUrl}" class="news-image ${index === 0 ? 'active' : ''}" alt="Изображение новости">`;
//         });
//     }
//     // <div class="full-text" style="display: none;"><div>${fullText}</div></div>
//     const formattedDate = formatDate(latestNews.date);

//     const newsHtml = `
//         <div class="news-item">
//             <h2>${latestNews.title}</h2>
//             <small>${formattedDate}</small>
//            <p class="news-text">
//       <div class="full-text" style="display: none;">${fullText}</div>

//             <span class="short-text">${shortText}</span>

// <button class="toggle-text">Weiterlesen</button>
// </p>

//             <div class="news-carousel">
//                 ${latestNews.images.length > 1 ? `
//                 <button class="prev">&#10094;</button>
//                 <div class="carousel-images">${imagesHtml}</div>
//                 <button class="next">&#10095;</button>
//                 ` : imagesHtml}
//             </div>

//         </div>
//     `;

//     document.getElementById("news-container").innerHTML = newsHtml;

//     setupCarousel();
// } catch (error) {
//     console.error("Ошибка загрузки новостей:", error);
// }

// }

let currentPage = 1;
let newsData = [];
const pageSize = 10;

async function loadNews() {
  const url =
    "https://script.google.com/macros/s/AKfycbxQnVhEKok0dzophckOLB8ij4yiVUx-BVxh7Z3JB_EpXiXrFLNlzFEbr9gLStpYimNBrw/exec";
  try {
    let response = await fetch(url);
    newsData = await response.json();

    if (newsData.length === 0) {
      document.getElementById("news-container").innerHTML =
        "<p>Es gibt noch keine Neuigkeiten</p>";
      return;
    }

    newsData.sort((a, b) => new Date(b.date) - new Date(a.date));
    displayNews();
  } catch (error) {
    console.error("Fehler beim Laden von Nachrichten:", error);
    document.getElementById("news-container").innerHTML = "<p>Fehler</p>";
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

// function setupToggleText() {
//     document.querySelectorAll(".toggle-text").forEach(button => {
//         button.addEventListener("click", function () {
//             const newsItem = this.closest(".news-item");
//             const shortText = newsItem.querySelector(".short-text");
//             const fullText = newsItem.querySelector(".full-text");

//             if (fullText.style.display === "none") {
//                 shortText.style.display = "none";
//                 fullText.style.display = "block";
//                 this.textContent = "Ausblenden";
//             } else {
//                 shortText.style.display = "block";
//                 fullText.style.display = "none";
//                 this.textContent = "Weiterlesen";
//             }
//         });
//     });
// }

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
  let date = new Date(isoString);
  return date.toLocaleDateString("ru-RU");
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

  window.addEventListener("scroll", revealSections);
  revealSections(); // Проверка при загрузке страницы
});
