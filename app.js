const contactForm = document.getElementById('contact-form');
const contactFeedback = document.getElementById('contact-feedback');

contactForm.addEventListener('submit', function(e) {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const message = document.getElementById('message').value.trim();

  if (!name || !email || !message) {
    contactFeedback.textContent = 'Please fill all fields.';
    contactFeedback.style.color = '#d63384';
    return;
  }

  contactFeedback.textContent = `Thanks, ${name}! Your message has been received.`;
  contactFeedback.style.color = '#1f7a1f';
  contactForm.reset();
});
