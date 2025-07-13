/**
 * Контроллер камеры
 * Управляет различными режимами камеры и их переключением
 */
export class CameraController {
    constructor(scene, canvas, configManager) {
        this.scene = scene;
        this.canvas = canvas;
        this.config = configManager;
        
        this.cameras = {};
        this.currentCamera = null;
        this.currentMode = 'arcRotate';
        this.target = null;
        
        // Настройки камеры
        this.mouseSensitivity = this.config.get('camera.mouseSensitivity');
        this.zoomSensitivity = this.config.get('camera.zoomSensitivity');
        this.smoothing = this.config.get('camera.smoothing');
        
        // Состояние клавиш для управления камерой
        this.keyState = {
            ArrowLeft: false,
            ArrowRight: false,
            ArrowUp: false,
            ArrowDown: false
        };
        
        this.init();
        this.setupKeyboardControls();
    }
    
    /**
     * Инициализация камер
     */
    init() {
        this.createArcRotateCamera();
        this.createFreeCamera();
        this.createFollowCamera();
        
        this.setActiveCamera('arcRotate');
        
        console.log('📷 Camera controller initialized');
    }
    
    /**
     * Настройка управления камерой с клавиатуры
     */
    setupKeyboardControls() {
        document.addEventListener('keydown', (event) => {
            if (event.code in this.keyState) {
                this.keyState[event.code] = true;
                event.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (event) => {
            if (event.code in this.keyState) {
                this.keyState[event.code] = false;
                event.preventDefault();
            }
        });
        
        // Сброс состояния при потере фокуса
        window.addEventListener('blur', () => {
            Object.keys(this.keyState).forEach(key => {
                this.keyState[key] = false;
            });
        });
    }
    
    /**
     * Создание ArcRotate камеры (орбитальная)
     */
    createArcRotateCamera() {
        const camera = new BABYLON.ArcRotateCamera(
            "arcRotateCamera",
            -Math.PI / 2, // Угол по горизонтали
            Math.PI / 3,  // Угол по вертикали (более пологий)
            15,           // Расстояние (ближе к объекту)
            new BABYLON.Vector3(0, 2, 0), // Цель на высоте игрока
            this.scene
        );
        
        // Настройки управления
        camera.attachControl(this.canvas, true);
        camera.setTarget(new BABYLON.Vector3(0, 2, 0));
        
        // Ограничения
        camera.lowerBetaLimit = 0.1;
        camera.upperBetaLimit = Math.PI / 2;
        camera.lowerRadiusLimit = 3;  // Минимальное расстояние
        camera.upperRadiusLimit = 100; // Максимальное расстояние
        
        // Настройки чувствительности
        camera.angularSensibilityX = 1000 / this.mouseSensitivity;
        camera.angularSensibilityY = 1000 / this.mouseSensitivity;
        camera.wheelPrecision = 50 / this.zoomSensitivity;
        
        // Инерция
        camera.inertia = this.smoothing;
        
        console.log('📷 ArcRotate camera: positioned closer to player level');
        this.cameras.arcRotate = camera;
    }
    
    /**
     * Создание Free камеры (от первого лица)
     */
    createFreeCamera() {
        const camera = new BABYLON.FreeCamera(
            "freeCamera",
            new BABYLON.Vector3(0, 3, -8), // Ближе и на уровне игрока
            this.scene
        );
        
        // Настройки управления
        camera.attachControl(this.canvas, true);
        camera.setTarget(new BABYLON.Vector3(0, 2, 0)); // Смотрим на уровень игрока
        
        // Настройки движения
        camera.speed = this.config.get('camera.moveSpeed');
        camera.angularSensibility = 1000 / this.mouseSensitivity;
        
        // Инерция
        camera.inertia = this.smoothing;
        
        // Коллизии
        camera.checkCollisions = true;
        camera.ellipsoid = new BABYLON.Vector3(1, 1, 1);
        
        console.log('📷 Free camera: positioned at player level');
        this.cameras.free = camera;
    }
    
    /**
     * Создание Follow камеры (следящая за игроком)
     */
    createFollowCamera() {
        const camera = new BABYLON.FollowCamera(
            "followCamera",
            new BABYLON.Vector3(0, 10, -10),
            this.scene
        );
        
        // Настройки следования
        camera.radius = 15;
        camera.heightOffset = 8;
        camera.rotationOffset = 0;
        camera.cameraAcceleration = 0.05;
        camera.maxCameraSpeed = 10;
        
        this.cameras.follow = camera;
    }
    
    /**
     * Установка активной камеры
     * @param {string} mode - Режим камеры ('arcRotate', 'free', 'follow')
     */
    setActiveCamera(mode) {
        if (!this.cameras[mode]) {
            console.warn(`⚠️ Camera mode '${mode}' not found`);
            return;
        }
        
        // Отключаем текущую камеру
        if (this.currentCamera) {
            this.currentCamera.detachControl(this.canvas);
        }
        
        // Устанавливаем новую камеру
        this.currentCamera = this.cameras[mode];
        this.currentMode = mode;
        this.scene.activeCamera = this.currentCamera;
        
        // Включаем управление для новой камеры
        if (mode !== 'follow') {
            this.currentCamera.attachControl(this.canvas, true);
        }
        
        console.log(`📷 Camera switched to ${mode} mode`);
    }
    
    /**
     * Установка цели для камеры
     * @param {BABYLON.Vector3|BABYLON.Mesh} target - Цель для камеры
     */
    setTarget(target) {
        this.target = target;
        
        if (this.currentMode === 'arcRotate') {
            const position = target instanceof BABYLON.Vector3 ? target : target.position;
            this.cameras.arcRotate.setTarget(position);
        } else if (this.currentMode === 'follow' && target instanceof BABYLON.Mesh) {
            this.cameras.follow.lockedTarget = target;
        }
    }
    
    /**
     * Обновление камеры
     * @param {Object} player - Объект игрока
     * @param {number} deltaTime - Время кадра
     * @param {Object} inputManager - Менеджер ввода
     */
    update(player, deltaTime, inputManager = null) {
        if (!player) return;
        
        // Обрабатываем управление стрелками
        this.handleKeyboardInput(deltaTime, inputManager);
        
        const playerPosition = player.getPosition();
        
        switch (this.currentMode) {
            case 'arcRotate':
                this.updateArcRotateCamera(playerPosition);
                break;
            case 'free':
                this.updateFreeCamera(playerPosition);
                break;
            case 'follow':
                this.updateFollowCamera(player);
                break;
        }
    }
    
    /**
     * Обработка ввода с клавиатуры для управления камерой
     * @param {number} deltaTime - Время кадра
     * @param {Object} inputManager - Менеджер ввода
     */
    handleKeyboardInput(deltaTime, inputManager = null) {
        if (!this.currentCamera) return;
        
        const rotationSpeed = 2.0 * deltaTime; // Скорость поворота
        
        // Используем InputManager если доступен, иначе собственный keyState
        const isArrowLeftPressed = inputManager ? inputManager.isKeyPressed('ArrowLeft') : this.keyState.ArrowLeft;
        const isArrowRightPressed = inputManager ? inputManager.isKeyPressed('ArrowRight') : this.keyState.ArrowRight;
        const isArrowUpPressed = inputManager ? inputManager.isKeyPressed('ArrowUp') : this.keyState.ArrowUp;
        const isArrowDownPressed = inputManager ? inputManager.isKeyPressed('ArrowDown') : this.keyState.ArrowDown;
        
        if (this.currentMode === 'arcRotate') {
            const camera = this.cameras.arcRotate;
            
            if (isArrowLeftPressed) {
                camera.alpha -= rotationSpeed;
            }
            if (isArrowRightPressed) {
                camera.alpha += rotationSpeed;
            }
            if (isArrowUpPressed) {
                camera.beta = Math.max(camera.lowerBetaLimit, camera.beta - rotationSpeed);
            }
            if (isArrowDownPressed) {
                camera.beta = Math.min(camera.upperBetaLimit, camera.beta + rotationSpeed);
            }
        } else if (this.currentMode === 'free') {
            const camera = this.cameras.free;
            
            if (isArrowLeftPressed) {
                camera.rotation.y -= rotationSpeed;
            }
            if (isArrowRightPressed) {
                camera.rotation.y += rotationSpeed;
            }
            if (isArrowUpPressed) {
                camera.rotation.x = Math.max(-Math.PI/2, camera.rotation.x - rotationSpeed);
            }
            if (isArrowDownPressed) {
                camera.rotation.x = Math.min(Math.PI/2, camera.rotation.x + rotationSpeed);
            }
        }
    }
    
    /**
     * Обновление орбитальной камеры
     */
    updateArcRotateCamera(playerPosition) {
        // Плавное следование за игроком
        const camera = this.cameras.arcRotate;
        const currentTarget = camera.getTarget();
        const targetPosition = playerPosition.clone();
        
        // Интерполяция к новой позиции
        const lerpFactor = 0.05;
        const newTarget = BABYLON.Vector3.Lerp(currentTarget, targetPosition, lerpFactor);
        camera.setTarget(newTarget);
    }
    
    /**
     * Обновление свободной камеры
     */
    updateFreeCamera(playerPosition) {
        // Можно добавить логику автоматического следования
        // или ограничения движения камеры
    }
    
    /**
     * Обновление следящей камеры
     */
    updateFollowCamera(player) {
        const camera = this.cameras.follow;
        if (!camera.lockedTarget) {
            camera.lockedTarget = player.getMesh();
        }
    }
    
    /**
     * Переключение режима камеры
     */
    toggleCameraMode() {
        const modes = ['arcRotate', 'free', 'follow'];
        const currentIndex = modes.indexOf(this.currentMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        const nextMode = modes[nextIndex];
        
        this.setActiveCamera(nextMode);
        
        // Обновляем цель для новой камеры
        if (this.target) {
            this.setTarget(this.target);
        }
        
        return nextMode;
    }
    
    /**
     * Установка позиции камеры
     * @param {BABYLON.Vector3} position - Новая позиция
     */
    setPosition(position) {
        if (this.currentCamera) {
            this.currentCamera.position.copyFrom(position);
        }
    }
    
    /**
     * Получение текущей камеры
     */
    getCurrentCamera() {
        return this.currentCamera;
    }
    
    /**
     * Получение текущего режима
     */
    getCurrentMode() {
        return this.currentMode;
    }
    
    /**
     * Включение/выключение управления мышью
     * @param {boolean} enabled - Включить управление
     */
    setMouseControl(enabled) {
        if (this.currentCamera && this.currentMode !== 'follow') {
            if (enabled) {
                this.currentCamera.attachControl(this.canvas, true);
            } else {
                this.currentCamera.detachControl(this.canvas);
            }
        }
    }
    
    /**
     * Установка дальнего зума
     * @param {boolean} farZoom - Включить дальний зум
     */
    setFarZoom(farZoom) {
        if (this.currentMode === 'arcRotate') {
            const camera = this.cameras.arcRotate;
            if (farZoom) {
                camera.radius = Math.min(camera.radius * 2, camera.upperRadiusLimit);
            } else {
                camera.radius = Math.max(camera.radius / 2, camera.lowerRadiusLimit);
            }
        }
    }
    
    /**
     * Обновление настроек из конфигурации
     */
    updateFromConfig() {
        this.mouseSensitivity = this.config.get('camera.mouseSensitivity');
        this.zoomSensitivity = this.config.get('camera.zoomSensitivity');
        this.smoothing = this.config.get('camera.smoothing');
        
        // Обновляем настройки всех камер
        Object.values(this.cameras).forEach(camera => {
            if (camera.angularSensibilityX !== undefined) {
                camera.angularSensibilityX = 1000 / this.mouseSensitivity;
                camera.angularSensibilityY = 1000 / this.mouseSensitivity;
            }
            if (camera.angularSensibility !== undefined) {
                camera.angularSensibility = 1000 / this.mouseSensitivity;
            }
            if (camera.wheelPrecision !== undefined) {
                camera.wheelPrecision = 50 / this.zoomSensitivity;
            }
            if (camera.inertia !== undefined) {
                camera.inertia = this.smoothing;
            }
            if (camera.speed !== undefined) {
                camera.speed = this.config.get('camera.moveSpeed');
            }
        });
    }
    
    /**
     * Сброс камеры к начальной позиции
     */
    reset() {
        switch (this.currentMode) {
            case 'arcRotate':
                const arcCamera = this.cameras.arcRotate;
                arcCamera.alpha = -Math.PI / 2;
                arcCamera.beta = Math.PI / 2.5;
                arcCamera.radius = 50;
                arcCamera.setTarget(BABYLON.Vector3.Zero());
                break;
            case 'free':
                const freeCamera = this.cameras.free;
                freeCamera.position = new BABYLON.Vector3(0, 5, -10);
                freeCamera.setTarget(BABYLON.Vector3.Zero());
                break;
            case 'follow':
                // Follow камера сбросится автоматически при установке цели
                break;
        }
    }
    
    /**
     * Освобождение ресурсов
     */
    dispose() {
        Object.values(this.cameras).forEach(camera => {
            camera.dispose();
        });
        console.log('🗑️ Camera controller disposed');
    }
}