const menuToggle = document.querySelector('.menu-toggle');
const navMenu = document.querySelector('.nav-menu');

if (menuToggle && navMenu) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!isOpen));
    navMenu.classList.toggle('is-open', !isOpen);
    document.querySelectorAll('.nav-dropdown.is-open').forEach((dropdown) => dropdown.classList.remove('is-open'));
    document.querySelectorAll('.nav-dropdown > a').forEach((toggle) => toggle.setAttribute('aria-expanded', 'false'));
  });

  // Links inside the mobile menu close it on tap, except the "Projects" dropdown
  // toggle itself, which gets its own open/close handling below (a real <a> with
  // no JS toggle would otherwise just navigate away on the first tap).
  document.querySelectorAll('.nav-menu a:not(.nav-dropdown > a)').forEach((link) => {
    link.addEventListener('click', () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      navMenu.classList.remove('is-open');
    });
  });

  document.querySelectorAll('.nav-dropdown > a').forEach((toggle) => {
    toggle.addEventListener('click', (event) => {
      if (!window.matchMedia('(max-width: 900px)').matches) return;
      const dropdown = toggle.closest('.nav-dropdown');
      if (!dropdown.classList.contains('is-open')) {
        event.preventDefault();
        dropdown.classList.add('is-open');
        toggle.setAttribute('aria-expanded', 'true');
      }
      // second tap while already open: let it navigate to the Projects page normally
    });
  });
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.14 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

document.querySelectorAll('.contact-form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = form.querySelector('.form-message');
    if (message) message.textContent = 'Thank you. You are on the list.';
    form.reset();
  });
});

document.querySelectorAll('.js-contact-form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = form.querySelector('.form-message');
    if (!form.checkValidity()) {
      if (message) message.textContent = 'Please add your name, a valid email, and a message.';
      form.reportValidity();
      return;
    }
    if (message) message.textContent = 'Thank you — your message has been sent. We will be in touch soon.';
    form.reset();
  });
});

document.querySelectorAll('.check-pill input').forEach((input) => {
  const sync = () => input.closest('.check-pill').classList.toggle('is-checked', input.checked);
  input.addEventListener('change', sync);
  sync();
});

document.querySelectorAll('.booking-form').forEach((form) => {
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const message = form.querySelector('.form-message');
    if (!form.checkValidity()) {
      if (message) message.textContent = 'Please fill in the required fields marked with *.';
      form.reportValidity();
      return;
    }
    if (message) message.textContent = 'Thank you. Your request has been received — we will reply within 2 business days.';
    form.reset();
  });
});

document.querySelectorAll('[data-slideshow]').forEach((slideshow) => {
  const slides = [...slideshow.querySelectorAll('.welcome-slide')];
  const toggle = slideshow.querySelector('.slideshow-toggle');
  const index = slideshow.querySelector('.welcome-index strong');
  let current = 0;
  let isPlaying = true;

  const showNext = () => {
    slides[current].classList.remove('is-active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('is-active');
    if (index) index.textContent = String(current + 1).padStart(2, '0');
  };

  let timer = window.setInterval(showNext, 4200);
  toggle?.addEventListener('click', () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
      timer = window.setInterval(showNext, 4200);
      toggle.setAttribute('aria-label', 'Pause welcome slideshow');
      toggle.setAttribute('aria-pressed', 'false');
    } else {
      window.clearInterval(timer);
      toggle.setAttribute('aria-label', 'Play welcome slideshow');
      toggle.setAttribute('aria-pressed', 'true');
    }
  });
});

// Testimonial marquee: duplicate the cards so the rightward scroll loops
// seamlessly, then wire each card + a shared modal for reading the full text.
document.querySelectorAll('[data-testimonial-marquee]').forEach((marquee) => {
  const track = marquee.querySelector('.testimonial-track');
  if (!track) return;
  [...track.children].forEach((card) => {
    const clone = card.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.setAttribute('tabindex', '-1');
    track.appendChild(clone);
  });
  marquee.classList.add('is-ready');
});

document.querySelectorAll('[data-testimonial-modal]').forEach((modal) => {
  const body = modal.querySelector('.testimonial-modal-body');
  const closeBtn = modal.querySelector('.testimonial-modal-close');
  let lastFocused = null;

  const open = (card) => {
    const full = card.querySelector('.tcard-full');
    if (!full || !body) return;
    lastFocused = document.activeElement;
    body.innerHTML = '';
    body.appendChild(full.content.cloneNode(true));
    modal.querySelector('.testimonial-modal-panel').scrollTop = 0;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    closeBtn?.focus();
  };
  const close = () => {
    modal.hidden = true;
    body.innerHTML = '';
    document.body.style.overflow = '';
    if (lastFocused && typeof lastFocused.focus === 'function') lastFocused.focus();
  };

  document.querySelectorAll('.tcard').forEach((card) => {
    card.addEventListener('click', () => open(card));
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open(card);
      }
    });
  });

  modal.addEventListener('click', (event) => {
    if (event.target.closest('.testimonial-modal-close') ||
        event.target.classList.contains('testimonial-modal-backdrop')) {
      close();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.hidden) close();
  });
});

