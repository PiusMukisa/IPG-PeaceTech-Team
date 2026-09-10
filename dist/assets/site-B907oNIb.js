(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var e=document.querySelector(`.menu-toggle`),t=document.querySelector(`.nav-menu`);e&&t&&(e.addEventListener(`click`,()=>{let n=e.getAttribute(`aria-expanded`)===`true`;e.setAttribute(`aria-expanded`,String(!n)),t.classList.toggle(`is-open`,!n)}),document.querySelectorAll(`.nav-menu a`).forEach(n=>{n.addEventListener(`click`,()=>{e.setAttribute(`aria-expanded`,`false`),t.classList.remove(`is-open`)})}));var n=new IntersectionObserver(e=>{e.forEach(e=>{e.isIntersecting&&(e.target.classList.add(`is-visible`),n.unobserve(e.target))})},{threshold:.14});document.querySelectorAll(`.reveal`).forEach(e=>n.observe(e)),document.querySelectorAll(`.contact-form`).forEach(e=>{e.addEventListener(`submit`,t=>{t.preventDefault();let n=e.querySelector(`.form-message`);n&&(n.textContent=`Thank you. You are on the list.`),e.reset()})}),document.querySelectorAll(`[data-slideshow]`).forEach(e=>{let t=[...e.querySelectorAll(`.welcome-slide`)],n=e.querySelector(`.slideshow-toggle`),r=e.querySelector(`.welcome-index strong`),i=0,a=!0,o=()=>{t[i].classList.remove(`is-active`),i=(i+1)%t.length,t[i].classList.add(`is-active`),r&&(r.textContent=String(i+1).padStart(2,`0`))},s=window.setInterval(o,4200);n?.addEventListener(`click`,()=>{a=!a,a?(s=window.setInterval(o,4200),n.setAttribute(`aria-label`,`Pause welcome slideshow`),n.setAttribute(`aria-pressed`,`false`)):(window.clearInterval(s),n.setAttribute(`aria-label`,`Play welcome slideshow`),n.setAttribute(`aria-pressed`,`true`))})}),document.querySelectorAll(`.detail-band`).forEach(e=>{let t=e.querySelector(`.story-kicker`);if(!(t&&t.textContent.includes(`Magarini`))||e.querySelector(`[data-payment-dashboard]`))return;e.classList.add(`magarini-donation`),e.innerHTML=`
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
    `;let n=e.querySelectorAll(`.payment-method`),r=e.querySelector(`#donation-amount`),i=e.querySelector(`#pay-now`),a=e.querySelector(`#card-now`),o=()=>{let t=Number(r.value)||0,n=!!e.querySelector(`#monthly-donate`).checked,o=`https://www.paypal.com/donate?amount=${encodeURIComponent(t)}&currency_code=USD`+(n?`&recurring=true`:``);i.setAttribute(`href`,o),a.setAttribute(`href`,`https://www.paypal.com/cgi-bin/webscr?cmd=_donations&amount=${encodeURIComponent(t)}`)};n.forEach(e=>{e.addEventListener(`click`,()=>{n.forEach(t=>t.classList.toggle(`is-selected`,t===e))})}),r.addEventListener(`input`,o),e.querySelector(`#monthly-donate`).addEventListener(`change`,o),o()}),document.querySelectorAll(`.reveal`).forEach(e=>{e.dataset.revealBound||(e.dataset.revealBound=`true`,n.observe(e))});