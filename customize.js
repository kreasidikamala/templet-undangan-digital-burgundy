const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function text(selector, value) {
  $(selector).textContent = String(value ?? '');
}

function safeAsset(value) {
  if (!value) return null;
  try {
    const url = new URL(value, location.href);
    if (url.protocol === 'https:' || url.protocol === 'file:' ||
        (url.protocol === 'http:' && url.origin === location.origin)) return url.href;
  } catch { /* Abaikan tautan yang tidak valid. */ }
  return null;
}

function photo(element, value, alt) {
  element.src = safeAsset(value) || 'assets/photo-placeholder.svg';
  element.alt = alt;
}

function pair(element, first, second, separatorTag) {
  const separator = document.createElement(separatorTag);
  separator.textContent = '&';
  element.replaceChildren(document.createTextNode(first + ' '), separator, document.createTextNode(' ' + second));
}

function renderStory(items) {
  const arch = $('.story__arch');
  arch.replaceChildren();
  const line = document.createElement('div');
  line.className = 'story__line';
  line.setAttribute('aria-hidden', 'true');
  arch.append(line);
  (items || []).forEach((item, index) => {
    const article = document.createElement('article');
    article.className = 'story__item';
    const copy = document.createElement('div');
    copy.className = 'story__copy';
    const number = document.createElement('span');
    number.className = 'story__number';
    number.textContent = String(index + 1).padStart(2, '0');
    const heading = document.createElement('h3');
    heading.textContent = item.title || '';
    const paragraph = document.createElement('p');
    paragraph.textContent = item.text || '';
    const dot = document.createElement('span');
    dot.className = 'story__dot';
    dot.setAttribute('aria-hidden', 'true');
    dot.textContent = '♥';
    copy.append(number, heading, paragraph);
    article.append(copy, dot);
    arch.append(article);
  });
  $('#story').hidden = !items?.length;
}

function renderGallery(items) {
  const grid = $('#galleryGrid');
  grid.replaceChildren();
  (items || []).forEach((item, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.gallery = String(index);
    button.setAttribute('aria-label', `Lihat foto ${index + 1} lebih besar`);
    const image = document.createElement('img');
    photo(image, item.src, item.alt || `Foto ${index + 1}`);
    image.loading = 'lazy';
    button.append(image);
    grid.append(button);
  });
  $('#gallery').hidden = !items?.length;
}

function renderGifts(gifts) {
  $('#gift').hidden = !gifts?.enabled;
  if (!gifts?.enabled) return;
  const banks = $$('.gift__card .bank');
  banks.forEach((bank, index) => {
    const account = gifts.banks?.[index];
    bank.hidden = !account?.number;
    if (!account?.number) return;
    bank.querySelector('.bank__label').textContent = `${account.name || 'Bank'} · a.n. ${account.owner || ''}`;
    bank.querySelector('.bank__number').textContent = account.number;
    bank.querySelector('[data-copy]').dataset.copy = account.number;
    const old = bank.querySelector('.bank__logo, .bank__placeholder');
    const logo = safeAsset(account.logo);
    const visual = document.createElement(logo ? 'img' : 'div');
    visual.className = logo ? 'bank__logo' : 'bank__placeholder';
    if (logo) { visual.src = logo; visual.alt = `Logo ${account.name || 'bank'}`; }
    else visual.textContent = account.name || 'Bank';
    old.replaceWith(visual);
  });
  const address = gifts.address || {};
  $('.gift__address').hidden = !address.text;
  text('.gift__recipient', address.recipient || '');
  text('#giftAddress', address.text || '');
  const dividers = $$('.gift__divider');
  dividers[0].hidden = banks[0].hidden || banks[1].hidden;
  dividers[1].hidden = $('.gift__address').hidden || (banks[0].hidden && banks[1].hidden);
}

