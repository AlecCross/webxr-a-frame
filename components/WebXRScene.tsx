// components/WebXRScene.tsx
"use client";

import React, { useEffect, useRef, useState } from 'react';
import Script from 'next/script'; // Цей імпорт має бути коректним після виправлень

// --- Типізація для DaydreamControllerData ---
interface DaydreamControllerData {
  isClickDown: boolean;
  isAppDown: boolean;
  isHomeDown: boolean;
  isVolPlusDown: boolean;
  isVolMinusDown: boolean;
  time: number;
  seq: number;
  xOri: number; // Кутова орієнтація по X (радіани)
  yOri: number; // Кутова орієнтація по Y (радіани)
  zOri: number; // Кутова орієнтація по Z (радіани)
  xAcc: number; // Прискорення по X (м/с^2)
  yAcc: number; // Прискорення по Y (м/с^2)
  zAcc: number; // Прискорення по Z (м/с^2)
  xGyro: number; // Кутова швидкість по X (радіани/с)
  yGyro: number; // Кутова швидкість по Y (радіани/с)
  zGyro: number; // Кутова швидкість по Z (радіани/с)
  xTouch: number; // Координата дотику X (0-1)
  yTouch: number; // Координата дотику Y (0-1)
  prevIsClickDown?: boolean; // Додаткова властивість для відстеження зміни стану кнопки
}
// --- Кінець типізації ---