// Highlight the current page (and its dropdown parent) in the shared nav.
(() => {
  const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase() || 'index.html';
  const fileOf = (a) => (a.getAttribute('href') || '').split('/').pop().split('#')[0].toLowerCase();
  document.querySelectorAll('.nav-menu > a[href]').forEach((link) => {
    if (fileOf(link) === here) link.classList.add('is-active');
  });
  document.querySelectorAll('.nav-dropdown').forEach((dd) => {
    const inChild = [...dd.querySelectorAll('.dropdown-menu a[href]')].some((a) => fileOf(a) === here);
    if (inChild) dd.querySelector(':scope > a')?.classList.add('is-active');
  });
})();

const applyDonationDashboards = () => {
  // Replace Magarini detail-band with an inline-thumbnail + full text + dashboard
  document.querySelectorAll('.detail-band').forEach((section) => {
    const kicker = section.querySelector('.story-kicker');
    const isMagarini = kicker && kicker.textContent.includes('Magarini');
    if (!isMagarini || section.querySelector('[data-payment-dashboard]')) return;

    const uid = String(Math.floor(Math.random() * 1e9));
    const amountId = `mag-amount-${uid}`;
    const monthlyId = `mag-monthly-${uid}`;

    section.classList.add('magarini-donation');
    section.innerHTML = `
      <div class="container">
        <div class="magarini-text">
          <img class="magarini-inline-thumb" src="https://www.internationalpeacegroup.com/wp-content/uploads/2016/08/MCCOFDF.jpg" alt="MCCOFDF" />
          <span class="story-kicker">Supporting the Magarini Children’s Centre and Organic Demonstration Farm in rural Kenya.</span>
          <h2>Magarini Children’s Centre and Organic Farming Demonstration Farm</h2>
          <p><strong>Magarini Children Centre and Organic Farming Demonstration Farm</strong> is a registered community-based organization under Kenyan law. It was formed in 2008 as a community initiative to provide care and education to children who had lost their parents through HIV/AIDS as well as other homeless and vulnerable children in a region that struggles with extreme poverty. They currently accommodate forty orphans and one hundred and twenty vulnerable and/or marginalized children and youth. Magarini has created a school for educating one hundred and sixty children every day and this guarantees them food on daily basis.</p>
          <p><strong>Beyond just providing immediate care to children in need, Magarini focuses on building a self-reliant community where people enjoy improved livelihoods through growing their own food while taking care of the soil, environment and nature for the benefit of the future generations.</strong> Their 8-hectare demonstration farm is a hub for community learning for thirty surrounding villages. Every Wednesday, three student farmers from each village come to tend the crops. As they learn and practice organic farming skills, they also learn how to integrate crops with care of pigs, poultry and goats, as well as fish-farming. Some of the harvested produce is sold to support the children’s programs, and the remainder is shared among the student farmers.</p>
          <p><strong>A community able to grow its own food brings people together and empowers them to create better livelihoods while taking care of the soil and restoring the land, especially forest.</strong> Such a community is resilient in the face of climate change and global economic crises. Our vision and goal in Magarini is to work with women, men, youth and children to create such a community in our region. Magarini was founded by Emmanuel Karisa Baya, local farmer and graduate of the Asian Rural Institute in Japan (2009, diploma in Sustainable Agriculture, Leadership, Conflict Resolution and Community Building), the East Africa Institute of Development Studies and is currently studying work-oriented coaching and facilitation at the Deep Democracy Institute for Process.</p>
        </div>

        <aside class="donation-dashboard" data-payment-dashboard data-fund="Magarini Children Centre" data-business="">
          <div class="donation-dashboard-top">
            <div>
              <span class="story-kicker">Donate</span>
              <h3>Support Magarini</h3>
            </div>
            <label class="monthly-toggle"><input type="checkbox" id="${monthlyId}" /> <span>Make this monthly</span></label>
          </div>

          <div class="donation-amount-input">
            <label class="sr-only" for="${amountId}">Donation amount</label>
            <div class="amount-entry"><span class="currency">$</span><input id="${amountId}" type="number" min="0" step="0.01" value="25" /></div>
            <div class="amount-display-big">$<span class="amount-preview">25.00</span></div>
            <div class="currency-label">USD</div>
          </div>

          <div class="donation-controls">
            <label><input type="checkbox" class="cover-fee" /> Add <strong>$0.00 USD</strong> to help cover the fees.</label>
          </div>

          <div class="donation-actions">
            <button class="button button-primary js-paypal" type="button">Donate with PayPal</button>
            <button class="button button-dark js-card" type="button">Donate with Debit or Credit Card</button>
          </div>
        </aside>
      </div>
    `;
  });

  // Generic wiring for any dashboard on the page
  document.querySelectorAll('[data-payment-dashboard]').forEach((dash) => {
    if (dash.dataset.bound === 'true') return;
    dash.dataset.bound = 'true';

    const amountInput = dash.querySelector('input[type="number"]');
    const preview = dash.querySelector('.amount-preview');
    const paypalBtn = dash.querySelector('.js-paypal');
    const cardBtn = dash.querySelector('.js-card');
    const monthlyToggle = dash.querySelector('.monthly-toggle input') || dash.querySelector('#' + (dash.querySelector('input[type="checkbox"][id]') || {}).id);
    const coverFee = dash.querySelector('.cover-fee');

    const format = (n) => Number(n || 0).toFixed(2);

    const computeFee = (amount) => {
      // simple estimate: 2.9% + $0.30 (USD)
      return Math.round((amount * 0.029 + 0.3) * 100) / 100;
    };

    const updatePreview = () => {
      const amt = Number(amountInput?.value) || 0;
      const fee = coverFee && coverFee.checked ? computeFee(amt) : 0;
      const total = amt + fee;
      if (preview) preview.textContent = format(total);
      // update fee text if present
      const feeLabel = dash.querySelector('.donation-controls strong');
      if (feeLabel) feeLabel.textContent = `$${format(fee)} USD`;
    };

    if (amountInput) amountInput.addEventListener('input', updatePreview);
    if (coverFee) coverFee.addEventListener('change', updatePreview);
    if (monthlyToggle) monthlyToggle.addEventListener('change', updatePreview);
    updatePreview();

    const buildPaypalUrl = (amount, cover, monthly) => {
      const business = dash.dataset.business || '';
      let amt = Number(amount) || 0;
      if (cover) amt = Number((amt + computeFee(amount)).toFixed(2));
      // If a business id is provided, include it; otherwise use generic donate link with amount
      if (business) {
        return `https://www.paypal.com/donate?business=${encodeURIComponent(business)}&amount=${encodeURIComponent(amt)}&currency_code=USD` + (monthly ? '&recurring=true' : '');
      }
      return `https://www.paypal.com/donate?amount=${encodeURIComponent(amt)}&currency_code=USD` + (monthly ? '&recurring=true' : '');
    };

    paypalBtn?.addEventListener('click', () => {
      const amount = Number(amountInput?.value) || 0;
      const monthly = !!(dash.querySelector('.monthly-toggle input')?.checked);
      const cover = !!(coverFee?.checked);
      const url = buildPaypalUrl(amount, cover, monthly);
      window.open(url, '_blank', 'noopener');
    });

    cardBtn?.addEventListener('click', () => {
      const amount = Number(amountInput?.value) || 0;
      const cover = !!(coverFee?.checked);
      const business = dash.dataset.business || '';
      if (business) {
        // PayPal hosted card donation link (fallback to donations cmd)
        const url = `https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=${encodeURIComponent(business)}&amount=${encodeURIComponent(amount)}`;
        window.open(url, '_blank', 'noopener');
      } else {
        // fallback: open mailto so the org can follow up (replace with real card gateway when available)
        window.location.href = `mailto:hello@internationalpeacegroup.com?subject=Donation%20of%20$${encodeURIComponent(amount)}&body=I%20want%20to%20donate%20$${encodeURIComponent(amount)}%20to%20${encodeURIComponent(dash.dataset.fund || '')}`;
      }
    });
  });

  // Ensure reveals are observed
  document.querySelectorAll('.reveal').forEach((element) => {
    if (!element.dataset.revealBound) {
      element.dataset.revealBound = 'true';
      revealObserver.observe(element);
    }
  });
};

applyDonationDashboards();

// Toggle behavior for compact donate toggles (homepage Ukraine section)
document.querySelectorAll('.donate-toggle').forEach((btn) => {
  btn.addEventListener('click', (e) => {
    const targetSelector = btn.getAttribute('data-target');
    if (!targetSelector) return;
    const target = document.querySelector(targetSelector);
    if (!target) return;
    const isHidden = target.hasAttribute('hidden');
    if (isHidden) {
      target.removeAttribute('hidden');
      // ensure dashboard wiring runs for newly revealed element
      applyDonationDashboards();
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      btn.textContent = 'Close donation';
      btn.classList.add('is-open');
    } else {
      target.setAttribute('hidden', '');
      btn.textContent = 'Donate — Ukraine';
      btn.classList.remove('is-open');
    }
  });
});
