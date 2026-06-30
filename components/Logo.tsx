export default function Logo({ className = '', light = false }: { className?: string; light?: boolean }) {
  const textColor = light ? '#ffffff' : '#0f1729';

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 1L25.5 7.5V20.5L14 27L2.5 20.5V7.5L14 1Z" fill="#2563eb" fillOpacity="0.15" stroke="#2563eb" strokeWidth="1.5" />
        <path d="M14 7L19.5 10.2V16.6L14 19.8L8.5 16.6V10.2L14 7Z" fill="#2563eb" />
      </svg>
      <span className="text-xl font-bold tracking-tight" style={{ color: textColor }}>
        ReZoom
      </span>
    </div>
  );
}
