// =============================================
// SUPABASE CONFIGURATION
// =============================================
if (localStorage.getItem('supabase_anon_key') === 'sb_publishable_PJpNpGzGWD2TWOe2D5KRYQ_Vgn7WUqX') {
    localStorage.removeItem('supabase_anon_key');
}
let SUPABASE_URL = localStorage.getItem('supabase_url') || 'https://nrferjfkdylwtfqeibfo.supabase.co';
let SUPABASE_ANON_KEY = localStorage.getItem('supabase_anon_key') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5yZmVyamZrZHlsd3RmcWVpYmZvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwODU3NDUsImV4cCI6MjA5NTY2MTc0NX0.PMOBq34WrxlUmZHDe5OxxldZ4S3L3k8wStbvilTWNaI';
const { createClient } = supabase;
let db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// =============================================
// TOAST NOTIFICATION
// =============================================
const showToast = (message, isError = false) => {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `glass px-4 py-3 rounded-xl border ${isError ? 'border-red-500/30' : 'border-white/10'} shadow-xl flex items-center gap-3 transform translate-y-10 opacity-0 transition-all duration-300`;
    toast.innerHTML = `<i class="fa-solid ${isError ? 'fa-circle-exclamation text-red-400' : 'fa-circle-check text-emerald-400'} text-lg"></i> <span class="text-white text-sm font-medium">${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-y-10', 'opacity-0'), 10);
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
};

// =============================================
// LOADING SPINNER HELPER
// =============================================
const setLoading = (tbodyOrContainerId, colSpan = 6) => {
    const el = document.getElementById(tbodyOrContainerId);
    if (!el) return;
    const isTable = el.tagName === 'TBODY';
    if (isTable) {
        el.innerHTML = `<tr><td colspan="${colSpan}" class="px-6 py-12 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin text-2xl mb-3 block"></i>Loading from database...</td></tr>`;
    } else {
        el.innerHTML = `<div class="flex justify-center items-center py-12 text-gray-500"><i class="fa-solid fa-spinner fa-spin text-2xl mr-3"></i>Loading...</div>`;
    }
};

const setEmpty = (tbodyOrContainerId, message, colSpan = 6) => {
    const el = document.getElementById(tbodyOrContainerId);
    if (!el) return;
    const isTable = el.tagName === 'TBODY';
    if (isTable) {
        el.innerHTML = `<tr><td colspan="${colSpan}" class="px-6 py-12 text-center text-gray-500"><i class="fa-solid fa-inbox text-3xl mb-3 block opacity-30"></i>${message}</td></tr>`;
    } else {
        el.innerHTML = `<div class="flex flex-col justify-center items-center py-12 text-gray-500"><i class="fa-solid fa-inbox text-3xl mb-3 opacity-30"></i><p>${message}</p></div>`;
    }
};

// =============================================
// STATUS BADGE HELPER
// =============================================
const getStatusBadge = (status) => {
    if (!status) return 'bg-gray-500/20 text-gray-400';
    switch (status.toLowerCase()) {
        case 'hot': case 'lost': case 'overdue': case 'no answer':
            return 'bg-red-500/20 text-red-400';
        case 'warm': case 'negotiation': case 'call back later':
            return 'bg-yellow-500/20 text-yellow-400';
        case 'cold': case 'new': case 'sent':
            return 'bg-blue-500/20 text-blue-400';
        case 'interested': case 'proposal sent': case 'replied': case 'seen':
            return 'bg-purple-500/20 text-purple-400';
        case 'closed': case 'approved': case 'meeting booked':
            return 'bg-emerald-500/20 text-emerald-400';
        default:
            return 'bg-gray-500/20 text-gray-400';
    }
};

// =============================================
// LEADS
// =============================================
const renderLeads = async () => {
    setLoading('leads-table-body', 7);
    const { data, error } = await db.from('leads').select('*').order('created_at', { ascending: false });
    const tbody = document.getElementById('leads-table-body');
    if (!tbody) return;
    if (error) { showToast('Failed to load leads', true); tbody.innerHTML = ''; return; }
    if (!data || data.length === 0) { setEmpty('leads-table-body', 'No leads yet. Add your first lead!', 7); return; }

    tbody.innerHTML = data.map(lead => `
        <tr class="hover:bg-white/5 transition-colors group">
            <td class="px-6 py-4 font-medium text-white">${lead.business}</td>
            <td class="px-6 py-4">
                <div class="flex flex-col">
                    <span>${lead.contact}</span>
                    <span class="text-xs text-gray-500">${lead.phone || ''}</span>
                </div>
            </td>
            <td class="px-6 py-4">${lead.category || ''}</td>
            <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs font-medium ${getStatusBadge(lead.status)}">${lead.status}</span></td>
            <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs font-medium ${getStatusBadge(lead.priority)}">${lead.priority}</span></td>
            <td class="px-6 py-4 text-gray-400">${lead.next_follow_up || 'TBD'}</td>
            <td class="px-6 py-4 text-right">
                <button class="delete-lead-btn text-gray-400 hover:text-red-400 transition-colors" data-id="${lead.id}"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>
    `).join('');
};

const insertLead = async (lead) => {
    const { error } = await db.from('leads').insert([lead]);
    if (error) { showToast('Failed to save lead: ' + error.message, true); return false; }
    showToast(`Lead "${lead.business}" added!`);
    return true;
};

const deleteLead = async (id) => {
    const { error } = await db.from('leads').delete().eq('id', id);
    if (error) { showToast('Failed to delete lead', true); return false; }
    showToast('Lead removed');
    return true;
};

// =============================================
// CALLS
// =============================================
const renderCalls = async () => {
    setLoading('calls-table-body', 5);
    const { data, error } = await db.from('calls').select('*').order('created_at', { ascending: false });
    const tbody = document.getElementById('calls-table-body');
    if (!tbody) return;
    if (error) { showToast('Failed to load calls', true); return; }
    if (!data || data.length === 0) { setEmpty('calls-table-body', 'No calls logged yet.', 5); return; }

    tbody.innerHTML = data.map(call => `
        <tr class="hover:bg-white/5 transition-colors group">
            <td class="px-6 py-4 font-medium text-white">${call.lead}</td>
            <td class="px-6 py-4 text-gray-400">${call.date || ''}</td>
            <td class="px-6 py-4">${call.duration || ''}</td>
            <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs font-medium ${getStatusBadge(call.result)}">${call.result}</span></td>
            <td class="px-6 py-4 text-gray-400">${call.action || ''}</td>
        </tr>
    `).join('');
};

const insertCall = async (call) => {
    const { error } = await db.from('calls').insert([call]);
    if (error) { showToast('Failed to save call: ' + error.message, true); return false; }
    showToast('Call logged!');
    return true;
};

// =============================================
// WHATSAPP
// =============================================
const renderWhatsApp = async () => {
    setLoading('whatsapp-table-body', 5);
    const { data, error } = await db.from('whatsapp').select('*').order('created_at', { ascending: false });
    const tbody = document.getElementById('whatsapp-table-body');
    if (!tbody) return;
    if (error) { showToast('Failed to load WhatsApp data', true); return; }
    if (!data || data.length === 0) { setEmpty('whatsapp-table-body', 'No WhatsApp messages yet.', 5); return; }

    tbody.innerHTML = data.map(wa => `
        <tr class="hover:bg-white/5 transition-colors group">
            <td class="px-6 py-4 font-medium text-white">${wa.lead}</td>
            <td class="px-6 py-4 text-gray-400">${wa.number || ''}</td>
            <td class="px-6 py-4 truncate max-w-[200px] text-gray-400">${wa.last_msg || ''}</td>
            <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs font-medium ${getStatusBadge(wa.status)}">${wa.status}</span></td>
            <td class="px-6 py-4 text-gray-400">${wa.followup || ''}</td>
        </tr>
    `).join('');
};

const insertWhatsApp = async (wa) => {
    const { error } = await db.from('whatsapp').insert([wa]);
    if (error) { showToast('Failed to save message: ' + error.message, true); return false; }
    showToast('WhatsApp message logged!');
    return true;
};

// =============================================
// INSTAGRAM
// =============================================
const renderInstagram = async () => {
    setLoading('instagram-table-body', 5);
    const { data, error } = await db.from('instagram').select('*').order('created_at', { ascending: false });
    const tbody = document.getElementById('instagram-table-body');
    if (!tbody) return;
    if (error) { showToast('Failed to load Instagram data', true); return; }
    if (!data || data.length === 0) { setEmpty('instagram-table-body', 'No Instagram DMs yet.', 5); return; }

    tbody.innerHTML = data.map(ig => `
        <tr class="hover:bg-white/5 transition-colors group">
            <td class="px-6 py-4 font-medium text-pink-400">${ig.handle}</td>
            <td class="px-6 py-4 text-white">${ig.business || ''}</td>
            <td class="px-6 py-4 truncate max-w-[200px] text-gray-400">${ig.last_dm || ''}</td>
            <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs font-medium ${getStatusBadge(ig.status)}">${ig.status}</span></td>
            <td class="px-6 py-4 text-gray-400">${ig.action || ''}</td>
        </tr>
    `).join('');
};

const insertInstagram = async (ig) => {
    const { error } = await db.from('instagram').insert([ig]);
    if (error) { showToast('Failed to save DM: ' + error.message, true); return false; }
    showToast('Instagram DM logged!');
    return true;
};

// =============================================
// FOLLOW-UPS
// =============================================
const renderFollowups = async () => {
    ['overdue', 'today', 'upcoming'].forEach(type => {
        const container = document.getElementById(`followups-${type}`);
        if (container) setLoading(`followups-${type}`);
    });

    const { data, error } = await db.from('followups').select('*').order('created_at', { ascending: false });

    if (error) { showToast('Failed to load follow-ups', true); return; }

    const grouped = { overdue: [], today: [], upcoming: [] };
    (data || []).forEach(fu => {
        if (grouped[fu.timing] !== undefined) grouped[fu.timing].push(fu);
        else grouped.upcoming.push(fu);
    });

    ['overdue', 'today', 'upcoming'].forEach(type => {
        const container = document.getElementById(`followups-${type}`);
        if (!container) return;
        if (grouped[type].length === 0) {
            container.innerHTML = `<p class="text-gray-600 text-sm text-center py-4">Nothing here</p>`;
            return;
        }
        container.innerHTML = grouped[type].map(fu => `
            <div class="glass p-3 rounded-lg border border-white/5 hover:border-white/20 transition-colors flex justify-between items-center" data-id="${fu.id}">
                <div>
                    <h4 class="text-white text-sm font-medium mb-1">${fu.task}</h4>
                    <div class="flex items-center text-xs text-gray-400 gap-2">
                        <span><i class="fa-solid fa-${fu.type?.toLowerCase() === 'call' ? 'phone' : (fu.type?.toLowerCase() === 'email' ? 'envelope' : 'message')} mr-1"></i>${fu.type}</span>
                        <span>&bull;</span>
                        <span class="${type === 'overdue' ? 'text-red-400' : ''}">${fu.due}</span>
                    </div>
                </div>
                <button class="complete-followup-btn w-6 h-6 rounded-full border border-gray-500 hover:border-emerald-500 hover:bg-emerald-500/20 text-transparent hover:text-emerald-500 flex items-center justify-center transition-all" data-id="${fu.id}">
                    <i class="fa-solid fa-check text-xs"></i>
                </button>
            </div>
        `).join('');
    });
};

const insertFollowup = async (fu) => {
    const { error } = await db.from('followups').insert([fu]);
    if (error) { showToast('Failed to save follow-up: ' + error.message, true); return false; }
    showToast('Follow-up added!');
    return true;
};

const deleteFollowup = async (id) => {
    const { error } = await db.from('followups').delete().eq('id', id);
    if (error) { showToast('Failed to complete follow-up', true); return false; }
    return true;
};

// =============================================
// MEETINGS
// =============================================
const renderMeetings = async () => {
    const container = document.getElementById('meetings-list');
    if (container) setLoading('meetings-list');
    const { data, error } = await db.from('meetings').select('*').order('created_at', { ascending: false });
    if (!container) return;
    if (error) { showToast('Failed to load meetings', true); return; }
    if (!data || data.length === 0) { setEmpty('meetings-list', 'No meetings scheduled yet.'); return; }

    container.innerHTML = data.map(mtg => {
        const timeParts = (mtg.time || 'TBD, 00:00').split(',');
        const day = timeParts[0] || 'TBD';
        const timeVal = timeParts[1] ? timeParts[1].trim().split(' ')[0] : '';
        return `
            <div class="glass p-4 rounded-xl border border-white/5 hover:border-white/20 transition-colors flex items-center justify-between">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-lg bg-blue-500/10 flex flex-col items-center justify-center border border-blue-500/20">
                        <span class="text-xs text-blue-400 font-bold uppercase">${day}</span>
                        <span class="text-white font-bold text-xs">${timeVal}</span>
                    </div>
                    <div>
                        <h4 class="text-white font-medium">${mtg.title}</h4>
                        <p class="text-sm text-gray-400">${mtg.client} &bull; ${mtg.platform}</p>
                    </div>
                </div>
                <button class="btn-modern bg-white/5 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg text-sm transition-colors border border-white/10">Join</button>
            </div>
        `;
    }).join('');
};

const insertMeeting = async (mtg) => {
    const { error } = await db.from('meetings').insert([mtg]);
    if (error) { showToast('Failed to save meeting: ' + error.message, true); return false; }
    showToast('Meeting scheduled!');
    return true;
};

// =============================================
// PROPOSALS
// =============================================
const renderProposals = async () => {
    setLoading('proposals-table-body', 5);
    const { data, error } = await db.from('proposals').select('*').order('created_at', { ascending: false });
    const tbody = document.getElementById('proposals-table-body');
    if (!tbody) return;
    if (error) { showToast('Failed to load proposals', true); return; }
    if (!data || data.length === 0) { setEmpty('proposals-table-body', 'No proposals yet.', 5); return; }

    tbody.innerHTML = data.map(prop => `
        <tr class="hover:bg-white/5 transition-colors group">
            <td class="px-6 py-4 font-medium text-white">${prop.client}</td>
            <td class="px-6 py-4 text-emerald-400 font-bold">${prop.value || ''}</td>
            <td class="px-6 py-4 text-gray-400">${prop.date || ''}</td>
            <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs font-medium ${getStatusBadge(prop.status)}">${prop.status}</span></td>
            <td class="px-6 py-4 text-right">
                <button class="text-gray-400 hover:text-blue-400 mr-2 transition-colors"><i class="fa-solid fa-eye"></i></button>
            </td>
        </tr>
    `).join('');
};

const insertProposal = async (prop) => {
    const { error } = await db.from('proposals').insert([prop]);
    if (error) { showToast('Failed to save proposal: ' + error.message, true); return false; }
    showToast('Proposal created!');
    return true;
};

// =============================================
// TEAM
// =============================================
const renderTeam = async () => {
    const container = document.getElementById('team-grid');
    if (container) setLoading('team-grid');
    const { data, error } = await db.from('team').select('*').order('created_at', { ascending: false });
    if (!container) return;
    if (error) { showToast('Failed to load team', true); return; }
    if (!data || data.length === 0) { setEmpty('team-grid', 'No team members yet. Invite someone!'); return; }

    container.innerHTML = data.map(member => `
        <div class="glass rounded-2xl p-6 border border-white/5 flex flex-col items-center text-center hover:border-blue-500/50 transition-colors relative group">
            <button class="remove-member-btn absolute top-3 right-3 w-8 h-8 flex justify-center items-center rounded-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white opacity-0 group-hover:opacity-100 transition-all duration-300" data-id="${member.id}">
                <i class="fa-solid fa-trash text-sm"></i>
            </button>
            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=random&color=fff" class="w-20 h-20 rounded-full border-4 border-dark mb-4">
            <h3 class="text-white font-bold text-lg">${member.name}</h3>
            <p class="text-blue-400 text-sm mb-4">${member.role}</p>
            <div class="w-full grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
                <div>
                    <p class="text-gray-400 text-xs mb-1">Deals Closed</p>
                    <p class="text-white font-bold">${member.deals}</p>
                </div>
                <div>
                    <p class="text-gray-400 text-xs mb-1">Revenue</p>
                    <p class="text-emerald-400 font-bold">${member.revenue}</p>
                </div>
            </div>
        </div>
    `).join('');
};

const insertTeamMember = async (member) => {
    const { error } = await db.from('team').insert([member]);
    if (error) { showToast('Failed to add member: ' + error.message, true); return false; }
    showToast(`${member.name} added to team!`);
    return true;
};

const deleteTeamMember = async (id) => {
    const { error } = await db.from('team').delete().eq('id', id);
    if (error) { showToast('Failed to remove member', true); return false; }
    showToast('Member removed');
    return true;
};

// =============================================
// CHARTS
// =============================================
const initCharts = () => {
    Chart.defaults.color = '#94a3b8';
    Chart.defaults.font.family = 'Inter';

    const outreachCtx = document.getElementById('outreachChart');
    if (outreachCtx) {
        // Destroy existing chart if any
        const existing = Chart.getChart(outreachCtx);
        if (existing) existing.destroy();
        new Chart(outreachCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [
                    { label: 'Calls Made', data: [120, 150, 180, 140, 210, 250], borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.1)', borderWidth: 2, fill: true, tension: 0.4 },
                    { label: 'Meetings Booked', data: [20, 35, 45, 30, 50, 65], borderColor: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.1)', borderWidth: 2, fill: true, tension: 0.4 }
                ]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } }, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } } }
        });
    }

    const sourceCtx = document.getElementById('sourceChart');
    if (sourceCtx) {
        const existing = Chart.getChart(sourceCtx);
        if (existing) existing.destroy();
        new Chart(sourceCtx, {
            type: 'doughnut',
            data: {
                labels: ['Cold Calling', 'Instagram DMs', 'WhatsApp', 'Referrals'],
                datasets: [{ data: [45, 25, 20, 10], backgroundColor: ['#3b82f6', '#ec4899', '#22c55e', '#f59e0b'], borderWidth: 0, hoverOffset: 4 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, cutout: '75%' }
        });
    }

    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
        const existing = Chart.getChart(revenueCtx);
        if (existing) existing.destroy();
        new Chart(revenueCtx, {
            type: 'bar',
            data: {
                labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                datasets: [{ label: 'Revenue (₹)', data: [120000, 190000, 250000, 310000], backgroundColor: '#10b981', borderRadius: 4 }]
            },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } }, x: { grid: { display: false } } } }
        });
    }

    const channelCtx = document.getElementById('channelChart');
    if (channelCtx) {
        const existing = Chart.getChart(channelCtx);
        if (existing) existing.destroy();
        new Chart(channelCtx, {
            type: 'polarArea',
            data: {
                labels: ['Email', 'Calls', 'Social Media', 'Ads'],
                datasets: [{ data: [11, 16, 7, 3], backgroundColor: ['rgba(59,130,246,0.5)', 'rgba(139,92,246,0.5)', 'rgba(236,72,153,0.5)', 'rgba(245,158,11,0.5)'], borderColor: 'rgba(15,23,42,1)' }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
        });
    }
};

// =============================================
// NAVIGATION
// =============================================
const setupNavigation = () => {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.view-section');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(l => {
                l.classList.remove('bg-white/10', 'text-white', 'active-nav');
                l.classList.add('text-gray-300');
            });
            link.classList.add('bg-white/10', 'text-white', 'active-nav');
            link.classList.remove('text-gray-300');
            sections.forEach(sec => sec.classList.remove('active'));
            const targetId = link.getAttribute('data-target');
            const targetSection = document.getElementById(`view-${targetId}`);
            if (targetSection) targetSection.classList.add('active');
            if (window.innerWidth < 768) {
                document.getElementById('sidebar').classList.add('hidden');
            }
        });
    });

    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const sidebar = document.getElementById('sidebar');
    if (mobileMenuBtn && sidebar) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('hidden');
            sidebar.classList.toggle('absolute');
            sidebar.classList.toggle('z-50');
            sidebar.classList.toggle('bg-darker');
        });
    }
};

// =============================================
// MODAL HELPER
// =============================================
const setupModal = (modalId, btnId, closeClass, formId, submitCallback) => {
    const modal = document.getElementById(modalId);
    const modalContent = document.getElementById(modalId + '-content');
    const openBtn = document.getElementById(btnId);
    const closeBtns = document.querySelectorAll(`.${closeClass}`);
    const form = document.getElementById(formId);
    if (!modal || !modalContent) return;

    const open = () => {
        modal.classList.remove('hidden');
        setTimeout(() => {
            modalContent.classList.remove('scale-95', 'opacity-0');
            modalContent.classList.add('scale-100', 'opacity-100');
        }, 10);
    };
    const close = () => {
        modalContent.classList.remove('scale-100', 'opacity-100');
        modalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => { modal.classList.add('hidden'); if (form) form.reset(); }, 300);
    };

    if (openBtn) openBtn.addEventListener('click', open);
    closeBtns.forEach(btn => btn.addEventListener('click', close));
    if (form && submitCallback) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = form.querySelector('[type="submit"]');
            if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...'; }
            await submitCallback();
            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = submitBtn.getAttribute('data-original-text') || 'Save'; }
            close();
        });
        // Store original text
        const submitBtn = form.querySelector('[type="submit"]');
        if (submitBtn) submitBtn.setAttribute('data-original-text', submitBtn.textContent.trim());
    }
};

// =============================================
// INTERACTIONS SETUP
// =============================================
const setupInteractions = () => {

    // ---- ADD LEAD ----
    const addLeadBtn = document.getElementById('add-lead-btn');
    const addLeadModal = document.getElementById('add-lead-modal');
    const addLeadModalContent = document.getElementById('add-lead-modal-content');
    const closeModalBtn = document.getElementById('close-modal-btn');
    const cancelModalBtn = document.getElementById('cancel-modal-btn');
    const addLeadForm = document.getElementById('add-lead-form');
    const quickAddBtn = document.getElementById('quick-add-btn');

    const openLeadModal = () => {
        addLeadModal.classList.remove('hidden');
        setTimeout(() => { addLeadModalContent.classList.remove('scale-95', 'opacity-0'); addLeadModalContent.classList.add('scale-100', 'opacity-100'); }, 10);
    };
    const closeLeadModal = () => {
        addLeadModalContent.classList.remove('scale-100', 'opacity-100');
        addLeadModalContent.classList.add('scale-95', 'opacity-0');
        setTimeout(() => { addLeadModal.classList.add('hidden'); addLeadForm.reset(); }, 300);
    };

    if (addLeadBtn) addLeadBtn.addEventListener('click', openLeadModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeLeadModal);
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', closeLeadModal);
    if (quickAddBtn) quickAddBtn.addEventListener('click', openLeadModal);

    if (addLeadForm) {
        addLeadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = addLeadForm.querySelector('[type="submit"]');
            if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Saving...'; }
            const ok = await insertLead({
                business: document.getElementById('lead-business').value,
                contact: document.getElementById('lead-contact').value,
                category: document.getElementById('lead-category').value,
                phone: document.getElementById('lead-phone').value,
                status: document.getElementById('lead-status').value,
                priority: document.getElementById('lead-priority').value,
                next_follow_up: 'TBD'
            });
            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = 'Add Lead'; }
            if (ok) { await renderLeads(); closeLeadModal(); }
        });
    }

    // Lead search
    const leadsSearch = document.getElementById('leads-search');
    if (leadsSearch) {
        leadsSearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            document.querySelectorAll('#leads-table-body tr').forEach(row => {
                row.style.display = row.textContent.toLowerCase().includes(term) ? '' : 'none';
            });
        });
    }

    // Delete lead (delegated)
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.delete-lead-btn');
        if (btn) {
            const id = btn.getAttribute('data-id');
            const row = btn.closest('tr');
            if (row) { row.style.transition = 'opacity 0.3s'; row.style.opacity = '0'; }
            setTimeout(async () => {
                const ok = await deleteLead(id);
                if (ok) await renderLeads();
            }, 300);
        }
    });

    // ---- CALLS ----
    setupModal('add-call-modal', 'add-call-btn', 'close-call-btn', 'add-call-form', async () => {
        await insertCall({
            lead: document.getElementById('call-lead').value,
            date: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
            duration: document.getElementById('call-duration').value,
            result: document.getElementById('call-result').value,
            action: document.getElementById('call-action').value
        });
        await renderCalls();
    });

    // ---- MEETINGS ----
    setupModal('add-meeting-modal', 'add-meeting-btn', 'close-meeting-btn', 'add-meeting-form', async () => {
        await insertMeeting({
            title: document.getElementById('meeting-title').value,
            client: document.getElementById('meeting-client').value,
            time: document.getElementById('meeting-time').value,
            platform: document.getElementById('meeting-platform').value
        });
        await renderMeetings();
    });

    // ---- WHATSAPP BROADCAST ----
    setupModal('add-broadcast-modal', 'add-broadcast-btn', 'close-broadcast-btn', 'add-broadcast-form', async () => {
        await insertWhatsApp({
            lead: document.getElementById('broadcast-lead').value,
            number: 'N/A',
            last_msg: document.getElementById('broadcast-msg').value,
            status: 'Sent',
            followup: 'Today'
        });
        await renderWhatsApp();
    });

    // ---- INSTAGRAM DMs ----
    setupModal('add-dm-modal', 'add-dm-btn', 'close-dm-btn', 'add-dm-form', async () => {
        await insertInstagram({
            handle: document.getElementById('dm-handle').value,
            business: document.getElementById('dm-business').value,
            last_dm: document.getElementById('dm-msg').value,
            status: 'Sent',
            action: 'Wait'
        });
        await renderInstagram();
    });

    // ---- FOLLOW-UPS ----
    setupModal('add-followup-modal', 'add-followup-btn', 'close-followup-btn', 'add-followup-form', async () => {
        await insertFollowup({
            task: document.getElementById('followup-task').value,
            type: document.getElementById('followup-type').value,
            due: document.getElementById('followup-due').value,
            timing: document.getElementById('followup-time').value
        });
        await renderFollowups();
    });

    // Complete follow-up (delegated)
    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.complete-followup-btn');
        if (btn) {
            const id = btn.getAttribute('data-id');
            const card = btn.closest('[data-id]');
            if (card) { card.style.transition = 'opacity 0.3s'; card.style.opacity = '0'; }
            setTimeout(async () => {
                const ok = await deleteFollowup(id);
                if (ok) await renderFollowups();
            }, 300);
        }
    });

    // ---- PROPOSALS ----
    setupModal('add-proposal-modal', 'add-proposal-btn', 'close-proposal-btn', 'add-proposal-form', async () => {
        await insertProposal({
            client: document.getElementById('proposal-client').value,
            value: document.getElementById('proposal-value').value,
            date: new Date().toLocaleDateString('en-IN'),
            status: 'Sent'
        });
        await renderProposals();
    });

    // ---- TEAM ----
    setupModal('add-member-modal', 'add-member-btn', 'close-member-btn', 'add-member-form', async () => {
        await insertTeamMember({
            name: document.getElementById('member-name').value,
            role: document.getElementById('member-role').value,
            deals: 0,
            revenue: '₹0'
        });
        await renderTeam();
    });

    // Remove team member (delegated)
    document.addEventListener('click', async (e) => {
        const removeBtn = e.target.closest('.remove-member-btn');
        if (removeBtn) {
            const id = removeBtn.getAttribute('data-id');
            const card = removeBtn.closest('.glass');
            if (card) { card.style.transition = 'opacity 0.3s ease, transform 0.3s ease'; card.style.opacity = '0'; card.style.transform = 'scale(0.9)'; }
            setTimeout(async () => {
                const ok = await deleteTeamMember(id);
                if (ok) await renderTeam();
            }, 300);
        }
    });

    // ---- ANALYTICS REFRESH ----
    const refreshAnalyticsBtn = document.getElementById('refresh-analytics-btn');
    if (refreshAnalyticsBtn) {
        refreshAnalyticsBtn.addEventListener('click', () => {
            const icon = refreshAnalyticsBtn.querySelector('i');
            icon.classList.add('fa-spin');
            setTimeout(() => {
                icon.classList.remove('fa-spin');
                showToast('Analytics refreshed!');
                initCharts();
            }, 800);
        });
    }
};

// =============================================
// SUPABASE DYNAMIC CONFIGURATION & SETUP
// =============================================
const setupSupabaseIntegration = () => {
    const urlInput = document.getElementById('supabase-url-input');
    const keyInput = document.getElementById('supabase-key-input');
    const toggleKeyBtn = document.getElementById('toggle-supabase-key');
    const testBtn = document.getElementById('test-supabase-btn');
    const configForm = document.getElementById('supabase-config-form');
    const copySqlBtn = document.getElementById('copy-sql-btn');
    const statusBadge = document.getElementById('supabase-status-badge');

    // Populate inputs on load
    if (urlInput) urlInput.value = SUPABASE_URL;
    if (keyInput) keyInput.value = SUPABASE_ANON_KEY;

    // Check connection status on load
    const checkConnection = async (silent = true) => {
        try {
            // Attempt a query to see if connection is healthy
            const { error } = await db.from('leads').select('id').limit(1);
            if (error) {
                // If it fails because relation does not exist, database is connected but tables are missing
                if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
                    if (statusBadge) {
                        statusBadge.className = 'text-xs px-2 py-0.5 rounded font-normal bg-orange-500/20 text-orange-400 flex items-center gap-1.5';
                        statusBadge.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> Tables Missing';
                    }
                    if (!silent) showToast('Connected to Supabase, but tables are missing. Run SQL setup script.', true);
                    return 'tables_missing';
                }
                throw error;
            }
            if (statusBadge) {
                statusBadge.className = 'text-xs px-2 py-0.5 rounded font-normal bg-emerald-500/20 text-emerald-400 flex items-center gap-1.5';
                statusBadge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Connected';
            }
            if (!silent) showToast('Supabase connection successful!');
            return 'connected';
        } catch (err) {
            if (statusBadge) {
                statusBadge.className = 'text-xs px-2 py-0.5 rounded font-normal bg-red-500/20 text-red-400 flex items-center gap-1.5';
                statusBadge.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Connection Failed';
            }
            if (!silent) showToast('Connection failed: ' + (err.message || 'Check URL/Key'), true);
            return 'failed';
        }
    };

    checkConnection(true);

    // Toggle API Key visibility
    if (toggleKeyBtn && keyInput) {
        toggleKeyBtn.addEventListener('click', () => {
            const isPassword = keyInput.type === 'password';
            keyInput.type = isPassword ? 'text' : 'password';
            toggleKeyBtn.innerHTML = isPassword ? '<i class="fa-solid fa-eye-slash text-sm"></i>' : '<i class="fa-solid fa-eye text-sm"></i>';
        });
    }

    // Test Connection Button
    if (testBtn) {
        testBtn.addEventListener('click', async () => {
            const testUrl = urlInput.value.trim();
            const testKey = keyInput.value.trim();
            if (!testUrl || !testKey) {
                showToast('Please fill in both URL and API Key', true);
                return;
            }

            testBtn.disabled = true;
            testBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Testing...';
            
            try {
                const testDb = supabase.createClient(testUrl, testKey);
                const { error } = await testDb.from('leads').select('id').limit(1);
                
                if (error) {
                    if (error.code === 'PGRST116' || error.message?.includes('does not exist')) {
                        showToast('Connected to Supabase, but leads table is missing.', false);
                    } else {
                        throw error;
                    }
                } else {
                    showToast('Connection test successful!');
                }
            } catch (err) {
                showToast('Test failed: ' + (err.message || 'Invalid URL or Key'), true);
            } finally {
                testBtn.disabled = false;
                testBtn.innerHTML = '<i class="fa-solid fa-plug"></i> Test Connection';
            }
        });
    }

    // Save configuration
    if (configForm) {
        configForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const saveBtn = configForm.querySelector('button[type="submit"]');
            if (saveBtn) {
                saveBtn.disabled = true;
                saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-1"></i> Saving...';
            }

            const newUrl = urlInput.value.trim();
            const newKey = keyInput.value.trim();

            localStorage.setItem('supabase_url', newUrl);
            localStorage.setItem('supabase_anon_key', newKey);
            SUPABASE_URL = newUrl;
            SUPABASE_ANON_KEY = newKey;
            
            // Re-initialize global client
            db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

            // Re-check connection and reload tables
            const status = await checkConnection(false);

            if (saveBtn) {
                saveBtn.disabled = false;
                saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Config';
            }

            // Always attempt to reload data, but handle errors gracefully
            try {
                await Promise.all([
                    renderLeads(),
                    renderCalls(),
                    renderWhatsApp(),
                    renderInstagram(),
                    renderFollowups(),
                    renderMeetings(),
                    renderProposals(),
                    renderTeam()
                ]);
                setTimeout(initCharts, 100);
            } catch (err) {
                console.error("Failed to load tables after credentials update", err);
            }
        });
    }

    // Copy SQL Schema
    if (copySqlBtn) {
        copySqlBtn.addEventListener('click', () => {
            const sqlTextarea = document.getElementById('supabase-sql-code');
            if (sqlTextarea) {
                // Temporary remove hidden, select, copy, and restore hidden
                sqlTextarea.classList.remove('hidden');
                sqlTextarea.select();
                sqlTextarea.setSelectionRange(0, 99999);
                try {
                    document.execCommand('copy');
                    showToast('Database Setup SQL copied to clipboard!');
                } catch (err) {
                    showToast('Failed to copy. Copy manually from Setup SQL section.', true);
                }
                sqlTextarea.classList.add('hidden');
            }
        });
    }
};

// =============================================
// INIT APP
// =============================================
document.addEventListener('DOMContentLoaded', async () => {
    setupNavigation();
    setupInteractions();
    setupSupabaseIntegration();

    // Load all data from Supabase in parallel
    try {
        await Promise.all([
            renderLeads(),
            renderCalls(),
            renderWhatsApp(),
            renderInstagram(),
            renderFollowups(),
            renderMeetings(),
            renderProposals(),
            renderTeam()
        ]);
    } catch (err) {
        console.error("Error loading initial data from Supabase", err);
        showToast("Error loading data. Check your Supabase settings.", true);
    }

    setTimeout(initCharts, 100);
});

