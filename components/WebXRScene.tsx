// src/components/WebXRScene.tsx
"use client"; // Важливо: цей компонент має бути клієнтським

import React, { useEffect, useRef } from 'react';
import Script from 'next/script'; // Використовуємо Next.js Script компонент

const WebXRScene: React.FC = () => {
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const aframeLoaded = useRef(false);

  // Ця функція буде викликана після завантаження A-Frame
  const handleAFrameLoaded = () => {
    if (aframeLoaded.current) return; // Запобігаємо подвійному завантаженню
    aframeLoaded.current = true;

    // Створюємо A-Frame сцену
    const aScene = document.createElement('a-scene');
    aScene.setAttribute('vr-mode-ui', 'enabled: true'); // Дозволяє вхід у VR
    aScene.setAttribute('ar-mode-ui', 'enabled: false'); // Вимикаємо AR-кнопку, якщо не потрібно

    aScene.innerHTML = `
      <a-entity camera look-controls wasd-controls position="0 1.6 0"></a-entity>

      <a-box position="-1 0.5 -3" rotation="0 45 0" color="#4CC3D9" shadow></a-box>

      <a-sphere position="0 1.25 -5" radius="1.25" color="#EF2D5E" shadow></a-sphere>

      <a-cylinder position="1 0.75 -3" radius="0.5" height="1.5" color="#FFC65D" shadow></a-cylinder>

      <a-plane position="0 0 -4" rotation="-90 0 0" width="10" height="10" color="#7BC8A4" shadow></a-plane>

      <a-sky color="#ECECEC"></a-sky>

      <a-entity light="type: ambient; color: #BBB"></a-entity>
      <a-entity light="type: directional; color: #FFF; intensity: 0.6" position="-0.5 1 1"></a-entity>
    `;

    if (sceneContainerRef.current) {
      sceneContainerRef.current.appendChild(aScene);
    }
  };

  useEffect(() => {
    // A-Frame ініціалізується після завантаження скрипту
    // Якщо A-Frame вже завантажено, викликаємо handleAFrameLoaded негайно
    if ((window as any).AFRAME && !aframeLoaded.current) {
      handleAFrameLoaded();
    }
  }, []);

  return (
    <>
      {/* Завантажуємо A-Frame JS бібліотеку. defer ensures it runs after HTML parsing */}
      <Script
        src="https://aframe.io/releases/1.5.0/aframe.min.js"
        strategy="lazyOnload" // Завантажує скрипт після того, як браузер став неактивним
        onLoad={handleAFrameLoaded}
      />
      <div
        ref={sceneContainerRef}
        style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}
      >
        {/* Тут буде вбудована A-Frame сцена */}
      </div>
    </>
  );
};

export default WebXRScene;
