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
let calendarMonth = new Date();
let statsPeriod = 'month';
let statsDate = new Date();
let statsType = 'member';
let editFromStats = false; // 标记是否从统计页进入编辑
let statsDetailKey = null; // 保存统计页展开的明细key

// ========== 自定义弹窗系统 ==========

let currentModal = null;

function showCustomModal({ title, content, buttons }) {
  return new Promise((resolve) => {
    // 关闭已有弹窗
    if (currentModal) {
      currentModal.remove();
      currentModal = null;
    }

    const overlay = document.createElement('div');
    overlay.className = 'custom-modal-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.right = '0';
    overlay.style.bottom = '0';
    overlay.style.zIndex = '9999';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.background = 'rgba(0,0,0,0.5)';
    overlay.style.padding = '20px';

    const modal = document.createElement('div');
    modal.style.background = 'white';
    modal.style.borderRadius = '16px';
    modal.style.width = '100%';
    modal.style.maxWidth = '360px';
    modal.style.overflow = 'hidden';
    modal.style.boxShadow = '0 10px 40px rgba(0,0,0,0.2)';

    if (title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'custom-modal-title';
      titleEl.innerHTML = title;
      titleEl.style.padding = '18px 20px 12px';
      titleEl.style.fontSize = '1.1rem';
      titleEl.style.fontWeight = '600';
      titleEl.style.textAlign = 'center';
      modal.appendChild(titleEl);
    }

    const contentEl = document.createElement('div');
    contentEl.className = 'custom-modal-content';
    contentEl.innerHTML = content;
    contentEl.style.padding = '0 20px 16px';
    contentEl.style.fontSize = '0.9rem';
    contentEl.style.color = '#666';
    contentEl.style.lineHeight = '1.5';
    modal.appendChild(contentEl);

    const actions = document.createElement('div');
    actions.style.display = 'flex';
    actions.style.borderTop = '1px solid #eee';

    buttons.forEach((btn, idx) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = btn.text;
      button.style.flex = '1';
      button.style.padding = '14px';
      button.style.background = 'none';
      button.style.border = 'none';
      button.style.fontSize = '1rem';
      button.style.cursor = 'pointer';
      button.style.color = btn.primary ? 'var(--primary-color)' : '#666';
      if (btn.primary) button.style.fontWeight = '600';
      if (idx > 0) button.style.borderLeft = '1px solid #eee';
      
      button.onclick = function() {
        if (currentModal === overlay) {
          currentModal = null;
        }
        overlay.remove();
        resolve(btn.value);
      };
      
      actions.appendChild(button);
    });

    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    currentModal = overlay;
  });
}

function showToast(message, duration = 2000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ========== 初始化 ==========

function initApp() {
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
  
  setTimeout(() => {
    const screenW = window.screen.width;
    const viewportW = window.innerWidth;
    
    if (viewportW > 0 && screenW > viewportW * 1.05) {
      const scale = screenW / viewportW;
      const body = document.body;
      body.style.width = screenW + 'px';
      body.style.transformOrigin = 'top left';
      body.style.transform = `scale(${1/scale})`;
      const scrollH = document.documentElement.scrollHeight;
      document.documentElement.style.minHeight = (scrollH / scale) + 'px';
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
  document.getElementById('btn-save').addEventListener('click', handleSave);
  
  const importInput = document.getElementById('import-input');
  if (importInput) {
    importInput.addEventListener('change', handleImport);
  }
  
  const filterMember = document.getElementById('filter-member');
  const filterCategory = document.getElementById('filter-category');
  if (filterMember) filterMember.addEventListener('change', renderAllRecords);
  if (filterCategory) filterCategory.addEventListener('change', renderAllRecords);
  
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', renderAllRecords);
  }
  
  document.querySelectorAll('.stats-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.stats-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      statsType = tab.dataset.type;
      renderStats();
    });
  });
  
  // 统计页日期选择
  document.querySelectorAll('.date-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.date-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      statsPeriod = btn.dataset.period;
      renderStats();
    });
  });
  
  const statsPrev = document.getElementById('stats-prev');
  const statsNext = document.getElementById('stats-next');
  if (statsPrev) statsPrev.addEventListener('click', () => {
    if (statsPeriod === 'month') {
      statsDate.setMonth(statsDate.getMonth() - 1);
    } else {
      statsDate.setFullYear(statsDate.getFullYear() - 1);
    }
    renderStats();
  });
  if (statsNext) statsNext.addEventListener('click', () => {
    if (statsPeriod === 'month') {
      statsDate.setMonth(statsDate.getMonth() + 1);
    } else {
      statsDate.setFullYear(statsDate.getFullYear() + 1);
    }
    renderStats();
  });
  
  // 日历导航
  const prevMonth = document.getElementById('prev-month');
  const nextMonth = document.getElementById('next-month');
  if (prevMonth) prevMonth.addEventListener('click', () => {
    calendarMonth.setMonth(calendarMonth.getMonth() - 1);
    renderHome();
  });
  if (nextMonth) nextMonth.addEventListener('click', () => {
    calendarMonth.setMonth(calendarMonth.getMonth() + 1);
    renderHome();
  });
}

