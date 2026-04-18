const cards = Array.from(document.querySelectorAll('#social-videos .sv-card'));

function toFacebookEmbed(url) {
  return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&width=560`;
}

function toTikTokEmbed(url) {
  const id = extractTikTokId(url);
  return id ? `https://www.tiktok.com/embed/v2/${id}` : '';
}

function extractTikTokId(url) {
  const match = String(url).match(/\/video\/(\d+)/);
  return match ? match[1] : '';
}

cards.forEach((card) => {
  const frame = card.querySelector('iframe');
  const openLink = card.querySelector('.sv-open');
  const fallback = card.querySelector('.sv-fallback');
  if (!frame || !openLink) return;

  const href = openLink.href;
  let src = '';

  if (card.classList.contains('sv-card--facebook')) {
    src = toFacebookEmbed(href);
  } else if (card.classList.contains('sv-card--tiktok')) {
    src = toTikTokEmbed(href);
  }

  if (src) {
    frame.src = src;
    frame.addEventListener('load', () => {
      card.classList.add('is-loaded');
    }, { once: true });
  }

  if (!src && fallback) {
    fallback.style.opacity = '1';
    fallback.style.pointerEvents = 'auto';
  }
});
