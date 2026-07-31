let CATEGORIES = {
  '我': ['衣', '食', '交通', '生活', '医', '话费', '其他'],
  '芊羽': ['衣', '学', '医', '生活', '食', '其他'],
  '杰': ['衣', '食', '交通', '生活', '医', '话费', '其他'],
  '家庭': ['食', '住', '零食', '其他'],
  '人情': ['爸妈', '老爸老妈', '孝敬', '过节', '朋友', '其他']
};

const DEFAULT_CATEGORIES = {
  '我': ['衣', '食', '交通', '生活', '医', '话费', '其他'],
  '芊羽': ['衣', '学', '医', '生活', '食', '其他'],
  '杰': ['衣', '食', '交通', '生活', '医', '话费', '其他'],
  '家庭': ['食', '住', '零食', '其他'],
  '人情': ['爸妈', '老爸老妈', '孝敬', '过节', '朋友', '其他']
};

let CATEGORY_COLORS = {
  '衣': '#FF6B6B', '食': '#4ECDC4', '交通': '#45B7D1', '生活': '#96CEB4',
  '医': '#FFEAA7', '话费': '#DDA0DD', '学': '#98D8C8', '住': '#F7DC6F',
  '零食': '#BB8FCE', '爸妈': '#85C1E9', '老爸老妈': '#F8B500',
  '孝敬': '#FF69B4', '过节': '#00CED1', '朋友': '#9370DB', '其他': '#BDC3C7'
};

const DEFAULT_COLORS = {
  '衣': '#FF6B6B', '食': '#4ECDC4', '交通': '#45B7D1', '生活': '#96CEB4',
  '医': '#FFEAA7', '话费': '#DDA0DD', '学': '#98D8C8', '住': '#F7DC6F',
  '零食': '#BB8FCE', '爸妈': '#85C1E9', '老爸老妈': '#F8B500',
  '孝敬': '#FF69B4', '过节': '#00CED1', '朋友': '#9370DB', '其他': '#BDC3C7'
};

const PRESET_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8B500', '#FF69B4', '#00CED1', '#9370DB', '#BDC3C7', '#FFA07A', '#87CEEB', '#90EE90', '#DDA0DD', '#F0E68C'];

let currentTab = 'home';
let currentMember = '我';
let editingId = null;

function initApp() {
  registerServiceWorker();
  loadCategories();
  setupEventListeners();
  renderHome();
}

function loadCategories() {
  const savedCategories = localStorage.getItem('categories');
  const savedColors = localStorage.getItem('categoryColors');
  if (savedCategories) {
    try {
      CATEGORIES = JSON.parse(savedCategories);
    } catch (e) {}
  }
  if (savedColors) {
    try {
      CATEGORY_COLORS = JSON.parse(savedColors);
    } catch (e) {}
  }
}

function saveCategories() {
  localStorage.setItem('categories', JSON.stringify(CATEGORIES));
  localStorage.setItem('categoryColors', JSON.stringify(CATEGORY_COLORS));
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(console.error);
  }
}

function setupEventListeners() {
  document.getElementById('nav-home').addEventListener('click', () => switchTab('home'));
  document.getElementById('nav-add').addEventListener('click', () => switchTab('add'));
  document.getElementById('nav-stats').addEventListener('click', () => switchTab('stats'));
  document.getElementById('nav-settings').addEventListener('click', () => switchTab('settings'));

  document.querySelectorAll('.member-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentMember = btn.dataset.member;
      document.querySelectorAll('.member-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCategories();
    });
  });

  document.getElementById('record-form').addEventListener('submit', handleSubmit);
  document.getElementById('cancel-btn').addEventListener('click', cancelEdit);

  const fileInput = document.getElementById('import-file');
  if (fileInput) {
    fileInput.addEventListener('change', handleImport);
  }
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tab);
  });
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  document.getElementById(`page-${tab}`).classList.add('active');

  if (tab === 'home') renderHome();
  if (tab === 'add') renderAddPage();
  if (tab === 'stats') renderStats();
  if (tab === 'settings') renderSettings();
}

