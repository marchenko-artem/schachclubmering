document.addEventListener("DOMContentLoaded", function() {
    const menuToggle = document.querySelector(".menu-toggle");
    const navList = document.querySelector(".nav-list");
    
    menuToggle.addEventListener("click", function() {
        navList.classList.toggle("active");
    });

    // Анимация появления секций при прокрутке
    const sections = document.querySelectorAll(".section");

    const revealSections = () => {
        sections.forEach(section => {
            const sectionTop = section.getBoundingClientRect().top;
            if (sectionTop < window.innerHeight - 100) {
                section.classList.add("show");
            }
        });
    };











    //Карусуль 

    const carouselImages = document.querySelectorAll(".news-carousel img");
    const prevButton = document.createElement("button");
    const nextButton = document.createElement("button");
    let currentIndex = 0;

    prevButton.textContent = "❮";
    nextButton.textContent = "❯";
    prevButton.classList.add("carousel-button", "prev");
    nextButton.classList.add("carousel-button", "next");
    
    document.querySelector(".news-carousel").appendChild(prevButton);
    document.querySelector(".news-carousel").appendChild(nextButton);
    
    function updateCarousel() {
        carouselImages.forEach((img, index) => {
            img.style.display = index === currentIndex ? "block" : "none";
        });
    }

    function nextImage() {
        currentIndex = (currentIndex + 1) % carouselImages.length;
        updateCarousel();
    }

    function prevImage() {
        currentIndex = (currentIndex - 1 + carouselImages.length) % carouselImages.length;
        updateCarousel();
    }

    nextButton.addEventListener("click", nextImage);
    prevButton.addEventListener("click", prevImage);

    setInterval(nextImage, 7000); // Автоматическое переключение каждые 5 секунд

    updateCarousel();
    // Карусуль
















    window.addEventListener("scroll", revealSections);
    revealSections(); // Проверка при загрузке страницы
});