function switchTab(tab) {
  currentTab = tab;
  
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });
  
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });
  const pageEl = document.getElementById(tab + '-page');
  if (pageEl) pageEl.classList.add('active');
  
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

// ========== 首页渲染 ==========

function renderHome() {
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
    
    renderCalendar(records);
    
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

function renderCalendar(records) {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  
  document.getElementById('calendar-title').textContent = `${year}年${month + 1}月`;
  
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = (firstDay.getDay() + 6) % 7; // 周一为起始
  
  const daysInMonth = lastDay.getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  
  // 计算每日支出
  const dailyExpenses = {};
  records.forEach(r => {
    const date = new Date(r.date);
    if (date.getFullYear() === year && date.getMonth() === month) {
      const day = date.getDate();
      if (!dailyExpenses[day]) dailyExpenses[day] = 0;
      dailyExpenses[day] += r.amount;
    }
  });
  
  const grid = document.getElementById('calendar-grid');
  grid.innerHTML = '';
  
  // 前置空白
  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'calendar-day empty';
    grid.appendChild(empty);
  }
  
  // 日期格子
  for (let d = 1; d <= daysInMonth; d++) {
    const dayDiv = document.createElement('div');
    dayDiv.className = 'calendar-day';
    
    if (isCurrentMonth && d === today.getDate()) {
      dayDiv.classList.add('today');
    }
    
    const expense = dailyExpenses[d];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    
    dayDiv.innerHTML = `
      <span class="day-number">${d}</span>
      ${expense ? `<span class="day-expense">¥${expense.toFixed(0)}</span>` : ''}
    `;
    
    if (expense) {
      dayDiv.classList.add('has-expense');
      dayDiv.addEventListener('click', () => showDayRecords(dateStr, expense));
    }
    
    grid.appendChild(dayDiv);
  }
}

function showDayRecords(dateStr, totalExpense) {
  getAllRecords().then(records => {
    const dayRecords = records.filter(r => r.date === dateStr);
    
    const date = new Date(dateStr);
    const weekdayNames = ['日', '一', '二', '三', '四', '五', '六'];
    const weekday = weekdayNames[date.getDay()];
    
    let recordsHtml = '';
    if (dayRecords.length > 0) {
      dayRecords.forEach(r => {
        const color = CATEGORY_COLORS[r.category] || '#BDC3C7';
        recordsHtml += `
          <div class="record-item">
            <div class="record-color" style="background:${color}"></div>
            <div class="record-info">
              <div class="record-main">
                <span class="record-member">${escapeHtml(r.member)}</span>
                <span class="record-category">${escapeHtml(r.category)}</span>
              </div>
              ${r.note ? `<div class="record-sub"><span>${escapeHtml(r.note)}</span></div>` : ''}
            </div>
            <div class="record-amount">¥${r.amount.toFixed(2)}</div>
          </div>
        `;
      });
    }
    
    showCustomModal({
      title: `${dateStr} 周${weekday}`,
      content: `
        <div class="day-expense-total">当日支出：¥${totalExpense.toFixed(2)}</div>
        <div class="day-records-list">${recordsHtml || '<div class="empty-state">当天暂无记录</div>'}</div>
      `,
      buttons: [{ text: '关闭', value: 'close', primary: true }]
    });
  });
}

// ========== 记录元素 ==========

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

// ========== 添加/编辑记录 ==========

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

