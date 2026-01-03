/* [Code Gốc - Bản FULL A-Z Đã Ghép & Bổ Sung TrafficTot + LayMaNet] */

let currentUser = null;

function initApp() {
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'login.html';
        } else { 
            currentUser = user; 
            syncData(); 
            showPage('home'); 
        }
    });
}

function toggleSidebar() {
    let sb = document.getElementById("sidebar");
    if (sb) {
        sb.style.width = sb.style.width === "250px" ? "0" : "250px";
    }
}

function showPage(id) {
    const view = document.getElementById('main-view');
    if (!view) return;
    
    // Chỉ đóng sidebar khi không phải trang khởi tạo
    if (id !== 'init') toggleSidebar();

    if (id === 'home') {
        view.innerHTML = `
            <div class="card">
                <h3 style="color: var(--gold);">TOP NGÀY / TUẦN / THÁNG</h3>
                <div id="top-list">Đang tải dữ liệu...</div>
            </div>
            <div class="card" style="text-align:center">
                <h3 style="color: var(--gold);">THỐNG KÊ HỆ THỐNG</h3>
                <p>Online: 1.250 người</p>
            </div>`;
    } else if (id === 'task') {
        view.innerHTML = `
            <div class="card">
                <h3 style="color: var(--gold);"><i class="fas fa-coins"></i> NHIỆM VỤ KIẾM TIỀN</h3>
                <p style="font-size: 12px; opacity: 0.8;">Hoàn thành nhiệm vụ để nhận ngay 250đ/lượt.</p>
                <div class="api-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 15px;">
                    <button class="btn-blue" onclick="getLink('YeuMoney')">YeuMoney</button>
                    <button class="btn-blue" onclick="getLink('Link4M')">Link4M</button>
                    <button class="btn-blue" onclick="getLink('LayMaNgay')">LayMaNgay</button>
                    <button class="btn-blue" onclick="getLink('XLink')">XLink</button>
                    <button class="btn-blue" style="background: #e2b13c; color: #000; font-weight: bold;" onclick="getLink('TrafficTot')">TrafficTot</button>
                    <button class="btn-blue" style="background: #e2b13c; color: #000; font-weight: bold;" onclick="getLink('LayMaNet')">LayMaNet</button>
                </div>
                <div style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 15px;">
                    <input type="text" id="k-in" placeholder="Dán mã xác nhận vào đây..." 
                        style="width: 100%; padding: 12px; background: #111; border: 1px solid var(--gold); color: #fff; border-radius: 8px; outline: none;">
                    <button class="btn-blue" style="background:#28a745; width: 100%; margin-top: 10px; font-weight: 900;" onclick="verify()">XÁC NHẬN NHẬN THƯỞNG</button>
                </div>
            </div>`;
    } else if (id === 'wallet') {
        view.innerHTML = `
            <div class="card">
                <h3 style="color: var(--gold);">VÍ TIỀN</h3>
                <h1 id="w-val" style="color: #fff;">0đ</h1>
                <hr style="opacity: 0.1; margin: 20px 0;">
                <input type="number" id="amt" placeholder="Số tiền muốn rút" style="width:100%; margin-bottom:10px;">
                <textarea id="inf" placeholder="Thông tin: STK, Ngân hàng hoặc Nhà mạng" style="width:100%; height:80px;"></textarea>
                <button class="btn-blue" style="width:100%; margin-top:10px;" onclick="withdraw()">GỬI LỆNH RÚT TIỀN</button>
            </div>`;
    }
}

async function getLink(api) {
    const token = Math.random().toString(36).substring(2, 20);
    const dest = CONFIG.WEB_URL + "?key=" + token;
    
    // Lưu phiên làm việc vào database để chống gian lận
    await db.ref('sessions/' + token).set({uid: currentUser.uid, time: Date.now()});
    
    let url = "";
    const key = CONFIG.API_KEYS[api];

    // Ghép logic API cũ và mới
    switch(api) {
        case 'YeuMoney':
            url = `https://yeumoney.com/QL_api.php?token=${key}&format=text&url=${encodeURIComponent(dest)}`;
            break;
        case 'Link4M':
            url = `https://link4m.co/api-shorten/v2?api=${key}&url=${encodeURIComponent(dest)}`;
            break;
        case 'LayMaNgay':
            url = `https://laymangay.com/api?api=${key}&url=${encodeURIComponent(dest)}`;
            break;
        case 'XLink':
            url = `https://xlink.co/api?token=${key}&url=${encodeURIComponent(dest)}`;
            break;
        case 'LayMaNet':
            // Cấu trúc API Admin gửi: tokenUser, format, url, link_du_phong
            url = `https://api.layma.net/api/admin/shortlink/quicklink?tokenUser=${key}&format=json&url=${encodeURIComponent(dest)}&link_du_phong=${encodeURIComponent(CONFIG.WEB_URL)}`;
            break;
        case 'TrafficTot':
            // Cấu trúc API Admin gửi: api_key, url
            url = `https://services.traffictot.com/api/v1/shorten/redirect?api_key=${key}&url=${encodeURIComponent(dest)}`;
            break;
    }
    
    if (url) {
        window.open(url, "_blank");
    } else {
        novaNotify('error', 'LỖI CẤU HÌNH', 'Thiếu API Key cho nhà mạng này!');
    }
}

async function verify() {
    const k = document.getElementById('k-in').value;
    if (!k) return novaNotify('warning', 'NHẬP MÃ', 'Vui lòng nhập mã để xác nhận!');

    const snap = await db.ref('sessions/'+k).once('value');
    
    if (snap.exists() && snap.val().uid === currentUser.uid) {
        // Cộng tiền và xóa session vĩnh viễn
        await db.ref('users/'+currentUser.uid+'/balance').transaction(b => (b || 0) + 250);
        await db.ref('sessions/'+k).remove();
        
        // Thông báo thành công kiểu Nova Gold
        novaNotify('success', 'NHẬN TIỀN THÀNH CÔNG', 'Tài khoản của bạn đã được cộng +250đ.');
        setTimeout(() => location.reload(), 1500);
    } else {
        novaNotify('error', 'MÃ SAI', 'Mã xác nhận không tồn tại hoặc đã được sử dụng!');
    }
}

function syncData() {
    if (!currentUser) return;
    db.ref('users/'+currentUser.uid).on('value', s => {
        if (!s.exists()) return;
        const b = (s.val().balance || 0).toLocaleString() + "đ";
        
        const topBalance = document.getElementById('top-balance');
        const walletVal = document.getElementById('w-val');
        
        if (topBalance) topBalance.innerText = b;
        if (walletVal) walletVal.innerText = b;
    });
}
