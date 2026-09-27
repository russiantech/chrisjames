// import { useAdSlot, usePublicSettings } from '@/api/hooks';

// interface Props {
//   slotKey: string;
//   className?: string;
//   category?: string;
//   postId?: number;
//   tags?: string[];
// }

// /**
//  * Renders one advert position. Fetching a slot is what books the impression,
//  * so this component must not be memoised across mounts.
//  */
// export function AdSlot({ slotKey, className = '', category, postId, tags }: Props) {
//   const { data: settings } = usePublicSettings();
//   const { data, isLoading } = useAdSlot(slotKey, { category, postId, tags });

//   if (settings?.ads_enabled === false) return null;
//   if (isLoading || !data) return null;

//   const hasCreatives = data.creatives.length > 0;

//   if (!hasCreatives) {
//     if (!data.fallback_html) return null;
//     return (
//       <aside
//         className={`cj-ad cj-ad--empty ${className}`}
//         aria-label="Advertisement space"
//         dangerouslySetInnerHTML={{ __html: data.fallback_html }}
//       />
//     );
//   }

//   return (
//     <aside className={`cj-ad ${className}`} aria-label="Advertisement">
//       <p className="text-uppercase text-muted mb-2" style={{ fontSize: '0.65rem', letterSpacing: '0.08em' }}>
//         Sponsored
//       </p>
//       <div className="d-flex flex-column gap-3">
//         {data.creatives.map((creative) =>
//           creative.creative_type === 'html' && creative.html ? (
//             <div key={creative.id} dangerouslySetInnerHTML={{ __html: creative.html }} />
//           ) : (
//             <a
//               key={creative.id}
//               href={creative.click_url}
//               className="card border shadow-none text-decoration-none cj-transition"
//               target="_blank"
//               rel="noopener sponsored"
//             >
//               {creative.image_url && (
//                 <img
//                   src={creative.image_url}
//                   alt=""
//                   className="card-img-top cj-cover"
//                   loading="lazy"
//                   style={{ maxHeight: 160 }}
//                 />
//               )}
//               <div className="card-body">
//                 {creative.headline && (
//                   <h5 className="h6 text-heading mb-1">{creative.headline}</h5>
//                 )}
//                 {creative.body && (
//                   <p className="text-sm text-muted mb-3 cj-line-clamp-3">{creative.body}</p>
//                 )}
//                 <span className={`btn btn-sm btn-${creative.accent || 'primary'} rounded-pill`}>
//                   {creative.cta_label}
//                 </span>
//               </div>
//             </a>
//           ),
//         )}
//       </div>
//     </aside>
//   );
// }





// v2
import { useAdSlot, usePublicSettings } from '@/api/hooks';

interface Props {
  slotKey: string;
  className?: string;
  category?: string;
  postId?: number;
  tags?: string[];
}

/**
 * Strips any <iframe> whose src resolves to this same origin before we ever
 * dangerouslySetInnerHTML admin-authored ad markup. An ad embedding the site
 * inside itself is never intentional — whatever produced it upstream (a
 * relative src like "/" resolving against this page, a stale placeholder,
 * a copy-paste mistake in the ad admin), the safe move is to drop it here
 * rather than render it.
 */
function stripSelfEmbeddingIframes(html: string): string {
  if (typeof window === 'undefined' || !html.includes('<iframe')) return html;
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    doc.querySelectorAll('iframe').forEach((frame) => {
      const src = frame.getAttribute('src') || '';
      let isSameOrigin = false;
      try {
        isSameOrigin = new URL(src, window.location.href).origin === window.location.origin;
      } catch {
        isSameOrigin = false;
      }
      if (!src || isSameOrigin) frame.remove();
    });
    return doc.body.innerHTML;
  } catch {
    return html;
  }
}

/**
 * Renders one advert position. Fetching a slot is what books the impression,
 * so this component must not be memoised across mounts.
 */
export function AdSlot({ slotKey, className = '', category, postId, tags }: Props) {
  const { data: settings } = usePublicSettings();
  const { data, isLoading } = useAdSlot(slotKey, { category, postId, tags });

  if (settings?.ads_enabled === false) return null;
  if (isLoading || !data) return null;

  const hasCreatives = data.creatives.length > 0;

  if (!hasCreatives) {
    if (!data.fallback_html) return null;
    return (
      <aside
        className={`cj-ad cj-ad--empty ${className}`}
        aria-label="Advertisement space"
        dangerouslySetInnerHTML={{ __html: stripSelfEmbeddingIframes(data.fallback_html) }}
      />
    );
  }

  return (
    <aside className={`cj-ad ${className}`} aria-label="Advertisement">
      <p className="text-uppercase text-muted mb-2" style={{ fontSize: '0.65rem', letterSpacing: '0.08em' }}>
        Sponsored
      </p>
      <div className="d-flex flex-column gap-3">
        {data.creatives.map((creative) =>
          creative.creative_type === 'html' && creative.html ? (
            <div key={creative.id} dangerouslySetInnerHTML={{ __html: stripSelfEmbeddingIframes(creative.html) }} />
          ) : (
            <a
              key={creative.id}
              href={creative.click_url}
              className="card border shadow-none text-decoration-none cj-transition"
              target="_blank"
              rel="noopener sponsored"
            >
              {creative.image_url && (
                <img
                  src={creative.image_url}
                  alt=""
                  className="card-img-top cj-cover"
                  loading="lazy"
                  style={{ maxHeight: 160 }}
                />
              )}
              <div className="card-body">
                {creative.headline && (
                  <h5 className="h6 text-heading mb-1">{creative.headline}</h5>
                )}
                {creative.body && (
                  <p className="text-sm text-muted mb-3 cj-line-clamp-3">{creative.body}</p>
                )}
                <span className={`btn btn-sm btn-${creative.accent || 'primary'} rounded-pill`}>
                  {creative.cta_label}
                </span>
              </div>
            </a>
          ),
        )}
      </div>
    </aside>
  );
}