async function handleSave() {
  const amount = parseFloat(document.getElementById('amount-input').value);
  const date = document.getElementById('date-input').value;
  const note = document.getElementById('note-input').value.trim();
  
  if (!amount || amount <= 0) {
    showToast('请输入有效金额');
    return;
  }
  if (!currentCategory) {
    showToast('请选择小类');
    return;
  }
  
  const record = {
    member: currentMember,
    category: currentCategory,
    amount: amount,
    date: date,
    note: note
  };
  
  try {
    if (editingId) {
      await updateRecord(editingId, record);
    } else {
      await addRecord(record);
    }
    editingId = null;
    
    // 如果从统计页进入编辑，保存后回到统计页并展开明细
    if (editFromStats && statsDetailKey) {
      editFromStats = false;
      switchTab('stats');
      // 重新渲染统计并展开明细
      const records = await getAllRecords();
      renderStats();
      // 延迟一点等待渲染完成
      setTimeout(() => {
        showCategoryDetail(statsDetailKey, records);
      }, 100);
    } else {
      switchTab('home');
    }
  } catch (err) {
    showToast('保存失败: ' + err.message);
  }
}

function editRecord(record) {
  editingId = record.id;
  currentMember = record.member;
  currentCategory = record.category;
  
  switchTab('add');
  
  const memberGrid = document.getElementById('member-grid');
  memberGrid.querySelectorAll('.member-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.member === currentMember);
  });
  
  renderCategoryGrid();
  
  document.getElementById('amount-input').value = record.amount;
  document.getElementById('date-input').value = record.date;
  document.getElementById('note-input').value = record.note || '';
}

async function deleteRecordItem(id) {
  // 确保 id 是数字类型（IndexedDB 要求键类型匹配）
  const numericId = typeof id === 'string' ? parseInt(id, 10) : id;

  const confirmed = await showCustomModal({
    title: '删除记录',
    content: '确定删除这条记录吗？',
    buttons: [
      { text: '取消', value: 'cancel' },
      { text: '确定删除', value: 'confirm', primary: true }
    ]
  });

  if (confirmed !== 'confirm') return;

  try {
    await deleteRecord(numericId);
    if (editingId === numericId || editingId === id) {
      editingId = null;
    }
    showToast('删除成功');
    // 刷新当前页面数据
    const activeTab = document.querySelector('.nav-btn.active');
    if (activeTab) {
      const tab = activeTab.dataset.tab;
      if (tab === 'list') {
        renderAllRecords();
      } else if (tab === 'home') {
        renderHome();
      } else if (tab === 'stats') {
        renderStats();
      }
    }
  } catch (err) {
    showToast('删除失败: ' + err.message);
  }
}

// ========== 记录列表 ==========

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

// ========== 统计页 ==========

function renderStats() {
  const display = document.getElementById('stats-date-display');
  if (statsPeriod === 'month') {
    display.textContent = `${statsDate.getFullYear()}年${statsDate.getMonth() + 1}月`;
  } else {
    display.textContent = `${statsDate.getFullYear()}年`;
  }
  
  getAllRecords().then(records => {
    const filtered = filterRecordsByPeriod(records);
    
    const byMember = {};
    const byCategory = {};
    
    filtered.forEach(r => {
      if (!byMember[r.member]) byMember[r.member] = 0;
      byMember[r.member] += r.amount;
      if (!byCategory[r.category]) byCategory[r.category] = 0;
      byCategory[r.category] += r.amount;
    });
    
    const total = filtered.reduce((s, r) => s + r.amount, 0);
    
    document.getElementById('chart-center-value').textContent = '¥' + total.toFixed(2);
    document.getElementById('chart-center-label').textContent = 
      statsPeriod === 'month' ? '本月支出' : '本年支出';
    
    const data = statsType === 'member' ? byMember : byCategory;
    const colorMap = statsType === 'member' ? CATEGORY_COLORS : CATEGORY_COLORS;
    
    drawPieChart(data, colorMap);
    renderCategoryList(data, total, filtered);
  });
}

function filterRecordsByPeriod(records) {
  const year = statsDate.getFullYear();
  const month = statsDate.getMonth();
  
  return records.filter(r => {
    const date = new Date(r.date);
    if (statsPeriod === 'year') {
      return date.getFullYear() === year;
    } else {
      return date.getFullYear() === year && date.getMonth() === month;
    }
  });
}

