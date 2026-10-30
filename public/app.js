// ESTADO DA APLICAÇÃO
let currentUser = null;
let currentTurma = null;
let alunosTurma = [];

// INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('docente_session');
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      showTurmasView();
    } catch (e) {
      localStorage.removeItem('docente_session');
    }
  }
});

// NOTIFICAÇÕES (TOAST)
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  toast.innerText = message;
  toast.className = `toast toast-${type}`;
  toast.style.display = 'block';

  setTimeout(() => {
    toast.style.display = 'none';
  }, 4000);
}

// PREENCHIMENTO RÁPIDO PARA DEMO/TESTE
function fillCreds(nif, senha) {
  document.getElementById('nif').value = nif;
  document.getElementById('senha').value = senha;
}

// 1. LOGIN
async function handleLogin(event) {
  event.preventDefault();
  const nifInput = document.getElementById('nif').value;
  const senhaInput = document.getElementById('senha').value;
  const btn = document.getElementById('btnLogin');

  btn.querySelector('.btn-text').style.display = 'none';
  btn.querySelector('.btn-loader').style.display = 'inline';
  btn.disabled = true;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nif: nifInput, senha: senhaInput })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showToast(data.error || 'Falha ao autenticar.', 'error');
      return;
    }

    currentUser = data.docente;
    localStorage.setItem('docente_session', JSON.stringify(currentUser));
    showToast(`Bem-vindo, ${currentUser.nome}!`, 'success');
    showTurmasView();
  } catch (err) {
    showToast('Erro de comunicação com o servidor: ' + err.message, 'error');
  } finally {
    btn.querySelector('.btn-text').style.display = 'inline';
    btn.querySelector('.btn-loader').style.display = 'none';
    btn.disabled = false;
  }
}

function logout() {
  localStorage.removeItem('docente_session');
  currentUser = null;
  currentTurma = null;
  document.getElementById('viewDiario').classList.remove('active');
  document.getElementById('viewTurmas').classList.remove('active');
  document.getElementById('viewLogin').classList.add('active');
  showToast('Sessão encerrada.', 'success');
}

// 2. TELA DE TURMAS
function showTurmasView() {
  document.getElementById('viewLogin').classList.remove('active');
  document.getElementById('viewDiario').classList.remove('active');
  document.getElementById('viewTurmas').classList.add('active');

  document.getElementById('userName').innerText = currentUser.nome;
  document.getElementById('userNif').innerText = `NIF: ${currentUser.nif}`;
  document.getElementById('userAvatar').innerText = currentUser.nome.charAt(0).toUpperCase();

  loadTurmas();
}