const WebXRScene: React.FC = () => {
  const sceneContainerRef = useRef<HTMLDivElement>(null);
  const aframeLoaded = useRef(false);
  const [isControllerConnected, setIsControllerConnected] = useState(false);
  const [isDaydreamScriptLoaded, setIsDaydreamScriptLoaded] = useState(false);
  const controllerAframeEntityRef = useRef<HTMLElement | null>(null);

  // Ця функція буде викликана після завантаження A-Frame
  const handleAFrameLoaded = () => {
    if (aframeLoaded.current) return;
    aframeLoaded.current = true;

    const aScene = document.createElement('a-scene');
    aScene.setAttribute('vr-mode-ui', 'enabled: true');
    aScene.setAttribute('ar-mode-ui', 'enabled: false');

    aScene.innerHTML = `
      <a-entity camera look-controls wasd-controls position="0 1.6 0"></a-entity>
      <a-box id="box1" position="-1 0.5 -3" rotation="0 45 0" color="#4CC3D9" shadow class="collidable"></a-box>
      <a-sphere id="sphere1" position="0 1.25 -5" radius="1.25" color="#EF2D5E" shadow class="collidable"></a-sphere>
      <a-cylinder id="cylinder1" position="1 0.75 -3" radius="0.5" height="1.5" color="#FFC65D" shadow class="collidable"></a-cylinder>
      <a-plane position="0 0 -4" rotation="-90 0 0" width="10" height="10" color="#7BC8A4" shadow></a-plane>
      <a-sky color="#ECECEC"></a-sky>
      <a-entity light="type: ambient; color: #BBB"></a-entity>
      <a-entity light="type: directional; color: #FFF; intensity: 0.6" position="-0.5 1 1"></a-entity>
    `;

    if (sceneContainerRef.current) {
      sceneContainerRef.current.appendChild(aScene);
    }
  };

  // Функція для ініціалізації Daydream контролера
  const initializeDaydreamControllerLogic = (aScene: HTMLElement) => {
    if (typeof window.DaydreamController === 'undefined') {
      console.warn('DaydreamController.js ще не завантажено або не доступно (initializeLogic).');
      return;
    }

    if (!navigator.bluetooth) {
      console.warn('Web Bluetooth API не підтримується цим браузером. Daydream контролер не буде працювати.');
      return;
    }

    const daydream = new window.DaydreamController();
    let prevIsClickDown = false;

    daydream.onChange(function (this: DaydreamController, controllerData: DaydreamControllerData) {
      if (!this.connected || !controllerAframeEntityRef.current) return;

      const controllerEntity = controllerAframeEntityRef.current;
      const THREE = window.THREE;

      const xDeg = THREE.MathUtils.radToDeg(controllerData.xOri);
      const yDeg = THREE.MathUtils.radToDeg(controllerData.yOri);
      const zDeg = THREE.MathUtils.radToDeg(controllerData.zOri);

      controllerEntity.setAttribute('rotation', `${xDeg} ${yDeg} ${zDeg}`);


      if (controllerData.isClickDown && !prevIsClickDown) {
        console.log('Кнопка Click (тачпад) натиснута!');
        if (controllerEntity.components && controllerEntity.components.raycaster && controllerEntity.components.raycaster.intersectedEls.length > 0) {
          const targetEl = controllerEntity.components.raycaster.intersectedEls[0];
          if (targetEl.classList.contains('collidable')) {
            console.log('Клік по об\'єкту:', targetEl.id);
            targetEl.setAttribute('material', { color: 'purple' });
            targetEl.setAttribute('position', {
                x: targetEl.object3D.position.x + 0.1,
                y: targetEl.object3D.position.y + 0.1,
                z: targetEl.object3D.position.z
            });
          }
        }
      }
      prevIsClickDown = controllerData.isClickDown;
    });

    aScene.addEventListener('loaded', () => {
      if (controllerAframeEntityRef.current) {
        const raycasterEl = document.createElement('a-entity');
        raycasterEl.setAttribute('raycaster', {
          objects: '.collidable',
          far: 10,
          showLine: true
        });
        raycasterEl.setAttribute('line', {
          color: 'red',
          opacity: 0.7
        });
        controllerAframeEntityRef.current.appendChild(raycasterEl);

        aScene.addEventListener('raycaster-intersected', (event: Event) => {
          const customEvent = event as CustomEvent;
          const intersectedEl = customEvent.detail.el as HTMLElement;
          if (intersectedEl.classList.contains('collidable')) {
            intersectedEl.setAttribute('material', { color: 'green' });
          }
        });

        aScene.addEventListener('raycaster-intersected-cleared', (event: Event) => {
          const customEvent = event as CustomEvent;
          const clearedEl = customEvent.detail.el as HTMLElement;
          if (clearedEl.classList.contains('collidable')) {
            const originalColor = clearedEl.getAttribute('color') || '#4CC3D9';
            clearedEl.setAttribute('material', { color: originalColor });
          }
        });
      }
    });
  };

  // useEffect для ініціалізації A-Frame
  useEffect(() => {
    if (typeof window.AFRAME !== 'undefined' && !aframeLoaded.current) {
      handleAFrameLoaded();
    }
  }, []);

  // useEffect для ручного вставлення скрипта DaydreamController.js
  useEffect(() => {
    let scriptElement: HTMLScriptElement | null = null;
    if (!isDaydreamScriptLoaded && typeof document !== 'undefined') {
      scriptElement = document.createElement('script');
      scriptElement.src = '/js/DaydreamController.js';
      scriptElement.async = true;
      scriptElement.onload = () => {
        console.log('DaydreamController.js завантажено вручну.');
        const checkInterval = setInterval(() => {
          if (typeof window.DaydreamController !== 'undefined') {
            clearInterval(checkInterval);
            setIsDaydreamScriptLoaded(true);
            console.log('window.DaydreamController доступний!');
          }
        }, 50);
      };
      scriptElement.onerror = (error) => {
        console.error('Помилка завантаження DaydreamController.js вручну:', error);
        alert('Помилка завантаження DaydreamController.js. Перевірте шлях та доступ.');
      };
      document.body.appendChild(scriptElement);
    }

    return () => {
      if (scriptElement && document.body.contains(scriptElement)) {
        document.body.removeChild(scriptElement);
      }
    };
  }, [isDaydreamScriptLoaded]);

  // useEffect для ініціалізації DaydreamController після того, як A-Frame завантажено
  // і DaydreamController.js доступний
  useEffect(() => {
    if (aframeLoaded.current && isDaydreamScriptLoaded) {
      const sceneEl = document.querySelector('a-scene') as HTMLElement | null;
      if (sceneEl) {
        initializeDaydreamControllerLogic(sceneEl);
      }
    }
  }, [aframeLoaded.current, isDaydreamScriptLoaded]);

  const handleConnectController = async () => {
    if (!isDaydreamScriptLoaded || typeof window.DaydreamController === 'undefined') {
        alert('Бібліотека DaydreamController.js ще не завантажена. Спробуйте оновити сторінку.');
        return;
    }
    if (!navigator.bluetooth) {
        alert('Ваш браузер не підтримує Web Bluetooth API. Неможливо підключити Daydream контролер.');
        return;
    }

    const daydream = new window.DaydreamController();
    try {
      console.log('Спроба підключення до Daydream контролера...');
      const connected = await daydream.connect();
      if (connected) {
        console.log('Daydream контролер успішно підключений!');
        setIsControllerConnected(true);

        if (!controllerAframeEntityRef.current) {
            const sceneEl = document.querySelector('a-scene');
            if (sceneEl) {
                const controllerEntity = document.createElement('a-entity');
                controllerEntity.setAttribute('id', 'daydream-controller-virtual');
                controllerEntity.setAttribute('geometry', { primitive: 'box', width: 0.05, height: 0.05, depth: 0.2 });
                controllerEntity.setAttribute('material', { color: '#33aaff' });
                controllerEntity.setAttribute('position', '0 1.5 -1');
                sceneEl.appendChild(controllerEntity);
                controllerAframeEntityRef.current = controllerEntity;
            }
        }
      } else {
        console.error('Не вдалося підключитися до Daydream контролера.');
        alert('Не вдалося підключитися до Daydream контролера. Перевірте, чи він увімкнений і не підключений до іншого пристрою.');
      }
    } catch (error: any) {
      console.error('Помилка підключення до Daydream контролера:', error);
      alert('Помилка підключення: ' + error.message);
    }
  };

  return (
    <>
      {/* Завантажуємо A-Frame JS бібліотеку */}
      <Script
        src="https://aframe.io/releases/1.5.0/aframe.min.js"
        strategy="lazyOnload"
        onLoad={handleAFrameLoaded}
      />
      {/* <Script> для DaydreamController.js ВИДАЛЕНО з JSX, тепер він вставляється вручну через useEffect */}

      <div
        ref={sceneContainerRef}
        style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}
      >
        {/* Тут буде вбудована A-Frame сцена */}
      </div>

      {/* Кнопка для підключення контролера */}
      {!isControllerConnected && (
        <button
          onClick={handleConnectController}
          disabled={!isDaydreamScriptLoaded}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            backgroundColor: isDaydreamScriptLoaded ? '#007bff' : '#cccccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isDaydreamScriptLoaded ? 'pointer' : 'not-allowed',
            zIndex: 1000,
            fontSize: '16px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}
        >
          {isDaydreamScriptLoaded ? 'Підключити Daydream Контролер' : 'Завантаження контролера...'}
        </button>
      )}
      {isControllerConnected && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            zIndex: 1000,
            fontSize: '16px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
          }}
        >
          Контролер підключено!
        </div>
      )}
    </>
  );
};

export default WebXRScene;
