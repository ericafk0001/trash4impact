document.addEventListener("DOMContentLoaded", () => {
  initScrollAnimations();
  initSmoothScroll();
  initNavbarScroll();
  initStatsCounter();
  initContactForm();
});

function initScrollAnimations() {
  const observerOptions = {
    threshold: 0.15,
    rootMargin: "0px 0px -100px 0px",
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, observerOptions);

  const fadeElements = document.querySelectorAll(
    ".section-content, .section-split-content, .section-split-visual",
  );
  fadeElements.forEach((el) => {
    el.classList.add("fade-in");
    observer.observe(el);
  });

  const rankCards = document.querySelectorAll(".rank-card");
  rankCards.forEach((card, index) => {
    card.style.transitionDelay = `${index * 0.1}s`;
    observer.observe(card);
  });

  const competeCards = document.querySelectorAll(".compete-card");
  competeCards.forEach((card, index) => {
    card.classList.add("fade-in");
    card.style.transitionDelay = `${index * 0.15}s`;
    observer.observe(card);
  });
}

function initParallaxEffects() {
  let ticking = false;

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        handleParallax();
        ticking = false;
      });
      ticking = true;
    }
  });

  function handleParallax() {
    const scrolled = window.pageYOffset;

    const heroPhone = document.querySelector(".hero-phone");
    const heroContent = document.querySelector(".hero-content");

    if (heroPhone && heroContent) {
      heroPhone.style.transform = `translateY(${scrolled * 0.15}px)`;
      heroContent.style.transform = `translateY(${scrolled * 0.08}px)`;
    }

    const phoneMockup = document.querySelector(".phone-mockup");
    if (phoneMockup) {
      const rotation = Math.min(scrolled * 0.01, 5);
      phoneMockup.style.transform = `translateY(-10px) scale(1.02) rotateY(${rotation}deg)`;
    }
  }
}

function initSmoothScroll() {
  const navLinks = document.querySelectorAll(".nav-links a");

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const targetId = link.getAttribute("href");
      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        const navHeight = document.querySelector(".nav").offsetHeight;
        const targetPosition = targetSection.offsetTop - navHeight - 20;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });

        navLinks.forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
      }
    });
  });
}

function initNavbarScroll() {
  const nav = document.querySelector(".nav");
  let lastScroll = 0;

  window.addEventListener("scroll", () => {
    const currentScroll = window.pageYOffset;

    // Add shadow when scrolled
    if (currentScroll > 100) {
      nav.style.boxShadow = "0 4px 30px rgba(26, 26, 26, 0.08)";
    } else {
      nav.style.boxShadow = "none";
    }

    // Hide on scroll down, show on scroll up
    if (currentScroll > lastScroll && currentScroll > 200) {
      // Scrolling down - hide completely
      nav.style.transform = "translateY(-100%)";
      nav.style.opacity = "0";
    } else if (currentScroll < lastScroll) {
      // Scrolling up - show navbar
      nav.style.transform = "translateY(0)";
      nav.style.opacity = "1";
    }

    lastScroll = currentScroll;
  });
}

function initRankCardAnimations() {
  const rankCards = document.querySelectorAll(".rank-card");

  rankCards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      card.style.transition = "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)";
    });

    card.addEventListener("mouseleave", () => {
      card.style.transition = "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
    });
  });
}

function initStatsCounter() {
  const statsObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateValue(entry.target);
          statsObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 },
  );

  const statValues = document.querySelectorAll(".hero-stat-value");
  statValues.forEach((stat) => statsObserver.observe(stat));

  function animateValue(element) {
    const text = element.textContent;
    const hasK = text.includes("K");
    const hasM = text.includes("M");
    const suffix = hasK ? "K+" : hasM ? "M" : "";

    let targetValue = parseFloat(text.replace(/[^0-9.]/g, ""));

    if (hasK) targetValue = targetValue * 1000;
    if (hasM) targetValue = targetValue * 1000000;

    const duration = 2000;
    const startTime = performance.now();
    const startValue = 0;

    function update(currentTime) {
      const elapsedTime = currentTime - startTime;
      const progress = Math.min(elapsedTime / duration, 1);

      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue =
        startValue + (targetValue - startValue) * easeOutQuart;

      let displayValue;
      if (hasK) {
        displayValue = (currentValue / 1000).toFixed(0) + "K+";
      } else if (hasM) {
        displayValue = "$" + (currentValue / 1000000).toFixed(1) + "M";
      } else {
        displayValue = currentValue.toFixed(0);
      }

      element.textContent = displayValue;

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }

    requestAnimationFrame(update);
  }
}

document.querySelectorAll(".btn-download").forEach((button) => {
  button.addEventListener("click", (e) => {
    e.preventDefault();

    button.style.transform = "scale(0.95)";
    setTimeout(() => {
      button.style.transform = "";
    }, 150);

    const isApple = button.classList.contains("btn-apple");
    const storeName = isApple ? "App Store" : "Google Play";

    showNotification(`Opening ${storeName}...`);
  });
});

function showNotification(message) {
  const existingNotif = document.querySelector(".notification");
  if (existingNotif) existingNotif.remove();

  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;

  notification.style.cssText = `
        position: fixed;
        bottom: 3rem;
        right: 3rem;
        background: linear-gradient(135deg, #1a4d2e, #2d9c6f);
        color: white;
        padding: 1.25rem 2rem;
        border-radius: 14px;
        font-size: 1rem;
        font-weight: 600;
        box-shadow: 0 12px 40px rgba(26, 77, 46, 0.4);
        z-index: 10000;
        opacity: 0;
        transform: translateY(20px);
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    `;

  document.body.appendChild(notification);

  requestAnimationFrame(() => {
    notification.style.opacity = "1";
    notification.style.transform = "translateY(0)";
  });

  setTimeout(() => {
    notification.style.opacity = "0";
    notification.style.transform = "translateY(20px)";
    setTimeout(() => notification.remove(), 500);
  }, 3000);
}

window.addEventListener("load", () => {
  setTimeout(() => {
    const progressFill = document.querySelector(".progress-fill");
    if (progressFill) {
      progressFill.style.width = "68%";
    }
  }, 1500);
});

function initContactForm() {
  const form = document.querySelector(".contact-form");
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = form.querySelector("#name").value;
    const email = form.querySelector("#email").value;
    const message = form.querySelector("#message").value;

    // Here you would normally send the data to a server
    console.log("Form submitted:", { name, email, message });

    // Show success notification
    showNotification("Message sent successfully! We'll get back to you soon.");

    // Reset form
    form.reset();
  });
}
