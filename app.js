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
let currentCategory = '';
let editingId = null;

function initApp() {
  // 强制修复Edge浏览器缩放
  forceEdgeFix();
  
  registerServiceWorker();
  loadCategories();
  renderMemberGrid();
  setupEventListeners();
  
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  if (tab === 'add') {
    switchTab('add');
  } else {
    switchTab('home');
  }
}

function forceEdgeFix() {
  const ua = navigator.userAgent;
  const isEdgeMobile = /Edg|Edge/i.test(ua) && /Android|webOS|iPhone|iPad|iPod/i.test(ua);
  
  if (!isEdgeMobile) return;
  
  // 延迟检测，确保viewport已经应用
  setTimeout(() => {
    const screenW = window.screen.width;
    const viewportW = window.innerWidth;
    
    console.log(`[Edge修复] screen=${screenW}, viewport=${viewportW}`);
    
    // 如果viewport明显小于屏幕宽度
    if (viewportW > 0 && screenW > viewportW * 1.05) {
      const scale = screenW / viewportW;
      
      console.log(`[Edge修复] scale=${scale.toFixed(3)}`);
      
      // 方案：用transform放大整个body
      const body = document.body;
      
      // 保存原始样式
      const origWidth = body.style.width;
      const origTransform = body.style.transform;
      
      // 设置body为屏幕宽度
      body.style.width = screenW + 'px';
      body.style.transformOrigin = 'top left';
      body.style.transform = `scale(${1/scale})`;
      
      // 调整高度
      const scrollH = document.documentElement.scrollHeight;
      document.documentElement.style.minHeight = (scrollH / scale) + 'px';
      
      console.log('[Edge修复] 应用transform缩放完成');
    }
  }, 100);
}

function loadCategories() {
  const savedCategories = localStorage.getItem('categories');
  const savedColors = localStorage.getItem('categoryColors');
  if (savedCategories) {
    try { CATEGORIES = JSON.parse(savedCategories); } catch (e) {}
  }
  if (savedColors) {
    try { CATEGORY_COLORS = JSON.parse(savedColors); } catch (e) {}
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
  // 保存按钮
  document.getElementById('btn-save').addEventListener('click', handleSave);
  
  // 导入文件
  const importInput = document.getElementById('import-input');
  if (importInput) {
    importInput.addEventListener('change', handleImport);
  }
  
  // 列表页筛选
  const filterMember = document.getElementById('filter-member');
  const filterCategory = document.getElementById('filter-category');
  if (filterMember) filterMember.addEventListener('change', renderAllRecords);
  if (filterCategory) filterCategory.addEventListener('change', renderAllRecords);
  
  // 搜索
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', renderAllRecords);
  }
  
  // 统计页标签
  document.querySelectorAll('.stats-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.stats-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderStats();
    });
  });
}

function switchTab(tab) {
  currentTab = tab;
  
  // 更新底部导航
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  
  // 切换页面
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  const pageEl = document.getElementById(tab + '-page');
  if (pageEl) pageEl.classList.add('active');
  
  // 渲染对应页面
  if (tab === 'home') renderHome();
  if (tab === 'add') { 
    if (editingId === null) resetAddForm();
    renderCategoryGrid();
  }
  if (tab === 'list') {
    populateFilterOptions();
    renderAllRecords();
  }
  if (tab === 'stats') renderStats();
  if (tab === 'settings') setupSettingsPage();
}

function renderHome() {
  // 渲染汇总
  getAllRecords().then(records => {
    records.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    let totalAmount = 0, monthAmount = 0;
    records.forEach(r => {
      totalAmount += r.amount;
      if (r.date.startsWith(currentMonth)) monthAmount += r.amount;
    });
    
    document.getElementById('month-total').textContent = '¥' + monthAmount.toFixed(2);
    document.getElementById('all-total').textContent = '¥' + totalAmount.toFixed(2);
    
    // 渲染最近记录
    const recentContainer = document.getElementById('recent-records');
    if (!recentContainer) return;
    
    const recent = records.slice(0, 5);
    recentContainer.innerHTML = '';
    
    if (recent.length === 0) {
      recentContainer.innerHTML = '<div class="empty-state">暂无记录，点击下方 + 开始记账</div>';
      return;
    }
    
    recent.forEach(record => {
      recentContainer.appendChild(createRecordElement(record));
    });
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

  div.querySelector('.btn-edit').addEventListener('click', () => editRecord(record));
  div.querySelector('.btn-delete').addEventListener('click', () => deleteRecordItem(record.id));

  return div;
}

function resetAddForm() {
  document.getElementById('amount-input').value = '';
  document.getElementById('note-input').value = '';
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('date-input').value = today;
  currentCategory = '';
  renderCategoryGrid();
}

function renderMemberGrid() {
  const grid = document.getElementById('member-grid');
  if (!grid) return;
  
  const members = Object.keys(CATEGORIES);
  grid.innerHTML = members.map(m => `
    <button class="member-btn ${m === currentMember ? 'active' : ''}" data-member="${escapeHtml(m)}">${escapeHtml(m)}</button>
  `).join('');
  
  grid.querySelectorAll('.member-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentMember = btn.dataset.member;
      grid.querySelectorAll('.member-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderCategoryGrid();
    });
  });
  
  renderCategoryGrid();
}

