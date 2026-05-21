// RED Browser — Main App Logic
// Handles tabs, proxy, search, and UI interactions

const app = {
  tabs: [],
  activeTab: null,
  settings: {},
  useProxy: false,

  async init() {
    console.log("🔴 RED Browser initializing...");
    
    // Load settings
    try {
      const res = await fetch("/api/settings");
      this.settings = await res.json();
    } catch (e) {
      console.warn("Settings fetch failed, using defaults", e);
    }

    this.setupEventListeners();
    this.createNewTab("about:home");
    console.log("✓ Initialization complete");
  },

  setupEventListeners() {
    // URL bar
    const urlBar = document.getElementById("url-bar");
    const goBtn = document.getElementById("go-btn");
    const securityIcon = document.getElementById("security-icon");

    goBtn.addEventListener("click", () => this.navigate(urlBar.value));
    urlBar.addEventListener("keypress", (e) => {
      if (e.key === "Enter") this.navigate(urlBar.value);
    });

    // Home search
    const homeSearch = document.querySelector(".home-search");
    const homeSearchBtn = document.querySelector(".home-search-btn");
    if (homeSearch && homeSearchBtn) {
      homeSearchBtn.addEventListener("click", () => this.handleHomeSearch(homeSearch.value));
      homeSearch.addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.handleHomeSearch(homeSearch.value);
      });
    }

    // Quicklinks
    document.querySelectorAll(".quicklink").forEach((link) => {
      link.addEventListener("click", () => {
        const action = link.getAttribute("data-action") || link.textContent.toLowerCase();
        this.handleQuicklink(action);
      });
    });

    // Tab management
    document.getElementById("new-tab-btn").addEventListener("click", () => this.createNewTab("about:home"));

    // Nav buttons
    document.querySelector('[onclick="navBack()"]')?.parentElement.addEventListener("click", () => this.navBack());
    document.querySelector('[onclick="navForward()"]')?.parentElement.addEventListener("click", () => this.navForward());
    document.querySelector('[onclick="navReload()"]')?.parentElement.addEventListener("click", () => this.navReload());

    // Settings
    document.querySelector('[onclick="toggleSettings()"]')?.addEventListener("click", () => this.toggleSettings());

    // Context menu
    document.addEventListener("contextmenu", (e) => this.showContextMenu(e));
    document.addEventListener("click", () => this.hideContextMenu());

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => this.handleKeyboard(e));
  },

  handleHomeSearch(query) {
    if (!query.trim()) return;
    this.navigate(query);
  },

  handleQuicklink(action) {
    const links = {
      reddit: "https://reddit.com",
      youtube: "https://youtube.com",
      github: "https://github.com",
      twitter: "https://twitter.com",
      twitch: "https://twitch.tv",
    };
    if (links[action]) {
      this.navigate(links[action]);
    }
  },

  navigate(input) {
    if (!input.trim()) return;

    let url = input.trim();

    // Handle search queries
    if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("about:")) {
      const engine = this.settings.searchEngine || "duckduckgo";
      const engines = {
        duckduckgo: "https://duckduckgo.com/?q=",
        google: "https://www.google.com/search?q=",
        bing: "https://www.bing.com/search?q=",
      };
      url = (engines[engine] || engines.duckduckgo) + encodeURIComponent(url);
    }

    // Handle proxy
    if (this.useProxy && !url.startsWith("about:")) {
      url = "/~/" + url;
    }

    // Update active tab or create new one
    if (this.activeTab) {
      this.activeTab.url = url;
      this.activeTab.title = url;
      this.loadFrame(this.activeTab);
    } else {
      this.createNewTab(url);
    }

    // Update URL bar
    document.getElementById("url-bar").value = url;
  },

  createNewTab(url = "about:home") {
    const tabId = `tab-${Date.now()}`;
    const tab = {
      id: tabId,
      url,
      title: url === "about:home" ? "HOME" : url,
      favicon: "🌐",
    };

    this.tabs.push(tab);
    this.setActiveTab(tabId);
    this.renderTabs();
    this.loadFrame(tab);
  },

  setActiveTab(tabId) {
    this.activeTab = this.tabs.find((t) => t.id === tabId);
    if (this.activeTab) {
      document.getElementById("url-bar").value = this.activeTab.url;
      this.updateSecurityIcon();
    }
    this.renderTabs();
  },

  loadFrame(tab) {
    // Remove old frames
    document.querySelectorAll(".frame").forEach((f) => f.remove());

    const frame = document.createElement("div");
    frame.className = "frame active";

    if (tab.url === "about:home") {
      frame.innerHTML = this.renderHomePage();
    } else {
      const iframe = document.createElement("iframe");
      iframe.src = tab.url;
      iframe.style.width = "100%";
      iframe.style.height = "100%";
      iframe.style.border = "none";
      frame.appendChild(iframe);
    }

    document.getElementById("frames").appendChild(frame);
    this.showLoadingBar();
  },

  renderHomePage() {
    return `
      <div class="home-page">
        <div class="home-grid"></div>
        <div class="home-logo">RED</div>
        <div class="home-tagline">PROXY SEARCH ENGINE</div>
        
        <div class="home-search-wrap">
          <div class="home-search-icon">🔍</div>
          <input type="text" class="home-search" placeholder="Search or enter URL...">
          <button class="home-search-btn">SEARCH</button>
        </div>

        <div class="quicklinks">
          <div class="quicklink" data-action="reddit">
            <div class="quicklink-icon">🔥</div>
            <div class="quicklink-label">Reddit</div>
          </div>
          <div class="quicklink" data-action="youtube">
            <div class="quicklink-icon">▶</div>
            <div class="quicklink-label">YouTube</div>
          </div>
          <div class="quicklink" data-action="github">
            <div class="quicklink-icon">⚙</div>
            <div class="quicklink-label">GitHub</div>
          </div>
          <div class="quicklink" data-action="twitter">
            <div class="quicklink-icon">𝕏</div>
            <div class="quicklink-label">Twitter</div>
          </div>
          <div class="quicklink" data-action="twitch">
            <div class="quicklink-icon">💜</div>
            <div class="quicklink-label">Twitch</div>
          </div>
        </div>

        <div class="home-status">
          <span><span class="status-dot"></span>ONLINE</span>
          <span>VER 1.0</span>
        </div>
      </div>
    `;
  },

  renderTabs() {
    const tabBar = document.getElementById("tab-bar");
    tabBar.innerHTML = "";

    this.tabs.forEach((tab) => {
      const tabEl = document.createElement("div");
      tabEl.className = `tab ${tab.id === this.activeTab?.id ? "active" : ""}`;

      tabEl.innerHTML = `
        <div class="tab-favicon">${tab.favicon}</div>
        <div class="tab-title">${tab.title}</div>
        <div class="tab-close">✕</div>
      `;

      tabEl.addEventListener("click", () => this.setActiveTab(tab.id));
      tabEl.querySelector(".tab-close").addEventListener("click", (e) => {
        e.stopPropagation();
        this.closeTab(tab.id);
      });

      tabBar.appendChild(tabEl);
    });

    tabBar.appendChild(document.getElementById("new-tab-btn"));
  },

  closeTab(tabId) {
    this.tabs = this.tabs.filter((t) => t.id !== tabId);
    if (this.activeTab?.id === tabId) {
      this.activeTab = this.tabs[this.tabs.length - 1] || null;
      if (!this.activeTab) this.createNewTab("about:home");
      else this.loadFrame(this.activeTab);
    }
    this.renderTabs();
  },

  updateSecurityIcon() {
    const icon = document.getElementById("security-icon");
    if (this.useProxy) {
      icon.textContent = "🔐";
      icon.className = "proxied";
      document.getElementById("proxy-badge").style.display = "block";
    } else {
      icon.textContent = "🌐";
      icon.className = "secure";
      document.getElementById("proxy-badge").style.display = "none";
    }
  },

  toggleProxy() {
    this.useProxy = !this.useProxy;
    this.updateSecurityIcon();
    if (this.activeTab && this.activeTab.url !== "about:home") {
      this.loadFrame(this.activeTab);
    }
    this.showToast(this.useProxy ? "🔐 Proxy enabled" : "🌐 Proxy disabled");
  },

  toggleSettings() {
    document.getElementById("settings-sidebar").classList.toggle("open");
  },

  showContextMenu(e) {
    e.preventDefault();
    const menu = document.getElementById("ctx-menu");
    menu.style.display = "block";
    menu.style.left = e.clientX + "px";
    menu.style.top = e.clientY + "px";
  },

  hideContextMenu() {
    document.getElementById("ctx-menu").style.display = "none";
  },

  handleKeyboard(e) {
    if (e.key === "Escape" && e.repeat === false) {
      // Panic key: close all tabs
      if (this.panicKeyPressed) {
        this.tabs = [];
        this.createNewTab("about:home");
        this.showToast("🚨 ALL TABS CLEARED");
      }
      this.panicKeyPressed = true;
      setTimeout(() => (this.panicKeyPressed = false), 1000);
    }
  },

  showLoadingBar() {
    const loadingBar = document.getElementById("loading-bar");
    loadingBar.classList.add("active");
    setTimeout(() => loadingBar.classList.remove("active"), 1500);
  },

  showToast(msg) {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<div class="toast-icon">→</div><div>${msg}</div>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  },

  navBack() {
    this.showToast("← Back");
  },
  navForward() {
    this.showToast("→ Forward");
  },
  navReload() {
    if (this.activeTab) this.loadFrame(this.activeTab);
    this.showToast("↻ Reloaded");
  },
};

// Context menu function
function ctxAction(action) {
  const actions = {
    newTab: () => app.createNewTab("about:home"),
    back: () => app.navBack(),
    forward: () => app.navForward(),
    reload: () => app.navReload(),
    copyUrl: () => {
      navigator.clipboard.writeText(document.getElementById("url-bar").value);
      app.showToast("📋 URL copied");
    },
    openProxy: () => app.toggleProxy(),
    settings: () => app.toggleSettings(),
  };
  actions[action]?.();
  app.hideContextMenu();
}

// Initialize app when DOM is ready
document.addEventListener("DOMContentLoaded", () => app.init());
