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

const applyMagariniDonationLayout = () => {
  document.querySelectorAll('.detail-band').forEach((section) => {
    const kicker = section.querySelector('.story-kicker');
    const isMagarini = kicker && kicker.textContent.includes('Magarini');

    if (!isMagarini || section.querySelector('[data-payment-dashboard]')) return;

    section.classList.add('magarini-donation');
    section.innerHTML = `
      <div class="container magarini-donation-shell">
        <div class="magarini-content reveal">
          <div class="magarini-thumb"><img src="https://www.internationalpeacegroup.com/wp-content/uploads/2016/08/MCCOFDF.jpg" alt="MCCOFDF logo" /></div>
          <div class="magarini-text">
            <span class="story-kicker">Supporting the Magarini Children’s Centre and Organic Demonstration Farm in rural Kenya.</span>
            <h2>Magarini Children’s Centre and Organic Farming Demonstration Farm</h2>
            <p><strong>Magarini Children Centre and Organic Farming Demonstration Farm</strong> is a registered community-based organization under Kenyan law. It was formed in 2008 as a community initiative to provide care and education to children who had lost their parents through HIV/AIDS as well as other homeless and vulnerable children in a region that struggles with extreme poverty. They currently accommodate forty orphans and one hundred and twenty vulnerable and/or marginalized children and youth. Magarini has created a school for educating one hundred and sixty children every day and this guarantees them food on daily basis.</p>
            <p><strong>Beyond just providing immediate care to children in need, Magarini focuses on building a self-reliant community where people enjoy improved livelihoods through growing their own food while taking care of the soil, environment and nature for the benefit of the future generations.</strong> Their 8-hectare demonstration farm is a hub for community learning for thirty surrounding villages. Every Wednesday, three student farmers from each village come to tend the crops. As they learn and practice organic farming skills, they also learn how to integrate crops with care of pigs, poultry and goats, as well as fish-farming. Some of the harvested produce is sold to support the children’s programs, and the remainder is shared among the student farmers.</p>
            <p><strong>A community able to grow its own food brings people together and empowers them to create better livelihoods while taking care of the soil and restoring the land, especially forest.</strong> Such a community is resilient in the face of climate change and global economic crises. Our vision and goal in Magarini is to work with women, men, youth and children to create such a community in our region. Magarini was founded by Emmanuel Karisa Baya, local farmer and graduate of the Asian Rural Institute in Japan (2009, diploma in Sustainable Agriculture, Leadership, Conflict Resolution and Community Building), the East Africa Institute of Development Studies and is currently studying work-oriented coaching and facilitation at the Deep Democracy Institute for Process.</p>
          </div>
        </div>

        <aside class="donation-dashboard reveal" data-payment-dashboard>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
            <div>
              <span class="story-kicker">Donate</span>
              <h3>Support Magarini</h3>
            </div>
            <label class="monthly-toggle"><input type="checkbox" id="monthly-donate" /> <span>Make this monthly</span></label>
          </div>

          <div class="donation-amount-input">
            <label class="sr-only" for="donation-amount">Donation amount</label>
            <div class="amount-display">$
              <input id="donation-amount" type="number" min="1" step="1" value="25" />
              <span style="font-size:13px;color:rgba(255,255,255,.7);">USD</span>
            </div>
          </div>

          <div class="payment-methods">
            <button class="payment-method is-selected" type="button" data-method="paypal"><span class="payment-icon paypal">P</span>PayPal</button>
            <button class="payment-method" type="button" data-method="card"><span class="payment-icon card">C</span>Debit / Card</button>
          </div>

          <div class="donation-buttons">
            <a id="pay-now" class="button button-primary" href="#">Donate with PayPal</a>
            <a id="card-now" class="button button-dark" href="#">Donate with Debit or Credit Card</a>
          </div>

          <div class="donation-note">We never share your information. For secure processing we use PayPal’s hosted checkout.</div>
        </aside>
      </div>
    `;

    // wire up interactions
    const methods = section.querySelectorAll('.payment-method');
    const amountInput = section.querySelector('#donation-amount');
    const payNow = section.querySelector('#pay-now');
    const cardNow = section.querySelector('#card-now');

    const updateLinks = () => {
      const amount = Number(amountInput.value) || 0;
      const monthly = !!section.querySelector('#monthly-donate').checked;
      // simple PayPal donate link with amount param (consumer-facing demo)
      const paypalHref = `https://www.paypal.com/donate?amount=${encodeURIComponent(amount)}&currency_code=USD` + (monthly ? '&recurring=true' : '');
      payNow.setAttribute('href', paypalHref);
      // card flow placeholder: point to PayPal card flow or a contact form
      cardNow.setAttribute('href', `https://www.paypal.com/cgi-bin/webscr?cmd=_donations&amount=${encodeURIComponent(amount)}`);
    };

    methods.forEach((button) => {
      button.addEventListener('click', () => {
        methods.forEach((m) => m.classList.toggle('is-selected', m === button));
      });
    });

    amountInput.addEventListener('input', updateLinks);
    section.querySelector('#monthly-donate').addEventListener('change', updateLinks);
    updateLinks();
  });

  document.querySelectorAll('.reveal').forEach((element) => {
    if (!element.dataset.revealBound) {
      element.dataset.revealBound = 'true';
      revealObserver.observe(element);
    }
  });
};

applyMagariniDonationLayout();
