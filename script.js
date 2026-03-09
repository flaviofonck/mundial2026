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
    let timeFrom = ''; // "HH:MM" en hora Colombia, vacío = sin filtro
    let timeTo = '';   // "HH:MM" en hora Colombia, vacío = sin filtro

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
    const timeFromInput = document.getElementById('time-from');
    const timeToInput = document.getElementById('time-to');
    const timeClearBtn = document.getElementById('time-clear-btn');
    const timeFilterBar = document.getElementById('time-filter-bar');
    const fixtureView = document.getElementById('fixture-view');

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
    // ========================
    // FIXTURE VIEW
    // ========================

    // Mapa: para cada grupo, indica la ronda de dieciseisavos donde podrían aparecer sus equipos
    // Formato: { groupKey: [ { matchId, role: '1ro'|'2do' }, ... ] }
    const GROUP_TO_R32 = {
        'Grupo A': [{ matchId: 72, role: '1ro' }, { matchId: 77, role: '2do' }],
        'Grupo B': [{ matchId: 73, role: '1ro' }, { matchId: 78, role: '2do' }],
        'Grupo C': [{ matchId: 74, role: '1ro' }, { matchId: 81, role: '2do' }],
        'Grupo D': [{ matchId: 75, role: '1ro' }, { matchId: 82, role: '2do' }],
        'Grupo E': [{ matchId: 76, role: '1ro' }, { matchId: 84, role: '2do' }],
        'Grupo F': [{ matchId: 77, role: '1ro' }, { matchId: 84, role: '2do' }],
        'Grupo G': [{ matchId: 78, role: '1ro' }, { matchId: 74, role: '2do' }],
        'Grupo H': [{ matchId: 79, role: '1ro' }, { matchId: 84, role: '2do' }],
        'Grupo I': [{ matchId: 80, role: '1ro' }, { matchId: 85, role: '2do' }],
        'Grupo J': [{ matchId: 81, role: '1ro' }, { matchId: 85, role: '2do' }],
        'Grupo K': [{ matchId: 82, role: '1ro' }, { matchId: 86, role: '2do' }],
        'Grupo L': [{ matchId: 83, role: '1ro' }, { matchId: 87, role: '2do' }],
    };

    // Rounds de eliminatorias en orden
    const ELIM_ROUNDS = [
        { key: 'Dieciseisavos de Final', label: 'R32' },
        { key: 'Octavos de Final', label: 'Octavos' },
        { key: 'Cuartos de Final', label: 'Cuartos' },
        { key: 'Semifinales', label: 'Semis' },
        { key: 'Gran Final', label: 'Final' },
    ];

    function fmtBogota(utcStr) {
        const d = bogotaDate(utcStr);
        const time = d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
        const date = d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase();
        return { time, date };
    }

    function teamClass(name) {
        if (name === 'Colombia') return 'is-colombia';
        if (teamIsFav(name)) return 'is-fav';
        return '';
    }

    function renderFixtureView(groupKey) {
        if (!groupKey || groupKey === 'all' || !groupKey.startsWith('Grupo')) {
            fixtureView.classList.remove('visible');
            fixtureView.innerHTML = '';
            // En vista normal mostramos la grid
            container.style.display = '';
            return;
        }

        // En modo fixture ocultamos la grid de tarjetas
        container.style.display = 'none';
        fixtureView.classList.add('visible');

        const groupMatches = matches
            .filter(m => m.group === groupKey)
            .sort((a, b) => new Date(a.dateUtc) - new Date(b.dateUtc));

        // ---- FASE DE GRUPOS ----
        const groupRowsHTML = groupMatches.map(m => {
            const { time, date } = fmtBogota(m.dateUtc);
            const isCol = isColombia(m);
            const hasFav = matchHasFav(m);
            const rowClass = isCol ? 'fx-col' : (hasFav ? 'fx-fav' : '');
            const t1c = teamClass(m.team1.name);
            const t2c = teamClass(m.team2.name);
            return `
            <div class="fx-match-row ${rowClass}">
                <div class="fx-team">
                    <span class="fx-team-flag">${m.team1.flag}</span>
                    <span class="fx-team-name ${t1c}">${m.team1.name}</span>
                </div>
                <div class="fx-vs-block">
                    <span class="fx-vs-time">${time}</span>
                    <span class="fx-vs-date">${date}</span>
                </div>
                <div class="fx-team right">
                    <span class="fx-team-flag">${m.team2.flag}</span>
                    <span class="fx-team-name ${t2c}">${m.team2.name}</span>
                </div>
            </div>`;
        }).join('');

        // ---- BRACKET DE ELIMINATORIAS ----
        // Para cada ronda, obtenemos todos los partidos y construimos columnas
        // Solo mostramos los partidos donde este grupo puede tener representación
        const r32Links = GROUP_TO_R32[groupKey] || [];
        const r32MatchIds = new Set(r32Links.map(l => l.matchId));

        // Construir árbol de partidos: R32 seed → octavos → cuartos → semis → final
        const matchById = Object.fromEntries(matches.map(m => [m.id, m]));

        function nodeHTML(m, extraClass = '') {
            if (!m) return `<div class="fx-node ${extraClass}"><div class="fx-node-teams"><div class="fx-node-team is-tbd">Por definir</div></div></div>`;
            const { time, date } = fmtBogota(m.dateUtc);
            const t1c = teamClass(m.team1.name);
            const t2c = teamClass(m.team2.name);
            return `
            <div class="fx-node ${extraClass}">
                <div class="fx-node-date">${date} · ${time}</div>
                <div class="fx-node-teams">
                    <div class="fx-node-team ${t1c}">
                        <span class="fx-node-team-flag">${m.team1.flag}</span>
                        <span>${m.team1.name}</span>
                    </div>
                    <div class="fx-node-team-sep"></div>
                    <div class="fx-node-team ${t2c}">
                        <span class="fx-node-team-flag">${m.team2.flag}</span>
                        <span>${m.team2.name}</span>
                    </div>
                </div>
            </div>`;
        }

        // Armar las columnas del bracket
        // R32: los 2 partidos donde puede aparecer este grupo
        const r32Matches = r32Links.map(l => matchById[l.matchId]).filter(Boolean);

        // Para Octavos, Cuartos, Semis, Final: todos los partidos de esa ronda
        // (mostramos todos en una columna, es visualmente más comprensible en este contexto)
        function roundMatches(phase) {
            return matches.filter(m => m.phase === phase).sort((a, b) => new Date(a.dateUtc) - new Date(b.dateUtc));
        }

        const roundsData = [
            { label: 'R32 (posibles)', list: r32Matches, finalRound: false },
            { label: 'Octavos', list: roundMatches('Octavos de Final'), finalRound: false },
            { label: 'Cuartos', list: roundMatches('Cuartos de Final'), finalRound: false },
            { label: 'Semifinales', list: roundMatches('Semifinales'), finalRound: false },
            { label: '🏆 Final', list: roundMatches('Gran Final'), finalRound: true },
        ];

        const bracketColumnsHTML = roundsData.map(({ label, list, finalRound }) => {
            const slotsHTML = list.map(m =>
                `<div class="fx-slot">${nodeHTML(m, finalRound ? 'final-node' : '')}</div>`
            ).join('');
            return `
            <div class="fx-round ${finalRound ? 'final' : ''}">
                <div class="fx-round-label">${label}</div>
                ${slotsHTML}
            </div>`;
        }).join('');

        fixtureView.innerHTML = `
        <div class="fx-section-title">⚽ Fase de grupos · ${groupKey}</div>
        <div class="fx-matches-table">${groupRowsHTML}</div>

        <div class="fx-section-title">🏟️ Posibles partidos en eliminatorias</div>
        <div class="fx-bracket-outer">
            <div class="fx-bracket">${bracketColumnsHTML}</div>
        </div>`;
    }

    // Convierte "HH:MM" a minutos desde medianoche
    function timeToMinutes(hhmm) {
        if (!hhmm) return null;
        const [h, m] = hhmm.split(':').map(Number);
        return h * 60 + m;
    }

    function updateTimeClearBtn() {
        const active = timeFrom !== '' || timeTo !== '';
        timeClearBtn.classList.toggle('visible', active);
        timeFilterBar.classList.toggle('active', active);
    }

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

        // 3. Filtro por Rango Horario (en hora Colombia)
        const fromMin = timeToMinutes(timeFrom);
        const toMin = timeToMinutes(timeTo);
        if (fromMin !== null || toMin !== null) {
            filtered = filtered.filter(m => {
                const d = bogotaDate(m.dateUtc);
                const matchMin = d.getHours() * 60 + d.getMinutes();
                if (fromMin !== null && matchMin < fromMin) return false;
                if (toMin !== null && matchMin > toMin) return false;
                return true;
            });
        }

        // 4. Filtro del botón rápido
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
        // Si seleccionaron un grupo específico (Grupo A..L), mostrar fixture
        if (activeGroup !== 'all' && activeGroup.startsWith('Grupo')) {
            renderFixtureView(activeGroup);
        } else {
            renderFixtureView(null); // oculta la vista fixture
            applyFilters();
        }
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

    // Filtro de hora
    timeFromInput.addEventListener('change', () => {
        timeFrom = timeFromInput.value;
        updateTimeClearBtn();
        applyFilters();
    });
    timeToInput.addEventListener('change', () => {
        timeTo = timeToInput.value;
        updateTimeClearBtn();
        applyFilters();
    });
    timeClearBtn.addEventListener('click', () => {
        timeFrom = '';
        timeTo = '';
        timeFromInput.value = '';
        timeToInput.value = '';
        updateTimeClearBtn();
        applyFilters();
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
