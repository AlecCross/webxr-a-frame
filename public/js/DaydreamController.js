// public/js/DaydreamController.js

(function() { // Починаємо IIFE

    /**
     * @author mrdoob / http://mrdoob.com/
     * @author crazyh2 / http://github.com/crazyh2
     */

    class DaydreamController {
        constructor() {
            this.connected = false;
            this.controller = null;
            this.onChangeFunc = function() {};
            console.log('DaydreamController: Constructor called.'); // Додав лог
        };

        async auth() {
            var scope = this;
            console.log('DaydreamController: auth() started.'); // Додав лог
            return new Promise(async (resolve, reject) => { // Додав reject для промісу
                try {
                    console.log('DaydreamController: Getting primary service 0xfe55...'); // Додав лог
                    var service = await scope.controller.getPrimaryService( 0xfe55 );
                    console.log('DaydreamController: Got primary service. Getting characteristic 00000003...'); // Додав лог
                    var rollingCodes = await service.getCharacteristic('00000003-1000-1000-8000-00805f9b34fb');
                    console.log('DaydreamController: Got characteristic 00000003. Getting characteristic 00000002...'); // Додав лог
                    var enterCodes = await service.getCharacteristic('00000002-1000-1000-8000-00805f9b34fb');
                    console.log('DaydreamController: Got characteristic 00000002. Reading rolling code...'); // Додав лог
                    var rollingCode = await rollingCodes.readValue();
                    console.log('DaydreamController: Read rolling code. Value:', Array.from(new Uint8Array(rollingCode.buffer))); // Додав лог для значення

                    console.log('DaydreamController: Writing rolling code with response...'); // Додав лог
                    // Цей рядок викликає помилку "GATT operation not supported."
                    var res = await enterCodes.writeValueWithResponse(rollingCode.buffer);
                    console.log('DaydreamController: writeValueWithResponse result:', res); // Додав лог

                    resolve(res);
                } catch (e) {
                    console.error('DaydreamController: Error in auth():', e); // Змінив на console.error
                    reject(e); // Відхиляємо проміс у разі помилки
                }
            });
        };

        async connect() {
            console.log('DaydreamController: connect() started.'); // Додав лог
            if(this.connected !== false) {
                console.log('DaydreamController: Already connected, returning false.'); // Додав лог
                return false;
            }

            try {
                console.log('DaydreamController: Requesting Bluetooth device...'); // Додав лог
                var controller = await navigator.bluetooth.requestDevice({ filters: [{ name: 'Daydream controller' }], optionalServices: [ 0xfe55 ]});
                if(controller == undefined) {
                    console.log('DaydreamController: No device selected or found, returning false.'); // Додав лог
                    return false;
                }
                this.controller = controller.gatt;
                console.log('DaydreamController: Connecting to GATT server...'); // Додав лог
                await this.controller.connect(); // Додав await, щоб чекати підключення
                console.log('DaydreamController: Connected to GATT server. Starting auth...'); // Додав лог

                await this.auth(); // Цей виклик тепер може відхилити проміс

                console.log('DaydreamController: Auth completed. Getting primary service 0xfe55 for notifications...'); // Додав лог
                var service = await this.controller.getPrimaryService( 0xfe55 );
                console.log('DaydreamController: Got primary service for notifications. Getting characteristic 00000001...'); // Додав лог
                var characteristic =  await service.getCharacteristic( '00000001-1000-1000-8000-00805f9b34fb' );
                
                console.log('DaydreamController: Got characteristic 00000001. Adding event listener and starting notifications...'); // Додав лог
                characteristic.addEventListener( 'characteristicvaluechanged', this.handleData.bind(this) );
                characteristic.startNotifications();
                console.log('DaydreamController: Notifications started.'); // Додав лог

                this.connected = true;
                return true;
            } catch (error) {
                console.error('DaydreamController: Error in connect():', error); // Змінив на console.error
                // Якщо помилка виникла на етапі connect(), то this.connected має бути false
                this.connected = false; // Переконаємося, що стан коректний
                return false; // Повертаємо false, оскільки підключення не вдалося
            }
        };

        async disconnect() {
            console.log('DaydreamController: disconnect() started.'); // Додав лог
            if(this.connected !== true) {
                console.log('DaydreamController: Not connected, returning false.'); // Додав лог
                return false;
            }

            this.controller.disconnect();
            console.log('DaydreamController: Disconnected from controller.'); // Додав лог

            this.connected = false;
            return true;
        };

        // Метод onChange для встановлення колбеку
        onChange( callback ) {
            this.onChangeFunc = callback;
        }

        handleData(event) {
            // console.log('DaydreamController: handleData received data.'); // Додав лог
            var data = event.target.value;
        
            this.isClickDown = (data.getUint8(18) & 0x1) > 0;
            this.isAppDown = (data.getUint8(18) & 0x4) > 0;
            this.isHomeDown = (data.getUint8(18) & 0x2) > 0;
            this.isVolPlusDown = (data.getUint8(18) & 0x10) > 0;
            this.isVolMinusDown = (data.getUint8(18) & 0x8) > 0;

            this.time = ((data.getUint8(0) & 0xFF) << 1 | (data.getUint8(1) & 0x80) >> 7);

            this.seq = (data.getUint8(1) & 0x7C) >> 2;

            this.xOri = (data.getUint8(1) & 0x03) << 11 | (data.getUint8(2) & 0xFF) << 3 | (data.getUint8(3) & 0x80) >> 5;
            this.xOri = (this.xOri << 19) >> 19;
            this.xOri *= (2 * Math.PI / 4095.0);

            this.yOri = (data.getUint8(3) & 0x1F) << 8 | (data.getUint8(4) & 0xFF);
            this.yOri = (this.yOri << 19) >> 19;
            this.yOri *= (2 * Math.PI / 4095.0);

            this.zOri = (data.getUint8(5) & 0xFF) << 5 | (data.getUint8(6) & 0xF8) >> 3;
            this.zOri = (this.zOri << 19) >> 19;
            this.zOri *= (2 * Math.PI / 4095.0);

            this.xAcc = (data.getUint8(6) & 0x07) << 10 | (data.getUint8(7) & 0xFF) << 2 | (data.getUint8(8) & 0xC0) >> 6;
            this.xAcc = (this.xAcc << 19) >> 19;
            this.xAcc *= (8 * 9.8 / 4095.0);

            this.yAcc = (data.getUint8(8) & 0x3F) << 7 | (data.getUint8(9) & 0xFE) >>> 1;
            this.yAcc = (this.yAcc << 19) >> 19;
            this.yAcc *= (8 * 9.8 / 4095.0);

            this.zAcc = (data.getUint8(9) & 0x01) << 12 | (data.getUint8(10) & 0xFF) << 4 | (data.getUint8(11) & 0xF0) >> 4;
            this.zAcc = (this.zAcc << 19) >> 19;
            this.zAcc *= (8 * 9.8 / 4095.0);

            this.xGyro = ((data.getUint8(11) & 0x0F) << 9 | (data.getUint8(12) & 0xFF) << 1 | (data.getUint8(13) & 0x80) >> 7);
            this.xGyro = (this.xGyro << 19) >> 19;
            this.xGyro *= (2048 / 180 * Math.PI / 4095.0);

            this.yGyro = ((data.getUint8(13) & 0x7F) << 6 | (data.getUint8(14) & 0xFC) >> 2);
            this.yGyro = (this.yGyro << 19) >> 19;
            this.yGyro *= (2048 / 180 * Math.PI / 4095.0);

            this.zGyro = ((data.getUint8(14) & 0x03) << 11 | (data.getUint8(15) & 0xFF) << 3 | (data.getUint8(16) & 0xE0) >> 5);
            this.zGyro = (this.zGyro << 19) >> 19;
            this.zGyro *= (2048 / 180 * Math.PI / 4095.0);

            this.xTouch = ((data.getUint8(16) & 0x1F) << 3 | (data.getUint8(17) & 0xE0) >> 5) / 255.0;
            this.yTouch = ((data.getUint8(17) & 0x1F) << 3 | (data.getUint8(18) & 0xE0) >> 5) / 255.0;
            
            this.onChangeFunc( {
                isClickDown: this.isClickDown,
                isAppDown: this.isAppDown,
                isHomeDown: this.isHomeDown,
                isVolPlusDown: this.isVolPlusDown,
                isVolMinusDown: this.isVolMinusDown,
                time: this.time,
                seq: this.seq,
                xOri: this.xOri,
                yOri: this.yOri,
                zOri: this.zOri,
                xAcc: this.xAcc,
                yAcc: this.yAcc,
                zAcc: this.zAcc,
                xGyro: this.xGyro,
                yGyro: this.yGyro,
                zGyro: this.zGyro,
                xTouch: this.xTouch,
                yTouch: this.yTouch
            } );
        };
    };

    // Робимо клас доступним глобально
    window.DaydreamController = DaydreamController;
    console.log('DaydreamController: Class defined and assigned to window.'); // Додав лог

})(); // Закінчуємо IIFE
