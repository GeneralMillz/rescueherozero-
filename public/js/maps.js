// PrepperZero Maps – Michigan via mbtileserver
// CRITICAL FIX: Local glyphs instead of external demotiles.maplibre.org
// LAN-safe tile URL (auto-detects Pi hostname/IP)

document.addEventListener('DOMContentLoaded', () => {

  const tileHost = window.location.hostname;
  const tileURL = `http://${tileHost}:8087/tiles/michigan/{z}/{x}/{y}.pbf`;

  // LOCAL GLYPHS: Serve from /glyphs endpoint instead of external server
  const glyphURL = `http://${tileHost}:8083/glyphs/{fontstack}/{range}.pbf`;

  const map = new maplibregl.Map({
    container: 'map',
    style: {
      version: 8,

      // REQUIRED FOR TEXT LABELS - Now served locally
      glyphs: glyphURL,

      sources: {
        michigan: {
          type: 'vector',
          tiles: [ tileURL ],
          minzoom: 0,
          maxzoom: 14
        }
      },

      layers: [
        {
          id: 'background',
          type: 'background',
          paint: { 'background-color': '#05060a' }
        },
        {
          id: 'landcover',
          type: 'fill',
          source: 'michigan',
          'source-layer': 'landcover',
          paint: { 'fill-color': '#111820' }
        },
        {
          id: 'landuse',
          type: 'fill',
          source: 'michigan',
          'source-layer': 'landuse',
          paint: {
            'fill-color': '#101b10',
            'fill-opacity': 0.4
          }
        },
        {
          id: 'water',
          type: 'fill',
          source: 'michigan',
          'source-layer': 'water',
          paint: { 'fill-color': '#1b3b5f' }
        },
        {
          id: 'boundaries',
          type: 'line',
          source: 'michigan',
          'source-layer': 'boundary',
          paint: {
            'line-color': '#555b7a',
            'line-width': 0.8
          }
        },
        {
          id: 'roads',
          type: 'line',
          source: 'michigan',
          'source-layer': 'transportation',
          paint: {
            'line-color': [
              'match',
              ['get', 'class'],
              'motorway', '#ff7b5c',
              'trunk', '#ffb15c',
              'primary', '#ffd15c',
              'secondary', '#e0e0e0',
              'tertiary', '#b0b0b0',
              '#555555'
            ],
            'line-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              5, 0.4,
              10, 1.2,
              14, 2.4
            ]
          }
        },
        {
          id: 'buildings',
          type: 'fill',
          source: 'michigan',
          'source-layer': 'building',
          paint: {
            'fill-color': '#c0c4d0',
            'fill-opacity': 0.6
          }
        },
        {
          id: 'places',
          type: 'symbol',
          source: 'michigan',
          'source-layer': 'place',
          layout: {
            'text-field': ['get', 'name:latin'],
            'text-size': 11,

            // ? THE FIX: Force MapLibre to use ONE font
            'text-font': ['Open Sans Regular']
          },
          paint: {
            'text-color': '#f5f5f7',
            'text-halo-color': '#05060a',
            'text-halo-width': 1.2
          }
        }
      ]
    },
    center: [-84.5, 44.5],
    zoom: 5
  });

  map.addControl(new maplibregl.NavigationControl(), 'top-right');
});