function renderHome() {
  const listContainer = document.getElementById('record-list');
  if (!listContainer) return;

  getAllRecords().then(records => {
    records.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const summary = calculateSummary(records);
    document.getElementById('total-amount').textContent = summary.total.toFixed(2);
    document.getElementById('month-amount').textContent = summary.month.toFixed(2);

    const grouped = groupByMonth(records);
    listContainer.innerHTML = '';

    Object.keys(grouped).sort().reverse().forEach(month => {
      const [year, mon] = month.split('-');
      const monthDiv = document.createElement('div');
      monthDiv.className = 'month-group';
      monthDiv.innerHTML = `<div class="month-header">${year}年${parseInt(mon)}月 (合计: ¥${grouped[month].reduce((s, r) => s + r.amount, 0).toFixed(2)})</div>`;
      
      grouped[month].forEach(record => {
        monthDiv.appendChild(createRecordElement(record));
      });
      listContainer.appendChild(monthDiv);
    });

    if (records.length === 0) {
      listContainer.innerHTML = '<div class="empty-state">暂无记录，点击下方 + 开始记账</div>';
    }
  });
}

function createRecordElement(record) {
  const div = document.createElement('div');
  div.className = 'record-item';
  const color = CATEGORY_COLORS[record.category] || '#BDC3C7';
  div.innerHTML = `
    <div class="record-color" style="background: ${color}"></div>
    <div class="record-info">
      <div class="record-main">
        <span class="record-member">${escapeHtml(record.member)}</span>
        <span class="record-category">${escapeHtml(record.category)}</span>
      </div>
      <div class="record-sub">
        <span>${formatDate(record.date)}</span>
        ${record.note ? `<span class="record-note">${escapeHtml(record.note)}</span>` : ''}
      </div>
    </div>
    <div class="record-amount">¥${record.amount.toFixed(2)}</div>
    <div class="record-actions">
      <button class="btn-edit" data-id="${record.id}">编辑</button>
      <button class="btn-delete" data-id="${record.id}">删除</button>
    </div>
  `;

  div.querySelector('.btn-edit').addEventListener('click', (e) => {
    e.stopPropagation();
    editRecord(record);
  });
  div.querySelector('.btn-delete').addEventListener('click', (e) => {
    e.stopPropagation();
    deleteRecordItem(record.id);
  });

  return div;
}

function calculateSummary(records) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  let total = 0, month = 0;
  records.forEach(r => {
    total += r.amount;
    if (r.date.startsWith(currentMonth)) month += r.amount;
  });
  return { total, month };
}

function groupByMonth(records) {
  const groups = {};
  records.forEach(r => {
    const month = r.date.substring(0, 7);
    if (!groups[month]) groups[month] = [];
    groups[month].push(r);
  });
  return groups;
}

function renderAddPage() {
  editingId = null;
  document.getElementById('record-form').reset();
  document.getElementById('form-title').textContent = '记一笔';
  setDefaultDate();
  renderCategories();
}

function setDefaultDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('record-date').value = today;
}

function renderCategories() {
  const container = document.getElementById('category-list');
  container.innerHTML = '';
  const categories = CATEGORIES[currentMember] || [];
  categories.forEach(cat => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'category-btn';
    btn.textContent = cat;
    btn.dataset.category = cat;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('selected-category').value = cat;
    });
    container.appendChild(btn);
  });
  if (categories.length > 0) {
    document.getElementById('selected-category').value = categories[0];
    const firstBtn = container.querySelector('.category-btn');
    if (firstBtn) firstBtn.classList.add('active');
  }
}

function handleSubmit(e) {
  e.preventDefault();
  const record = {
    member: currentMember,
    category: document.getElementById('selected-category').value,
    amount: parseFloat(document.getElementById('record-amount').value),
    date: document.getElementById('record-date').value,
    note: document.getElementById('record-note').value.trim()
  };

  if (!record.amount || record.amount <= 0) {
    alert('请输入有效金额');
    return;
  }
  if (!record.category) {
    alert('请选择分类');
    return;
  }

  const action = editingId ? updateRecord(editingId, record) : addRecord(record);
  action.then(() => {
    switchTab('home');
  }).catch(err => alert('保存失败: ' + err.message));
}