function renderCategoryGrid() {
  const grid = document.getElementById('category-grid');
  if (!grid) return;
  
  const categories = CATEGORIES[currentMember] || [];
  grid.innerHTML = categories.map(c => `
    <button class="category-btn ${c === currentCategory ? 'active' : ''}" data-category="${escapeHtml(c)}">${escapeHtml(c)}</button>
  `).join('');
  
  grid.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentCategory = btn.dataset.category;
      grid.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  
  if (!currentCategory && categories.length > 0) {
    currentCategory = categories[0];
    const firstBtn = grid.querySelector('.category-btn');
    if (firstBtn) firstBtn.classList.add('active');
  }
}

function handleSave() {
  const amount = parseFloat(document.getElementById('amount-input').value);
  const date = document.getElementById('date-input').value;
  const note = document.getElementById('note-input').value.trim();
  
  if (!amount || amount <= 0) {
    alert('请输入有效金额');
    return;
  }
  if (!currentCategory) {
    alert('请选择小类');
    return;
  }
  
  const record = {
    member: currentMember,
    category: currentCategory,
    amount: amount,
    date: date,
    note: note
  };
  
  const action = editingId ? updateRecord(editingId, record) : addRecord(record);
  action.then(() => {
    editingId = null;
    switchTab('home');
  }).catch(err => alert('保存失败: ' + err.message));
}

function editRecord(record) {
  editingId = record.id;
  currentMember = record.member;
  currentCategory = record.category;
  
  switchTab('add');
  
  // 更新成员选择
  const memberGrid = document.getElementById('member-grid');
  memberGrid.querySelectorAll('.member-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.member === currentMember);
  });
  
  // 更新分类选择
  renderCategoryGrid();
  
  // 填充表单
  document.getElementById('amount-input').value = record.amount;
  document.getElementById('date-input').value = record.date;
  document.getElementById('note-input').value = record.note || '';
}

function deleteRecordItem(id) {
  if (!confirm('确定删除这条记录吗？')) return;
  deleteRecord(id).then(() => {
    if (editingId === id) {
      editingId = null;
    }
    switchTab('home');
  }).catch(err => alert('删除失败: ' + err.message));
}

function populateFilterOptions() {
  const filterMember = document.getElementById('filter-member');
  const filterCategory = document.getElementById('filter-category');
  
  if (!filterMember || !filterCategory) return;
  
  if (filterMember.options.length <= 1) {
    Object.keys(CATEGORIES).forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m;
      filterMember.appendChild(opt);
    });
    
    filterMember.addEventListener('change', () => {
      const member = filterMember.value;
      filterCategory.innerHTML = '<option value="">全部</option>';
      if (member && CATEGORIES[member]) {
        CATEGORIES[member].forEach(c => {
          const opt = document.createElement('option');
          opt.value = c;
          opt.textContent = c;
          filterCategory.appendChild(opt);
        });
      }
      renderAllRecords();
    });
  }
  
  // 更新分类选项
  const selectedMember = filterMember.value;
  filterCategory.innerHTML = '<option value="">全部</option>';
  if (selectedMember && CATEGORIES[selectedMember]) {
    CATEGORIES[selectedMember].forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      filterCategory.appendChild(opt);
    });
  }
}

function renderAllRecords() {
  const container = document.getElementById('all-records');
  if (!container) return;
  
  const search = document.getElementById('search-input').value.toLowerCase();
  const filterMember = document.getElementById('filter-member').value;
  const filterCategory = document.getElementById('filter-category').value;
  
  getAllRecords().then(records => {
    records.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    let filtered = records;
    if (filterMember) filtered = filtered.filter(r => r.member === filterMember);
    if (filterCategory) filtered = filtered.filter(r => r.category === filterCategory);
    if (search) {
      filtered = filtered.filter(r => 
        r.member.toLowerCase().includes(search) ||
        r.category.toLowerCase().includes(search) ||
        (r.note && r.note.toLowerCase().includes(search))
      );
    }
    
    container.innerHTML = '';
    
    if (filtered.length === 0) {
      container.innerHTML = '<div class="empty-state">没有找到匹配的记录</div>';
      return;
    }
    
    // 按月份分组
    const groups = {};
    filtered.forEach(r => {
      const month = r.date.substring(0, 7);
      if (!groups[month]) groups[month] = [];
      groups[month].push(r);
    });
    
    Object.keys(groups).sort().reverse().forEach(month => {
      const [year, mon] = month.split('-');
      const groupDiv = document.createElement('div');
      groupDiv.className = 'month-group';
      const groupTotal = groups[month].reduce((s, r) => s + r.amount, 0);
      groupDiv.innerHTML = `<div class="month-header">${year}年${parseInt(mon)}月 (合计: ¥${groupTotal.toFixed(2)})</div>`;
      
      groups[month].forEach(record => {
        groupDiv.appendChild(createRecordElement(record));
      });
      container.appendChild(groupDiv);
    });
  });
}

