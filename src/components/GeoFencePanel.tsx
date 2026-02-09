import { useState } from "react";
import { MapPin, Plus, Trash2, Navigation } from "lucide-react";
import type { GeoFenceZone } from "@/hooks/useGeoLocation";

interface GeoFencePanelProps {
  zones: GeoFenceZone[];
  location: { lat: number; lng: number } | null;
  locationError: string | null;
  onAddZone: (name: string, lat: number, lng: number, radius: number) => Promise<any>;
  onRemoveZone: (id: string) => Promise<void>;
}

export function GeoFencePanel({ zones, location, locationError, onAddZone, onRemoveZone }: GeoFencePanelProps) {
  const [name, setName] = useState("");
  const [radius, setRadius] = useState(500);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (!location || !name.trim()) return;
    setIsAdding(true);
    await onAddZone(name.trim(), location.lat, location.lng, radius);
    setName("");
    setRadius(500);
    setIsAdding(false);
  };

  return (
    <div className="flex flex-col rounded-lg border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border bg-secondary px-4 py-2">
        <MapPin className="h-3.5 w-3.5 text-primary" />
        <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-primary">
          Geo-Fence Zones
        </h3>
      </div>

      <div className="p-3 space-y-3">
        {/* Current location */}
        <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
          <Navigation className="h-3 w-3" />
          {location ? (
            <span>{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>
          ) : (
            <span>{locationError || "Getting location..."}</span>
          )}
        </div>

        {/* Add zone */}
        <div className="space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Zone name (e.g., Village Border)"
            className="w-full rounded border border-border bg-secondary px-3 py-1.5 font-mono text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              min={50}
              max={10000}
              className="w-24 rounded border border-border bg-secondary px-2 py-1.5 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
            />
            <span className="font-mono text-[10px] text-muted-foreground">meters</span>
            <button
              onClick={handleAdd}
              disabled={!location || !name.trim() || isAdding}
              className="ml-auto flex items-center gap-1 rounded bg-primary px-3 py-1.5 font-mono text-xs font-bold text-primary-foreground disabled:opacity-40"
            >
              <Plus className="h-3 w-3" /> ADD
            </button>
          </div>
        </div>

        {/* Zone list */}
        <div className="max-h-32 space-y-1 overflow-y-auto">
          {zones.length === 0 ? (
            <p className="py-2 text-center font-mono text-[10px] text-muted-foreground">
              No zones — alerts trigger everywhere
            </p>
          ) : (
            zones.map((zone) => (
              <div key={zone.id} className="flex items-center justify-between rounded bg-secondary px-3 py-1.5 font-mono text-xs text-foreground">
                <span>{zone.name} ({zone.radius_meters}m)</span>
                <button onClick={() => onRemoveZone(zone.id)} className="text-muted-foreground hover:text-danger">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
