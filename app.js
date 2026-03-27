// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href !== '#' && document.querySelector(href)) {
      e.preventDefault();
      const element = document.querySelector(href);
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
      // Close navbar if open on mobile
      const navbarCollapse = document.querySelector('.navbar-collapse');
      if (navbarCollapse.classList.contains('show')) {
        const toggler = document.querySelector('.navbar-toggler');
        toggler.click();
      }
    }
  });
});

// Contact form handling
const contactForm = document.getElementById('contact-form');
const contactFeedback = document.getElementById('contact-feedback');

contactForm.addEventListener('submit', function(e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const subject = document.getElementById('subject').value.trim();
  const message = document.getElementById('message').value.trim();

  // Simple validation
  if (!name || !email || !subject || !message) {
    showFeedback('❌ Please fill all fields.', 'danger');
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    showFeedback('❌ Please enter a valid email address.', 'danger');
    return;
  }

  // Success message
  showFeedback(`✓ Thanks ${name}! Your message has been received. I'll get back to you soon.`, 'success');
  
  // Reset form
  contactForm.reset();
  
  // Clear feedback after 5 seconds
  setTimeout(() => {
    contactFeedback.textContent = '';
  }, 5000);
});

function showFeedback(message, type) {
  contactFeedback.textContent = message;
  
  if (type === 'success') {
    contactFeedback.style.borderColor = '#28a745';
    contactFeedback.style.backgroundColor = '#d4edda';
    contactFeedback.style.color = '#155724';
  } else {
    contactFeedback.style.borderColor = '#dc3545';
    contactFeedback.style.backgroundColor = '#f8d7da';
    contactFeedback.style.color = '#721c24';
  }
}

// Navbar background enhancement on scroll
window.addEventListener('scroll', function() {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    navbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  } else {
    navbar.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
  }
});

// Active nav link on scroll
const sections = document.querySelectorAll('main > section');
const navLinks = document.querySelectorAll('.navbar-nav .nav-link');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.clientHeight;
    if (pageYOffset >= sectionTop - 200) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href').slice(1) === current) {
      link.classList.add('active');
    }
  });
});

// Animation on scroll for elements
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.animation = 'slideIn 0.5s ease forwards';
    }
  });
}, observerOptions);

// Observe skill cards and project cards
document.querySelectorAll('.skill-card, .project-card, .education-card, .achievement-card').forEach(el => {
  el.style.opacity = '0';
  observer.observe(el);
});