function renderStats() {
  const container = document.getElementById('stats-content');
  if (!container) return;
  
  const activeTab = document.querySelector('.stats-tab.active');
  const type = activeTab ? activeTab.dataset.type : 'member';
  
  getAllRecords().then(records => {
    const byMember = {};
    const byCategory = {};
    
    records.forEach(r => {
      if (!byMember[r.member]) byMember[r.member] = 0;
      byMember[r.member] += r.amount;
      if (!byCategory[r.category]) byCategory[r.category] = 0;
      byCategory[r.category] += r.amount;
    });
    
    const total = records.reduce((s, r) => s + r.amount, 0);
    
    let html = `<div class="stats-total">总支出: <span>¥${total.toFixed(2)}</span></div>`;
    
    if (type === 'member') {
      html += '<div class="stats-section"><h3>按大类</h3>';
      Object.keys(byMember).sort().forEach(m => {
        const pct = total > 0 ? ((byMember[m] / total) * 100).toFixed(1) : 0;
        html += `<div class="stats-bar"><div class="stats-bar-label">${m}: ¥${byMember[m].toFixed(2)} (${pct}%)</div><div class="stats-bar-bg"><div class="stats-bar-fill" style="width:${pct}%;background:var(--primary-color)"></div></div></div>`;
      });
      html += '</div>';
    } else {
      html += '<div class="stats-section"><h3>按小类</h3>';
      Object.keys(byCategory).sort((a, b) => byCategory[b] - byCategory[a]).forEach(c => {
        const pct = total > 0 ? ((byCategory[c] / total) * 100).toFixed(1) : 0;
        const color = CATEGORY_COLORS[c] || '#BDC3C7';
        html += `<div class="stats-bar"><div class="stats-bar-label"><span class="color-dot" style="background:${color}"></span>${c}: ¥${byCategory[c].toFixed(2)} (${pct}%)</div><div class="stats-bar-bg"><div class="stats-bar-fill" style="width:${pct}%;background:${color}"></div></div></div>`;
      });
      html += '</div>';
    }
    
    container.innerHTML = html;
  });
}

function setupSettingsPage() {
  // 绑定管理分类按钮
  const manageBtn = document.getElementById('manage-categories');
  if (manageBtn && !manageBtn.dataset.bound) {
    manageBtn.addEventListener('click', openCategoryManager);
    manageBtn.dataset.bound = 'true';
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
  
  overlay.querySelector('#add-member-btn').addEventListener('click', () => {
    const input = overlay.querySelector('#new-member-name');
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

  editor.querySelector('#add-sub-btn').addEventListener('click', () => {
    const input = editor.querySelector('#new-sub-name');
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
      
      let records = [];
      let hasSettings = false;
      
      if (Array.isArray(data)) {
        records = data;
      } else if (data.records && Array.isArray(data.records)) {
        records = data.records;
        hasSettings = true;
      } else {
        throw new Error('文件格式错误');
      }
      
      let confirmMsg = `将导入 ${records.length} 条记账记录`;
      if (hasSettings && data.categories) {
        const memberCount = Object.keys(data.categories).length;
        confirmMsg += `\n同时导入 ${memberCount} 个大类及其小类配置`;
      }
      confirmMsg += '\n\n是否继续？';
      
      if (!confirm(confirmMsg)) return;
      
      if (hasSettings && data.categories) {
        CATEGORIES = data.categories;
        CATEGORY_COLORS = data.categoryColors || {};
        saveCategories();
        renderMemberGrid();
      }
      
      bulkAddRecords(records).then(() => {
        alert('导入成功！');
        e.target.value = '';
        switchTab('home');
      }).catch(err => alert('导入失败: ' + err.message));
    } catch (err) {
      alert('文件解析失败: ' + err.message);
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  if (!confirm('确定清空所有数据吗？此操作不可恢复！')) return;
  if (!confirm('再次确认：所有记账记录将被永久删除！')) return;
  clearAllRecords().then(() => {
    alert('已清空所有数据');
    switchTab('home');
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

// 导出函数供HTML onclick使用
window.openCategoryManager = openCategoryManager;
window.exportData = handleExport;
window.handleImport = handleImport;
window.triggerImport = function() {
  document.getElementById('import-input').click();
};
window.clearAllData = clearAllData;

document.addEventListener('DOMContentLoaded', initApp);
