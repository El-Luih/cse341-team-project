const hookTrainsCatalog = async () => {
    const listEl = document.getElementById('trains-list');
    const templateEl = document.getElementById('train-card-template');
    const loadingEl = document.getElementById('trains-loading');
    const errorEl = document.getElementById('trains-error');

    if (!listEl || !templateEl) {
        return;
    }

    try {
        const response = await fetch('/api/trains');
        if (!response.ok) {
            throw new Error(`Failed to load trains (${response.status})`);
        }

        const payload = await response.json();
        const trains = payload.trains || [];
        const fragment = document.createDocumentFragment();

        trains.forEach((train) => {
            const card = templateEl.content.cloneNode(true);
            const imageEl = card.querySelector('[data-field="image"]');

            imageEl.src = train.imageUrl;
            imageEl.alt = train.imageAlt || `${train.name} train`;

            card.querySelector('[data-field="name"]').textContent = train.name;
            card.querySelector('[data-field="operator"]').textContent = train.operator;
            card.querySelector('[data-field="type"]').textContent = train.type;
            card.querySelector('[data-field="speed"]').textContent = `${train.maxSpeedKmh} km/h`;
            card.querySelector('[data-field="seats"]').textContent = `${train.capacity} seats`;
            card.querySelector('[data-field="power"]').textContent = train.powerSource;
            card.querySelector('[data-field="description"]').textContent = train.description;
            card.querySelector('[data-field="best-for"]').textContent = train.bestFor;

            fragment.appendChild(card);
        });

        listEl.replaceChildren(fragment);
        if (loadingEl) {
            loadingEl.hidden = true;
        }
    } catch (error) {
        if (loadingEl) {
            loadingEl.hidden = true;
        }
        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = 'Unable to load trains right now. Please try again in a moment.';
        }
    }
};

let tripsCatalog = [];

const titleCase = (value) => value
    ? value.charAt(0).toUpperCase() + value.slice(1)
    : '';

const populateFilter = (select, values) => {
    if (!select) return;

    values.forEach((value) => {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = titleCase(value);
        select.appendChild(option);
    });
};

const renderTripsCatalog = () => {
    const listEl = document.getElementById('trips-list');
    const templateEl = document.getElementById('trip-card-template');
    const regionSelect = document.getElementById('region-filter');
    const seasonSelect = document.getElementById('season-filter');

    if (!listEl || !templateEl) return;

    const region = regionSelect?.value || 'all';
    const season = seasonSelect?.value || 'all';
    const visibleTrips = tripsCatalog.filter((trip) =>
        (region === 'all' || trip.region === region) &&
        (season === 'all' || trip.bestSeason === season)
    );

    const fragment = document.createDocumentFragment();
    visibleTrips.forEach((trip) => {
        const card = templateEl.content.cloneNode(true);
        const root = card.querySelector('.route-card');
        root.classList.add(trip.region);

        card.querySelector('[data-field="name"]').textContent = trip.name;
        card.querySelector('[data-field="region"]').textContent = trip.region;
        card.querySelector('[data-field="startStation"]').textContent = trip.startStation;
        card.querySelector('[data-field="endStation"]').textContent = trip.endStation;
        card.querySelector('[data-field="duration"]').textContent = trip.duration;
        card.querySelector('[data-field="distance"]').textContent = trip.distance;

        const seasonBadge = card.querySelector('[data-field="season"]');
        seasonBadge.textContent = `Best in ${trip.bestSeason}`;
        seasonBadge.classList.add(`season-${trip.bestSeason}`);

        card.querySelector('[data-field="description"]').textContent = trip.description;

        const highlights = card.querySelector('[data-field="highlights"]');
        (trip.highlights || []).forEach((highlight) => {
            const tag = document.createElement('span');
            tag.className = 'highlight-tag';
            tag.textContent = highlight;
            highlights.appendChild(tag);
        });

        const link = card.querySelector('[data-field="link"]');
        link.href = `/trips/${trip.id}`;

        fragment.appendChild(card);
    });

    listEl.replaceChildren(fragment);
};

const hookTripsCatalog = async () => {
    const listEl = document.getElementById('trips-list');
    if (!listEl) return;

    const loadingEl = document.getElementById('trips-loading');
    const errorEl = document.getElementById('trips-error');

    try {
        const response = await fetch('/api/trips');
        if (!response.ok) {
            throw new Error(`Failed to load trips (${response.status})`);
        }

        tripsCatalog = await response.json();

        const regionSelect = document.getElementById('region-filter');
        const seasonSelect = document.getElementById('season-filter');
        populateFilter(regionSelect, [...new Set(tripsCatalog.map((trip) => trip.region))].sort());
        populateFilter(seasonSelect, [...new Set(tripsCatalog.map((trip) => trip.bestSeason))].sort());

        regionSelect?.addEventListener('change', renderTripsCatalog);
        seasonSelect?.addEventListener('change', renderTripsCatalog);

        renderTripsCatalog();
        if (loadingEl) loadingEl.hidden = true;
    } catch (error) {
        if (loadingEl) loadingEl.hidden = true;
        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = 'Unable to load trips right now. Please try again in a moment.';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    hookTrainsCatalog();
    hookTripsCatalog();
});