function drawPieChart(data, colorMap) {
  const canvas = document.getElementById('pie-chart');
  const ctx = canvas.getContext('2d');
  const centerX = 140, centerY = 140;
  const radius = 110;
  const innerRadius = 60;
  
  ctx.clearRect(0, 0, 280, 280);
  
  const entries = Object.entries(data);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  
  if (total === 0) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2, true);
    ctx.fillStyle = '#f0f0f0';
    ctx.fill();
    return;
  }
  
  let startAngle = -Math.PI / 2;
  
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8B500', '#FF69B4', '#00CED1', '#9370DB', '#BDC3C7'];
  
  entries.forEach(([key, value], idx) => {
    const sliceAngle = (value / total) * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;
    
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
    ctx.closePath();
    
    const color = colorMap[key] || colors[idx % colors.length];
    ctx.fillStyle = color;
    ctx.fill();
    
    startAngle = endAngle;
  });
}

function renderCategoryList(data, total, allRecords) {
  const container = document.getElementById('stats-categories');
  const detail = document.getElementById('stats-detail');
  
  detail.innerHTML = '';
  
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  
  container.innerHTML = entries.map(([key, value], idx) => {
    const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
    const color = CATEGORY_COLORS[key] || ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'][idx % 5];
    
    return `
      <div class="stats-category-item" data-key="${escapeHtml(key)}" data-pct="${pct}">
        <div class="stats-category-info">
          <div class="stats-category-name">
            <span class="color-dot" style="background:${color}"></span>
            ${escapeHtml(key)}
          </div>
          <div class="stats-category-amount">¥${value.toFixed(2)}</div>
        </div>
        <div class="stats-category-bar">
          <div class="stats-category-fill" style="width:${pct}%;background:${color}"></div>
        </div>
        <div class="stats-category-stats">
          <span>${pct}%</span>
          <span class="stats-count">${getCountForCategory(allRecords, key, statsType)}笔</span>
        </div>
      </div>
    `;
  }).join('');
  
  container.querySelectorAll('.stats-category-item').forEach(item => {
    item.addEventListener('click', () => {
      const key = item.dataset.key;
      showCategoryDetail(key, allRecords);
    });
  });
}

function getCountForCategory(records, key, type) {
  if (type === 'member') {
    return records.filter(r => r.member === key).length;
  } else {
    return records.filter(r => r.category === key).length;
  }
}

function showCategoryDetail(key, allRecords) {
  const detail = document.getElementById('stats-detail');

  // 保存当前展开的 key，用于编辑后恢复
  statsDetailKey = key;

  const detailRecords = allRecords.filter(r => {
    return statsType === 'member' ? r.member === key : r.category === key;
  });

  const total = detailRecords.reduce((s, r) => s + r.amount, 0);
  const totalAll = allRecords.reduce((s, r) => s + r.amount, 0);
  const pct = totalAll > 0 ? ((total / totalAll) * 100).toFixed(1) : '0.0';

  detailRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

  // 用 DOM API 构建明细，确保事件可靠绑定
  detail.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'stats-detail-header';
  header.innerHTML = `
    <h4>${escapeHtml(key)} 明细</h4>
    <div class="stats-detail-summary">
      <span>共${detailRecords.length}笔</span>
      <span>总计：¥${total.toFixed(2)}</span>
      <span>${pct}%</span>
    </div>
  `;
  const closeBtn = document.createElement('button');
  closeBtn.className = 'stats-detail-close';
  closeBtn.textContent = '收起';
  closeBtn.addEventListener('click', () => { detail.style.display = 'none'; });
  header.appendChild(closeBtn);
  detail.appendChild(header);

  const recordsContainer = document.createElement('div');
  recordsContainer.className = 'stats-detail-records';

  detailRecords.forEach(r => {
    const color = CATEGORY_COLORS[r.category] || '#BDC3C7';
    const item = document.createElement('div');
    item.className = 'record-item';
    item.innerHTML = `
      <div class="record-color" style="background:${color}"></div>
      <div class="record-info">
        <div class="record-main">
          <span class="record-member">${escapeHtml(r.member)}</span>
          <span class="record-category">${escapeHtml(r.category)}</span>
        </div>
        <div class="record-sub">
          <span>${r.date}</span>
          ${r.note ? `<span class="record-note">${escapeHtml(r.note)}</span>` : ''}
        </div>
      </div>
      <div class="record-amount">¥${r.amount.toFixed(2)}</div>
      <div class="record-actions"></div>
    `;

    const actionsEl = item.querySelector('.record-actions');

    const editBtn = document.createElement('button');
    editBtn.className = 'btn-edit';
    editBtn.textContent = '编辑';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      detail.style.display = 'none';
      editFromStats = true; // 标记来自统计页
      editRecord(r);
    });

    const delBtn = document.createElement('button');
    delBtn.className = 'btn-delete';
    delBtn.textContent = '删除';
    delBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await deleteRecordItem(r.id);
      detail.style.display = 'none';
      renderStats();
    });

    actionsEl.appendChild(editBtn);
    actionsEl.appendChild(delBtn);
    recordsContainer.appendChild(item);
  });

  detail.appendChild(recordsContainer);
  detail.style.display = 'block';
  detail.scrollIntoView({ behavior: 'smooth' });
}

