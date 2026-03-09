document.addEventListener('DOMContentLoaded', () => {

    // ========================
    // CONSTANTES
    // ========================
    const LS_KEY = 'mundial2026_favorites_v2';
    // Equipos "destacados" por defecto (los 11 seleccionados por el usuario)
    const SUGGESTED_FAVORITES = new Set([
        "Brasil", "Alemania", "Países Bajos", "Bélgica", "España",
        "Uruguay", "Francia", "Argentina", "Portugal", "Inglaterra", "Colombia"
    ]);
    // Prefijos que indican equipos no definidos aún (eliminatorias)
    const PLACEHOLDER_PREFIXES = ["gan.", "por definir", "perdedor", "mejor", "1ro", "2do", "ganador"];

    // ========================
    // OBTENER TODOS LOS EQUIPOS REALES del fixture
    // ========================
    function isRealTeam(name) {
        const lower = name.toLowerCase();
        return !PLACEHOLDER_PREFIXES.some(p => lower.startsWith(p));
    }

    const ALL_TEAMS = [...new Set(
        matches.flatMap(m => [m.team1.name, m.team2.name]).filter(isRealTeam)
    )].sort((a, b) => {
        // Sugeridos primero, luego alfabético
        const aSug = SUGGESTED_FAVORITES.has(a) ? 0 : 1;
        const bSug = SUGGESTED_FAVORITES.has(b) ? 0 : 1;
        if (aSug !== bSug) return aSug - bSug;
        return a.localeCompare(b, 'es');
    });

    // ========================
    // FAVORITOS (localStorage)
    // ========================
    function loadFavorites() {
        try {
            const saved = localStorage.getItem(LS_KEY);
            return saved ? new Set(JSON.parse(saved)) : new Set(SUGGESTED_FAVORITES);
        } catch {
            return new Set(SUGGESTED_FAVORITES);
        }
    }

    function saveFavorites() {
        localStorage.setItem(LS_KEY, JSON.stringify([...userFavorites]));
    }

    let userFavorites = loadFavorites();

    // ========================
    // ESTADO DE FILTROS
    // ========================
    let activeQuickFilter = 'all';
    let activeGroup = 'all';
    let selectedDays = new Set(); // vacío = todos los días

    // ========================
    // REFERENCIAS DOM
    // ========================
    const container = document.getElementById('schedule-container');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const groupSelect = document.getElementById('group-select');
    const favoritesPanel = document.getElementById('favorites-panel');
    const favoritesChipsEl = document.getElementById('favorites-chips');
    const favSearch = document.getElementById('fav-search');
    const dayChips = document.querySelectorAll('.day-chip');
    const btnSelectAll = document.getElementById('fav-select-all');
    const btnClearAll = document.getElementById('fav-clear-all');

    // ========================
    // HELPERS
    // ========================
    function isColombia(match) {
        return match.team1.name === 'Colombia' || match.team2.name === 'Colombia';
    }

    function teamIsFav(name) {
        return userFavorites.has(name);
    }

    function matchHasFav(match) {
        return teamIsFav(match.team1.name) || teamIsFav(match.team2.name);
    }

    function bogotaDate(utcStr) {
        return new Date(new Date(utcStr).toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    }

    // ========================
    // ORDENAR: favoritos/Colombia primero
    // ========================
    function sortFavsFirst(list) {
        return [...list].sort((a, b) => {
            const aP = (isColombia(a) || matchHasFav(a)) ? 0 : 1;
            const bP = (isColombia(b) || matchHasFav(b)) ? 0 : 1;
            if (aP !== bP) return aP - bP;
            return new Date(a.dateUtc) - new Date(b.dateUtc);
        });
    }

    // ========================
    // RENDERIZAR CHIPS DE FAVORITOS
    // ========================
    function renderFavoriteChips(query = '') {
        const q = query.toLowerCase().trim();
        favoritesChipsEl.innerHTML = '';

        ALL_TEAMS.forEach(teamName => {
            if (q && !teamName.toLowerCase().includes(q)) return;
            const chip = document.createElement('span');
            chip.className = `fav-chip${userFavorites.has(teamName) ? ' selected' : ''}`;
            chip.textContent = teamName;
            chip.title = userFavorites.has(teamName) ? 'Quitar de favoritos' : 'Agregar a favoritos';
            chip.addEventListener('click', () => {
                if (userFavorites.has(teamName)) {
                    userFavorites.delete(teamName);
                } else {
                    userFavorites.add(teamName);
                }
                saveFavorites();
                chip.classList.toggle('selected', userFavorites.has(teamName));
                chip.title = userFavorites.has(teamName) ? 'Quitar de favoritos' : 'Agregar a favoritos';
                applyFilters();
            });
            favoritesChipsEl.appendChild(chip);
        });
    }

    // ========================
    // RENDERIZAR TARJETAS
    // ========================
    function renderMatches(list) {
        container.innerHTML = '';

        if (list.length === 0) {
            container.innerHTML = `<div class="no-matches">😔 No hay partidos para el filtro seleccionado.</div>`;
            return;
        }

        list.forEach((match, index) => {
            const localDate = bogotaDate(match.dateUtc);
            const timeStr = localDate.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
            const dateStr = localDate.toLocaleDateString('es-CO', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();

            const isCol = isColombia(match);
            const hasFav = matchHasFav(match);

            const cardClass = [
                'match-card',
                isCol ? 'match-colombia' : '',
                (hasFav && !isCol) ? 'match-favorite' : ''
            ].filter(Boolean).join(' ');

            const t1Class = match.team1.name === 'Colombia' ? 'is-colombia' : teamIsFav(match.team1.name) ? 'is-favorite' : '';
            const t2Class = match.team2.name === 'Colombia' ? 'is-colombia' : teamIsFav(match.team2.name) ? 'is-favorite' : '';

            const channelsHTML = match.channels
                .map(ch => `<span class="channel-tag ${ch.class}">${ch.name}</span>`).join('');

            const card = document.createElement('div');
            card.className = cardClass;
            card.style.animationDelay = `${Math.min(index * 0.04, 1.2)}s`;
            card.innerHTML = `
                <div class="match-header">
                    <span class="match-phase">${match.phase}</span>
                    <span class="match-date">${dateStr}</span>
                </div>
                <div class="match-teams">
                    <div class="team">
                        <span class="flag">${match.team1.flag}</span>
                        <span class="team-name ${t1Class}">${match.team1.name}</span>
                    </div>
                    <div class="team">
                        <span class="flag">${match.team2.flag}</span>
                        <span class="team-name ${t2Class}">${match.team2.name}</span>
                    </div>
                </div>
                <div class="match-footer">
                    <div class="match-time">
                        <span class="time-label">${match.group}</span>
                        <span class="time-value">${timeStr}</span>
                    </div>
                    <div class="broadcast">${channelsHTML}</div>
                </div>`;
            container.appendChild(card);
        });
    }

    // ========================
    // APLICAR TODOS LOS FILTROS
    // ========================
    function applyFilters() {
        let filtered = [...matches];

        // 1. Filtro por Grupo/Fase
        if (activeGroup !== 'all') {
            filtered = filtered.filter(m => m.group === activeGroup || m.phase === activeGroup);
        }

        // 2. Filtro por Día de la Semana (en hora Colombia)
        if (selectedDays.size > 0) {
            filtered = filtered.filter(m => selectedDays.has(bogotaDate(m.dateUtc).getDay()));
            // Dentro del día: favoritos/Colombia primero, luego por hora
            filtered = sortFavsFirst(filtered);
        }

        // 3. Filtro del botón rápido
        if (activeQuickFilter === 'colombia') {
            filtered = filtered.filter(isColombia);

        } else if (activeQuickFilter === 'favorites') {
            filtered = filtered.filter(matchHasFav);

        } else if (activeQuickFilter === 'today') {
            const now = bogotaDate(new Date().toISOString());
            const [y, mo, d] = [now.getFullYear(), now.getMonth(), now.getDate()];
            filtered = filtered.filter(m => {
                const md = bogotaDate(m.dateUtc);
                return md.getFullYear() === y && md.getMonth() === mo && md.getDate() === d;
            });
            filtered = sortFavsFirst(filtered);
        }

        renderMatches(filtered);
    }

    // ========================
    // EVENTOS
    // ========================

    // Botones rápidos
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeQuickFilter = btn.dataset.filter;
            favoritesPanel.classList.toggle('visible', activeQuickFilter === 'favorites');
            applyFilters();
        });
    });

    // Selector de grupo
    groupSelect.addEventListener('change', () => {
        activeGroup = groupSelect.value;
        applyFilters();
    });

    // Chips de día — clic normal = selección exclusiva, Ctrl+clic = toggle
    dayChips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            const day = chip.dataset.day;

            if (day === 'all') {
                // Resetear selección
                selectedDays.clear();
                dayChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');
            } else if (e.ctrlKey || e.metaKey) {
                // Ctrl+clic: toggle este día
                const dayNum = parseInt(day, 10);
                // Quitar "Todos" activo si estaba
                document.querySelector('.day-chip[data-day="all"]').classList.remove('active');
                if (selectedDays.has(dayNum)) {
                    selectedDays.delete(dayNum);
                    chip.classList.remove('active');
                    // Si no queda ninguno, volver a 'Todos'
                    if (selectedDays.size === 0) {
                        document.querySelector('.day-chip[data-day="all"]').classList.add('active');
                    }
                } else {
                    selectedDays.add(dayNum);
                    chip.classList.add('active');
                }
            } else {
                // Clic normal: selección exclusiva
                selectedDays.clear();
                dayChips.forEach(c => c.classList.remove('active'));
                const dayNum = parseInt(day, 10);
                selectedDays.add(dayNum);
                chip.classList.add('active');
            }
            applyFilters();
        });
    });

    // Búsqueda en favoritos
    favSearch.addEventListener('input', () => renderFavoriteChips(favSearch.value));

    // Seleccionar destacados (los 11 sugeridos)
    btnSelectAll.addEventListener('click', () => {
        SUGGESTED_FAVORITES.forEach(t => userFavorites.add(t));
        saveFavorites();
        renderFavoriteChips(favSearch.value);
        applyFilters();
    });

    // Limpiar todos
    btnClearAll.addEventListener('click', () => {
        userFavorites.clear();
        saveFavorites();
        renderFavoriteChips(favSearch.value);
        applyFilters();
    });

    // ========================
    // INIT
    // ========================
    renderFavoriteChips();
    applyFilters();
});