function editRecord(record) {
  switchTab('add');
  editingId = record.id;
  document.getElementById('form-title').textContent = '编辑记录';
  currentMember = record.member;
  document.querySelectorAll('.member-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.member === currentMember);
  });
  document.getElementById('record-amount').value = record.amount;
  document.getElementById('record-date').value = record.date;
  document.getElementById('record-note').value = record.note || '';
  renderCategories();
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.category === record.category);
  });
  document.getElementById('selected-category').value = record.category;
}

function cancelEdit() {
  editingId = null;
  document.getElementById('record-form').reset();
  document.getElementById('form-title').textContent = '记一笔';
  setDefaultDate();
  renderCategories();
}

function deleteRecordItem(id) {
  if (!confirm('确定删除这条记录吗？')) return;
  deleteRecord(id).then(() => {
    renderHome();
  }).catch(err => alert('删除失败: ' + err.message));
}

function renderStats() {
  const container = document.getElementById('stats-content');
  const yearSelect = document.getElementById('stats-year');
  const monthSelect = document.getElementById('stats-month');

  getAllRecords().then(records => {
    populateYearMonthSelectors(records);
    
    const year = yearSelect.value;
    const month = monthSelect.value;
    const filtered = records.filter(r => {
      const recordDate = new Date(r.date);
      if (year !== 'all' && recordDate.getFullYear() !== parseInt(year)) return false;
      if (month !== 'all' && recordDate.getMonth() + 1 !== parseInt(month)) return false;
      return true;
    });

    const byMember = {};
    const byCategory = {};
    filtered.forEach(r => {
      if (!byMember[r.member]) byMember[r.member] = 0;
      byMember[r.member] += r.amount;
      if (!byCategory[r.category]) byCategory[r.category] = 0;
      byCategory[r.category] += r.amount;
    });

    const total = filtered.reduce((s, r) => s + r.amount, 0);
    
    let html = `<div class="stats-total">总支出: <span>¥${total.toFixed(2)}</span></div>`;
    
    html += '<div class="stats-section"><h3>按成员</h3>';
    Object.keys(byMember).sort().forEach(m => {
      const pct = total > 0 ? ((byMember[m] / total) * 100).toFixed(1) : 0;
      html += `<div class="stats-bar"><div class="stats-bar-label">${m}: ¥${byMember[m].toFixed(2)} (${pct}%)</div><div class="stats-bar-bg"><div class="stats-bar-fill" style="width:${pct}%;background:var(--primary-color)"></div></div></div>`;
    });
    html += '</div>';

    html += '<div class="stats-section"><h3>按分类</h3>';
    Object.keys(byCategory).sort((a, b) => byCategory[b] - byCategory[a]).forEach(c => {
      const pct = total > 0 ? ((byCategory[c] / total) * 100).toFixed(1) : 0;
      const color = CATEGORY_COLORS[c] || '#BDC3C7';
      html += `<div class="stats-bar"><div class="stats-bar-label"><span class="color-dot" style="background:${color}"></span>${c}: ¥${byCategory[c].toFixed(2)} (${pct}%)</div><div class="stats-bar-bg"><div class="stats-bar-fill" style="width:${pct}%;background:${color}"></div></div></div>`;
    });
    html += '</div>';

    container.innerHTML = html;
  });
}

function populateYearMonthSelectors(records) {
  const yearSelect = document.getElementById('stats-year');
  const monthSelect = document.getElementById('stats-month');
  
  if (yearSelect.options.length > 1) return;
  
  const years = new Set();
  records.forEach(r => years.add(new Date(r.date).getFullYear()));
  const currentYear = new Date().getFullYear();
  years.add(currentYear);
  
  [...years].sort().reverse().forEach(y => {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y + '年';
    yearSelect.appendChild(opt);
  });
  
  for (let i = 1; i <= 12; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = i + '月';
    monthSelect.appendChild(opt);
  }

  yearSelect.addEventListener('change', renderStats);
  monthSelect.addEventListener('change', renderStats);
}

