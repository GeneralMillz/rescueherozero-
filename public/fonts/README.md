# MapLibre Glyph Files

This directory stores font glyph files (.pbf) for offline map rendering.

## Why This Matters

MapLibre GL JS needs glyph files to render text labels on maps. Previously, PrepperZero was fetching these from `https://demotiles.maplibre.org`, which:

1. **Fails in AP mode** (weak radio)
2. **Fails offline** (no internet)
3. **Slows maps** (external CDN latency)

By serving glyphs locally, maps work 100% offline.

## Directory Structure

```
fonts/
├── Noto_Sans_Regular/
│   ├── 0-255.pbf
│   ├── 256-511.pbf
│   ├── 512-767.pbf
│   ├── 768-1023.pbf
│   └── ...
├── Noto_Sans_Bold/
│   ├── 0-255.pbf
│   └── ...
└── README.md (this file)
```

## How to Populate Glyph Files

### Option 1: Use Mapbox Tools (Recommended for Raspberry Pi)

1. Install Mapbox's `glyph-pbf-patch` tool:
   ```bash
   npm install -g @mapbox/glyph-pbf-patch
   ```

2. Download or generate glyph files:
   ```bash
   # Fetch from Mapbox CDN (requires API key)
   curl https://fonts.mapbox.com/v1/fonts/{fontstack}/{start}-{end}.pbf \
     -o public/fonts/{fontstack}/{start}-{end}.pbf
   ```

### Option 2: Use PreGenerated Glyph Sets

Download pre-built glyph .pbf files for common fonts from:
- https://github.com/maplibre/demotiles/tree/main/fonts
- https://github.com/klokantech/tileserver-gl/tree/master/data/fonts

### Option 3: Minimal Set for Offline Maps

For a lightweight offline solution, create minimal glyph sets for ASCII characters (0-255):

```bash
# For each font you want to support:
mkdir -p public/fonts/Noto_Sans_Regular
# Place 0-255.pbf in that directory
```

## Current Status

⚠️ **Placeholder Implementation**: The `/api/glyphs` endpoint is ready, but font files are not yet populated.

To test:
1. Populate the fonts directory with .pbf files as described above
2. Restart the dashboard: `sudo systemctl restart prepperzero`
3. Visit http://192.168.1.184:8083/maps.html
4. Map labels should appear without external requests

## Testing

After populating fonts, verify in browser DevTools:
1. Open Network tab
2. Load maps.html
3. Look for `api/glyphs/` requests
4. Confirm they return 200 (not 404 or external redirects)

## Troubleshooting

**Maps show without labels:**
- Glyph files not found (404s in Network tab)
- MapLibre gracefully falls back when glyphs unavailable

**High latency on maps page:**
- Glyph files missing, MapLibre waiting for timeout
- Populate fonts directory as described above

**Font not supported:**
- Add new font directory: `mkdir public/fonts/{FontName}`
- Place .pbf files for that font

## Font Stack Format

MapLibre uses "font stacks" with format: `"Font Name, Fallback Font"`

When requesting glyphs, underscores replace spaces:
- `Noto Sans` → `Noto_Sans`
- `Noto Sans, Arial` → `Noto_Sans,Arial` → stored as `Noto_Sans` (first font only)

## References

- [MapLibre GL JS Font Stacks](https://maplibre.org/maplibre-style-spec/references/#font)
- [OpenMapTiles Glyph Format](https://openmaptiles.org/docs/style-to-source/fonts/)
- [Glyph PBF Format](https://github.com/mapbox/glyph-pbf-patch)
