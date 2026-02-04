'use client';

export default function SplineBackground() {
  return (
    <div 
      className="absolute inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
    >
      <iframe
        src="https://my.spline.design/glasswave-6HLEnvJfCRsq1aKT2xqlgme7"
        frameBorder="0"
        width="100%"
        height="100%"
        id="kotomo-spline"
        style={{
          border: 'none',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}
        allow="autoplay"
        loading="eager"
      />
    </div>
  );
}