async function loadTurmas() {
  const grid = document.getElementById('turmasGrid');
  grid.innerHTML = '<div style="color: #94a3b8; padding: 20px;">Carregando turmas vinculadas...</div>';

  try {
    const res = await fetch(`/api/turmas?nif=${currentUser.nif}`);
    const data = await res.json();

    if (!res.ok || !data.success) {
      grid.innerHTML = `<div style="color: #fca5a5; padding: 20px;">${data.error || 'Falha ao carregar turmas.'}</div>`;
      return;
    }

    const turmas = data.turmas || [];
    if (turmas.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1/-1; background: #131b2e; padding: 30px; border-radius: 12px; text-align: center; border: 1px dashed #24304f;">
          <h3 style="color:#f8fafc; margin-bottom: 8px;">Nenhuma turma vinculada</h3>
          <p style="color:#94a3b8;">Não há turmas ativas registradas para o NIF ${currentUser.nif}.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = turmas.map(t => `
      <div class="turma-card" onclick="openDiario(${t.codigo})">
        <div>
          <div class="turma-card-header">
            <span class="turma-code">CÓD. #${t.codigo}</span>
            <span class="turma-turno">Turno: ${t.turno}</span>
          </div>

          <h3 class="turma-title">${t.nome_curso}</h3>

          <div class="turma-meta-grid">
            <div class="turma-meta-item">
              <span class="turma-meta-label">Estudantes</span>
              <span class="turma-meta-value">${t.total_alunos || 0} matriculados</span>
            </div>
            <div class="turma-meta-item">
              <span class="turma-meta-label">Capacidade</span>
              <span class="turma-meta-value">${t.quantidade_maxima} vagas</span>
            </div>
            <div class="turma-meta-item">
              <span class="turma-meta-label">Início</span>
              <span class="turma-meta-value">${t.data_inicio || '--'}</span>
            </div>
            <div class="turma-meta-item">
              <span class="turma-meta-label">Término</span>
              <span class="turma-meta-value">${t.data_fim || '--'}</span>
            </div>
          </div>
        </div>

        <div class="turma-card-footer">
          <span class="status-badge">
            <span class="status-dot active"></span>
            Diário: ${t.status_diario || 'Ativo'}
          </span>
          <span style="color: #38bdf8; font-weight: 600;">Abrir Diário →</span>
        </div>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = `<div style="color: #fca5a5; padding: 20px;">Erro ao carregar: ${err.message}</div>`;
  }
}

// 3. DIÁRIO DA TURMA (ALUNOS, NOTAS E PRESENÇAS)
async function openDiario(codigoTurma) {
  document.getElementById('viewTurmas').classList.remove('active');
  document.getElementById('viewDiario').classList.add('active');

  document.getElementById('userNameDiario').innerText = currentUser.nome;
  document.getElementById('turmaCodigoBadge').innerText = `Turma #${codigoTurma}`;
  document.getElementById('turmaNomeHeader').innerText = 'Carregando detalhes...';

  const tbody = document.getElementById('alunosTableBody');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 30px; color: #94a3b8;">Carregando alunos da turma...</td></tr>';

  try {
    const res = await fetch(`/api/alunos?codigoTurma=${codigoTurma}`);
    const data = await res.json();

    if (!res.ok || !data.success) {
      showToast(data.error || 'Erro ao carregar alunos.', 'error');
      return;
    }

    currentTurma = data.turma || { codigo: codigoTurma, nome_curso: `Turma #${codigoTurma}` };
    alunosTurma = data.alunos || [];

    renderTurmaDetails();
    renderAlunosTable();
  } catch (err) {
    showToast('Falha ao abrir diário: ' + err.message, 'error');
  }
}

function voltarTurmas() {
  document.getElementById('viewDiario').classList.remove('active');
  document.getElementById('viewTurmas').classList.add('active');
  currentTurma = null;
  alunosTurma = [];
}

function renderTurmaDetails() {
  document.getElementById('turmaNomeHeader').innerText = currentTurma.nome_curso || `Turma #${currentTurma.codigo}`;

  const detailCard = document.getElementById('turmaDetailCard');
  detailCard.innerHTML = `
    <div class="detail-block">
      <span class="d-label">Curso</span>
      <span class="d-val">${currentTurma.nome_curso || '--'}</span>
    </div>
    <div class="detail-block">
      <span class="d-label">Turno</span>
      <span class="d-val">${currentTurma.turno || 'Não informado'}</span>
    </div>
    <div class="detail-block">
      <span class="d-label">Vínculo Empresa</span>
      <span class="d-val">${currentTurma.empresa ? (currentTurma.nome_empresa || 'Empresa Parceira') : 'Turma Regular'}</span>
    </div>
    <div class="detail-block">
      <span class="d-label">Período Letivo</span>
      <span class="d-val">${currentTurma.data_inicio || '--'} até ${currentTurma.data_fim || '--'}</span>
    </div>
  `;
}

function renderAlunosTable() {
  const tbody = document.getElementById('alunosTableBody');
  document.getElementById('statTotalAlunos').innerText = alunosTurma.length;

  if (alunosTurma.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding: 30px; color: #94a3b8;">Nenhum aluno matriculado nesta turma até o momento.</td></tr>';
    document.getElementById('statMediaTurma').innerText = '--';
    return;
  }

  let somaNotas = 0;
  let countNotas = 0;

  tbody.innerHTML = alunosTurma.map((aluno, index) => {
    const totalAulas = aluno.total_aulas || 20;
    const presencas = aluno.presencas || 0;
    const freqPerc = Math.round((presencas / totalAulas) * 100);
    const notaVal = aluno.nota !== null && aluno.nota !== undefined ? Number(aluno.nota) : '';

    if (notaVal !== '') {
      somaNotas += Number(notaVal);
      countNotas++;
    }

    return `
      <tr id="rowAluno_${aluno.matricula_aluno}">
        <td class="col-matricula">#${aluno.matricula_aluno}</td>
        <td class="col-nome">${aluno.nome}</td>
        <td>
          <div class="presence-control">
            <button class="btn-counter" onclick="changePresenca(${index}, -1)">-</button>
            <input type="number" class="input-presence" id="presenca_${aluno.matricula_aluno}" value="${presencas}" min="0" max="${totalAulas}" onchange="updatePresencaInput(${index}, this.value)" />
            <button class="btn-counter" onclick="changePresenca(${index}, 1)">+</button>
            <span style="font-size: 0.8rem; color: #64748b;">/${totalAulas}</span>
          </div>
        </td>
        <td style="text-align:center;">
          <div class="freq-bar-wrapper">
            <span id="freqLabel_${aluno.matricula_aluno}" style="font-weight: 700; font-size: 0.85rem;">${freqPerc}%</span>
            <div class="freq-bar-bg">
              <div class="freq-bar-fill" id="freqBar_${aluno.matricula_aluno}" style="width: ${Math.min(freqPerc, 100)}%;"></div>
            </div>
          </div>
        </td>
        <td>
          <input 
            type="number" 
            step="0.1" 
            min="0" 
            max="10" 
            placeholder="0.0" 
            class="input-nota" 
            id="nota_${aluno.matricula_aluno}" 
            value="${notaVal}" 
            onchange="updateNotaLocal(${index}, this.value)"
          />
        </td>
        <td style="text-align:center;">
          <select class="select-status" id="status_${aluno.matricula_aluno}" onchange="updateStatusLocal(${index}, this.value)">
            <option value="Cursando" ${aluno.status_final === 'Cursando' ? 'selected' : ''}>Cursando</option>
            <option value="Aprovado" ${aluno.status_final === 'Aprovado' ? 'selected' : ''}>Aprovado</option>
            <option value="Em Recuperação" ${aluno.status_final === 'Em Recuperação' ? 'selected' : ''}>Em Recuperação</option>
            <option value="Reprovado" ${aluno.status_final === 'Reprovado' ? 'selected' : ''}>Reprovado</option>
          </select>
        </td>
        <td style="text-align:center;">
          <button class="btn btn-primary btn-sm" id="btnSalvar_${aluno.matricula_aluno}" onclick="salvarAluno(${index})">
            💾 Salvar
          </button>
        </td>
      </tr>
    `;
  }).join('');

  if (countNotas > 0) {
    const media = (somaNotas / countNotas).toFixed(1);
    document.getElementById('statMediaTurma').innerText = `${media} / 10`;
  } else {
    document.getElementById('statMediaTurma').innerText = '--';
  }
}

// CONTROLES DE FREQUÊNCIA E NOTA
function changePresenca(index, delta) {
  const aluno = alunosTurma[index];
  const totalAulas = aluno.total_aulas || 20;
  let novo = (aluno.presencas || 0) + delta;
  if (novo < 0) novo = 0;
  if (novo > totalAulas) novo = totalAulas;

  aluno.presencas = novo;
  document.getElementById(`presenca_${aluno.matricula_aluno}`).value = novo;
  recalcFreq(aluno);
}

function updatePresencaInput(index, val) {
  const aluno = alunosTurma[index];
  const totalAulas = aluno.total_aulas || 20;
  let num = parseInt(val, 10);
  if (isNaN(num) || num < 0) num = 0;
  if (num > totalAulas) num = totalAulas;
  aluno.presencas = num;
  recalcFreq(aluno);
}

function recalcFreq(aluno) {
  const totalAulas = aluno.total_aulas || 20;
  const perc = Math.round((aluno.presencas / totalAulas) * 100);
  const label = document.getElementById(`freqLabel_${aluno.matricula_aluno}`);
  const bar = document.getElementById(`freqBar_${aluno.matricula_aluno}`);
  if (label) label.innerText = `${perc}%`;
  if (bar) bar.style.width = `${Math.min(perc, 100)}%`;
}

function updateNotaLocal(index, val) {
  const aluno = alunosTurma[index];
  const num = val === '' ? null : parseFloat(val);
  aluno.nota = num;

  // Sugestão automática de status conforme nota
  const statusSelect = document.getElementById(`status_${aluno.matricula_aluno}`);
  if (statusSelect && num !== null) {
    if (num >= 7.0) {
      statusSelect.value = 'Aprovado';
      aluno.status_final = 'Aprovado';
    } else if (num < 5.0) {
      statusSelect.value = 'Reprovado';
      aluno.status_final = 'Reprovado';
    } else {
      statusSelect.value = 'Em Recuperação';
      aluno.status_final = 'Em Recuperação';
    }
  }
}

function updateStatusLocal(index, val) {
  alunosTurma[index].status_final = val;
}

// 4. PERSISTÊNCIA NO BANCO (SALVAR ALUNO)
async function salvarAluno(index) {
  const aluno = alunosTurma[index];
  const btn = document.getElementById(`btnSalvar_${aluno.matricula_aluno}`);

  const notaInput = document.getElementById(`nota_${aluno.matricula_aluno}`).value;
  const presencaInput = document.getElementById(`presenca_${aluno.matricula_aluno}`).value;
  const statusInput = document.getElementById(`status_${aluno.matricula_aluno}`).value;

  btn.disabled = true;
  btn.innerText = 'Salvando...';

  try {
    const res = await fetch('/api/alunos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        codigoTurma: currentTurma.codigo,
        matricula: aluno.matricula_aluno,
        nota: notaInput,
        presencas: presencaInput,
        statusFinal: statusInput,
        nifDocente: currentUser.nif
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      showToast(data.error || 'Erro ao salvar avaliação.', 'error');
      return;
    }

    showToast(`Avaliação de ${aluno.nome} salva no diário!`, 'success');
    btn.innerText = '✓ Salvo';
    setTimeout(() => {
      btn.innerText = '💾 Salvar';
      btn.disabled = false;
    }, 2000);
  } catch (err) {
    showToast('Erro de rede: ' + err.message, 'error');
    btn.disabled = false;
    btn.innerText = '💾 Salvar';
  }
}
