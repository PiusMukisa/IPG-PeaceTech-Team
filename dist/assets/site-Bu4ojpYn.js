(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=document.querySelector(`.menu-toggle`),t=document.querySelector(`.nav-menu`);e&&t&&(e.addEventListener(`click`,()=>{let n=e.getAttribute(`aria-expanded`)===`true`;e.setAttribute(`aria-expanded`,String(!n)),t.classList.toggle(`is-open`,!n)}),document.querySelectorAll(`.nav-menu a`).forEach(n=>{n.addEventListener(`click`,()=>{e.setAttribute(`aria-expanded`,`false`),t.classList.remove(`is-open`)})}));var n=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting&&(e.target.classList.add(`is-visible`),n.unobserve(e.target))})},{threshold:.14});document.querySelectorAll(`.reveal`).forEach(e=>n.observe(e)),document.querySelectorAll(`.contact-form`).forEach(e=>{e.addEventListener(`submit`,t=>{t.preventDefault();let n=e.querySelector(`.form-message`);n&&(n.textContent=`Thank you. You are on the list.`),e.reset()})}),document.querySelectorAll(`[data-slideshow]`).forEach(e=>{let t=[...e.querySelectorAll(`.welcome-slide`)],n=e.querySelector(`.slideshow-toggle`),r=e.querySelector(`.welcome-index strong`),i=0,a=!0,o=()=>{t[i].classList.remove(`is-active`),i=(i+1)%t.length,t[i].classList.add(`is-active`),r&&(r.textContent=String(i+1).padStart(2,`0`))},s=window.setInterval(o,4200);n?.addEventListener(`click`,()=>{a=!a,a?(s=window.setInterval(o,4200),n.setAttribute(`aria-label`,`Pause welcome slideshow`),n.setAttribute(`aria-pressed`,`false`)):(window.clearInterval(s),n.setAttribute(`aria-label`,`Play welcome slideshow`),n.setAttribute(`aria-pressed`,`true`))})}),document.querySelectorAll(`.detail-band`).forEach(e=>{let t=e.querySelector(`.story-kicker`);if(!(t&&t.textContent.includes(`Magarini`))||e.querySelector(`[data-payment-dashboard]`))return;e.classList.add(`magarini-donation`),e.innerHTML=`
      <div class="container magarini-donation-shell">
        <div class="magarini-feature-card reveal">
          <div class="magarini-image-wrap">
            <img src="https://www.internationalpeacegroup.com/wp-content/uploads/2016/08/MCCOFDF.jpg" alt="Magarini Children's Centre and Organic Demonstration Farm" />
            <span class="magarini-image-badge">Kenya</span>
          </div>
          <div class="magarini-cta">
            <span class="story-kicker">Supporting the Magarini Children’s Centre and Organic Demonstration Farm in rural Kenya.</span>
            <h2>Help grow food, care, and opportunity for children and families.</h2>
            <p>Magarini is building resilient futures through education, organic agriculture, and community-led care. Your gift helps fund food, school support, and sustainable livelihoods for children and families in rural Kenya.</p>
            <div class="donation-links">
              <a class="primary-link" href="https://www.paypal.com/donate" target="_blank" rel="noreferrer">Donate now</a>
              <a class="secondary-link" href="mailto:hello@internationalpeacegroup.com">Email us</a>
            </div>
          </div>
        </div>
        <aside class="donation-dashboard reveal" data-payment-dashboard>
          <div class="donation-dashboard-top">
            <div>
              <span class="story-kicker">Choose a gift</span>
              <h3>Make a donation</h3>
            </div>
            <label class="monthly-toggle">
              <input type="checkbox" aria-label="Make donation monthly" />
              <span>Monthly</span>
            </label>
          </div>
          <div class="payment-methods">
            <button class="payment-method is-selected" type="button" data-method="paypal"><span class="payment-icon paypal">P</span>PayPal</button>
            <button class="payment-method" type="button" data-method="card"><span class="payment-icon card">C</span>Card</button>
          </div>
          <div class="donation-amounts" role="group" aria-label="Choose donation amount">
            <button class="is-selected" type="button">$25</button>
            <button type="button">$50</button>
            <button type="button">$100</button>
            <button type="button">$250</button>
          </div>
          <div class="payment-panel is-visible" data-panel="paypal">
            <p>Send a secure PayPal gift to support meals, school meals, and sustainable farm learning at Magarini.</p>
            <a class="button button-primary" href="https://www.paypal.com/donate" target="_blank" rel="noreferrer">Continue to PayPal <span aria-hidden="true">&#8594;</span></a>
          </div>
          <div class="payment-panel" data-panel="card">
            <p>Use a debit or credit card to sponsor the next cycle of care, food, and training for the children and youth at Magarini.</p>
            <a class="button button-primary" href="https://www.paypal.com/cgi-bin/webscr?cmd=_donations" target="_blank" rel="noreferrer">Continue with card <span aria-hidden="true">&#8594;</span></a>
          </div>
        </aside>
      </div>
    `,e.querySelector(`[data-payment-dashboard`);let n=e.querySelectorAll(`.payment-method`),r=e.querySelectorAll(`.donation-amounts button`),i=e.querySelectorAll(`.payment-panel`);n.forEach(e=>{e.addEventListener(`click`,()=>{n.forEach(t=>t.classList.toggle(`is-selected`,t===e)),i.forEach(t=>t.classList.toggle(`is-visible`,t.dataset.panel===e.dataset.method))})}),r.forEach(e=>{e.addEventListener(`click`,()=>{r.forEach(t=>t.classList.toggle(`is-selected`,t===e))})})}),document.querySelectorAll(`.reveal`).forEach(e=>{e.dataset.revealBound||(e.dataset.revealBound=`true`,n.observe(e))});