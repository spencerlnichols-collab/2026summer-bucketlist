import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { ITEMS } from '../data/items';
import { COORDS } from '../data/coords';

export default function MapView({ checks, onToggle, hidden }) {
  const visibleItems = ITEMS.filter(i => !hidden.has(i.id) && COORDS[i.id]);

  return (
    <div style={{ height: '70vh', width: '100%', borderRadius: '16px', overflow: 'hidden' }}>
      <MapContainer
        center={[37.65, -122.35]}
        zoom={9}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {visibleItems.map(item => {
          const checked = !!checks[item.id];
          return (
            <CircleMarker
              key={item.id}
              center={COORDS[item.id]}
              radius={checked ? 9 : 7}
              pathOptions={{
                color: checked ? '#5a8a5a' : '#b84040',
                fillColor: checked ? '#7D9B76' : '#C4614A',
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>
                <div style={{ fontFamily: 'system-ui, sans-serif', minWidth: '160px' }}>
                  <p style={{
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: '#3D1F10',
                    margin: '0 0 6px',
                    lineHeight: 1.3,
                  }}>
                    {item.name}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#A67C60', margin: '0 0 10px' }}>
                    {item.tag}
                  </p>
                  <button
                    onClick={() => onToggle(item.id)}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      backgroundColor: checked ? '#E8D5B7' : '#C4614A',
                      color: checked ? '#7A4030' : 'white',
                    }}
                  >
                    {checked ? '✓ Done' : 'Mark done'}
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
}
