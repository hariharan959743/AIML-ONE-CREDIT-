const contactForm = document.getElementById('contact-form');
const contactFeedback = document.getElementById('contact-feedback');

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    if (href !== '#' && document.querySelector(href)) {
      e.preventDefault();
      document.querySelector(href).scrollIntoView({
        behavior: 'smooth'
      });
    }
  });
});

// Contact form handling
contactForm.addEventListener('submit', function(e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const subject = document.getElementById('subject').value.trim();
  const message = document.getElementById('message').value.trim();

  // Simple validation
  if (!name || !email || !subject || !message) {
    contactFeedback.textContent = '❌ Please fill all fields.';
    contactFeedback.style.borderColor = '#dc3545';
    contactFeedback.style.backgroundColor = '#f8d7da';
    contactFeedback.style.color = '#721c24';
    return;
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    contactFeedback.textContent = '❌ Please enter a valid email address.';
    contactFeedback.style.borderColor = '#dc3545';
    contactFeedback.style.backgroundColor = '#f8d7da';
    contactFeedback.style.color = '#721c24';
    return;
  }

  // Success message
  contactFeedback.textContent = `✓ Thanks ${name}! Your message has been received. I'll get back to you soon.`;
  contactFeedback.style.borderColor = '#28a745';
  contactFeedback.style.backgroundColor = '#d4edda';
  contactFeedback.style.color = '#155724';
  
  // Reset form
  contactForm.reset();
  
  // Clear feedback after 5 seconds
  setTimeout(() => {
    contactFeedback.textContent = '';
  }, 5000);
});

// Navbar background on scroll
window.addEventListener('scroll', function() {
  const navbar = document.querySelector('.navbar');
  if (window.scrollY > 50) {
    navbar.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  } else {
    navbar.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
  }
});
