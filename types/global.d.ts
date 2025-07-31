// src/types/global.d.ts
// Цей файл оголошує глобальні змінні, які завантажуються через <script> теги

// Оголошення глобального об'єкта AFRAME
declare const AFRAME: any;

// Оголошення глобального об'єкта THREE
// Після встановлення `@types/three`, TypeScript зможе коректно типізувати THREE.
// Якщо ви все ще бачите помилки, можна тимчасово використовувати `any`
// declare const THREE: any;
// Або, якщо `@types/three` встановлено:

declare const THREE: any;

// declare const THREE: typeof import("three");
// Цей імпорт лише для типізації, не для виконання

// Розширення інтерфейсу Window для DaydreamController
interface Window {
  DaydreamController: typeof import("../public/js/DaydreamController").DaydreamController; // Припускаємо, що DaydreamController.js експортує клас
  AFRAME: any;
  THREE: any; // Залишаємо для сумісності, але основне оголошення вище
}

// Розширення інтерфейсу Navigator для підтримки Web Bluetooth
interface Navigator {
  bluetooth: Bluetooth;
}

// Розширення HTMLElement для A-Frame специфічних властивостей
interface HTMLElement {
  components: {
    raycaster?: {
      intersectedEls: HTMLElement[];
    };
    // Додайте інші компоненти A-Frame, якщо будете до них звертатися
  };
  object3D: THREE.Object3D; // Three.js об'єкт для A-Frame сутностей
  setAttribute(qualifiedName: string, value: string | object): void;
  getAttribute(qualifiedName: string): any;
}

// Додаткова типізація для DaydreamController, якщо вона не експортується як модуль
// Якщо DaydreamController.js не використовує `export class DaydreamController`,
// а просто оголошує глобальний клас, тоді потрібно так:
declare class DaydreamController {
  connected: boolean;
  controller: BluetoothRemoteGATTServer | null;
  onChangeFunc: (data: DaydreamControllerData) => void;

  constructor();
  auth(): Promise<any>;
  connect(): Promise<boolean>;
  disconnect(): Promise<boolean>;
  onChange(callback: (data: DaydreamControllerData) => void): void;
  handleData(event: Event): void;
  isClickDown: boolean;
  isAppDown: boolean;
  isHomeDown: boolean;
  isVolPlusDown: boolean;
  isVolMinusDown: boolean;
  xOri: number;
  yOri: number;
  zOri: number;
  xAcc: number;
  yAcc: number;
  zAcc: number;
  xGyro: number;
  yGyro: number;
  zGyro: number;
  xTouch: number;
  yTouch: number;
}

// Оголошення інтерфейсу для даних, що надходять від контролера (можна перенести сюди з WebXRScene.tsx)
interface DaydreamControllerData {
  isClickDown: boolean;
  isAppDown: boolean;
  isHomeDown: boolean;
  isVolPlusDown: boolean;
  isVolMinusDown: boolean;
  time: number;
  seq: number;
  xOri: number;
  yOri: number;
  zOri: number;
  xAcc: number;
  yAcc: number;
  zAcc: number;
  xGyro: number;
  yGyro: number;
  zGyro: number;
  xTouch: number;
  yTouch: number;
  prevIsClickDown?: boolean;
}