function renderSettings() {
  const container = document.getElementById('settings-content');
  container.innerHTML = `
    <div class="settings-section">
      <h3>分类管理</h3>
      <div class="settings-item">
        <div class="settings-info">
          <strong>管理大类和小类</strong>
          <p>添加、编辑或删除大类（成员）和小类（分类）</p>
        </div>
        <button id="manage-categories-btn" class="btn-primary">管理</button>
      </div>
      <div class="settings-item">
        <div class="settings-info">
          <strong>恢复默认分类</strong>
          <p>将所有大类和小类恢复为默认设置</p>
        </div>
        <button id="reset-categories-btn" class="btn-secondary">恢复</button>
      </div>
    </div>
    <div class="settings-section">
      <h3>数据管理</h3>
      <div class="settings-item">
        <div class="settings-info">
          <strong>导出数据</strong>
          <p>导出记账记录 + 大类小类配置，用于备份或换机迁移</p>
        </div>
        <button id="export-btn" class="btn-primary">导出</button>
      </div>
      <div class="settings-item">
        <div class="settings-info">
          <strong>导入数据</strong>
          <p>从备份文件导入记账记录和大类小类配置</p>
        </div>
        <button id="import-btn" class="btn-primary">选择文件</button>
        <input type="file" id="import-file" accept=".json" style="display:none" />
      </div>
      <div class="settings-item danger">
        <div class="settings-info">
          <strong>清空所有数据</strong>
          <p>删除所有记账记录和分类配置，此操作不可恢复</p>
        </div>
        <button id="clear-btn" class="btn-danger">清空</button>
      </div>
    </div>
    <div class="settings-section">
      <h3>关于</h3>
      <p class="about-text">家庭记账本 v2.1</p>
      <p class="about-text">多成员记账 · 本地存储 · 数据可迁移</p>
    </div>
  `;

  document.getElementById('manage-categories-btn').addEventListener('click', openCategoryManager);
  document.getElementById('reset-categories-btn').addEventListener('click', resetCategories);
  document.getElementById('export-btn').addEventListener('click', handleExport);
  document.getElementById('import-btn').addEventListener('click', () => {
    document.getElementById('import-file').click();
  });
  document.getElementById('clear-btn').addEventListener('click', handleClear);
  
  const fileInput = document.getElementById('import-file');
  if (fileInput) {
    fileInput.addEventListener('change', handleImport);
  }
}

function openCategoryManager() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>分类管理</h3>
        <button class="modal-close">✕</button>
      </div>
      <div class="modal-body">
        <div class="category-manager-section">
          <h4>大类管理</h4>
          <div class="category-list-manager" id="member-list"></div>
          <div class="add-category-row">
            <input type="text" id="new-member-name" placeholder="新大类名称">
            <button id="add-member-btn" class="btn-primary">添加大类</button>
          </div>
        </div>
        <div class="category-manager-section">
          <h4>小类管理 <span class="hint">（点击大类编辑对应的小类）</span></h4>
          <div class="member-tabs" id="member-tabs"></div>
          <div class="subcategory-editor" id="subcategory-editor"></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector('.modal-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  renderMemberList(overlay);
  renderMemberTabs(overlay);
  
  document.getElementById('add-member-btn').addEventListener('click', () => {
    const input = document.getElementById('new-member-name');
    const name = input.value.trim();
    if (!name) return;
    if (CATEGORIES[name]) {
      alert('该大类已存在');
      return;
    }
    CATEGORIES[name] = ['其他'];
    saveCategories();
    input.value = '';
    renderMemberList(overlay);
    renderMemberTabs(overlay);
  });
}

