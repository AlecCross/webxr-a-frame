// src/app/page.tsx
"use client"; // Важливо: цей компонент має бути клієнтським
import dynamic from 'next/dynamic';

// Динамічний імпорт з відключеним SSR, оскільки A-Frame працює лише в браузері
const DynamicWebXRScene = dynamic(() => import('../components/WebXRScene'), {
  ssr: false,
});

export default function HomePage() {
  return (
    <>
      {/* Можливо, ти захочеш додати якийсь заголовок або інструкції,
          які зникнуть, коли користувач увійде у VR-режим. */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', textAlign: 'center', zIndex: 10 }}>
        <h1>Ласкаво просимо до твого WebXR PWA!</h1>
        <p>Натисни кнопку "Enter VR" унизу екрану (або встав телефон у VR-гарнітуру), щоб зануритися.</p>
      </div>
      <DynamicWebXRScene />
    </>
  );
}
