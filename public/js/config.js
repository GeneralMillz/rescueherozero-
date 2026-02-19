/**
 * PrepperZero Configuration
 * Centralized port and service definitions
 */

const PREPPERZERO_CONFIG = {
  /* Service Ports */
  ports: {
    nginx: 80,
    dashboard: 8083,
    kiwix_core: 8081,
    kiwix_nice: 8082,
    tile_proxy: 8087,
    maps_server: 8091,
    game_server: 9000,
    status_service: 9100,
    streamlit_lan: 8501,
    streamlit_ap: 8502
  },

  /* Library Ports (non-standard) */
  libraries: {
    core: 8081,
    nice: 8082,
    ted: 8089,
    stackexchange: 8084,
    libretexts: 8092,
    misc: 8085,
    heavy: 8093
  },

  /* Get current host (LAN or AP) */
  getHost() {
    return window.location.hostname || "127.0.0.1";
  },

  /* Build service URL */
  getServiceUrl(portKey, path = "") {
    const host = this.getHost();
    const port = this.ports[portKey];
    if (!port) {
      console.error(`Unknown port key: ${portKey}`);
      return null;
    }
    return `http://${host}:${port}${path}`;
  },

  /* Build library URL */
  getLibraryUrl(libKey) {
    const host = this.getHost();
    const port = this.libraries[libKey];
    if (!port) {
      console.error(`Unknown library key: ${libKey}`);
      return null;
    }
    return `http://${host}:${port}/`;
  }
};
