'use strict';
(() => {
  const { hikes, events, meta } = window.RANDO_DATA;
  const valleys = ['Tinée', 'Vésubie', 'Var', 'Roya', 'Roya / Bévéra', 'Cians'];
  const featureNames = { col: 'Col', summit: 'Sommet', lake: 'Lac' };
  const featureIcons = { col: '↗', summit: '△', lake: '≈' };
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const normalize = value => String(value).normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const formatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const shortFormatter = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
  const fromDate = value => new Date(value + 'T12:00:00');
  const toDate = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  const dateLabel = value => formatter.format(fromDate(value));
  const shortDate = value => shortFormatter.format(fromDate(value));
  const hoursLabel = value => {
    if (!Number.isFinite(value)) return '—';
    const minutes = Math.round(value * 60);
    if (minutes >= 24 * 60) return `${Math.floor(minutes / 1440)} j${minutes % 1440 ? ` ${Math.floor(minutes % 1440 / 60)} h` : ''}`;
    return `${Math.floor(minutes / 60)} h${minutes % 60 ? ` ${String(minutes % 60).padStart(2, '0')}` : ''}`;
  };
  const bands = Array.from({ length: Math.floor(Math.max(...hikes.map(h => h.ascent)) / 500) + 1 }, (_, i) => ({ value: String(i * 500), min: i * 500, max: i * 500 + 500, label: `${(i * 500).toLocaleString('fr-FR')} – ${(i * 500 + 499).toLocaleString('fr-FR')} m` })).filter(b => hikes.some(h => h.ascent >= b.min && h.ascent < b.max));
  const params = new URLSearchParams(location.search);
  const state = {
    query: params.get('q') || '', valleys: (params.get('v') || '').split('|').filter(v => valleys.includes(v)),
    bands: (params.get('d') || '').split('|').filter(v => bands.some(b => b.value === v)),
    features: (params.get('f') || '').split('|').filter(v => v in featureNames),
    date: /^\d{4}-\d{2}-\d{2}$/.test(params.get('date') || '') && Number.isFinite(fromDate(params.get('date')).getTime()) ? params.get('date') : toDate(new Date()),
    mode: params.get('period') === 'day' ? 'day' : 'week', dayOnly: params.get('day') === '1', eventOnly: params.get('event') === '1',
    sortKey: 'name', sortDir: 'asc', page: 1, pageSize: 12
  };
  const validKeys = ['name', 'valley', 'ascent', 'col', 'summit', 'lake', 'hours', 'events', 'plan'];
  const sortNames = { name: 'Nom', valley: 'Vallée', ascent: 'Dénivelé', col: 'Col', summit: 'Sommet', lake: 'Lac', hours: 'Durée', events: 'Événements', plan: 'Plan · distance' };
  $('sort-select').innerHTML = validKeys.flatMap(key => ['asc', 'desc'].map(dir => `<option value="${key}:${dir}">${sortNames[key]} · ${key === 'name' || key === 'valley' ? dir === 'asc' ? 'A → Z' : 'Z → A' : dir === 'asc' ? 'croissant' : 'décroissant'}</option>`)).join('');
  const initialSort = (params.get('sort') || '').split(':');
  if (validKeys.includes(initialSort[0]) && ['asc', 'desc'].includes(initialSort[1])) [state.sortKey, state.sortDir] = initialSort;
  let filtered = [], currentEvents = [], lastFocusedLink = null;

  function period(date, mode) {
    const start = fromDate(date);
    if (mode === 'week') start.setDate(start.getDate() - (start.getDay() + 6) % 7);
    const end = new Date(start);
    if (mode === 'week') end.setDate(end.getDate() + 6);
    return { start: toDate(start), end: toDate(end) };
  }
  function occurrences(date, mode) {
    const range = period(date, mode), found = [];
    for (const event of events) {
      if (event.end < range.start || event.start > range.end) continue;
      if (Number.isInteger(event.weekday)) {
        for (let day = fromDate(range.start); toDate(day) <= range.end; day.setDate(day.getDate() + 1)) {
          const d = toDate(day);
          if (day.getDay() === event.weekday && d >= event.start && d <= event.end) found.push({ ...event, occurrence: d });
        }
      } else found.push({ ...event, occurrence: event.start > range.start ? event.start : range.start });
    }
    return found.sort((a, b) => a.occurrence.localeCompare(b.occurrence) || a.name.localeCompare(b.name, 'fr'));
  }
  const eventsFor = hike => currentEvents.filter(e => e.valleys.some(v => hike.valleys.includes(v)));
  function matches(hike) {
    return (!state.query || normalize(hike.name + ' ' + hike.departure + ' ' + hike.arrival).includes(normalize(state.query)))
      && (!state.valleys.length || state.valleys.some(v => hike.valleys.includes(v)))
      && (!state.bands.length || state.bands.some(v => hike.ascent >= +v && hike.ascent < +v + 500))
      && state.features.every(key => hike.features[key].value === true)
      && (!state.dayOnly || hike.dayHike)
      && (!state.eventOnly || eventsFor(hike).length > 0);
  }
  function sortValue(hike, key) {
    if (key === 'valley') return hike.valleys.join(', ');
    if (key === 'plan') return hike.distance;
    if (key === 'events') return eventsFor(hike).length;
    if (key in featureNames) return hike.features[key].value === true ? 1 : 0;
    return hike[key];
  }
  function compare(a, b) {
    const av = sortValue(a, state.sortKey), bv = sortValue(b, state.sortKey);
    if (av == null && bv != null) return 1;
    if (bv == null && av != null) return -1;
    const cmp = typeof av === 'string' ? av.localeCompare(bv, 'fr', { numeric: true }) : (av ?? 0) - (bv ?? 0);
    return (state.sortDir === 'asc' ? cmp : -cmp) || a.name.localeCompare(b.name, 'fr') || a.id.localeCompare(b.id);
  }
  function syncUrl() {
    const p = new URLSearchParams();
    if (state.query) p.set('q', state.query);
    if (state.valleys.length) p.set('v', state.valleys.join('|'));
    if (state.bands.length) p.set('d', state.bands.join('|'));
    if (state.features.length) p.set('f', state.features.join('|'));
    p.set('date', state.date);
    if (state.mode === 'day') p.set('period', 'day');
    if (state.dayOnly) p.set('day', '1');
    if (state.eventOnly) p.set('event', '1');
    if (state.sortKey !== 'name' || state.sortDir !== 'asc') p.set('sort', `${state.sortKey}:${state.sortDir}`);
    history.replaceState(null, '', `${location.pathname}?${p}${location.hash}`);
  }
  const badges = list => list.map(v => `<span class="badge" data-valley="${esc(v)}">${esc(v)}</span>`).join(' ');
  const status = (hike, key) => hike.features[key].value === true
    ? `<span class="feature-status" data-kind="${key}" title="${esc(featureNames[key])} repéré dans la fiche officielle · à confirmer" role="img" aria-label="${esc(featureNames[key])} repéré">${featureIcons[key]}</span>`
    : `<span class="feature-status unknown" title="Information non renseignée" role="img" aria-label="${esc(featureNames[key])} : non renseigné">—</span>`;

  function project(hike, width, height, pad) {
    const paths = hike.coords.filter(p => p.length), all = paths.flat();
    if (!all.length) return null;
    const lat = all.reduce((n, p) => n + p[1], 0) / all.length;
    const factorX = 111320 * Math.cos(lat * Math.PI / 180), factorY = 111320;
    const projected = paths.map(p => p.map(c => [c[0] * factorX, -c[1] * factorY]));
    const points = projected.flat();
    const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const scale = Math.min((width - 2 * pad) / Math.max(1, maxX - minX), (height - 2 * pad) / Math.max(1, maxY - minY));
    const ox = (width - (maxX - minX) * scale) / 2, oy = (height - (maxY - minY) * scale) / 2;
    return { scale, paths: projected.map(p => p.map(([x, y]) => [(x - minX) * scale + ox, (y - minY) * scale + oy])) };
  }
  function mapSvg(hike, large = false) {
    const width = large ? 800 : 140, height = large ? 480 : 80, pad = large ? 65 : 10;
    const result = project(hike, width, height, pad);
    if (!result) return '<span class="soft-label">Tracé indisponible</span>';
    const lines = result.paths.map(p => `<path d="${p.map((xy, i) => `${i ? 'L' : 'M'}${xy[0].toFixed(1)},${xy[1].toFixed(1)}`).join(' ')}" fill="none" stroke="#547052" stroke-width="${large ? 3 : 2.2}" stroke-linejoin="round" stroke-linecap="round"/>`).join('');
    const first = result.paths[0][0], lastPath = result.paths.at(-1), last = lastPath.at(-1);
    const grid = Array.from({ length: 9 }, (_, i) => `<path d="M${i * 100} 0V${height}M0 ${i * 80}H${width}" stroke="#dce4d4" stroke-width="${large ? .6 : .3}"/>`).join('');
    const loop = Math.hypot(first[0] - last[0], first[1] - last[1]) < 8;
    const targetPixels = 90, rawMeters = targetPixels / result.scale;
    const order = 10 ** Math.floor(Math.log10(rawMeters));
    const meters = [1, 2, 5, 10].map(n => n * order).reduce((best, n) => Math.abs(n - rawMeters) < Math.abs(best - rawMeters) ? n : best, order);
    const scaleWidth = meters * result.scale;
    return `<svg ${large ? '' : 'class="route-map"'} viewBox="0 0 ${width} ${height}" role="img" aria-label="Tracé GPS de ${esc(hike.name)}${large ? ', nord en haut' : ''}" xmlns="http://www.w3.org/2000/svg"><rect width="${width}" height="${height}" fill="#f0f3e9"/>${grid}${lines}<circle cx="${first[0]}" cy="${first[1]}" r="${large ? 7 : 3}" class="map-marker" fill="#334d3d" stroke="#fff" stroke-width="${large ? 3 : 1.4}"/>${!loop ? `<circle cx="${last[0]}" cy="${last[1]}" r="${large ? 7 : 3}" class="finish-marker" fill="#aa603a" stroke="#fff" stroke-width="${large ? 3 : 1.4}"/>` : ''}${large ? `<path d="M748 68V32m-7 9 7-9 7 9" stroke="#52694c" stroke-width="2"/><text x="744" y="25" class="map-label">N</text><path d="M30 420v8h${scaleWidth.toFixed(1)}v-8" stroke="#52694c" stroke-width="2"/><text x="30" y="448" class="map-label">${meters >= 1000 ? `${meters / 1000} km` : `${meters} m`} · échelle indicative</text><text x="590" y="450" class="map-label">● Départ${loop ? ' / retour' : ' · Arrivée en orange'}</text>` : ''}</svg>`;
  }
  function profileSvg(hike) {
    const coords = hike.coords.flat().filter(p => Number.isFinite(p[2]));
    if (coords.length < 2) return '<p>Profil altimétrique non disponible dans les données GPS.</p>';
    let cumulative = 0;
    const samples = coords.map((c, i) => {
      if (i) { const prev = coords[i - 1]; cumulative += Math.hypot((c[0] - prev[0]) * 111320 * Math.cos(c[1] * Math.PI / 180), (c[1] - prev[1]) * 111320); }
      return [cumulative, c[2]];
    });
    const lo = Math.min(...samples.map(p => p[1])), hi = Math.max(...samples.map(p => p[1]));
    const d = samples.map(([x, y], i) => `${i ? 'L' : 'M'}${(45 + x / Math.max(1, cumulative) * 680).toFixed(1)},${(130 - (y - lo) / Math.max(1, hi - lo) * 100).toFixed(1)}`).join(' ');
    return `<svg viewBox="0 0 760 165" role="img" aria-label="Profil d’altitude : de ${lo} à ${hi} mètres"><path d="M45 30H725M45 80H725M45 130H725" stroke="#e3e8da"/><path d="${d}L725 130H45Z" fill="#dfe8d5"/><path d="${d}" fill="none" stroke="#5b7953" stroke-width="2"/><text x="0" y="34" class="profile-label">${hi} m</text><text x="0" y="134" class="profile-label">${lo} m</text><text x="45" y="156" class="profile-label">Départ</text><text x="673" y="156" class="profile-label">${hike.distance} km</text></svg>`;
  }
  function renderRows() {
    const pageCount = Math.max(1, Math.ceil(filtered.length / state.pageSize));
    state.page = Math.min(state.page, pageCount);
    const offset = (state.page - 1) * state.pageSize;
    $('hikes-body').innerHTML = filtered.slice(offset, offset + state.pageSize).map(h => {
      const related = eventsFor(h);
      return `<tr data-id="${h.id}" title="Ouvrir la fiche détaillée"><td data-label="Itinéraire"><a href="#rando-${h.id}" class="route-link">${esc(h.name)}</a><span class="route-departure">${esc(h.departure)}${!h.dayHike ? ' · Itinérance' : ''}</span></td><td data-label="Vallée">${badges(h.valleys)}</td><td data-label="Dénivelé">+${h.ascent.toLocaleString('fr-FR')} m</td><td data-label="Col">${status(h, 'col')}</td><td data-label="Sommet">${status(h, 'summit')}</td><td data-label="Lac">${status(h, 'lake')}</td><td data-label="Temps total"><span class="duration">${hoursLabel(h.hours)}<small>${esc(h.route === 'Aller-retour' ? 'aller + retour' : h.route === 'Boucle' ? 'boucle complète' : h.route === 'Aller simple' ? 'aller seul' : h.route === 'Itinérance' ? 'itinérance complète' : 'parcours officiel')}</small></span></td><td data-label="Événements">${related.length ? `<span class="events-tag" title="${esc(related.map(e => `${e.name} · ${e.town} · ${shortDate(e.occurrence)}`).join('\n'))}">${related.length} rendez-vous ${state.mode === 'day' ? 'ce jour' : 'cette semaine'}</span>` : '<span class="no-event">Aucun événement<br>répertorié</span>'}</td><td data-label="Plan">${mapSvg(h)}</td></tr>`;
    }).join('');
    $('hikes-table').hidden = !filtered.length;
    $('empty-results').hidden = !!filtered.length;
    $('result-count').textContent = filtered.length;
    $('result-description').textContent = `${filtered.length} itinéraire${filtered.length > 1 ? 's' : ''} sur ${hikes.length}`;
    $('page-description').textContent = filtered.length ? `${offset + 1}–${Math.min(offset + state.pageSize, filtered.length)} sur ${filtered.length} itinéraires` : '0 itinéraire';
    $('page-number').textContent = `${state.page} / ${pageCount}`;
    $('previous-page').disabled = state.page <= 1;
    $('next-page').disabled = state.page >= pageCount;
    document.querySelectorAll('th[data-key]').forEach(th => {
      const active = th.dataset.key === state.sortKey;
      th.setAttribute('aria-sort', active ? state.sortDir === 'asc' ? 'ascending' : 'descending' : 'none');
      th.querySelector('span').textContent = active ? state.sortDir === 'asc' ? '↑' : '↓' : '↕';
    });
    const sortOption = `${state.sortKey}:${state.sortDir}`;
    if (![...$('sort-select').options].some(o => o.value === sortOption)) {
      const option = document.createElement('option'); option.value = sortOption;
      option.textContent = `${({ name: 'Nom', valley: 'Vallée', ascent: 'Dénivelé', hours: 'Durée', events: 'Événements', plan: 'Plan · distance', ...featureNames })[state.sortKey]} · ${state.sortDir === 'asc' ? 'croissant' : 'décroissant'}`;
      $('sort-select').add(option);
    }
    $('sort-select').value = sortOption;
  }
  function renderChips() {
    const chips = [...state.valleys.map(v => ['valleys', v, v]), ...state.bands.map(v => ['bands', v, bands.find(b => b.value === v).label]), ...state.features.map(v => ['features', v, featureNames[v]])];
    if (state.dayOnly) chips.push(['dayOnly', '', 'À la journée']);
    if (state.eventOnly) chips.push(['eventOnly', '', 'Avec événement']);
    if (state.query) chips.push(['query', '', `Recherche : ${state.query}`]);
    $('active-filters').innerHTML = chips.map(([key, value, label]) => `<button class="filter-chip" data-remove="${key}" data-value="${esc(value)}" aria-label="Retirer le filtre ${esc(label)}">${esc(label)} <span aria-hidden="true">×</span></button>`).join('');
    $('mobile-filter-count').textContent = chips.length ? `(${chips.length})` : '';
  }
  function cards(list) {
    if (!list.length) return '<p class="agenda-empty">Aucun événement répertorié pour cette période et ces vallées. Consultez aussi les agendas officiels ci-dessous.</p>';
    return list.map(e => `<event-card-component><event-card-meta><span>${esc(e.kind)}</span><span>${shortDate(e.occurrence)}</span></event-card-meta><h3>${esc(e.name)}</h3><p>${esc(e.town)} · ${esc(e.time)}</p><event-card-footer>${badges(e.valleys)}<a href="${esc(e.source)}" target="_blank" rel="noopener noreferrer" aria-label="Programme officiel de ${esc(e.name)}">Programme ↗</a></event-card-footer><details><summary>En savoir plus</summary><p>${esc(e.description)}</p><p>Informations vérifiées le ${dateLabel(meta.verifiedAt)}. Confirmer le programme auprès de l’organisateur.</p></details></event-card-component>`).join('');
  }
  function renderAgenda() {
    const range = period(state.date, state.mode);
    $('date').value = state.date;
    $('catalogue-date').value = state.date;
    $('catalogue-mode-day').setAttribute('aria-pressed', state.mode === 'day');
    $('catalogue-mode-week').setAttribute('aria-pressed', state.mode === 'week');
    $('catalogue-period').textContent = state.mode === 'day' ? dateLabel(state.date) : `Du ${shortDate(range.start)} au ${dateLabel(range.end)}`;
    $('mode-day').setAttribute('aria-pressed', state.mode === 'day');
    $('mode-week').setAttribute('aria-pressed', state.mode === 'week');
    $('period-label').textContent = state.mode === 'day' ? dateLabel(state.date) : `Du ${shortDate(range.start)} au ${dateLabel(range.end)}`;
    $('event-count').textContent = `${currentEvents.length} rendez-vous`;
    $('events-grid').innerHTML = cards(currentEvents);
    $('agenda-note').textContent = `Agenda partiel, vérifié le ${dateLabel(meta.verifiedAt)}. Les marchés récurrents sont enregistrés pour 2026. Les critères de randonnée ne filtrent pas les événements ; le choix de vallée s’applique aux deux listes.`;
  }
  function render() {
    currentEvents = occurrences(state.date, state.mode).filter(e => !state.valleys.length || e.valleys.some(v => state.valleys.includes(v)));
    filtered = hikes.filter(matches).sort(compare);
    renderRows(); renderChips(); renderAgenda(); syncUrl();
    if (location.hash.startsWith('#rando-')) renderDetail(location.hash.slice(7), false);
  }
  function syncControls() {
    $('search').value = state.query;
    $('day-only').checked = state.dayOnly;
    $('event-only').checked = state.eventOnly;
    document.querySelectorAll('input[name="valley"]').forEach(input => input.checked = state.valleys.includes(input.value));
    document.querySelectorAll('input[name="ascent"]').forEach(input => input.checked = state.bands.includes(input.value));
    document.querySelectorAll('input[name="feature"]').forEach(input => input.checked = state.features.includes(input.value));
  }
  function changed() { state.page = 1; render(); }
  function reset() { Object.assign(state, { query: '', valleys: [], bands: [], features: [], dayOnly: false, eventOnly: false, page: 1 }); syncControls(); render(); }
  function openFilters(open) {
    $('filters').dataset.open = String(open);
    $('filter-open').setAttribute('aria-expanded', String(open));
    $('filter-backdrop').hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { $('filters').setAttribute('role', 'dialog'); $('filters').setAttribute('aria-modal', 'true'); $('filter-close').focus(); }
    else { $('filters').removeAttribute('role'); $('filters').removeAttribute('aria-modal'); $('filter-open').focus(); }
  }
  function updateDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(fromDate(value).getTime())) return;
    state.date = value; changed();
  }
  function renderDetail(id, scroll = true) {
    const h = hikes.find(hike => hike.id === id);
    $('explorer').hidden = true; $('detail').hidden = false;
    if (!h) {
      $('detail').innerHTML = '<detail-header><h1>Ce chemin n’est pas dans le catalogue.</h1><p>Le lien est peut-être incomplet.</p><a href="#catalogue">← Revenir aux randonnées</a></detail-header>';
      document.title = 'Rando tentative';
      return;
    }
    document.title = `${h.name} · Rando tentative`;
    const range = period(state.date, state.mode), related = occurrences(state.date, state.mode).filter(e => e.valleys.some(v => h.valleys.includes(v)));
    const lat = h.departureCoords?.[1], lon = h.departureCoords?.[0];
    $('detail').innerHTML = `<detail-nav><a href="#catalogue" id="detail-back">← Toutes les randonnées</a><span class="soft-label">${esc(h.provider)} · vérifié le ${dateLabel(meta.verifiedAt)}</span></detail-nav><detail-header>${badges(h.valleys)}<h1 tabindex="-1">${esc(h.name)}</h1><detail-badges><span class="badge">${esc(h.route)}</span><span class="badge">${esc(h.degree)}</span>${!h.dayHike ? '<span class="badge">Itinérance · plusieurs jours</span>' : ''}</detail-badges><p>Au départ de ${esc(h.departure)}, un itinéraire de ${h.distance} km dans ${h.valleys.length > 1 ? 'les secteurs' : 'le secteur'} ${esc(h.valleys.join(' et '))}.${h.features.summit.value ? ' Un sommet est repéré dans la fiche officielle.' : ''}${h.features.lake.value ? ' Le parcours mentionne un lac.' : ''}</p></detail-header><detail-metrics><div><dt>Dénivelé positif</dt><dd>+${h.ascent.toLocaleString('fr-FR')} m<small>montée cumulée</small></dd></div><div><dt>Dénivelé négatif</dt><dd>−${h.descent.toLocaleString('fr-FR')} m<small>descente cumulée</small></dd></div><div><dt>Temps du parcours</dt><dd>${hoursLabel(h.hours)}<small>${h.route === 'Aller simple' ? 'aller seul · retour à organiser' : h.route === 'Aller-retour' ? 'aller + retour' : h.route === 'Boucle' ? 'boucle complète' : 'durée totale officielle'}</small></dd></div><div><dt>Distance</dt><dd>${h.distance} km<small>distance planimétrique</small></dd></div><div><dt>Altitude minimale</dt><dd>${h.minElevation.toLocaleString('fr-FR')} m<small>sur le parcours</small></dd></div><div><dt>Altitude maximale</dt><dd>${h.maxElevation.toLocaleString('fr-FR')} m<small>sur le parcours GPS</small></dd></div></detail-metrics><detail-grid><detail-map><h2>Le parcours, d’un coup d’œil</h2>${mapSvg(h, true)}<p class="map-caption">Tracé issu des données GPS officielles. Nord en haut, projection locale approximative, sans fond topographique. Cet aperçu sert à visualiser le parcours ; emportez la carte officielle pour vous orienter.</p><detail-actions>${h.gpx ? `<a href="${esc(h.gpx)}" target="_blank" rel="noopener noreferrer">Télécharger le GPX ↗</a>` : ''}${h.pdf ? `<a href="${esc(h.pdf)}" target="_blank" rel="noopener noreferrer">Carte & topo PDF ↗</a>` : ''}${lat != null && lon != null ? `<a href="https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=14/${lat}/${lon}" target="_blank" rel="noopener noreferrer">Situer le départ ↗</a>` : ''}</detail-actions><detail-profile><h3>Le relief de l’itinéraire</h3>${profileSvg(h)}<p class="data-note">Profil calculé à partir du tracé GPS simplifié. Durées et dénivelés : valeurs publiées par ${esc(h.provider)}.</p></detail-profile></detail-map><detail-information><section><h2>Préparer la sortie</h2><dl><dt>Départ</dt><dd>${esc(h.departure)}</dd><dt>Arrivée</dt><dd>${esc(h.arrival)}</dd><dt>Format</dt><dd>${esc(h.route)}${h.route === 'Aller simple' ? ' · prévoir une navette ou un retour distinct.' : ''}</dd><dt>Difficulté</dt><dd>${esc(h.degree)} · échelle ${esc(h.provider)}</dd><dt>Coordonnées</dt><dd>${lat != null && lon != null ? `${lat.toFixed(5)}° N, ${lon.toFixed(5)}° E` : 'Non renseignées'}</dd><dt>Fiche actualisée</dt><dd>${dateLabel(h.updated)}</dd></dl></section><section><h2>Col, sommet ou lac ?</h2><detail-features>${Object.keys(featureNames).map(key => `<detail-feature><strong>${status(h, key)} ${featureNames[key]} ${h.features[key].value ? 'repéré' : 'non renseigné'}</strong>${h.features[key].value ? `<p>${esc(h.features[key].method)}. ${h.features[key].method.startsWith('Repérage') ? `Extrait : « ${esc(h.features[key].evidence)}… »` : ''}</p>` : '<p>La source ne permet pas de le confirmer. Cela ne signifie pas que cet élément est absent.</p>'}</detail-feature>`).join('')}</detail-features><p style="margin-top:10px">Le repérage textuel est indicatif : vérifiez les destinations, variantes et passages dans le topo officiel.</p></section><section><h2>Le topo officiel</h2>${h.excerpt ? `<p>Présentation de la source : « ${esc(h.excerpt)}${h.excerpt.endsWith('.') ? '' : '…'} »</p>` : ''}<detail-source-links>${h.sources.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">Itinéraire détaillé · ${esc(s.name)} ↗</a>`).join('')}</detail-source-links><p>Retrouvez les balises, consignes, accès et variantes dans la fiche officielle.${h.sources.length > 1 ? ' Plusieurs sources décrivent cet itinéraire ; leurs valeurs peuvent différer.' : ''}</p></section><section><h2>Avant de partir</h2><p><a href="https://randoxygene.departement06.fr/listes-des-itineraires-fermes" target="_blank" rel="noopener noreferrer">Vérifier les fermetures de sentiers ↗</a><br><a href="https://www.inforoutes06.fr/" target="_blank" rel="noopener noreferrer">Vérifier l’accès routier ↗</a><br><a href="https://meteofrance.com/meteo-montagne/alpes-du-sud" target="_blank" rel="noopener noreferrer">Consulter la météo montagne ↗</a></p></section></detail-information></detail-grid><detail-events><agenda-heading><agenda-title><p class="eyebrow">DANS ${h.valleys.length > 1 ? 'CES VALLÉES' : 'LA VALLÉE'}</p><h2>Les rendez-vous de votre sortie</h2></agenda-title><agenda-controls><label>Date de sortie<input id="detail-date" type="date" value="${state.date}" aria-label="Date de sortie de la randonnée"></label><group-control role="group" aria-label="Période des événements de la randonnée"><button data-mode="day" aria-pressed="${state.mode === 'day'}">Le jour</button><button data-mode="week" aria-pressed="${state.mode === 'week'}">La semaine</button></group-control></agenda-controls></agenda-heading><p class="data-note">${state.mode === 'day' ? dateLabel(state.date) : `Du ${shortDate(range.start)} au ${dateLabel(range.end)}`} · Événements dans le même secteur, sans garantie de proximité avec le départ.</p><agenda-grid>${cards(related)}</agenda-grid><p class="data-note" style="margin-top:15px">Agenda partiel vérifié le ${dateLabel(meta.verifiedAt)}. Confirmer les dates et horaires auprès de l’organisateur.</p></detail-events>`;
    $('detail-date').addEventListener('change', e => updateDate(e.target.value));
    $('detail').querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => { state.mode = button.dataset.mode; changed(); }));
    if (scroll) { window.scrollTo(0, 0); $('detail').querySelector('h1').focus({ preventScroll: true }); }
  }
  function handleHash() {
    if (location.hash.startsWith('#rando-')) { openFilters(false); renderDetail(location.hash.slice(7)); }
    else {
      $('explorer').hidden = false; $('detail').hidden = true; document.title = 'Rando tentative';
      if (location.hash === '#catalogue' || location.hash === '#agenda') {
        $(location.hash.slice(1)).scrollIntoView({ behavior: 'auto' });
        if (location.hash === '#catalogue' && lastFocusedLink) $('hikes-body').querySelector(`[data-id="${lastFocusedLink}"] .route-link`)?.focus({ preventScroll: true });
      } else window.scrollTo(0, 0);
    }
  }
  function showSources() { $('about-dialog').showModal(); }
  $('valley-options').innerHTML = valleys.map(v => `<label><input type="checkbox" name="valley" value="${esc(v)}"><span>${esc(v)}</span><span class="count">${hikes.filter(h => h.valleys.includes(v)).length}</span></label>`).join('');
  $('ascent-options').innerHTML = bands.map(b => `<label><input type="checkbox" name="ascent" value="${b.value}"><span>${b.label}</span><span class="count">${hikes.filter(h => h.ascent >= b.min && h.ascent < b.max).length}</span></label>`).join('');
  $('hero-count').textContent = hikes.length;
  $('verified-label').textContent = `Sources vérifiées le ${dateLabel(meta.verifiedAt)}`;
  $('sources-body').innerHTML = `<p>${esc(meta.scope)}</p><h3>Le périmètre de la recherche</h3><ul><li><a href="https://randoxygene.departement06.fr/annuaire-des-randonnees?discipline%5B929%5D=929" target="_blank" rel="noopener noreferrer">RandOxygène · Département des Alpes-Maritimes</a> : ${meta.primaryCatalog} fiches à la journée parcourues, ${meta.primarySelected} retenues dans les secteurs demandés.</li><li><a href="https://destination.marittimemercantour.eu/" target="_blank" rel="noopener noreferrer">Destination Marittime-Mercantour · portail du Parc</a> : ${meta.secondaryCatalog} fiches examinées, ${meta.secondarySelected} retenues au départ du 06.</li><li>${meta.merged} doublons rapprochés sur le nom, la distance et le départ. Les variantes distinctes restent séparées.</li></ul><p><strong>${hikes.length} itinéraires, dont ${hikes.filter(h => h.dayHike).length} à la journée.</strong> Une randonnée peut appartenir à plusieurs vallées.</p><table><caption>Couverture par secteur</caption><thead><tr><th>Secteur</th><th>Itinéraires</th></tr></thead><tbody>${valleys.map(v => `<tr><td>${esc(v)}</td><td>${hikes.filter(h => h.valleys.includes(v)).length}</td></tr>`).join('')}</tbody></table><h3>Comment lire les données</h3><p>${esc(meta.featureMethod)}</p><p>Les dénivelés, distances, durées et coordonnées proviennent des API Geotrek officielles de ces deux catalogues. Les temps désignent le parcours complet publié ; pour un aller simple, aucun retour fictif n’est ajouté. Le plan se trie selon la distance.</p><h3>L’agenda</h3><p>${esc(meta.eventScope)} ${events.length} événements ou séries récurrentes sont enregistrés, avec un lien vers chaque source. Les marchés récurrents sont limités à 2026. Une date sans résultat signifie « aucun événement répertorié ».</p><p>Les événements sont associés à une vallée ; ils peuvent être éloignés du départ. Ils ne sont pas garantis accessibles après une longue randonnée.</p><h3>Actualisation & cartes</h3><p>Instantané vérifié le ${dateLabel(meta.verifiedAt)}. La page est statique : les données ne se mettent pas à jour toutes seules. Les scripts du dépôt permettent de renouveler le catalogue. Les événements se mettent à jour dans le fichier local prévu à cet effet.</p><p>Les aperçus de parcours et profils sont dessinés à partir de la géométrie GPS. Ils fonctionnent hors ligne. Les cartes et topos officiels, les téléchargements GPX et les agendas externes nécessitent Internet.</p>`;

  $('filters').addEventListener('change', e => {
    const input = e.target;
    if (input.name === 'valley') state.valleys = [...document.querySelectorAll('input[name="valley"]:checked')].map(x => x.value);
    if (input.name === 'ascent') state.bands = [...document.querySelectorAll('input[name="ascent"]:checked')].map(x => x.value);
    if (input.name === 'feature') state.features = [...document.querySelectorAll('input[name="feature"]:checked')].map(x => x.value);
    if (input.id === 'day-only') state.dayOnly = input.checked;
    if (input.id === 'event-only') state.eventOnly = input.checked;
    changed();
  });
  $('search').addEventListener('input', e => { state.query = e.target.value.trim(); changed(); });
  $('active-filters').addEventListener('click', e => {
    const button = e.target.closest('[data-remove]'); if (!button) return;
    const key = button.dataset.remove;
    if (Array.isArray(state[key])) state[key] = state[key].filter(v => v !== button.dataset.value);
    else state[key] = key === 'query' ? '' : false;
    syncControls(); changed();
  });
  $('hikes-body').addEventListener('click', e => {
    const row = e.target.closest('tr'); if (!row) return;
    lastFocusedLink = row.dataset.id;
    if (!e.target.closest('a')) location.hash = `rando-${row.dataset.id}`;
  });
  $('hikes-table').querySelector('thead').addEventListener('click', e => {
    const header = e.target.closest('[data-key]'); if (!header) return;
    state.sortDir = state.sortKey === header.dataset.key && state.sortDir === 'asc' ? 'desc' : 'asc';
    state.sortKey = header.dataset.key; changed();
  });
  $('sort-select').addEventListener('change', e => { [state.sortKey, state.sortDir] = e.target.value.split(':'); changed(); });
  $('date').addEventListener('change', e => updateDate(e.target.value));
  $('catalogue-date').addEventListener('change', e => updateDate(e.target.value));
  ['day', 'week'].forEach(mode => $(`catalogue-mode-${mode}`).addEventListener('click', () => { state.mode = mode; changed(); }));
  ['day', 'week'].forEach(mode => $(`mode-${mode}`).addEventListener('click', () => { state.mode = mode; changed(); }));
  ['reset', 'empty-reset'].forEach(id => $(id).addEventListener('click', reset));
  $('previous-page').addEventListener('click', () => { state.page--; renderRows(); $('catalogue').scrollIntoView({ behavior: 'auto' }); });
  $('next-page').addEventListener('click', () => { state.page++; renderRows(); $('catalogue').scrollIntoView({ behavior: 'auto' }); });
  $('filter-open').setAttribute('aria-controls', 'filters');
  $('filter-open').setAttribute('aria-expanded', 'false');
  $('filter-open').addEventListener('click', () => openFilters(true));
  ['filter-close', 'filter-backdrop', 'filter-apply'].forEach(id => $(id).addEventListener('click', () => openFilters(false)));
  document.addEventListener('keydown', e => {
    if ($('filters').dataset.open !== 'true') return;
    if (e.key === 'Escape') { openFilters(false); return; }
    if (e.key === 'Tab') {
      const focusable = [...$('filters').querySelectorAll('button,input,a[href]')].filter(el => el.getClientRects().length);
      const first = focusable[0], last = focusable.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  matchMedia('(min-width:1001px)').addEventListener('change', e => { if (e.matches && $('filters').dataset.open === 'true') openFilters(false); });
  ['about-open', 'footer-about'].forEach(id => $(id).addEventListener('click', showSources));
  $('about-close').addEventListener('click', () => $('about-dialog').close());
  $('about-dialog').addEventListener('click', e => { if (e.target === $('about-dialog')) { const r = $('about-dialog').getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) $('about-dialog').close(); } });
  window.addEventListener('hashchange', handleHash);
  syncControls(); render(); handleHash();
  // Expose the pure date and formatting helpers for regression checks.
  window.Rando = { state, period, occurrences, hoursLabel, matches, compare, mapSvg };
})();