function renderMemberList(overlay) {
  const list = overlay.querySelector('#member-list');
  const members = Object.keys(CATEGORIES);
  list.innerHTML = members.map(m => `
    <div class="category-item">
      <span class="category-name">${escapeHtml(m)}</span>
      <div class="category-item-actions">
        <button class="btn-icon" data-action="edit-member" data-name="${escapeHtml(m)}">✏️</button>
        <button class="btn-icon danger" data-action="delete-member" data-name="${escapeHtml(m)}">🗑️</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.btn-icon').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const name = btn.dataset.name;
      if (action === 'edit-member') {
        const newName = prompt('编辑大类名称：', name);
        if (newName && newName !== name) {
          if (CATEGORIES[newName]) {
            alert('该名称已存在');
            return;
          }
          const oldData = CATEGORIES[name];
          const oldColorData = {};
          CATEGORIES[newName] = oldData;
          delete CATEGORIES[name];
          saveCategories();
          renderMemberList(overlay);
          renderMemberTabs(overlay);
        }
      } else if (action === 'delete-member') {
        if (Object.keys(CATEGORIES).length <= 1) {
          alert('至少保留一个大类');
          return;
        }
        if (!confirm(`确定删除大类"${name}"及其所有小类吗？`)) return;
        delete CATEGORIES[name];
        saveCategories();
        renderMemberList(overlay);
        renderMemberTabs(overlay);
      }
    });
  });
}

function renderMemberTabs(overlay) {
  const tabs = overlay.querySelector('#member-tabs');
  const members = Object.keys(CATEGORIES);
  let activeMember = tabs.dataset.active || members[0];
  
  tabs.innerHTML = members.map(m => `
    <button class="member-tab ${m === activeMember ? 'active' : ''}" data-member="${escapeHtml(m)}">${escapeHtml(m)}</button>
  `).join('');

  tabs.querySelectorAll('.member-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      activeMember = tab.dataset.member;
      tabs.dataset.active = activeMember;
      renderMemberTabs(overlay);
      renderSubcategoryEditor(overlay, activeMember);
    });
  });

  if (activeMember) {
    renderSubcategoryEditor(overlay, activeMember);
  }
}

function renderSubcategoryEditor(overlay, memberName) {
  const editor = overlay.querySelector('#subcategory-editor');
  const subcategories = CATEGORIES[memberName] || [];
  
  editor.innerHTML = `
    <div class="current-member-name">当前大类：<strong>${escapeHtml(memberName)}</strong></div>
    <div class="subcategory-list">
      ${subcategories.map((sub, idx) => `
        <div class="subcategory-item">
          <span class="subcategory-color" style="background:${CATEGORY_COLORS[sub] || '#BDC3C7'}"></span>
          <span class="subcategory-name">${escapeHtml(sub)}</span>
          <div class="subcategory-actions">
            <button class="btn-icon" data-action="edit-sub" data-member="${escapeHtml(memberName)}" data-idx="${idx}">✏️</button>
            <button class="btn-icon" data-action="color-sub" data-member="${escapeHtml(memberName)}" data-idx="${idx}">🎨</button>
            <button class="btn-icon danger" data-action="delete-sub" data-member="${escapeHtml(memberName)}" data-idx="${idx}">🗑️</button>
          </div>
        </div>
      `).join('') || '<div class="empty-subcategory">暂无小类</div>'}
    </div>
    <div class="add-category-row">
      <input type="text" id="new-sub-name" placeholder="新小类名称">
      <button id="add-sub-btn" class="btn-primary">添加小类</button>
    </div>
  `;

  editor.querySelectorAll('.btn-icon').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      const member = btn.dataset.member;
      const idx = parseInt(btn.dataset.idx);
      
      if (action === 'edit-sub') {
        const oldName = CATEGORIES[member][idx];
        const newName = prompt('编辑小类名称：', oldName);
        if (newName && newName !== oldName) {
          CATEGORIES[member][idx] = newName;
          if (CATEGORY_COLORS[oldName] && !CATEGORY_COLORS[newName]) {
            CATEGORY_COLORS[newName] = CATEGORY_COLORS[oldName];
            delete CATEGORY_COLORS[oldName];
          }
          saveCategories();
          renderSubcategoryEditor(overlay, member);
        }
      } else if (action === 'color-sub') {
        const currentColor = CATEGORY_COLORS[CATEGORIES[member][idx]] || '#BDC3C7';
        showColorPicker(overlay, member, idx, currentColor);
      } else if (action === 'delete-sub') {
        const subName = CATEGORIES[member][idx];
        if (!confirm(`确定删除小类"${subName}"吗？`)) return;
        CATEGORIES[member].splice(idx, 1);
        if (CATEGORIES[member].length === 0) {
          CATEGORIES[member].push('其他');
        }
        saveCategories();
        renderSubcategoryEditor(overlay, member);
      }
    });
  });

  document.getElementById('add-sub-btn').addEventListener('click', () => {
    const input = document.getElementById('new-sub-name');
    const name = input.value.trim();
    if (!name) return;
    if (CATEGORIES[memberName].includes(name)) {
      alert('该小类已存在');
      return;
    }
    CATEGORIES[memberName].push(name);
    if (!CATEGORY_COLORS[name]) {
      CATEGORY_COLORS[name] = PRESET_COLORS[CATEGORIES[memberName].length % PRESET_COLORS.length];
    }
    saveCategories();
    input.value = '';
    renderSubcategoryEditor(overlay, memberName);
  });
}

function showColorPicker(overlay, memberName, idx, currentColor) {
  const subName = CATEGORIES[memberName][idx];
  const picker = document.createElement('div');
  picker.className = 'color-picker-modal';
  picker.innerHTML = `
    <div class="color-picker-content">
      <h4>选择颜色 - ${escapeHtml(subName)}</h4>
      <div class="color-grid">
        ${PRESET_COLORS.map(c => `
          <button class="color-swatch ${c === currentColor ? 'selected' : ''}" style="background:${c}" data-color="${c}"></button>
        `).join('')}
      </div>
      <div class="color-picker-actions">
        <button class="btn-secondary" id="cancel-color">取消</button>
      </div>
    </div>
  `;
  document.body.appendChild(picker);

  picker.querySelectorAll('.color-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      const color = swatch.dataset.color;
      CATEGORY_COLORS[subName] = color;
      saveCategories();
      picker.remove();
      renderSubcategoryEditor(overlay, memberName);
    });
  });

  picker.querySelector('#cancel-color').addEventListener('click', () => picker.remove());
}

function resetCategories() {
  if (!confirm('确定恢复默认分类吗？这将删除所有自定义的大类和小类！')) return;
  CATEGORIES = JSON.parse(JSON.stringify(DEFAULT_CATEGORIES));
  CATEGORY_COLORS = JSON.parse(JSON.stringify(DEFAULT_COLORS));
  saveCategories();
  alert('已恢复默认分类');
  renderSettings();
}

function handleExport() {
  getAllRecords().then(records => {
    const exportData = {
      version: '2.0',
      exportTime: new Date().toISOString(),
      categories: CATEGORIES,
      categoryColors: CATEGORY_COLORS,
      records: records
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `家庭记账完整备份_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert('导出成功！\n已导出：\n• 记账记录 ' + records.length + ' 条\n• 大类小类配置');
  });
}

