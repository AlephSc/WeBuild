import type { Block, HeroData, TextData, ImageData, ButtonData, GalleryData, ContactData } from '@/lib/blocks';

// Presentational murni — versi terang (site-root). Styling pakai class util nb-* + inline color mint.
const MINT = '#64e6be';
const INK = '#061421';

function Hero({ data }: { data: HeroData }) {
  const words = data.heading.split(' ');
  const first = words[0];
  const rest = words.slice(1).join(' ');
  return (
    <header style={{ maxWidth: '48rem', margin: '0 auto', padding: '2rem 1rem', textAlign: 'center' }}>
      <h1 className="s-hero-title" style={{ fontSize: 'clamp(2rem, 6vw, 3.5rem)', margin: '0 0 1rem' }}>
        <span>{first}</span>
        {rest ? ` ${rest}` : ''}
      </h1>
      {data.subheading && (
        <p style={{ fontSize: '1.1rem', color: '#3a5560', margin: '0 0 1.5rem' }}>{data.subheading}</p>
      )}
      {data.ctaLabel && data.ctaUrl && (
        <a
          href={data.ctaUrl}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '44px',
            background: MINT,
            color: INK,
            border: '2px solid' + ' ' + INK,
            borderRadius: 14,
            padding: '0.75rem 1.5rem',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: `4px 4px 0 ${INK}`,
          }}
        >
          {data.ctaLabel}
        </a>
      )}
    </header>
  );
}

function Text({ data }: { data: TextData }) {
  return (
    <section style={{ maxWidth: '42rem', margin: '0 auto', padding: '1.5rem 1rem' }}>
      {data.heading && <h2 style={{ marginBottom: '0.75rem' }}>{data.heading}</h2>}
      <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{data.body}</p>
    </section>
  );
}

function Image({ data }: { data: ImageData }) {
  return (
    <figure style={{ maxWidth: '42rem', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <img
        src={data.url}
        alt={data.alt}
        style={{ width: '100%', height: 'auto', border: `2px solid ${INK}`, borderRadius: 14 }}
      />
      {data.caption && <figcaption style={{ color: '#3a5560', fontSize: '0.9rem', marginTop: '0.5rem' }}>{data.caption}</figcaption>}
    </figure>
  );
}

function Button({ data }: { data: ButtonData }) {
  return (
    <section style={{ maxWidth: '42rem', margin: '0 auto', padding: '1.5rem 1rem', textAlign: 'center' }}>
      <a
        href={data.url}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '44px',
          background: MINT,
          color: INK,
          border: `2px solid ${INK}`,
          borderRadius: 14,
          padding: '0.75rem 1.5rem',
          fontWeight: 600,
          textDecoration: 'none',
          boxShadow: `4px 4px 0 ${INK}`,
        }}
      >
        {data.label}
      </a>
    </section>
  );
}

function Gallery({ data }: { data: GalleryData }) {
  return (
    <section style={{ maxWidth: '60rem', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {data.images.map((img, i) => (
          <figure key={i} style={{ margin: 0 }}>
            <img
              src={img.url}
              alt={img.alt}
              style={{ width: '100%', height: 'auto', border: `2px solid ${INK}`, borderRadius: 14 }}
            />
          </figure>
        ))}
      </div>
    </section>
  );
}

// ponytail: normalisasi sederhana (strip non-digit, 0/62 prefix); upgrade ke libphonenumber bila perlu.
function waHref(phone: string) {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '62' + digits.slice(1);
  if (!digits.startsWith('62')) digits = '62' + digits;
  return `https://wa.me/${digits}`;
}

function Contact({ data }: { data: ContactData }) {
  return (
    <section style={{ maxWidth: '42rem', margin: '0 auto', padding: '1.5rem 1rem' }}>
      <div
        className="nb-card"
        style={{
          background: '#f7cf76',
          color: INK,
          border: `2px solid ${INK}`,
          borderRadius: 14,
          boxShadow: `4px 4px 0 ${INK}`,
          padding: '1.5rem',
          textAlign: 'center',
        }}
      >
        {data.message && <p style={{ marginTop: 0 }}>{data.message}</p>}
        <a
          href={waHref(data.phone)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '44px',
            background: MINT,
            color: INK,
            border: `2px solid ${INK}`,
            borderRadius: 14,
            padding: '0.75rem 1.5rem',
            fontWeight: 600,
            textDecoration: 'none',
            boxShadow: `4px 4px 0 ${INK}`,
          }}
        >
          Chat WhatsApp
        </a>
      </div>
    </section>
  );
}

export default function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'hero':
      return <Hero data={block.data as HeroData} />;
    case 'text':
      return <Text data={block.data as TextData} />;
    case 'image':
      return <Image data={block.data as ImageData} />;
    case 'button':
      return <Button data={block.data as ButtonData} />;
    case 'gallery':
      return <Gallery data={block.data as GalleryData} />;
    case 'contact':
      return <Contact data={block.data as ContactData} />;
    default:
      return null;
  }
}
