const Storage = {
    get: (key) => JSON.parse(localStorage.getItem(key) || '[]'),
    set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
    getSession: () => JSON.parse(localStorage.getItem('cold_session')),
    setSession: (user) => localStorage.setItem('cold_session', JSON.stringify(user)),
    clearSession: () => localStorage.removeItem('cold_session'),
    getCart: () => JSON.parse(localStorage.getItem('cold_cart') || '[]'),
    setCart: (cart) => localStorage.setItem('cold_cart', JSON.stringify(cart))
};

const Utils = {
    formatCurrency: (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
    calculateInstallments: (price) => {
        const count = 10;
        const value = price / count;
        return `ou ${count}x de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} s/ juros`;
    },
    generateId: () => '_' + Math.random().toString(36).substr(2, 9),
    showToast: (msg, type = 'success') => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = type === 'success' ? `✅ ${msg}` : `⚠️ ${msg}`;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
};

const app = {
    data: {
        users: [],
        products: [],
        currentUser: null,
        cart: [],
        editingId: null
    },

    init: () => {
        document.title = 'Acold MarketPlace';
        app.data.users = Storage.get('cold_users');
        app.data.products = Storage.get('cold_products');
        app.data.currentUser = Storage.getSession();
        app.data.cart = Storage.getCart();

        if (app.data.products.length === 0) app.seedData();

        app.injectHTML(); // Cria estruturas faltantes (Carrinho, PDP)
        app.themeInit();
        app.injectStyles();
        app.checkAuth();
        app.renderProducts();

        app.router('home');
    },

    injectHTML: () => {
        // Injeta o container da Página de Detalhes se não existir
        if (!document.getElementById('product-detail-screen')) {
            const pdp = document.createElement('div');
            pdp.id = 'product-detail-screen';
            pdp.className = 'screen';
            pdp.innerHTML = `<div id="pdp-content" class="pdp-container"></div>`;
            document.body.appendChild(pdp);
        }

        // Injeta o Carrinho (Sidebar) se não existir
        if (!document.getElementById('cart-sidebar')) {
            const cartHTML = `
                <div id="cart-overlay" class="cart-overlay" onclick="app.toggleCart()"></div>
                <aside id="cart-sidebar" class="cart-sidebar">
                    <div class="cart-header">
                        <h3>Meu Carrinho</h3>
                        <button class="close-cart" onclick="app.toggleCart()">×</button>
                    </div>
                    <div id="cart-items" class="cart-items">
                        <!-- Itens renderizados via JS -->
                    </div>
                    <div class="cart-footer">
                        <div class="cart-total">Total: <span id="cart-total-value">R$ 0,00</span></div>
                        <button class="btn-primary btn-checkout" onclick="app.checkout()">FINALIZAR COMPRA</button>
                    </div>
                </aside>
            `;
            document.body.insertAdjacentHTML('beforeend', cartHTML);
        }

        // Injeta o Botão Flutuante de Carrinho se não existir
        if (!document.getElementById('cart-float-btn')) {
            const floatBtn = document.createElement('div');
            floatBtn.id = 'cart-float-btn';
            floatBtn.className = 'cart-float-btn';
            floatBtn.onclick = () => app.toggleCart();
            floatBtn.innerHTML = `<span id="cart-count-float" class="cart-count">0</span>🛒`;
            document.body.appendChild(floatBtn);
        }

        // Injeta a Sidebar de Menu (Menu Lateral)
        if (!document.getElementById('app-sidebar')) {
            const sidebarHTML = `
                <div id="menu-overlay" class="menu-overlay" onclick="app.closeMenu()"></div>
                <header class="app-header">
                    <div id="menu-toggle" class="menu-toggle" onmouseenter="app.openMenu()" onclick="app.openMenu()"><div class="bar"></div><div class="bar"></div><div class="bar"></div></div>
                    <div class="header-logo">Cold MarketPlace</div>
                </header>
                <aside id="app-sidebar" class="app-sidebar" onmouseleave="app.closeMenu()">
                    <div class="sidebar-header">
                        <h2>Menu</h2>
                        <button class="close-sidebar" onclick="app.closeMenu()">×</button>
                    </div>
                    <div class="sidebar-content">
                        <a href="#" onclick="app.router('home'); app.closeMenu(); return false;" class="sidebar-link">🏠 Início</a>
                        <div id="sidebar-dynamic-links"></div>
                        <div class="sidebar-footer">
                            <button id="sidebarThemeBtn" class="theme-btn">🌗 Alternar Tema</button>
                        </div>
                    </div>
                </aside>
            `;
            document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
        }
    },

    seedData: () => {
        const mockProducts = [
            { id: '1', sellerId: 's1', sellerName: 'Maria Silva', title: 'Bolsa de Crochê Azul', price: 45.00, img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500', desc: 'Feita à mão com fio náutico.', stock: 5, preorder: false },
            { id: '2', sellerId: 's2', sellerName: 'Ana Souza', title: 'Boneca de Pano', price: 60.00, img: 'https://images.unsplash.com/photo-1558679908-4e7fa56a297e?w=500', desc: 'Hipoalergênica e lavável.', stock: 2, preorder: true },
            { id: '3', sellerId: 's1', sellerName: 'Maria Silva', title: 'Kit Panos de Prato', price: 25.00, img: 'https://images.unsplash.com/photo-1596464716127-f9a0639b5d7e?w=500', desc: 'Bordado ponto cruz.', stock: 10, preorder: false },
        ];
        const mockUsers = [
            { id: 's1', name: 'Maria Silva', email: 'maria@cold.com', pass: '123', type: 'seller' },
            { id: 'c1', name: 'João Cliente', email: 'joao@cold.com', pass: '123', type: 'client' } // Default login for testing
        ];
        app.data.products = mockProducts;
        app.data.users = mockUsers;
        Storage.set('cold_products', mockProducts);
        Storage.set('cold_users', mockUsers);
    },

    router: (screenName) => {
        document.querySelectorAll('.screen').forEach(el => el.classList.remove('active'));

        if (screenName === 'dashboard') {
            if (!app.data.currentUser || app.data.currentUser.type !== 'seller') {
                Utils.showToast('Acesso restrito a vendedoras.', 'error');
                return app.router('home');
            }
            app.renderSellerDashboard();
        }

        if (screenName === 'product-detail') {
            window.scrollTo(0, 0);
        }

        const target = document.getElementById(`${screenName}-screen`);
        if (target) target.classList.add('active');
        window.scrollTo(0, 0);
    },

    checkAuth: () => {
        const guestNav = document.getElementById('guest-nav');
        const userNav = document.getElementById('user-nav');
        const dashBtn = document.getElementById('dashboard-btn');
        const greeting = document.getElementById('user-greeting');
        const sidebarLinks = document.getElementById('sidebar-dynamic-links');

        if (app.data.currentUser) {
            if(guestNav) guestNav.style.display = 'none';
            if(userNav) userNav.style.display = 'flex';
            if(greeting) greeting.textContent = `Olá, ${app.data.currentUser.name.split(' ')[0]}`;
            
            let linksHtml = `<div class="user-info-sidebar">Olá, ${app.data.currentUser.name.split(' ')[0]}</div>`;
            if (app.data.currentUser.type === 'seller') {
                if(dashBtn) dashBtn.style.display = 'inline-block';
                linksHtml += `<a href="#" onclick="app.router('dashboard'); app.closeMenu(); return false;" class="sidebar-link">📊 Painel Vendedora</a>`;
            }
            linksHtml += `<a href="#" onclick="app.logout(); app.closeMenu(); return false;" class="sidebar-link">🚪 Sair</a>`;
            if(sidebarLinks) sidebarLinks.innerHTML = linksHtml;

        } else {
            if(guestNav) guestNav.style.display = 'flex';
            if(userNav) userNav.style.display = 'none';
            if(sidebarLinks) sidebarLinks.innerHTML = `
                <a href="#" onclick="app.router('login'); app.closeMenu(); return false;" class="sidebar-link">🔑 Login</a>
                <a href="#" onclick="app.router('register'); app.closeMenu(); return false;" class="sidebar-link">📝 Cadastro</a>
            `;
        }
    },

    themeInit: () => {
        const savedTheme = localStorage.getItem('cold_theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        const btn = document.getElementById('themeBtn');
        if(btn) btn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

        const toggleTheme = () => {
            const current = document.body.getAttribute('data-theme');
            const newTheme = current === 'light' ? 'dark' : 'light';
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('cold_theme', newTheme);
            if(btn) btn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        };

        if(btn) btn.onclick = toggleTheme;
        
        const sidebarBtn = document.getElementById('sidebarThemeBtn');
        if(sidebarBtn) sidebarBtn.onclick = toggleTheme;
    },

    openMenu: () => {
        document.getElementById('app-sidebar').classList.add('open');
        document.getElementById('menu-overlay').classList.add('open');
    },
    closeMenu: () => {
        document.getElementById('app-sidebar').classList.remove('open');
        document.getElementById('menu-overlay').classList.remove('open');
    },

    injectStyles: () => {
        const style = document.createElement('style');
        style.innerHTML = `
            :root {
                --primary: #cb0011 !important; /* Vermelho KitchenAid */
                --primary-dark: #a0000d !important;
                --bg: #f6f6f6 !important;
                --card-bg: #ffffff !important;
                --border-color: #e0e0e0 !important;
                --text: #333333 !important;
                --font-family: "Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif;
            }
            body {
                font-family: var(--font-family) !important;
                background-color: var(--bg) !important;
                color: var(--text) !important;
                padding-top: 80px !important; /* Espaço para o header fixo */
            }
            
            /* Dark Mode Fixes */
            body[data-theme="dark"] {
                --bg: #121212 !important;
                --card-bg: #1e1e1e !important;
                --text: #e0e0e0 !important;
                --border-color: #333 !important;
            }
            body[data-theme="dark"] .card-title { color: #fff !important; }
            body[data-theme="dark"] .app-sidebar { background: #1e1e1e !important; color: #fff !important; }
            body[data-theme="dark"] .sidebar-link { color: #ccc !important; }
            body[data-theme="dark"] .sidebar-link:hover { background: #333 !important; color: #fff !important; }
            body[data-theme="dark"] .app-header { background: #1e1e1e !important; border-bottom: 1px solid #333; }
            body[data-theme="dark"] .menu-toggle .bar { background: #fff !important; }
            
            /* Hide Old Nav */
            nav { display: none !important; }

            /* New Sidebar Styles */
            .app-header {
                position: fixed; top: 0; left: 0; width: 100%; height: 70px;
                background: #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                display: flex; align-items: center; padding: 0 20px; z-index: 1000;
                box-sizing: border-box;
            }
            .header-logo { font-size: 1.5rem; font-weight: bold; color: var(--text); margin-left: 15px; }

            .menu-toggle {
                cursor: pointer; padding: 5px; background: transparent;
            }
            .menu-toggle .bar {
                width: 25px; height: 3px; background: #333; margin: 5px 0;
                transition: 0.3s;
            }
            .app-sidebar {
                position: fixed; top: 0; left: 0; width: 280px; height: 100%;
                background: #fff; z-index: 1002;
                transform: translateX(-100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 5px 0 15px rgba(0,0,0,0.1);
                display: flex; flex-direction: column;
            }
            .app-sidebar.open { transform: translateX(0); }
            .menu-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.5); z-index: 1000;
                display: none; opacity: 0; transition: opacity 0.3s;
            }
            .menu-overlay.open { display: block; opacity: 1; }
            
            .sidebar-header { padding: 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
            .sidebar-header h2 { margin: 0; color: var(--primary); font-size: 1.5rem; }
            .close-sidebar { background: none; border: none; font-size: 2rem; cursor: pointer; color: var(--text); }
            
            .sidebar-content { padding: 20px; flex: 1; display: flex; flex-direction: column; gap: 10px; }
            .sidebar-link {
                display: block; padding: 12px 15px; text-decoration: none;
                color: #333; font-weight: 500; border-radius: 8px;
                transition: background 0.2s;
            }
            .sidebar-link:hover { background: #f0f0f0; color: var(--primary); }
            .user-info-sidebar { padding: 10px 15px; font-weight: bold; color: var(--primary); margin-bottom: 10px; border-bottom: 1px solid #eee; }
            
            .sidebar-footer { margin-top: auto; padding-top: 20px; border-top: 1px solid var(--border-color); }
            .theme-btn {
                width: 100%; padding: 10px; background: transparent; border: 1px solid var(--border-color);
                border-radius: 5px; cursor: pointer; color: var(--text);
            }
            
            /* Grid de Produtos */
            #product-grid {
                display: grid !important;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)) !important;
                gap: 30px !important;
                padding: 40px 20px !important;
                max-width: 1200px !important;
                margin: 0 auto !important;
            }
            
            /* Card de Produto */
            .card {
                background: var(--card-bg);
                border: none !important;
                border-radius: 0 !important;
                /* box-shadow: 0 1px 3px rgba(0,0,0,0.05) !important; */
                padding: 24px !important;
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
                transition: all 0.3s ease !important;
                height: 100%;
                cursor: pointer;
            }
            .card:hover {
                box-shadow: 0 15px 30px rgba(0,0,0,0.08) !important;
                transform: translateY(-4px);
            }
            .card-img-container {
                width: 100%;
                height: 220px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 20px;
                position: relative;
                background: transparent !important;
            }
            .card-img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain !important;
            }
            
            .card-title {
                font-size: 0.95rem !important;
                font-weight: 600 !important;
                color: #000;
                margin: 0 0 10px 0 !important;
                min-height: 40px;
                line-height: 1.4 !important;
                display: -webkit-box;
                -webkit-line-clamp: 2;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            .card-price {
                font-size: 1.4rem !important;
                font-weight: 700 !important;
                color: var(--primary) !important;
                margin-bottom: 2px !important;
            }
            .card-installments {
                font-size: 0.85rem;
                color: #777;
                margin-bottom: 20px;
            }
            .btn-primary {
                background-color: var(--primary) !important;
                color: white !important;
                border: none !important;
                border-radius: 4px !important;
                padding: 14px 24px !important;
                font-weight: 700 !important;
                text-transform: uppercase !important;
                font-size: 0.85rem !important;
                width: 100%;
                cursor: pointer;
                letter-spacing: 0.5px;
                transition: background 0.2s;
            }
            .btn-primary:hover {
                background-color: var(--primary-dark) !important;
            }
            .seller-link {
                font-size: 0.75rem !important;
                color: #999 !important;
                text-decoration: none !important;
                margin-bottom: 8px;
                display: block;
            }
            
            /* Carrinho Sidebar */
            .cart-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.5); z-index: 998;
                display: none; opacity: 0; transition: opacity 0.3s;
            }
            .cart-sidebar {
                position: fixed; top: 0; right: -400px; width: 400px; height: 100%;
                background: #fff; z-index: 999;
                box-shadow: -5px 0 15px rgba(0,0,0,0.1);
                transition: right 0.3s ease;
                display: flex; flex-direction: column;
                max-width: 90%;
            }
            .cart-sidebar.open { right: 0; }
            .cart-overlay.open { display: block; opacity: 1; }
            
            .cart-header { padding: 20px; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; align-items: center; }
            .cart-header h3 { margin: 0; font-size: 1.2rem; }
            .close-cart { background: none; border: none; font-size: 2rem; cursor: pointer; line-height: 1; }
            
            .cart-items { flex: 1; overflow-y: auto; padding: 20px; }
            .cart-item { display: flex; gap: 15px; margin-bottom: 20px; border-bottom: 1px solid #f0f0f0; padding-bottom: 15px; }
            .cart-item img { width: 70px; height: 70px; object-fit: cover; }
            .cart-item-info { flex: 1; }
            .cart-item-title { font-size: 0.9rem; font-weight: 600; margin-bottom: 5px; }
            .cart-item-price { color: var(--primary); font-weight: bold; }
            .cart-remove { color: #999; font-size: 0.8rem; cursor: pointer; text-decoration: underline; margin-top: 5px; display: inline-block; }
            
            .cart-footer { padding: 20px; border-top: 1px solid #eee; background: #f9f9f9; }
            .cart-total { font-size: 1.2rem; font-weight: bold; display: flex; justify-content: space-between; margin-bottom: 15px; }
            
            /* Página de Detalhes (PDP) */
            .pdp-container {
                max-width: 1200px; margin: 40px auto; padding: 20px;
                display: grid; grid-template-columns: 1fr 1fr; gap: 50px;
                background: #fff;
            }
            .pdp-image img { width: 100%; height: auto; object-fit: contain; max-height: 500px; }
            .pdp-info h1 { font-size: 2rem; margin-bottom: 10px; line-height: 1.2; }
            .pdp-seller { color: #666; font-size: 0.9rem; margin-bottom: 20px; display: block; }
            .pdp-image { overflow: hidden; cursor: crosshair; position: relative; display: flex; align-items: center; justify-content: center; }
            .pdp-image img { transition: transform 0.1s ease-out; transform-origin: center center; will-change: transform; }
            .pdp-price { font-size: 2rem; color: var(--primary); font-weight: 700; margin-bottom: 5px; }
            .pdp-installments { color: #666; margin-bottom: 30px; font-size: 1rem; }
            .pdp-desc { line-height: 1.6; color: #444; margin-bottom: 30px; border-top: 1px solid #eee; padding-top: 20px; }
            
            /* Botão flutuante do carrinho (opcional se não tiver no header) */
            .cart-float-btn {
                position: fixed; bottom: 30px; right: 30px;
                background: var(--primary); color: white;
                width: 60px; height: 60px; border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                box-shadow: 0 5px 15px rgba(203,0,17,0.4);
                cursor: pointer; z-index: 990; font-size: 1.5rem;
            }
            .cart-count {
                position: absolute; top: -5px; right: -5px;
                background: #333; color: white;
                font-size: 0.7rem; width: 24px; height: 24px;
                border-radius: 50%; display: flex; align-items: center; justify-content: center;
                border: 2px solid #fff;
            }

            @media (max-width: 768px) {
                .pdp-container { grid-template-columns: 1fr; }
                .cart-sidebar { width: 100%; right: -100%; }
            }

            /* Ocultar elementos antigos se existirem no CSS original */
            .stock-info, .card-desc { display: none !important; }
        `;
        document.head.appendChild(style);
    },

    renderProducts: () => {
        const container = document.getElementById('product-grid');
        container.innerHTML = app.data.products.map(p => app.createProductCard(p)).join('');
    },

    createProductCard: (p) => {
        const isSoldOut = parseInt(p.stock) <= 0 && !p.preorder;
        const btnText = isSoldOut ? 'AVISE-ME' : 'COMPRAR';
        const btnDisabled = isSoldOut ? 'disabled' : '';
        const installments = Utils.calculateInstallments(p.price);

        return `
                <article class="card" onclick="app.openProduct('${p.id}')">
                    <div class="card-img-container" title="Ver detalhes">
                        ${p.preorder ? '<span class="card-tag" style="position:absolute;top:10px;left:10px;background:#333;color:#fff;padding:4px 8px;font-size:0.7rem;text-transform:uppercase;font-weight:bold;">Sob Encomenda</span>' : ''}
                        <img src="${p.img}" class="card-img" alt="${p.title}" onerror="this.src='https://via.placeholder.com/300?text=Sem+Imagem'">
                    </div>
                    <div class="card-body" style="width:100%">
                        <h3 class="card-title" title="${p.title}">${p.title}</h3>
                        <span class="seller-link" onclick="event.stopPropagation(); app.showSellerProfile('${p.sellerId}', '${p.sellerName}')">Vendido por ${p.sellerName}</span>
                        <div class="card-price">${Utils.formatCurrency(p.price)}</div>
                        <div class="card-installments">${installments}</div>

                        <button class="btn-primary" onclick="event.stopPropagation(); app.addToCart('${p.id}')" ${btnDisabled}>
                            <span class="btn-text">${btnText}</span>
                        </button>
                    </div>
                </article>
                `;
    },

    openProduct: (id) => {
        const product = app.data.products.find(p => p.id === id);
        if (!product) return;

        const container = document.getElementById('pdp-content');
        const installments = Utils.calculateInstallments(product.price);
        const isSoldOut = parseInt(product.stock) <= 0 && !product.preorder;

        container.innerHTML = `
            <div class="pdp-image" onmousemove="app.handleZoom(event)" onmouseleave="app.resetZoom(event)">
                <img src="${product.img}" alt="${product.title}">
            </div>
            <div class="pdp-info">
                <h1>${product.title}</h1>
                <span class="pdp-seller">Vendido e entregue por <strong>${product.sellerName}</strong></span>
                
                <div class="pdp-price">${Utils.formatCurrency(product.price)}</div>
                <div class="pdp-installments">${installments}</div>

                <div class="pdp-desc">
                    <h3>Descrição</h3>
                    <p>${product.desc}</p>
                    <p><strong>Estoque:</strong> ${product.preorder ? 'Sob Encomenda' : product.stock + ' unidades'}</p>
                </div>

                <button class="btn-primary" style="max-width: 300px; height: 50px; font-size: 1rem;" 
                    onclick="app.addToCart('${product.id}')" ${isSoldOut ? 'disabled' : ''}>
                    ${isSoldOut ? 'ESGOTADO' : 'ADICIONAR AO CARRINHO'}
                </button>
                
                <br><br>
                <a href="#" onclick="app.router('home'); return false;" style="color:#666; text-decoration:underline;">Voltar para a loja</a>
            </div>
        `;

        app.router('product-detail');
    },

    handleZoom: (e) => {
        const container = e.currentTarget;
        const img = container.querySelector('img');
        const rect = container.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        img.style.transformOrigin = `${x}% ${y}%`;
        img.style.transform = "scale(2)";
    },

    resetZoom: (e) => {
        const img = e.currentTarget.querySelector('img');
        img.style.transform = "scale(1)";
    },

    showSellerProfile: (sellerId, sellerName) => {
        const sellerProducts = app.data.products.filter(p => p.sellerId === sellerId);
        document.getElementById('profile-name').innerText = `Loja de ${sellerName}`;
        document.getElementById('seller-grid').innerHTML = sellerProducts.map(p => app.createProductCard(p)).join('');
        app.router('seller-profile');
    },

    addToCart: (productId) => {
        const product = app.data.products.find(p => p.id === productId);

        if (product.stock <= 0 && !product.preorder) {
            Utils.showToast('Produto esgotado!', 'error');
            return;
        }

        // Verifica se já está no carrinho
        const existing = app.data.cart.find(item => item.id === productId);
        if (existing) {
            Utils.showToast('Produto já está no carrinho');
            app.toggleCart(true);
            return;
        }

        app.data.cart.push(product);
        Storage.setCart(app.data.cart);
        app.updateCartCount();
        app.renderCart();
        app.toggleCart(true); // Abre o carrinho
        Utils.showToast('Adicionado ao carrinho!');
    },

    removeFromCart: (productId) => {
        app.data.cart = app.data.cart.filter(p => p.id !== productId);
        Storage.setCart(app.data.cart);
        app.updateCartCount();
        app.renderCart();
    },

    toggleCart: (forceOpen = null) => {
        const sidebar = document.getElementById('cart-sidebar');
        const overlay = document.getElementById('cart-overlay');
        const isOpen = sidebar.classList.contains('open');
        
        if (forceOpen === true || (forceOpen === null && !isOpen)) {
            sidebar.classList.add('open');
            overlay.classList.add('open');
            app.renderCart();
        } else {
            sidebar.classList.remove('open');
            overlay.classList.remove('open');
        }
    },

    renderCart: () => {
        const container = document.getElementById('cart-items');
        const totalEl = document.getElementById('cart-total-value');
        
        if (app.data.cart.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#999; margin-top:50px;">Seu carrinho está vazio.</p>';
            totalEl.innerText = 'R$ 0,00';
            return;
        }

        let total = 0;
        container.innerHTML = app.data.cart.map(p => {
            total += p.price;
            return `
                <div class="cart-item">
                    <img src="${p.img}" alt="${p.title}">
                    <div class="cart-item-info">
                        <div class="cart-item-title">${p.title}</div>
                        <div class="cart-item-price">${Utils.formatCurrency(p.price)}</div>
                        <span class="cart-remove" onclick="app.removeFromCart('${p.id}')">Remover</span>
                    </div>
                </div>
            `;
        }).join('');
        
        totalEl.innerText = Utils.formatCurrency(total);
    },

    updateCartCount: () => {
        const count = app.data.cart.length;
        const badge = document.getElementById('cart-count-float');
        if (badge) badge.innerText = count;
    },

    checkout: () => {
        if (app.data.cart.length === 0) return;
        
        if (!app.data.currentUser) {
            Utils.showToast('Faça login para finalizar.', 'error');
            app.toggleCart(false);
            app.router('login');
            return;
        }

        // Simulação de compra
        Utils.showToast('Compra realizada com sucesso! Obrigado.');
        app.data.cart = [];
        Storage.setCart([]);
        app.renderCart();
        app.toggleCart(false);
    },

    handleLogin: (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-pass').value;

        const user = app.data.users.find(u => u.email === email && u.pass === pass);

        if (user) {
            app.data.currentUser = user;
            Storage.setSession(user);
            Utils.showToast(`Bem-vindo, ${user.name}!`);
            app.checkAuth();
            app.router('home');
        } else {
            Utils.showToast('Email ou senha inválidos.', 'error');
        }
    },

    handleRegister: (e) => {
        e.preventDefault();
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const pass = document.getElementById('reg-pass').value;
        const type = document.getElementById('reg-type').value;

        if (app.data.users.find(u => u.email === email)) {
            Utils.showToast('Email já cadastrado.', 'error');
            return;
        }

        const newUser = { id: Utils.generateId(), name, email, pass, type };
        app.data.users.push(newUser);
        Storage.set('cold_users', app.data.users);

        app.data.currentUser = newUser;
        Storage.setSession(newUser);

        Utils.showToast('Conta criada com sucesso!');
        app.checkAuth();
        app.router('home');
    },

    logout: () => {
        app.data.currentUser = null;
        Storage.clearSession();
        app.checkAuth();
        app.router('login');
        Utils.showToast('Você saiu.');
    },

    renderSellerDashboard: () => {
        const myProducts = app.data.products.filter(p => p.sellerId === app.data.currentUser.id);
        const listContainer = document.getElementById('seller-products-list');

        if (myProducts.length === 0) {
            listContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-secondary)">Você ainda não cadastrou produtos.</p>';
            return;
        }

        listContainer.innerHTML = myProducts.map(p => `
                    <div class="card" style="border: 1px solid #eee; padding: 15px;">
                        <div style="height: 120px; overflow: hidden; margin-bottom: 10px; display:flex; align-items:center; justify-content:center;">
                            <img src="${p.img}" style="max-width:100%; max-height:100%; object-fit:contain;">
                        </div>
                        <div style="width: 100%;">
                            <h4 style="font-size: 0.9rem; margin: 0 0 5px 0; min-height: 35px;">${p.title}</h4>
                            <div style="font-weight:bold; color: var(--primary); margin-bottom: 5px;">${Utils.formatCurrency(p.price)}</div>
                            <div style="font-size: 0.8rem; color: #666; margin-bottom: 15px;">Estoque: ${p.stock}</div>
                            
                            <div style="display: flex; gap: 10px;">
                                <button onclick="app.startEditProduct('${p.id}')" style="flex: 1; padding: 8px; background: #333; color: #fff; border: none; cursor: pointer; font-size: 0.8rem; border-radius: 4px;">Editar</button>
                                <button onclick="app.deleteProduct('${p.id}')" style="flex: 1; padding: 8px; background: var(--primary); color: #fff; border: none; cursor: pointer; font-size: 0.8rem; border-radius: 4px;">Excluir</button>
                            </div>
                        </div>
                    </div>
                `).join('');
    },

    deleteProduct: (id) => {
        if(!confirm('Tem certeza que deseja excluir este produto?')) return;
        app.data.products = app.data.products.filter(p => p.id !== id);
        Storage.set('cold_products', app.data.products);
        Utils.showToast('Produto excluído.');
        app.renderSellerDashboard();
        app.renderProducts();
    },

    startEditProduct: (id) => {
        const p = app.data.products.find(p => p.id === id);
        if(!p) return;
        
        document.getElementById('prod-name').value = p.title;
        document.getElementById('prod-img').value = p.img;
        document.getElementById('prod-price').value = p.price;
        document.getElementById('prod-stock').value = p.stock;
        document.getElementById('prod-desc').value = p.desc;
        const preorderCheck = document.getElementById('prod-preorder');
        if(preorderCheck) preorderCheck.checked = p.preorder;
        
        app.data.editingId = id;
        
        const submitBtn = document.querySelector('#add-product-form button[type="submit"]') || document.querySelector('form button[type="submit"]');
        if(submitBtn) submitBtn.innerText = 'Salvar Alterações';
        
        const form = document.getElementById('prod-name').closest('form');
        if(form) form.scrollIntoView({behavior: 'smooth'});
        
        Utils.showToast('Editando: ' + p.title);
    },

    handleAddProduct: (e) => {
        e.preventDefault();
        const title = document.getElementById('prod-name').value;
        const img = document.getElementById('prod-img').value;
        const price = parseFloat(document.getElementById('prod-price').value);
        const stock = parseInt(document.getElementById('prod-stock').value);
        const desc = document.getElementById('prod-desc').value;
        const preorderEl = document.getElementById('prod-preorder');
        const preorder = preorderEl ? preorderEl.checked : false;

        if (app.data.editingId) {
            const index = app.data.products.findIndex(p => p.id === app.data.editingId);
            if (index !== -1) {
                app.data.products[index] = {
                    ...app.data.products[index],
                    title, img, price, stock, desc, preorder
                };
                Utils.showToast('Produto atualizado!');
            }
            app.data.editingId = null;
            const submitBtn = e.target.querySelector('button[type="submit"]');
            if(submitBtn) submitBtn.innerText = 'Adicionar Produto';
        } else {
            const newProd = {
                id: Utils.generateId(),
                sellerId: app.data.currentUser.id,
                sellerName: app.data.currentUser.name,
                title, img, price, stock, desc, preorder
            };
            app.data.products.unshift(newProd);
            Utils.showToast('Produto adicionado!');
        }
        
        Storage.set('cold_products', app.data.products);
        e.target.reset();
        app.renderSellerDashboard();
        app.renderProducts();
    }
};

document.addEventListener('DOMContentLoaded', app.init);