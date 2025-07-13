/**
 * Класс для управления сценой игры
 * Отвечает за создание и настройку 3D сцены
 */
export class GameScene {
    constructor(engine, configManager = null) {
        this.engine = engine;
        this.configManager = configManager;
        this.scene = null;
        this.scaleFactor = 10;
        
        this.init();
    }
    
    /**
     * Инициализация сцены
     */
    init() {
        if (!this.engine) {
            throw new Error('Engine is required for GameScene initialization');
        }
        
        try {
            this.scene = new BABYLON.Scene(this.engine);
            
            // Включение коллизий
            this.scene.collisionsEnabled = true;
            
            // Включение физического движка
            this.scene.enablePhysics(
                new BABYLON.Vector3(0, -9.81, 0), 
                new BABYLON.CannonJSPlugin()
            );
            
            console.log('🌍 Game Scene initialized');
        } catch (error) {
            console.error('❌ Failed to initialize Game Scene:', error);
            throw error;
        }
    }
    
    /**
     * Создание базового освещения
     */
    createLighting() {
        // Основное освещение
        const light = new BABYLON.HemisphericLight(
            "mainLight", 
            new BABYLON.Vector3(1, 1, 0), 
            this.scene
        );
        light.intensity = 0.7;
        
        // Направленный свет для теней
        const directionalLight = new BABYLON.DirectionalLight(
            "dirLight", 
            new BABYLON.Vector3(-1, -1, -1), 
            this.scene
        );
        directionalLight.intensity = 0.5;
        
        console.log('💡 Lighting created');
        return { hemispheric: light, directional: directionalLight };
    }
    
    /**
     * Создание скайбокса
     */
    createSkybox() {
        const skybox = BABYLON.MeshBuilder.CreateBox(
            "skyBox", 
            { size: 1000.0 * this.scaleFactor }, 
            this.scene
        );
        
        const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", this.scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(
            "https://www.babylonjs-playground.com/textures/skybox", 
            this.scene
        );
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.material = skyboxMaterial;
        
        console.log('🌌 Skybox created');
        return skybox;
    }
    
    /**
     * Загрузка мира из GLB файла
     */
    async loadWorld(path, filename) {
        try {
            const result = await BABYLON.SceneLoader.ImportMeshAsync(
                "", 
                path, 
                filename, 
                this.scene
            );
            
            const worldMeshes = result.meshes;
            
            // Настройка мешей мира
            worldMeshes.forEach((mesh, index) => {
                mesh.checkCollisions = true;
                mesh.scaling.scaleInPlace(this.scaleFactor);
                
                // Позиционирование
                mesh.position.y = 5 * this.scaleFactor;
                
                // Добавление физики
                if (mesh.geometry || mesh.getTotalVertices() > 0) {
                    const mass = index === 0 ? 1 : 0;
                    const impostorType = index === 0 
                        ? BABYLON.PhysicsImpostor.BoxImpostor 
                        : BABYLON.PhysicsImpostor.MeshImpostor;
                    
                    mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
                        mesh, 
                        impostorType, 
                        { mass: mass, restitution: 0.3 }, 
                        this.scene
                    );
                }
            });
            
            console.log(`🏗️ World loaded: ${filename}`);
            return worldMeshes;
        } catch (error) {
            console.error('❌ Failed to load world:', error);
            return [];
        }
    }
    
    /**
     * Настройка модели мира
     * @param {Array} worldMeshes - Массив мешей мира
     * @param {number} scaleFactor - Масштабный фактор
     */
    setupWorldModel(worldMeshes, scaleFactor) {
        if (!worldMeshes || worldMeshes.length === 0) {
            console.warn('⚠️ No world meshes to setup');
            return;
        }

        worldMeshes.forEach((mesh, index) => {
            if (!mesh) return;

            // Включаем коллизии
            mesh.checkCollisions = true;
            
            // Настраиваем физику если еще не настроена и у меша есть геометрия
            if (!mesh.physicsImpostor && mesh.getTotalVertices && mesh.getTotalVertices() > 0) {
                const mass = 0; // Статичные объекты мира
                const impostorType = BABYLON.PhysicsImpostor.MeshImpostor;
                
                try {
                    mesh.physicsImpostor = new BABYLON.PhysicsImpostor(
                        mesh, 
                        impostorType, 
                        { mass: mass, restitution: 0.3, friction: 0.8 }, 
                        this.scene
                    );
                    console.log(`✅ Physics impostor created for mesh ${index}`);
                } catch (error) {
                    console.warn(`⚠️ Failed to create physics impostor for mesh ${index}:`, error);
                }
            } else if (!mesh.getTotalVertices || mesh.getTotalVertices() === 0) {
                console.log(`⚠️ Skipping physics for mesh ${index} - no vertices`);
            }
        });

        console.log(`🏗️ World model setup complete for ${worldMeshes.length} meshes`);
    }

    /**
     * Получение сцены
     */
    getScene() {
        return this.scene;
    }
    
    /**
     * Получение масштабного фактора
     */
    getScaleFactor() {
        return this.scaleFactor;
    }
    
    /**
     * Установка масштабного фактора
     */
    setScaleFactor(factor) {
        this.scaleFactor = factor;
    }
    
    /**
     * Освобождение ресурсов
     */
    dispose() {
        if (this.scene) {
            // Безопасная очистка всех физических объектов
            this.scene.meshes.forEach(mesh => {
                if (mesh.physicsImpostor) {
                    try {
                        mesh.physicsImpostor.dispose();
                        mesh.physicsImpostor = null;
                    } catch (error) {
                        console.warn('⚠️ Error disposing physics impostor:', error);
                    }
                }
            });
            
            this.scene.dispose();
        }
        console.log('🗑️ Game Scene disposed');
    }
}