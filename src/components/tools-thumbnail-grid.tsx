import { useCallback, useState } from 'react';
import Link from 'next/link';

// Thumbnails live alongside L0013's `snap` output, keyed by item id.
const THUMBS = 'https://storage.googleapis.com/graffiticode.appspot.com/thumbnails';

// A single tile: attempts to load thumbnails/<id>.png. It stays hidden until the image loads
// (so broken images never flash) and removes itself entirely if the image 404s.
function Tile({ item, onResolve }: { item: any; onResolve: (id: string, ok: boolean) => void }) {
  const [state, setState] = useState<'loading' | 'ok' | 'fail'>('loading');
  if (state === 'fail') return null;
  return (
    <Link
      href={`/items/${item.id}`}
      title={item.name || item.id}
      className="mb-2 block break-inside-avoid border border-gray-200 hover:border-gray-400"
      style={{ display: state === 'ok' ? 'block' : 'none' }}
    >
      {/* No loading="lazy": a lazy image inside a display:none tile never enters the viewport,
          so it would never load (and never reveal). display:none still loads eagerly. */}
      <img
        src={`${THUMBS}/${item.id}.png`}
        alt={item.name || item.id}
        className="block w-full"
        onLoad={() => { setState('ok'); onResolve(item.id, true); }}
        onError={() => { setState('fail'); onResolve(item.id, false); }}
      />
    </Link>
  );
}

export default function ToolsThumbnailGrid({ items }: { items?: any[] }) {
  const [results, setResults] = useState<Record<string, boolean>>({});
  const onResolve = useCallback((id: string, ok: boolean) => {
    setResults((r) => (r[id] === ok ? r : { ...r, [id]: ok }));
  }, []);

  if (items === undefined) return null; // items still loading

  const resolved = items.filter((it) => results[it.id] !== undefined).length;
  const okCount = items.filter((it) => results[it.id]).length;
  const showEmpty = items.length === 0 || (resolved === items.length && okCount === 0);

  return (
    <>
      <div className="columns-2 gap-2 md:columns-3">
        {items.map((item) => (
          <Tile key={item.id} item={item} onResolve={onResolve} />
        ))}
      </div>
      {showEmpty && <p className="text-sm text-gray-400">No thumbnails yet.</p>}
    </>
  );
}
