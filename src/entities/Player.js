/**
 * Класс игрока
 * Управляет созданием, движением и поведением игрока
 */
export class Player {
    constructor(scene, configManager, scaleFactor = 10) {
        this.scene = scene;
        this.config = configManager;
        this.scaleFactor = scaleFactor;
        
        this.mesh = null;
        this.position = new BABYLON.Vector3(-16, 2, 51);
        this.velocity = new BABYLON.Vector3(0, 0, 0);
        this.verticalVelocity = 0;
        this.isGrounded = false;
        this.isMoving = false;
        
        // Настройки движения
        this.playerSpeed = this.config.get('player.speed') * scaleFactor;
        this.jumpForce = this.config.get('player.jumpForce') * scaleFactor;
        this.gravity = this.config.get('physics.gravity') * scaleFactor;
        
        // Отладочные переменные
        this.f3Pressed = false;
        
        this.init();
    }
    
    /**
     * Инициализация игрока
     */
    init() {
        this.createPlayerMesh();
        this.setupPhysics();
        
        console.log('👤 Player initialized');
    }
    
    /**
     * Создание меша игрока
     */
    createPlayerMesh() {
        // Создаем сферу как представление игрока (уменьшена на 43.3%)
        this.mesh = BABYLON.MeshBuilder.CreateSphere(
            "player", 
            { diameter: 0.08505 * this.scaleFactor, segments: 32 }, 
            this.scene
        );
        
        // Настройка коллизий - уменьшенный эллипсоид на 43.3%
        this.mesh.ellipsoid = new BABYLON.Vector3(
            0.0567 * this.scaleFactor,   // Уменьшено на 43.3% с 0.1
            0.06804 * this.scaleFactor,  // Уменьшено на 43.3% с 0.12
            0.0567 * this.scaleFactor    // Уменьшено на 43.3% с 0.1
        );
        this.mesh.checkCollisions = true;
        
        // Материал игрока
        const playerMaterial = new BABYLON.StandardMaterial("playerMaterial", this.scene);
        playerMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.6, 1.0);
        playerMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        this.mesh.material = playerMaterial;
        
