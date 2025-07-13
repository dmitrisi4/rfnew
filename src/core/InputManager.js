/**
 * Менеджер ввода
 * Обрабатывает клавиатуру, мышь и другие устройства ввода
 */
export class InputManager {
    constructor(canvas, configManager) {
        this.canvas = canvas;
        this.config = configManager;
        
        // Карты состояний
        this.keyMap = {};
        this.mouseMap = {};
        this.mousePosition = { x: 0, y: 0 };
        this.mouseDelta = { x: 0, y: 0 };
        this.wheelDelta = 0;
        
        // Настройки
        this.mouseSensitivity = this.config.get('controls.mouseSensitivity');
        this.invertY = this.config.get('controls.invertY');
        
        // Состояние
        this.isPointerLocked = false;
        this.isEnabled = true;
        
        this.init();
    }
    
    /**
     * Инициализация обработчиков событий
     */
    init() {
        this.setupKeyboardEvents();
        this.setupMouseEvents();
        this.setupPointerLock();
        
        console.log('🎮 Input manager initialized');
    }
    
    /**
     * Настройка событий клавиатуры
     */
    setupKeyboardEvents() {
        document.addEventListener('keydown', (event) => {
            if (!this.isEnabled) return;
            
            const key = event.code;
            this.keyMap[key] = true;
            
            // Отладочное сообщение для игровых клавиш
            if (this.isGameKey(key)) {
                console.log(`🎮 Game key pressed: ${key}`);
                event.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (event) => {
            if (!this.isEnabled) return;
            
            const key = event.code;
            this.keyMap[key] = false;
            
            // Отладочное сообщение для игровых клавиш
            if (this.isGameKey(key)) {
                console.log(`🎮 Game key released: ${key}`);
            }
        });
        
        // Сброс состояния при потере фокуса
        window.addEventListener('blur', () => {
            this.keyMap = {};
        });
    }
    
    /**
     * Настройка событий мыши
     */
    setupMouseEvents() {
        // Нажатие кнопок мыши
        this.canvas.addEventListener('mousedown', (event) => {
            if (!this.isEnabled) return;
            
            this.mouseMap[event.button] = true;
            event.preventDefault();
        });
        
        this.canvas.addEventListener('mouseup', (event) => {
            if (!this.isEnabled) return;
            
            this.mouseMap[event.button] = false;
            event.preventDefault();
        });
        
        // Движение мыши
        this.canvas.addEventListener('mousemove', (event) => {
            if (!this.isEnabled) return;
            
            this.mousePosition.x = event.clientX;
            this.mousePosition.y = event.clientY;
            
            if (this.isPointerLocked) {
                this.mouseDelta.x = event.movementX * this.mouseSensitivity;
                this.mouseDelta.y = event.movementY * this.mouseSensitivity * (this.invertY ? -1 : 1);
            }
        });
        
        // Колесо мыши
        this.canvas.addEventListener('wheel', (event) => {
            if (!this.isEnabled) return;
            
            this.wheelDelta = event.deltaY;
            event.preventDefault();
        });
        
        // Контекстное меню
        this.canvas.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });
    }
    
