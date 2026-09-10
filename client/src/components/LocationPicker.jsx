import { useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { LocateFixed } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Leaflet's default marker icons reference asset paths that break under
// bundlers; point them at the CDN copies instead.
const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const OMAN_CENTER = [21.4735, 55.9754];

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng);
    }
  });
  return null;
}

export default function LocationPicker({ value, onChange }) {
  const [position, setPosition] = useState(value || null);
  const { t } = useLanguage();

  const handlePick = useCallback(
    (latlng) => {
      const next = { lat: Number(latlng.lat.toFixed(5)), lng: Number(latlng.lng.toFixed(5)) };
      setPosition(next);
      onChange?.(next);
    },
    [onChange]
  );

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      handlePick({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-rule">
      <div className="flex items-center justify-between gap-2 bg-canvas px-3 py-2">
        <p className="text-xs text-ink-muted">{t('map.prompt')}</p>
        <button
          type="button"
          onClick={useMyLocation}
          className="flex shrink-0 items-center gap-1 rounded-full bg-navy-700 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-navy-900"
        >
          <LocateFixed size={13} /> {t('map.useMyLocation')}
        </button>
      </div>
      <MapContainer center={position || OMAN_CENTER} zoom={position ? 12 : 6} style={{ height: '280px', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onPick={handlePick} />
        {position && <Marker position={[position.lat, position.lng]} icon={markerIcon} />}
      </MapContainer>
      {position && (
        <p className="bg-white px-3 py-1.5 font-mono text-[11px] text-ink-muted" dir="ltr">
          {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
        </p>
      )}
    </div>
  );
}