        console.log('🎭 Player mesh created');
    }
    
    /**
     * Настройка физики
     */
    setupPhysics() {
        // Отключаем физическое тело для игрока, используем только коллизии
        // Физическое тело может конфликтовать с moveWithCollisions
        console.log('🔧 Player physics: using collision system only (no physics impostor)');
        
        // Инициализируем отладочные элементы
        this.debugRays = [];
        this.debugEllipsoid = null;
        this.setupDebugVisualization();
    }
    
    /**
     * Настройка визуализации отладки
     */
    setupDebugVisualization() {
        // Создаем визуализацию эллипсоида коллизий (соответствует уменьшенному размеру)
        this.debugEllipsoid = BABYLON.MeshBuilder.CreateSphere(
            "debugEllipsoid", 
            { 
                diameterX: this.mesh.ellipsoid.x * 2,
                diameterY: this.mesh.ellipsoid.y * 2,
                diameterZ: this.mesh.ellipsoid.z * 2
            }, 
            this.scene
        );
        
        const debugMaterial = new BABYLON.StandardMaterial("debugEllipsoidMaterial", this.scene);
        debugMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0);
        debugMaterial.alpha = 0.3;
        debugMaterial.wireframe = true;
        this.debugEllipsoid.material = debugMaterial;
        this.debugEllipsoid.setEnabled(false); // Скрыто по умолчанию
    }
    
    /**
     * Переключение отладочной визуализации
     */
    toggleDebugVisualization(enabled) {
        if (this.debugEllipsoid) {
            this.debugEllipsoid.setEnabled(enabled);
        }
        
        // Очищаем старые лучи
        this.debugRays.forEach(ray => ray.dispose());
        this.debugRays = [];
        
        if (enabled) {
            console.log('🔍 Debug visualization enabled');
        } else {
            console.log('🔍 Debug visualization disabled');
        }
    }
    
    /**
     * Установка позиции игрока
     * @param {BABYLON.Vector3} position - Новая позиция
     */
    setPosition(position) {
        this.position.copyFrom(position);
        this.mesh.position.copyFrom(position);
    }
    
    /**
     * Поиск земли под игроком с множественными лучами
     * @param {Array} worldMeshes - Меши мира для проверки коллизий
     */
    findGround(worldMeshes) {
        // Множественные лучи для более надежного определения земли
        const rays = [
            // Центральный луч
            { offset: new BABYLON.Vector3(0, 0, 0) },
            // Лучи по углам эллипсоида
            { offset: new BABYLON.Vector3(0.05 * this.scaleFactor, 0, 0.05 * this.scaleFactor) },
            { offset: new BABYLON.Vector3(-0.05 * this.scaleFactor, 0, 0.05 * this.scaleFactor) },
            { offset: new BABYLON.Vector3(0.05 * this.scaleFactor, 0, -0.05 * this.scaleFactor) },
            { offset: new BABYLON.Vector3(-0.05 * this.scaleFactor, 0, -0.05 * this.scaleFactor) }
        ];
        
        let bestHit = null;
        let closestDistance = Infinity;
        
        for (const rayData of rays) {
            const rayOrigin = this.mesh.position.add(rayData.offset).subtract(
                new BABYLON.Vector3(0, this.mesh.ellipsoid.y, 0)
            );
            const ray = new BABYLON.Ray(
                rayOrigin, 
                new BABYLON.Vector3(0, -1, 0), 
                20 // Увеличена дальность луча с 10 до 20
            );
            
            const hit = this.scene.pickWithRay(ray, (mesh) => {
                // Если есть меши мира, используем их
                if (worldMeshes && worldMeshes.length > 0) {
                    return worldMeshes.includes(mesh) && mesh.checkCollisions && mesh !== this.mesh;
                }
                // Иначе используем любые меши с коллизиями (включая тестовую плоскость)
                return mesh.checkCollisions && mesh !== this.mesh && mesh.name !== 'skyBox';
            });
            
            if (hit.hit && hit.distance < closestDistance) {
                closestDistance = hit.distance;
                bestHit = hit;
            }
        }
        
        return bestHit || { hit: false };
    }
    
    /**
     * Размещение игрока на земле
     * @param {Array} worldMeshes - Меши мира
     */
    placeOnGround(worldMeshes) {
        console.log(`🔍 Placing player on ground. World meshes count: ${worldMeshes ? worldMeshes.length : 0}`);
        
        if (!worldMeshes || worldMeshes.length === 0) {
            // Если нет мешей мира, размещаем на тестовой плоскости
            const fallbackPosition = new BABYLON.Vector3(-16, 2, 51); // Новая стартовая позиция
            this.setPosition(fallbackPosition);
            this.verticalVelocity = 0;
            console.log('⚠️ No world meshes, placed on test ground');
            return;
        }
        
        const startPosition = new BABYLON.Vector3(
            -16, // Новая стартовая позиция по X
            1000 * this.scaleFactor, 
            51  // Новая стартовая позиция по Z
        );
        
        // Луч сверху вниз для поиска земли
        const groundRay = new BABYLON.Ray(
            startPosition, 
            new BABYLON.Vector3(0, -1, 0), 
            2000 * this.scaleFactor
        );
        
        const groundHit = this.scene.pickWithRay(groundRay, (mesh) => {
            const isWorldMesh = worldMeshes.includes(mesh);
            const hasCollisions = mesh.checkCollisions;
            console.log(`🔍 Checking mesh: ${mesh.name}, isWorldMesh: ${isWorldMesh}, hasCollisions: ${hasCollisions}`);
            return isWorldMesh && hasCollisions;
        });
        
        if (groundHit.hit) {
            const groundPosition = groundHit.pickedPoint.add(
                new BABYLON.Vector3(0, this.mesh.ellipsoid.y + 1, 0)
            );
            this.setPosition(groundPosition);
            this.verticalVelocity = 0;
            console.log(`🎯 Player placed on ground at: ${groundPosition.toString()}`);
        } else {
            // Запасная позиция на тестовой плоскости
            const fallbackPosition = new BABYLON.Vector3(-16, 2, 51); // Новая стартовая позиция
            this.setPosition(fallbackPosition);
            this.verticalVelocity = 0;
            console.log('⚠️ Ground not found in world meshes, using fallback position on test ground');
        }
    }
    
    /**
     * Обновление движения игрока
     * @param {Object} inputMap - Карта нажатых клавиш
     * @param {BABYLON.Camera} camera - Камера для определения направления
     * @param {Array} worldMeshes - Меши мира для коллизий
     * @param {number} deltaTime - Время кадра
     * @param {boolean} flyMode - Режим полета
     */
    update(inputMap, camera, worldMeshes, deltaTime, flyMode = false) {
        // Отладочное сообщение для проверки inputMap
        const pressedKeys = Object.keys(inputMap).filter(key => inputMap[key]);
        if (pressedKeys.length > 0) {
            console.log(`🎯 Player received input:`, pressedKeys);
        }
        
        // Получаем направления камеры
        const cameraForward = camera.getDirection(new BABYLON.Vector3(0, 0, 1));
        const cameraRight = camera.getDirection(new BABYLON.Vector3(1, 0, 0));
        const forward = new BABYLON.Vector3(cameraForward.x, 0, cameraForward.z).normalize();
        const right = new BABYLON.Vector3(cameraRight.x, 0, cameraRight.z).normalize();
        
        // Определяем направление движения
        let moveDirection = BABYLON.Vector3.Zero();
        if (inputMap[this.config.get('controls.keyBindings.forward')]) {
            moveDirection.addInPlace(forward);
        }
        if (inputMap[this.config.get('controls.keyBindings.backward')]) {
            moveDirection.subtractInPlace(forward);
        }
        if (inputMap[this.config.get('controls.keyBindings.left')]) {
            moveDirection.subtractInPlace(right);
        }
        if (inputMap[this.config.get('controls.keyBindings.right')]) {
            moveDirection.addInPlace(right);
        }
        
        // Нормализуем направление движения
        if (moveDirection.lengthSquared() > 0) {
            moveDirection.normalize();
            this.mesh.rotation.y = Math.atan2(moveDirection.x, moveDirection.z);
            this.isMoving = true;
        } else {
            this.isMoving = false;
        }
        
        // Вычисляем горизонтальное движение
        const speed = inputMap[this.config.get('controls.keyBindings.run')] 
            ? this.playerSpeed * 2 
            : this.playerSpeed;
        const horizontalMove = moveDirection.scale(speed * deltaTime);
        
        if (flyMode) {
            this.updateFlyMode(inputMap, horizontalMove, deltaTime);
        } else {
            this.updateNormalMode(inputMap, horizontalMove, worldMeshes, deltaTime);
        }
        
        // Обновляем позицию
        this.position.copyFrom(this.mesh.position);
        
        // Обновляем отладочную визуализацию
        if (this.debugEllipsoid && this.debugEllipsoid.isEnabled()) {
            this.debugEllipsoid.position.copyFrom(this.mesh.position);
        }
        
        // Переключение отладки клавишей F3
        if (inputMap['F3'] && !this.f3Pressed) {
            this.f3Pressed = true;
            const debugEnabled = this.debugEllipsoid ? this.debugEllipsoid.isEnabled() : false;
            this.toggleDebugVisualization(!debugEnabled);
        } else if (!inputMap['F3']) {
            this.f3Pressed = false;
        }
    }
    
    /**
     * Обновление в режиме полета
     */
    updateFlyMode(inputMap, horizontalMove, deltaTime) {
        this.mesh.checkCollisions = false;
        
        let verticalMove = 0;
        if (inputMap[this.config.get('controls.keyBindings.jump')]) {
            verticalMove = this.playerSpeed * deltaTime;
        } else if (inputMap[this.config.get('controls.keyBindings.crouch')]) {
            verticalMove = -this.playerSpeed * deltaTime;
        }
        
        const flyMove = new BABYLON.Vector3(
            horizontalMove.x, 
            verticalMove, 
            horizontalMove.z
        );
        this.mesh.position.addInPlace(flyMove);
        this.verticalVelocity = 0;
    }
    
    /**
     * Обновление в обычном режиме с исправленной системой коллизий
     */
    updateNormalMode(inputMap, horizontalMove, worldMeshes, deltaTime) {
        this.mesh.checkCollisions = true;
        
        // Проверка земли ПЕРЕД применением движения
        const groundHit = this.findGround(worldMeshes);
        const wasGrounded = this.isGrounded;
        
        // Определяем состояние на земле с использованием настроек из конфигурации
         if (groundHit && groundHit.hit) {
             const groundDistance = groundHit.distance;
             const tolerance = this.config.get('player.groundTolerance') * this.scaleFactor;
             
             // Если мы близко к земле и падаем или стоим
             if (groundDistance <= tolerance && this.verticalVelocity <= 0) {
                 this.isGrounded = true;
                 this.verticalVelocity = 0;
                 
                 // Плавная коррекция позиции только при необходимости
                 const targetY = groundHit.pickedPoint.y + this.mesh.ellipsoid.y;
                 const currentY = this.mesh.position.y;
                 const yDifference = Math.abs(targetY - currentY);
                 const minCorrection = 0.05 * this.scaleFactor;
                 const maxCorrection = 0.5 * this.scaleFactor;
                 
                 if (yDifference > minCorrection && yDifference < maxCorrection) {
                     // Плавная интерполяция с настраиваемым фактором сглаживания
                     const smoothingFactor = this.config.get('player.smoothingFactor');
                     this.mesh.position.y = BABYLON.Scalar.Lerp(currentY, targetY, smoothingFactor);
                 }
             } else {
                 this.isGrounded = false;
             }
         } else {
             this.isGrounded = false;
         }
        
        // Применяем гравитацию только если не на земле
        if (!this.isGrounded) {
            this.verticalVelocity += this.gravity * deltaTime;
        }
        
        // Прыжок
        if (inputMap[this.config.get('controls.keyBindings.jump')] && this.isGrounded) {
            this.verticalVelocity = this.jumpForce;
            this.isGrounded = false;
        }
        
        // Общее движение
        const totalMove = new BABYLON.Vector3(
            horizontalMove.x, 
            this.verticalVelocity * deltaTime, 
            horizontalMove.z
        );
        
        // Движение с коллизиями - БЕЗ дополнительной коррекции Y
        this.mesh.moveWithCollisions(totalMove);
        
        // Отладочная информация
        if (!wasGrounded && this.isGrounded) {
            console.log(`🎯 Player landed at Y=${this.mesh.position.y.toFixed(2)}`);
        } else if (this.verticalVelocity < -10) {
            console.log(`⬇️ Player falling fast: Y=${this.mesh.position.y.toFixed(2)}, velocity=${this.verticalVelocity.toFixed(2)}`);
        }
    }
    
    /**
     * Получение позиции игрока
     */
    getPosition() {
        return this.position.clone();
    }
    
    /**
     * Получение меша игрока
     */
    getMesh() {
        return this.mesh;
    }
    
    /**
     * Проверка, движется ли игрок
     */
    getIsMoving() {
        return this.isMoving;
    }
    
    /**
     * Проверка, на земле ли игрок
     */
    getIsGrounded() {
        return this.isGrounded;
    }
    
    /**
     * Обновление настроек из конфигурации
     */
    updateFromConfig() {
        this.playerSpeed = this.config.get('player.speed') * this.scaleFactor;
        this.jumpForce = this.config.get('player.jumpForce') * this.scaleFactor;
        this.gravity = this.config.get('physics.gravity') * this.scaleFactor;
    }
    
    /**
     * Освобождение ресурсов
     */
    dispose() {
        // Очищаем отладочные элементы
        if (this.debugEllipsoid) {
            this.debugEllipsoid.dispose();
            this.debugEllipsoid = null;
        }
        
        this.debugRays.forEach(ray => ray.dispose());
        this.debugRays = [];
        
        if (this.mesh) {
            // Безопасное удаление физического тела
            if (this.mesh.physicsImpostor) {
                this.mesh.physicsImpostor.dispose();
                this.mesh.physicsImpostor = null;
            }
            this.mesh.dispose();
        }
        console.log('🗑️ Player disposed');
    }
}