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
        this.position = new BABYLON.Vector3(0, 0, 0);
        this.velocity = new BABYLON.Vector3(0, 0, 0);
        this.verticalVelocity = 0;
        this.isGrounded = false;
        this.isMoving = false;
        
        // Настройки движения
        this.playerSpeed = this.config.get('player.speed') * scaleFactor;
        this.jumpForce = this.config.get('player.jumpForce') * scaleFactor;
        this.gravity = this.config.get('physics.gravity') * scaleFactor;
        
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
        // Создаем сферу как представление игрока
        this.mesh = BABYLON.MeshBuilder.CreateSphere(
            "player", 
            { diameter: 0.15 * this.scaleFactor, segments: 32 }, 
            this.scene
        );
        
        // Настройка коллизий
        this.mesh.ellipsoid = new BABYLON.Vector3(
            0.075 * this.scaleFactor, 
            0.09 * this.scaleFactor, 
            0.075 * this.scaleFactor
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
     * Поиск земли под игроком
     * @param {Array} worldMeshes - Меши мира для проверки коллизий
     */
    findGround(worldMeshes) {
        const rayOrigin = this.mesh.position.subtract(
            new BABYLON.Vector3(0, this.mesh.ellipsoid.y, 0)
        );
        const ray = new BABYLON.Ray(
            rayOrigin, 
            new BABYLON.Vector3(0, -1, 0), 
            10 // Увеличиваем дальность луча
        );
        
        const hit = this.scene.pickWithRay(ray, (mesh) => {
            // Если есть меши мира, используем их
            if (worldMeshes && worldMeshes.length > 0) {
                return worldMeshes.includes(mesh) && mesh.checkCollisions && mesh !== this.mesh;
            }
            // Иначе используем любые меши с коллизиями (включая тестовую плоскость)
            return mesh.checkCollisions && mesh !== this.mesh && mesh.name !== 'skyBox';
        });
        
        return hit;
    }
    
    /**
     * Размещение игрока на земле
     * @param {Array} worldMeshes - Меши мира
     */
    placeOnGround(worldMeshes) {
        console.log(`🔍 Placing player on ground. World meshes count: ${worldMeshes ? worldMeshes.length : 0}`);
        
        if (!worldMeshes || worldMeshes.length === 0) {
            // Если нет мешей мира, размещаем на тестовой плоскости
            const fallbackPosition = new BABYLON.Vector3(-5, 2, 0); // Перемещаем левее
            this.setPosition(fallbackPosition);
            this.verticalVelocity = 0;
            console.log('⚠️ No world meshes, placed on test ground');
            return;
        }
        
        const startPosition = new BABYLON.Vector3(
            -5, // Перемещаем левее по X
            1000 * this.scaleFactor, 
            0  // Центр по Z
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
            const fallbackPosition = new BABYLON.Vector3(-5, 2, 0); // Перемещаем левее
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
     * Обновление в обычном режиме
     */
    updateNormalMode(inputMap, horizontalMove, worldMeshes, deltaTime) {
        this.mesh.checkCollisions = true;
        
        // Применяем гравитацию
        this.verticalVelocity += this.gravity * deltaTime;
        
        // Общее движение
        const totalMove = new BABYLON.Vector3(
            horizontalMove.x, 
            this.verticalVelocity * deltaTime, 
            horizontalMove.z
        );
        
        // Сохраняем позицию до движения для отладки
        const positionBefore = this.mesh.position.clone();
        
        // Движение с коллизиями
        this.mesh.moveWithCollisions(totalMove);
        
        // Проверка земли
        const groundHit = this.findGround(worldMeshes);
        
        if (groundHit.hit) {
            this.isGrounded = true;
            
            if (this.verticalVelocity <= 0) {
                // Устанавливаем позицию точно на поверхности
                const newY = groundHit.pickedPoint.y + this.mesh.ellipsoid.y;
                this.mesh.position.y = newY;
                this.verticalVelocity = 0;
                
                // Логирование для отладки
                if (Math.abs(positionBefore.y - this.mesh.position.y) > 0.1) {
                    console.log(`🔧 Ground contact: Y corrected from ${positionBefore.y.toFixed(2)} to ${newY.toFixed(2)}`);
                }
            }
            
            // Прыжок
            if (inputMap[this.config.get('controls.keyBindings.jump')]) {
                this.verticalVelocity = this.jumpForce;
                this.isGrounded = false;
            }
        } else {
            this.isGrounded = false;
            // Логирование падения
            if (this.verticalVelocity < -5) {
                console.log(`⬇️ Player falling: Y=${this.mesh.position.y.toFixed(2)}, velocity=${this.verticalVelocity.toFixed(2)}`);
            }
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