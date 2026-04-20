// DADOS INICIAIS (pode importar CSV para substituir)
const players = [
  {
    position: 1,
    player: "João Silva",
    points: 120,
    wins: 12,
    fidelidade: "5/8",
  },
  {
    position: 2,
    player: "Maria Oliveira",
    points: 115,
    wins: 11,
    fidelidade: "4/8",
  },
  {
    position: 3,
    player: "Pedro Santos",
    points: 110,
    wins: 11,
    fidelidade: "6/8",
  },
  {
    position: 4,
    player: "Ana Costa",
    points: 105,
    wins: 10,
    fidelidade: "3/8",
  },
  {
    position: 5,
    player: "Lucas Ferreira",
    points: 100,
    wins: 10,
    fidelidade: "7/8",
  },
  { position: 6, player: "Zé Novato", points: 10, wins: 2, fidelidade: "1/8" },
];

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
function init() {
  runIntroIfFirstVisit();
  loadTheme();
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

  document.getElementById("sortSelect").addEventListener("change", (e) => {
    const colMap = {
      position: 0,
      player: 1,
      points: 2,
      wins: 3,
      fidelidade: 4,
    };
    sortTable(colMap[e.target.value]);
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

// Exportar CSV
function exportCSV() {
  const csv = ["Posição,Jogador,Pontos,Vitórias,Fidelidade"]
    .concat(
      currentData.map(
        (row) =>
          `${row.position},"${row.player}",${row.points},${row.wins},"${row.fidelidade}"`,
      ),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `ranking-pokemon-recife-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

// Importar CSV
function importCSV() {
  const fileInput = document.getElementById("csvFile");
  const file = fileInput.files[0];

  if (!file) {
    alert("Selecione um arquivo CSV primeiro!");
    return;
  }

  const reader = new FileReader();

  reader.onload = function (e) {
    const text = e.target.result;
    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l);

    const dataLines = lines.slice(1);

    const importedPlayers = dataLines.map((line, index) => {
      const values = line.split(",");

      const player = values[0]?.replace(/"/g, "").trim() || "Sem nome";
      const points = parseInt(values[1]) || 0;
      const monthly = parseInt(values[2]) || 0;
      const total = parseInt(values[3]) || 0;
      const qualified = parseInt(values[4]) || 0;
      const fidelidade = `${monthly}/${total}`;
      const position = index + 1;

      return { position, player, points, wins: qualified, fidelidade };
    });

    players.length = 0;
    players.push(...importedPlayers);

    currentData = [...players];
    currentPage = 1;
    saveToStorage();

    renderTable();
    updateStats();

    alert("CSV importado com sucesso!");
  };

  reader.readAsText(file, "UTF-8");
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