function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (evt) => {
    try {
      const data = JSON.parse(evt.target.result);
      
      // 兼容旧版本格式（只有records数组）
      let records = [];
      let hasSettings = false;
      
      if (Array.isArray(data)) {
        // 旧格式：只有records数组
        records = data;
      } else if (data.records && Array.isArray(data.records)) {
        // 新格式：包含完整数据
        records = data.records;
        hasSettings = true;
      } else {
        throw new Error('文件格式错误');
      }
      
      // 构建确认消息
      let confirmMsg = `将导入 ${records.length} 条记账记录`;
      if (hasSettings && data.categories) {
        const memberCount = Object.keys(data.categories).length;
        confirmMsg += `\n同时导入 ${memberCount} 个大类及其小类配置`;
      }
      confirmMsg += '\n\n是否继续？';
      
      if (!confirm(confirmMsg)) return;
      
      // 导入大类小类配置
      if (hasSettings && data.categories) {
        CATEGORIES = data.categories;
        CATEGORY_COLORS = data.categoryColors || {};
        saveCategories();
      }
      
      // 导入记账记录
      bulkAddRecords(records).then(() => {
        alert('导入成功！');
        e.target.value = '';
        renderHome();
      }).catch(err => alert('导入失败: ' + err.message));
    } catch (err) {
      alert('文件解析失败: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function handleClear() {
  if (!confirm('确定清空所有数据吗？此操作不可恢复！')) return;
  if (!confirm('再次确认：所有记账记录将被永久删除！')) return;
  clearAllRecords().then(() => {
    alert('已清空所有数据');
    renderHome();
  });
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = (now - date) / (1000 * 60 * 60 * 24);
  if (diff < 1) return '今天';
  if (diff < 2) return '昨天';
  if (diff < 7) return Math.floor(diff) + '天前';
  return dateStr;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', initApp);