// ========== 设置页 ==========

function setupSettingsPage() {
  const manageBtn = document.getElementById('manage-categories');
  if (manageBtn && !manageBtn.dataset.bound) {
    manageBtn.addEventListener('click', openCategoryManager);
    manageBtn.dataset.bound = 'true';
  }
}

// ========== 分类管理 ==========

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
      showToast('该大类已存在');
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
  list.innerHTML = members.map((m, idx) => `
    <div class="category-item" data-member="${escapeHtml(m)}" data-idx="${idx}">
      <div class="sort-buttons">
        <button class="btn-icon sort-btn" data-action="move-up" data-member="${escapeHtml(m)}" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''}>↑</button>
        <button class="btn-icon sort-btn" data-action="move-down" data-member="${escapeHtml(m)}" data-idx="${idx}" ${idx === members.length - 1 ? 'disabled' : ''}>↓</button>
      </div>
      <span class="category-name">${escapeHtml(m)}</span>
      <div class="category-item-actions">
        <button class="btn-icon" data-action="edit-member" data-name="${escapeHtml(m)}">✏️</button>
        <button class="btn-icon danger" data-action="delete-member" data-name="${escapeHtml(m)}">🗑️</button>
      </div>
    </div>
  `).join('');

  list.querySelectorAll('.btn-icon').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      const name = btn.dataset.name;
      if (action === 'edit-member') {
        const newName = prompt('编辑大类名称：', name);
        if (newName && newName !== name) {
          if (CATEGORIES[newName]) {
            showToast('该名称已存在');
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
          showToast('至少保留一个大类');
          return;
        }
        const confirmed = await showCustomModal({
          title: '删除大类',
          content: `确定删除大类"${name}"及其所有小类吗？`,
          buttons: [
            { text: '取消', value: 'cancel' },
            { text: '确定删除', value: 'confirm', primary: true }
          ]
        });
        if (confirmed !== 'confirm') return;
        delete CATEGORIES[name];
        saveCategories();
        renderMemberList(overlay);
        renderMemberTabs(overlay);
      } else if (action === 'move-up' || action === 'move-down') {
        const idx = parseInt(btn.dataset.idx);
        const memberName = btn.dataset.member;
        const members = Object.keys(CATEGORIES);
        const targetIdx = action === 'move-up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= members.length) return;
        
        const movedItem = members[idx];
        members.splice(idx, 1);
        members.splice(targetIdx, 0, movedItem);
        
        const newCategories = {};
        members.forEach(m => {
          newCategories[m] = CATEGORIES[m];
        });
        CATEGORIES = newCategories;
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
    <div class="subcategory-list" id="sub-list" data-member="${escapeHtml(memberName)}">
      ${subcategories.map((sub, idx) => `
        <div class="subcategory-item" data-idx="${idx}">
          <div class="sort-buttons">
            <button class="btn-icon sort-btn" data-action="move-up-sub" data-member="${escapeHtml(memberName)}" data-idx="${idx}" ${idx === 0 ? 'disabled' : ''}>↑</button>
            <button class="btn-icon sort-btn" data-action="move-down-sub" data-member="${escapeHtml(memberName)}" data-idx="${idx}" ${idx === subcategories.length - 1 ? 'disabled' : ''}>↓</button>
          </div>
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

  const subList = editor.querySelector('#sub-list');
  
  editor.querySelectorAll('.btn-icon').forEach(btn => {
    btn.addEventListener('click', async () => {
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
        const confirmed = await showCustomModal({
          title: '删除小类',
          content: `确定删除小类"${subName}"吗？`,
          buttons: [
            { text: '取消', value: 'cancel' },
            { text: '确定删除', value: 'confirm', primary: true }
          ]
        });
        if (confirmed !== 'confirm') return;
        CATEGORIES[member].splice(idx, 1);
        if (CATEGORIES[member].length === 0) {
          CATEGORIES[member].push('其他');
        }
        saveCategories();
        renderSubcategoryEditor(overlay, member);
      } else if (action === 'move-up-sub' || action === 'move-down-sub') {
        const subcategories = CATEGORIES[member];
        const targetIdx = action === 'move-up-sub' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= subcategories.length) return;
        
        const movedItem = subcategories[idx];
        subcategories.splice(idx, 1);
        subcategories.splice(targetIdx, 0, movedItem);
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
      showToast('该小类已存在');
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

  // 小类拖拽排序
  if (subList) {
    setupDragSort(subList, 'sub');
  }
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

// ========== 导出 ==========

async function handleExport() {
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const defaultName = `账单_${dateStr}_${timeStr}.json`;
  
  const result = await showCustomModal({
    title: '导出文件',
    content: `
      <div class="export-dialog">
        <label>文件名：</label>
        <input type="text" id="export-filename" value="${defaultName}" class="export-input">
        <div class="export-info">将导出：记账记录 + 分类配置</div>
      </div>
    `,
    buttons: [
      { text: '取消', value: 'cancel' },
      { text: '确定导出', value: 'confirm', primary: true }
    ]
  });
  
  if (result !== 'confirm') return;
  
  const filenameInput = document.querySelector('#export-filename');
  const filename = filenameInput ? filenameInput.value.trim() : defaultName;
  
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
    a.download = filename.endsWith('.json') ? filename : filename + '.json';
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('保存成功！');
  });
}

function exportExcel() {
  getAllRecords().then(records => {
    if (records.length === 0) {
      showToast('暂无记录可导出');
      return;
    }
    
    // 构建CSV内容（Excel兼容）
    let csv = '\uFEFF'; // BOM for Excel中文支持
    csv += '日期,大类,小类,金额,备注\n';
    
    records.forEach(r => {
      const note = r.note ? `"${r.note.replace(/"/g, '""')}"` : '';
      csv += `${r.date},${r.member},${r.category},${r.amount.toFixed(2)},${note}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const now = new Date();
    const filename = `账单_${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}.csv`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    showToast('Excel导出成功！');
  });
}

// ========== 导入 ==========

async function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (evt) => {
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
      
      let message = `<strong>导入记账记录和分类配置？</strong>`;
      message += `<div class="import-details">`;
      message += `<div>将导入：${records.length} 条记账记录</div>`;
      if (hasSettings && data.categories) {
        const memberCount = Object.keys(data.categories).length;
        message += `<div>分类配置：${memberCount} 个大类及其小类</div>`;
      }
      message += `</div>`;
      
      const confirmed = await showCustomModal({
        title: '导入确认',
        content: message,
        buttons: [
          { text: '取消', value: 'cancel' },
          { text: '确定', value: 'confirm', primary: true }
        ]
      });
      
      if (confirmed !== 'confirm') return;
      
      if (hasSettings && data.categories) {
        CATEGORIES = data.categories;
        CATEGORY_COLORS = data.categoryColors || {};
        saveCategories();
        renderMemberGrid();
      }
      
      await bulkAddRecords(records);
      e.target.value = '';
      switchTab('home');
      showToast('导入成功！');
    } catch (err) {
      showToast('文件解析失败: ' + err.message);
    }
  };
  reader.readAsText(file);
}

async function clearAllData() {
  const confirmed = await showCustomModal({
    title: '清空数据',
    content: '<strong style="color:#f44336">确定清空所有数据吗？此操作不可恢复！</strong>',
    buttons: [
      { text: '取消', value: 'cancel' },
      { text: '确定清空', value: 'confirm', primary: true }
    ]
  });
  
  if (confirmed !== 'confirm') return;
  
  try {
    await clearAllRecords();
    showToast('已清空所有数据');
    switchTab('home');
  } catch (err) {
    showToast('清空失败: ' + err.message);
  }
}

// ========== 工具函数 ==========

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

// ========== 导出全局函数 ==========

window.openCategoryManager = openCategoryManager;
window.exportData = handleExport;
window.exportExcel = exportExcel;
window.handleImport = handleImport;
window.triggerImport = function() {
  document.getElementById('import-input').click();
};
window.clearAllData = clearAllData;

document.addEventListener('DOMContentLoaded', initApp);