    /**
     * Настройка блокировки указателя
     */
    setupPointerLock() {
        // Обработчики изменения состояния блокировки
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.canvas;
        });
        
        document.addEventListener('pointerlockerror', () => {
            console.warn('⚠️ Pointer lock failed');
            this.isPointerLocked = false;
        });
    }
    
    /**
     * Проверка, является ли клавиша игровой
     * @param {string} key - Код клавиши
     */
    isGameKey(key) {
        const gameKeys = [
            this.config.get('controls.keyBindings.forward'),
            this.config.get('controls.keyBindings.backward'),
            this.config.get('controls.keyBindings.left'),
            this.config.get('controls.keyBindings.right'),
            this.config.get('controls.keyBindings.jump'),
            this.config.get('controls.keyBindings.crouch'),
            this.config.get('controls.keyBindings.run'),
            'Space', 'Tab', 'Escape'
        ];
        
        return gameKeys.includes(key);
    }
    
    /**
     * Проверка нажатия клавиши
     * @param {string} key - Код клавиши
     */
    isKeyPressed(key) {
        return !!this.keyMap[key];
    }
    
    /**
     * Проверка нажатия кнопки мыши
     * @param {number} button - Номер кнопки (0 - левая, 1 - средняя, 2 - правая)
     */
    isMousePressed(button) {
        return !!this.mouseMap[button];
    }
    
    /**
     * Получение карты нажатых клавиш
     */
    getKeyMap() {
        // Возвращаем только нажатые клавиши (true значения)
        const pressedKeys = {};
        for (const [key, pressed] of Object.entries(this.keyMap)) {
            if (pressed) {
                pressedKeys[key] = true;
            }
        }
        return pressedKeys;
    }
    
    /**
     * Получение позиции мыши
     */
    getMousePosition() {
        return { ...this.mousePosition };
    }
    
    /**
     * Получение дельты движения мыши
     */
    getMouseDelta() {
        const delta = { ...this.mouseDelta };
        this.mouseDelta.x = 0;
        this.mouseDelta.y = 0;
        return delta;
    }
    
    /**
     * Получение дельты колеса мыши
     */
    getWheelDelta() {
        const delta = this.wheelDelta;
        this.wheelDelta = 0;
        return delta;
    }
    
    /**
     * Запрос блокировки указателя
     */
    requestPointerLock() {
        if (!this.isPointerLocked) {
            this.canvas.requestPointerLock();
        }
    }
    
    /**
     * Выход из блокировки указателя
     */
    exitPointerLock() {
        if (this.isPointerLocked) {
            document.exitPointerLock();
        }
    }
    
    /**
     * Переключение блокировки указателя
     */
    togglePointerLock() {
        if (this.isPointerLocked) {
            this.exitPointerLock();
        } else {
            this.requestPointerLock();
        }
    }
    
    /**
     * Проверка состояния блокировки указателя
     */
    getIsPointerLocked() {
        return this.isPointerLocked;
    }
    
    /**
     * Включение/выключение обработки ввода
     * @param {boolean} enabled - Включить обработку
     */
    setEnabled(enabled) {
        this.isEnabled = enabled;
        
        if (!enabled) {
            // Сбрасываем все состояния
            this.keyMap = {};
            this.mouseMap = {};
            this.mouseDelta.x = 0;
            this.mouseDelta.y = 0;
            this.wheelDelta = 0;
        }
    }
    
    /**
     * Проверка включенности обработки ввода
     */
    getIsEnabled() {
        return this.isEnabled;
    }
    
    /**
     * Обновление настроек из конфигурации
     */
    updateFromConfig() {
        this.mouseSensitivity = this.config.get('controls.mouseSensitivity');
        this.invertY = this.config.get('controls.invertY');
    }
    
    /**
     * Добавление пользовательского обработчика клавиш
     * @param {string} key - Код клавиши
     * @param {Function} callback - Функция обратного вызова
     * @param {string} type - Тип события ('keydown' или 'keyup')
     */
    addKeyHandler(key, callback, type = 'keydown') {
        const handler = (event) => {
            if (event.code === key && this.isEnabled) {
                callback(event);
            }
        };
        
        document.addEventListener(type, handler);
        
        // Возвращаем функцию для удаления обработчика
        return () => {
            document.removeEventListener(type, handler);
        };
    }
    
    /**
     * Добавление пользовательского обработчика мыши
     * @param {string} event - Тип события
     * @param {Function} callback - Функция обратного вызова
     */
    addMouseHandler(event, callback) {
        const handler = (e) => {
            if (this.isEnabled) {
                callback(e);
            }
        };
        
        this.canvas.addEventListener(event, handler);
        
        // Возвращаем функцию для удаления обработчика
        return () => {
            this.canvas.removeEventListener(event, handler);
        };
    }
    
    /**
     * Получение информации о состоянии ввода
     */
    getInputState() {
        return {
            keys: { ...this.keyMap },
            mouse: {
                buttons: { ...this.mouseMap },
                position: { ...this.mousePosition },
                delta: { ...this.mouseDelta }
            },
            wheel: this.wheelDelta,
            pointerLocked: this.isPointerLocked,
            enabled: this.isEnabled
        };
    }
    
    /**
     * Сброс всех состояний ввода
     */
    reset() {
        this.keyMap = {};
        this.mouseMap = {};
        this.mousePosition = { x: 0, y: 0 };
        this.mouseDelta = { x: 0, y: 0 };
        this.wheelDelta = 0;
    }
    
    /**
     * Освобождение ресурсов
     */
    dispose() {
        this.setEnabled(false);
        this.exitPointerLock();
        console.log('🗑️ Input manager disposed');
    }
}