export type SitePage = 'home' | 'terms' | 'contact' | 'blog' | 'admin' | `#blog/${string}`;

const HOME_ANCHORS = new Set(['#home', '#start', '#services', '#about', '#tax-advance', '#booking']);

export function pageFromHash(hash: string): SitePage {
  if (hash === '#terms') return 'terms';
  if (hash === '#contact') return 'contact';
  if (hash === '#blog') return 'blog';
  if (hash === '#admin') return 'admin';
  if (hash.startsWith('#blog/')) return hash as `#blog/${string}`;
  return 'home';
}

export function isHomeAnchor(hash: string) {
  return HOME_ANCHORS.has(hash);
}

export function navigateTo(hash: string) {
  const target = document.querySelector(hash);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
    return;
  }
  window.location.hash = hash;
}