export function renderInvitation(config) {
  const first = config.couple.first;
  const second = config.couple.second;
  const names = `${first.short} & ${second.short}`;
  const imageAlt = `Potret ${first.short} dan ${second.short}`;
  document.title = `${names} — Undangan Pernikahan`;
  $('meta[name="description"]').content = `Undangan pernikahan ${names}. ${config.dateLabel || ''}`;
  document.body.dataset.theme = config.theme === 'sage' ? 'sage' : 'burgundy';
  document.body.dataset.layout = config.layout === 'centered' ? 'centered' : 'split';
  $('meta[name="theme-color"]').content = config.theme === 'sage' ? '#234239' : '#4c0911';

  pair($('.desktop-portrait strong'), first.short, second.short, 'em');
  $('.desktop-portrait').setAttribute('aria-label', imageAlt);
  pair($('.cover h1'), first.short, second.short, 'span');
  pair($('.monogram--script'), first.short[0], second.short[0], 'small');
  pair($('.quote__monogram'), first.short[0], second.short[0], 'span');
  pair($('.opening__names'), first.short.toUpperCase(), second.short.toUpperCase(), 'span');
  pair($('.closing__names'), first.short, second.short, 'span');
  $$('.desktop-portrait .eyebrow').at(-1).textContent = config.dateLabel;
  text('.cover__date', config.dateLabel);
  text('.opening__date', config.dateShort);
  text('.quote__arabic', config.quote?.arabic || '');
  $('.quote__arabic').hidden = !config.quote?.arabic;
  text('.quote__translation', config.quote?.translation || '');
  text('.quote__source', config.quote?.source || '');

  const people = $$('.person');
  [first, second].forEach((person, index) => {
    const card = people[index];
    card.querySelector('.script-title').textContent = person.short;
    card.querySelector('.person__full').textContent = person.full;
    card.querySelector('.person__label').textContent = person.parentsLabel;
    card.querySelector('.person__parents').textContent = person.parents;
    photo(card.querySelector('img'), config.photos?.[index === 0 ? 'first' : 'second'], `Potret ${person.short}`);
  });
  photo($('.opening__photo img'), config.photos?.opening, imageAlt);

  $$('.event-card').forEach((card, index) => {
    const event = config.events[index];
    photo(card.querySelector('img'), event.photo, `Foto ${event.title}`);
    card.querySelector('.event-card__ornament').textContent = `✦   ${first.short[0]} & ${second.short[0]}   ✦`;
    for (const [selector, value] of Object.entries({
      '.script-title': event.title, '.event-card__day': event.day,
      '.event-card__date': event.date, '.event-card__time': event.time,
      '.event-card__venue': event.venue, '.event-card__address': event.address
    })) card.querySelector(selector).textContent = value || '';
    const map = card.querySelector('a.outline-pill');
    map.hidden = !safeAsset(event.mapUrl);
    if (!map.hidden) map.href = safeAsset(event.mapUrl);
  });

  renderStory(config.story);
  renderGallery(config.gallery);
  renderGifts(config.gifts);
  text('.closing__content > p:nth-child(2)', config.closingMessage || '');
  text('.brand > span:last-child', config.brand?.name || '');
  const brandLogo = safeAsset(config.brand?.logo);
  if (brandLogo) {
    const image = document.createElement('img');
    image.className = 'brand__image';
    image.src = brandLogo;
    image.alt = `Logo ${config.brand.name}`;
    $('.brand__mark').replaceWith(image);
  }

  for (const [property, value] of Object.entries({
    '--desktop-photo': config.photos?.desktop,
    '--cover-photo': config.photos?.cover,
    '--closing-photo': config.photos?.closing
  })) {
    const url = safeAsset(value);
    if (url) document.documentElement.style.setProperty(property, `url("${url.replaceAll('"', '%22')}")`);
  }
  const music = safeAsset(config.music);
  if (music) $('#backgroundMusic').src = music;
  $('#guestInput').placeholder = `Contoh: ${config.guestPlaceholder || 'Tamu Undangan'}`;
}
