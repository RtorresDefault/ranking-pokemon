// DADOS INICIAIS (carregado do CSV)
let players = [];

// Carregar dados do CSV
async function loadCSVData() {
  try {
    const response = await fetch('data.csv');
    const text = await response.text();
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);
    const headers = lines[0].split(',');
    
    players = lines.slice(1).map((line, index) => {
      const values = line.split(',');
      return {
        position: index + 1,
        player: values[0]?.trim() || 'Sem nome',
        points: parseInt(values[1]) || 0,
        wins: 0,
        fidelidade: `${values[2] || 0}/${values[3] || 0}`
      };
    });

    // Ordenar por pontos (decrescente)
    players.sort((a, b) => b.points - a.points);
    players.forEach((p, i) => p.position = i + 1);

    return true;
  } catch (e) {
    console.error('Erro ao carregar CSV:', e);
    return false;
  }
}


const STORAGE_KEY = "rankingPokemonData";

function loadFromStorage() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        players.length = 0;
        players.push(...parsed);
        return true;
      }
    } catch (e) {}
  }
  return false;
}

function saveToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
}

let currentData = [...players];
let sortColumn = 0;
let sortDirection = 1;
const itemsPerPage = 15;
let currentPage = 1;

// Animação de intro (só na primeira visita)
function runIntroIfFirstVisit() {
  const intro = document.getElementById("pokeIntro");
  if (localStorage.getItem("rankingPokemonVisited")) {
    intro.classList.add("hidden");
    return;
  }
  localStorage.setItem("rankingPokemonVisited", "1");
  // Remove o overlay depois da animação terminar
  setTimeout(() => intro.classList.add("hidden"), 3000);
}

// Inicializar
async function init() {
  runIntroIfFirstVisit();
  loadTheme();
  const csvLoaded = await loadCSVData();
  if (!csvLoaded) {
    console.warn('Erro ao carregar CSV, usando dados vazios');
  }
  loadFromStorage();
  currentData = [...players];
  renderTable();
  updateStats();
  setupEventListeners();
}

// Renderizar tabela com paginação
function renderTable() {
  const tbody = document.getElementById("tableBody");
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageData = currentData.slice(start, end);

  console.log(pageData);

  tbody.innerHTML = pageData
    .map(
      (row) => `
                <tr>
                    <td class="position">${row.position}</td>
                    <td>${row.player}</td>
                    <td>${row.points}</td>
                    <td>${row.wins}</td>
                    <td class="win-rate">${row.fidelidade}</td>
                </tr>
            `,
    )
    .join("");

  renderPagination();
}

// Paginação
function renderPagination() {
  const totalPages = Math.ceil(currentData.length / itemsPerPage);
  const pagination = document.getElementById("pagination");
  let html = "";

  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="page-btn ${i === currentPage ? "page-active" : ""}" onclick="goToPage(${i})">${i}</button>`;
  }

  pagination.innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  renderTable();
}

// Ordenação
function sortTable(column) {
  if (sortColumn === column) {
    sortDirection *= -1;
  } else {
    sortColumn = column;
    sortDirection = 1;
  }

  currentData.sort((a, b) => {
    let valA = getSortValue(a, column);
    let valB = getSortValue(b, column);

    if (typeof valA === "string") {
      return valA.localeCompare(valB) * sortDirection;
    } else {
      return (valA - valB) * sortDirection;
    }
  });

  currentData.forEach((row, index) => (row.position = index + 1));

  updateSortIndicators();
  renderTable();
}

function getSortValue(row, column) {
  switch (column) {
    case 0:
      return row.position;
    case 1:
      return row.player.toLowerCase();
    case 2:
      return row.points;
    case 3:
      return row.wins;

    // Fidelidade ordena pelo primeiro número X do X/X
    case 4:
      return parseInt(row.fidelidade.split("/")[0]) || 0;

    default:
      return 0;
  }
}

function updateSortIndicators() {
  document.querySelectorAll("th").forEach((th, i) => {
    th.className = "sortable";
    if (i === sortColumn) {
      th.classList.add(sortDirection === 1 ? "sorted-asc" : "sorted-desc");
    }
  });
}

// Buscar e Filtrar
function setupEventListeners() {
  document.getElementById("search").addEventListener("input", (e) => {
    const query = e.target.value.toLowerCase();
    currentData = players.filter((p) => p.player.toLowerCase().includes(query));
    currentPage = 1;
    renderTable();
    updateStats();
  });
}

// Estatísticas
function updateStats() {
  document.getElementById("totalPlayers").textContent = currentData.length;

  const avgPoints =
    currentData.reduce((sum, p) => sum + p.points, 0) / currentData.length || 0;
  document.getElementById("avgPoints").textContent = avgPoints.toFixed(1);

  // Maior fidelidade (pelo X)
  let top = currentData.reduce(
    (best, p) => {
      const currentX = parseInt(p.fidelidade.split("/")[0]) || 0;
      const bestX = parseInt(best.fidelidade.split("/")[0]) || 0;
      return currentX > bestX ? p : best;
    },
    { fidelidade: "0/0" },
  );

  document.getElementById("topFidelidade").textContent = top.fidelidade;
}

// Tema Dark Mode
function setThemeButton() {
  const themeButton = document.querySelector('.theme-toggle');
  if (!themeButton) return;
  const isDark = document.body.dataset.theme === 'dark';
  themeButton.textContent = isDark ? '☀️' : '🌙';
  themeButton.title = isDark ? 'Ativar modo claro' : 'Ativar modo escuro';
}

function toggleTheme() {
  const isDark = document.body.dataset.theme === 'dark';
  document.body.dataset.theme = isDark ? '' : 'dark';
  localStorage.setItem('rankingPokemonTheme', isDark ? '' : 'dark');
  setThemeButton();
}

function toggleInfo() {
  const content = document.getElementById('infoContent');
  const button = document.querySelector('.info-toggle');
  const isExpanded = content.classList.contains('expanded');
  
  if (isExpanded) {
    content.classList.remove('expanded');
    button.classList.add('rotated');
  } else {
    content.classList.add('expanded');
    button.classList.add('rotated');
  }
}

function loadTheme() {
  const saved = localStorage.getItem('rankingPokemonTheme');
  if (saved) document.body.dataset.theme = saved;
  setThemeButton();
}

// Atualizar data automaticamente
setInterval(() => {
  document.getElementById("lastUpdate").textContent =
    `Atualizado: ${new Date().toLocaleString("pt-BR")}`;
}, 300000);

// Iniciar
init();
