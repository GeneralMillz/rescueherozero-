/**
 * Status Poller Utility - Optimized for Pi Zero
 * Polls status endpoint with exponential backoff and batch DOM updates
 * CRITICAL FIX: Changed from 5s to 30s interval, added backoff on errors
 */

class StatusPoller {
  constructor(options = {}) {
    // Support both styles: url OR (host + port)
    this.url = options.url || `http://${options.host || window.location.hostname || "127.0.0.1"}:${options.port || 9100}/status.json`;
    this.interval = options.interval || 30000;     // Default: 30 seconds (was 5000)
    this.timeout = options.timeout || 10000;
    this.maxBackoff = options.maxBackoff || 120000; // Max 2 minutes backoff
    this.backoffMultiplier = options.backoffMultiplier || 1.5;
    this.onUpdate = options.onUpdate || (() => {});
    this.onError = options.onError || (() => {});
    this.updateDOM = options.updateDOM || false;
    
    this.timerId = null;
    this.currentBackoff = this.interval;
    this.failureCount = 0;
  }

  /**
   * Update DOM elements with status data - batch updates to minimize reflows
   */
  updateStatusDOM(data) {
    // Batch all DOM updates together to avoid multiple reflows
    const updates = {
      "device-ip": data.ip,
      "kernel-version": data.kernel,
      "uptime": `${data.uptime.hours} hours ${data.uptime.minutes} min`,
      "cpu-load": data.cpu.load + "%",
      "cpu-temp": data.cpu.temp_c + " C",
      "mem-usage": `${data.memory.used_mb} MB / ${data.memory.total_mb} MB`,
      "zim-size": data.storage.zim_gb + " GB",
      "maps-size": data.storage.maps_gb + " GB",
      "svc-dashboard": data.services.dashboard,
      "svc-maps": data.services.maps,
      "svc-tileproxy": data.services.tileproxy,
      "svc-core": data.services.kiwix_core,
      "svc-nice": data.services.kiwix_nice,
      "svc-game": data.services.game_server
    };

    // Update all text elements
    Object.entries(updates).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el && el.textContent !== value) {
        el.textContent = value;
      }
    });

    // Update storage calculations
    const used = ((data.storage.zim_gb || 0) + (data.storage.maps_gb || 0) + (data.storage.roms_gb || 0)).toFixed(2);
    const storageUsed = document.getElementById("storage-used");
    if (storageUsed && storageUsed.textContent !== (used + " GB")) {
      storageUsed.textContent = used + " GB";
    }

    const storageTotal = document.getElementById("storage-total");
    if (storageTotal) {
      const totalText = data.storage.total_gb ? data.storage.total_gb + " GB" : "-- GB";
      if (storageTotal.textContent !== totalText) {
        storageTotal.textContent = totalText;
      }
    }

    // Update storage bar (less frequent reflow)
    if (data.storage.total_gb) {
      const pct = Math.min(100, (used / data.storage.total_gb) * 100);
      const bar = document.getElementById("storage-fill");
      if (bar && bar.style.width !== (pct + "%")) {
        bar.style.width = pct + "%";
      }
    }
  }

  async fetchStatus() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);
      
      const res = await fetch(this.url, {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      clearTimeout(timeoutId);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      
      // Success: reset backoff
      this.failureCount = 0;
      this.currentBackoff = this.interval;
      
      // Update DOM if configured
      if (this.updateDOM) {
        this.updateStatusDOM(data);
      }
      
      this.onUpdate(data);
    } catch (err) {
      // Error: apply exponential backoff
      this.failureCount++;
      this.currentBackoff = Math.min(
        this.maxBackoff,
        this.interval * Math.pow(this.backoffMultiplier, this.failureCount - 1)
      );
      
      // Only log every 5 failures to avoid console spam
      if (this.failureCount % 5 === 0) {
        console.warn(`Status fetch failed (attempt ${this.failureCount}), backing off to ${this.currentBackoff}ms:`, err.message);
      }
      
      this.onError(err);
    }
  }

  /**
   * Start polling with current backoff interval
   */
  start() {
    this.fetchStatus(); // Fetch immediately
    this.timerId = setInterval(() => this.fetchStatus(), this.currentBackoff);
  }

  /**
   * Stop polling and clean up resources
   */
  stop() {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.failureCount = 0;
    this.currentBackoff = this.interval;
  }

  /**
   * Reset backoff (call after network recovers)
   */
  resetBackoff() {
    this.failureCount = 0;
    this.currentBackoff = this.interval;
  }
}

