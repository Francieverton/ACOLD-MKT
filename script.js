const Storage = {
    get: (key) => JSON.parse(localStorage.getItem(key) || '[]'),
    set: (key, value) => localStorage.setItem(key, JSON.stringify(value)),
    getSession: () => JSON.parse(localStorage.getItem('cold_session')),
    setSession: (user) => localStorage.setItem('cold_session', JSON.stringify(user)),
    clearSession: () => localStorage.removeItem('cold_session')
};

const Utils = {
    formatCurrency: (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value),
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
        currentUser: null
    },

    init: () => {
        app.data.users = Storage.get('cold_users');
        app.data.products = Storage.get('cold_products');
        app.data.currentUser = Storage.getSession();

        if (app.data.products.length === 0) app.seedData();

        app.themeInit();
        app.checkAuth();
        app.renderProducts();

        app.router('home');
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

        const target = document.getElementById(`${screenName}-screen`);
        if (target) target.classList.add('active');
        window.scrollTo(0, 0);
    },

    checkAuth: () => {
        const guestNav = document.getElementById('guest-nav');
        const userNav = document.getElementById('user-nav');
        const dashBtn = document.getElementById('dashboard-btn');
        const greeting = document.getElementById('user-greeting');

        if (app.data.currentUser) {
            guestNav.style.display = 'none';
            userNav.style.display = 'flex';
            greeting.textContent = `Olá, ${app.data.currentUser.name.split(' ')[0]}`;

            if (app.data.currentUser.type === 'seller') {
                dashBtn.style.display = 'inline-block';
            } else {
                dashBtn.style.display = 'none';
            }
        } else {
            guestNav.style.display = 'flex';
            userNav.style.display = 'none';
        }
    },

    themeInit: () => {
        const savedTheme = localStorage.getItem('cold_theme') || 'light';
        document.body.setAttribute('data-theme', savedTheme);
        const btn = document.getElementById('themeBtn');
        btn.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

        btn.onclick = () => {
            const current = document.body.getAttribute('data-theme');
            const newTheme = current === 'light' ? 'dark' : 'light';
            document.body.setAttribute('data-theme', newTheme);
            localStorage.setItem('cold_theme', newTheme);
            btn.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        };
    },

    renderProducts: () => {
        const container = document.getElementById('product-grid');
        container.innerHTML = app.data.products.map(p => app.createProductCard(p)).join('');
    },

    createProductCard: (p) => {
        const isSoldOut = parseInt(p.stock) <= 0 && !p.preorder;
        const btnText = isSoldOut ? 'Esgotado' : (p.preorder ? 'Encomendar' : 'Comprar');
        const btnDisabled = isSoldOut ? 'disabled style="background:#ccc; cursor:not-allowed"' : '';

        return `
                <article class="card">
                    <div class="card-img-container">
                        ${p.preorder ? '<span class="card-tag">Sob Encomenda</span>' : ''}
                        <img src="${p.img}" class="card-img" alt="${p.title}" onerror="this.src='https://via.placeholder.com/300?text=Sem+Imagem'">
                    </div>
                    <div class="card-body">
                        <span class="seller-link" onclick="app.showSellerProfile('${p.sellerId}', '${p.sellerName}')">por ${p.sellerName}</span>
                        <h3 class="card-title">${p.title}</h3>
                        <div class="card-price">${Utils.formatCurrency(p.price)}</div>
                        <p class="card-desc">${p.desc}</p>
                        
                        <div class="stock-info ${p.stock < 3 ? 'stock-low' : 'stock-ok'}">
                            ${p.preorder ? 'Produção sob demanda' : `Estoque: ${p.stock} un.`}
                        </div>

                        <button class="btn-primary" onclick="app.handlePurchase('${p.id}')" ${btnDisabled}>
                            <span class="btn-text">${btnText}</span>
                            <div class="loader"></div>
                        </button>
                    </div>
                </article>
                `;
    },

    showSellerProfile: (sellerId, sellerName) => {
        const sellerProducts = app.data.products.filter(p => p.sellerId === sellerId);
        document.getElementById('profile-name').innerText = `Loja de ${sellerName}`;
        document.getElementById('seller-grid').innerHTML = sellerProducts.map(p => app.createProductCard(p)).join('');
        app.router('seller-profile');
    },

    handlePurchase: (productId) => {
        if (!app.data.currentUser || app.data.currentUser.type !== 'client') {
            if (!app.data.currentUser) {
                Utils.showToast('Faça login como Cliente para comprar.', 'error');
                setTimeout(() => app.router('login'), 1000);
                return;
            }
            if (app.data.currentUser.type === 'seller') {
                alert("Vendedoras não podem comprar produtos. Entre com uma conta de Cliente.");
                return;
            }
        }

        const productIndex = app.data.products.findIndex(p => p.id === productId);
        const product = app.data.products[productIndex];

        if (product.stock <= 0 && !product.preorder) {
            Utils.showToast('Produto esgotado!', 'error');
            return;
        }

        const btn = event.currentTarget;
        const textSpan = btn.querySelector('.btn-text');
        const loader = btn.querySelector('.loader');

        textSpan.style.display = 'none';
        loader.style.display = 'block';

        setTimeout(() => {
            if (!product.preorder) {
                product.stock = parseInt(product.stock) - 1;
            }

            app.data.products[productIndex] = product;
            Storage.set('cold_products', app.data.products);

            Utils.showToast('Compra realizada com sucesso!');
            textSpan.style.display = 'block';
            loader.style.display = 'none';

            app.renderProducts();
            if (document.getElementById('seller-profile-screen').classList.contains('active')) {
                app.showSellerProfile(product.sellerId, product.sellerName);
            }

        }, 1500);
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
                    <div class="card" style="border: 1px solid var(--primary);">
                        <div style="height: 120px; overflow: hidden;">
                            <img src="${p.img}" style="width:100%; height:100%; object-fit:cover;">
                        </div>
                        <div style="padding: 10px;">
                            <h4 style="font-size: 0.9rem;">${p.title}</h4>
                            <div style="font-weight:bold; color: var(--accent);">${Utils.formatCurrency(p.price)}</div>
                            <div style="font-size: 0.8rem;">Estoque: ${p.stock}</div>
                        </div>
                    </div>
                `).join('');
    },

    handleAddProduct: (e) => {
        e.preventDefault();
        const title = document.getElementById('prod-name').value;
        const img = document.getElementById('prod-img').value;
        const price = parseFloat(document.getElementById('prod-price').value);
        const stock = parseInt(document.getElementById('prod-stock').value);
        const desc = document.getElementById('prod-desc').value;
        const preorder = document.getElementById('prod-preorder').checked;

        const newProd = {
            id: Utils.generateId(),
            sellerId: app.data.currentUser.id,
            sellerName: app.data.currentUser.name,
            title, img, price, stock, desc, preorder
        };

        app.data.products.unshift(newProd);
        Storage.set('cold_products', app.data.products);


        Utils.showToast('Produto adicionado!');
        e.target.reset();
        app.renderSellerDashboard();
    }
};

document.addEventListener('DOMContentLoaded', app.init);