/**
 * Главный игровой класс
 * Объединяет все системы и управляет игровым циклом
 */
import { GameEngine } from './core/Engine.js';
import { GameScene } from './core/Scene.js';
import { AssetManager } from './core/AssetManager.js';
import { ConfigManager } from './core/ConfigManager.js';
import { CameraController } from './core/CameraController.js';
import { InputManager } from './core/InputManager.js';
import { UIManager } from './ui/UIManager.js';
import { Player } from './entities/Player.js';

export class Game {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.canvas = null;
        
        // Основные системы
        this.engine = null;
        this.scene = null;
        this.assetManager = null;
        this.configManager = null;
        this.cameraController = null;
        this.inputManager = null;
        this.uiManager = null;
        
        // Игровые объекты
        this.player = null;
        this.worldMeshes = [];
        
        // Состояние игры
        this.isRunning = false;
        this.isPaused = false;
        this.flyMode = false;
        this.scaleFactor = 10;
        
        // Статистика
        this.stats = {
            fps: 0,
            frameCount: 0,
            lastTime: 0,
            deltaTime: 0
        };
    }
    
    /**
     * Инициализация игры
     */
    async init() {
        try {
            console.log('🎮 Initializing game...');
            
            // Получаем canvas
            this.canvas = document.getElementById(this.canvasId);
            if (!this.canvas) {
                throw new Error(`Canvas with id '${this.canvasId}' not found`);
            }
            
            console.log('🖼️ Canvas found:', {
                width: this.canvas.width,
                height: this.canvas.height,
                clientWidth: this.canvas.clientWidth,
                clientHeight: this.canvas.clientHeight
            });
            
            // Инициализируем системы в правильном порядке
            await this.initSystems();
            await this.loadAssets();
            await this.setupScene();
            this.setupEventHandlers();
            
            console.log('✅ Game initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize game:', error);
            throw error;
        }
    }
    
    /**
     * Создание тестовых объектов для проверки рендеринга
     */
    createTestObjects() {
        const scene = this.scene.getScene();
        
        // Создаем тестовый куб
        const testBox = BABYLON.MeshBuilder.CreateBox(
            "testBox", 
            { size: 0.5 }, 
            scene
        );
        testBox.position.x = -3; // Перемещаем левее
        testBox.position.y = 1;
        
        // Материал для куба
        const boxMaterial = new BABYLON.StandardMaterial("boxMaterial", scene);
        boxMaterial.diffuseColor = new BABYLON.Color3(1, 0, 0); // Красный
        testBox.material = boxMaterial;
        
        // Создаем тестовую плоскость (пол)
        const ground = BABYLON.MeshBuilder.CreateGround(
            "ground", 
            { width: 50, height: 50 }, // Увеличиваем размер
            scene
        );
        
        // Включаем коллизии для тестовой плоскости
        ground.checkCollisions = true;
        ground.position.y = 0;
        
        // НЕ создаем физическое тело для тестовой плоскости
        // Используем только систему коллизий
        
        // Материал для пола
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0, 1, 0); // Зеленый
        groundMaterial.backFaceCulling = false; // Видимость с обеих сторон
        ground.material = groundMaterial;
        
        console.log('🟢 Test ground created: 50x50, collisions enabled, no physics body');
        
        console.log('🧪 Test objects created');
    }
    
    /**
     * Инициализация основных систем
     */
    async initSystems() {
        // Конфигурация (первая)
        this.configManager = new ConfigManager();
        // ConfigManager автоматически загружает настройки в конструкторе
        
        // Движок Babylon.js
        this.engine = new GameEngine(this.canvasId);
        
        // Сцена
        this.scene = new GameScene(this.engine.getEngine(), this.configManager);
        
        // Устанавливаем сцену в движке
        this.engine.setScene(this.scene.getScene());
        
        // Создаем базовое освещение
        this.scene.createLighting();
        
        // Создаем скайбокс
        this.scene.createSkybox();
        
        // Создаем тестовый объект для проверки рендеринга
        this.createTestObjects();
        
        // Менеджер ресурсов
        this.assetManager = new AssetManager(this.scene.getScene());
        
        // Контроллер камеры
        this.cameraController = new CameraController(
            this.scene.getScene(), 
            this.canvas, 
            this.configManager
        );
        
        // Менеджер ввода
        this.inputManager = new InputManager(this.canvas, this.configManager);
        
        // UI менеджер
        this.uiManager = new UIManager(this.scene.getScene(), this.configManager);
        
        console.log('🔧 Core systems initialized');
    }
    
    /**
     * Загрузка ресурсов
     */
    async loadAssets() {
        console.log('📦 Loading assets...');
        
        try {
            // Загружаем основную модель
            const modelPath = './assets/textures/core/hq_bellato.glb';
            console.log(`📦 Attempting to load model from: ${modelPath}`);
            
            const model = await this.assetManager.loadModel('main_model', modelPath);
            
            if (model && model.meshes) {
                this.worldMeshes = model.meshes;
                console.log(`📦 Loaded model with ${model.meshes.length} meshes`);
            } else {
                console.log('📦 No model loaded, continuing with test objects only');
                this.worldMeshes = [];
            }
            
        } catch (error) {
            console.warn('⚠️ Failed to load some assets:', error);
            // Продолжаем без модели
            this.worldMeshes = [];
        }
        
        console.log('📦 Asset loading completed');
    }
    
    /**
     * Настройка сцены
     */
    async setupScene() {
        console.log('🏗️ Setting up scene...');
        
        // Настраиваем модель мира
        if (this.worldMeshes.length > 0) {
            this.scene.setupWorldModel(this.worldMeshes, this.scaleFactor);
        }
        
        // Создаем игрока
        this.player = new Player(
            this.scene.getScene(), 
            this.configManager, 
            this.scaleFactor
        );
        
        // Размещаем игрока на земле
        if (this.worldMeshes.length > 0) {
            this.player.placeOnGround(this.worldMeshes);
        }
        
        // Настраиваем камеру
        if (this.player) {
            this.cameraController.setTarget(this.player.getMesh());
        } else {
            // Если игрока нет, направляем камеру на центр сцены
            this.cameraController.setTarget(new BABYLON.Vector3(0, 0, 0));
        }
        
        console.log('🏗️ Scene setup complete');
    }
    
    /**
     * Настройка обработчиков событий
     */
    setupEventHandlers() {
        // Обработчики клавиш для UI
        this.inputManager.addKeyHandler('Escape', () => {
            if (this.uiManager.isAnyPanelOpen()) {
                this.uiManager.closeAllPanels();
            } else {
                this.uiManager.showSettingsPanel();
            }
        });
        
        this.inputManager.addKeyHandler('F1', () => {
            this.uiManager.toggleDebugPanel();
        });
        
        this.inputManager.addKeyHandler('F2', () => {
            this.uiManager.toggleHelpPanel();
        });
        
        this.inputManager.addKeyHandler('KeyF', () => {
            const newMode = this.cameraController.toggleCameraMode();
            this.uiManager.showNotification(`Camera: ${newMode}`);
        });
        
        this.inputManager.addKeyHandler('KeyT', () => {
            const isLocked = this.inputManager.getIsPointerLocked();
            if (isLocked) {
                this.inputManager.exitPointerLock();
                this.uiManager.showNotification('Mouse control disabled');
            } else {
                this.inputManager.requestPointerLock();
                this.uiManager.showNotification('Mouse control enabled');
            }
        });
        
        this.inputManager.addKeyHandler('KeyY', () => {
            this.cameraController.setFarZoom(!this.cameraController.getCurrentMode().includes('far'));
            this.uiManager.showNotification('Far zoom toggled');
        });
        
        this.inputManager.addKeyHandler('KeyG', () => {
            this.flyMode = !this.flyMode;
            this.uiManager.showNotification(`Fly mode: ${this.flyMode ? 'ON' : 'OFF'}`);
        });
        
        this.inputManager.addKeyHandler('KeyH', () => {
            this.uiManager.toggleVisibility();
        });
        
        this.inputManager.addKeyHandler('KeyP', () => {
            this.uiManager.togglePositionPanel();
        });
        
        // Подключаем обработчик установки позиции
        this.uiManager.setOnSetPosition((position) => {
            if (this.player) {
                this.player.setPosition(position);
            }
        });
        
        // Обработчик изменения размера окна
        window.addEventListener('resize', () => {
            this.engine.resize();
        });
        
        console.log('🎛️ Event handlers setup complete');
    }
    
    /**
     * Запуск игры
     */
    start() {
        if (this.isRunning) {
            console.warn('⚠️ Game is already running');
            return;
        }
        
        this.isRunning = true;
        this.stats.lastTime = performance.now();
        
        console.log('🎬 Starting render loop...');
        
        // Запускаем игровой цикл
        this.engine.runRenderLoop(() => {
            this.update();
            this.render();
        });
        
        console.log('▶️ Game started');
        console.log('🎯 Render loop should be running now');
    }
    
    /**
     * Остановка игры
     */
    stop() {
        if (!this.isRunning) {
            console.warn('⚠️ Game is not running');
            return;
        }
        
        this.isRunning = false;
        this.engine.stopRenderLoop();
        
        console.log('⏹️ Game stopped');
    }
    
    /**
     * Пауза/возобновление игры
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.uiManager.setGameState('paused');
            this.uiManager.showNotification('Game Paused');
        } else {
            this.uiManager.setGameState('playing');
            this.uiManager.showNotification('Game Resumed');
        }
        
        console.log(`⏸️ Game ${this.isPaused ? 'paused' : 'resumed'}`);
    }
    
    /**
     * Обновление игровой логики
     */
    update() {
        if (this.isPaused || this.uiManager.getGameState() === 'paused') {
            return;
        }
        
        const currentTime = performance.now();
        this.stats.deltaTime = (currentTime - this.stats.lastTime) / 1000;
        this.stats.lastTime = currentTime;
        
        // Обновляем FPS
        this.stats.frameCount++;
        if (this.stats.frameCount % 60 === 0) {
            this.stats.fps = 1 / this.stats.deltaTime;
        }
        
        // Обновляем игрока
        if (this.player) {
            const inputMap = this.inputManager.getKeyMap();
            const camera = this.cameraController.getCurrentCamera();
            
            this.player.update(
                inputMap, 
                camera, 
                this.worldMeshes, 
                this.stats.deltaTime, 
                this.flyMode
            );
        }
        
        // Обновляем камеру
        if (this.cameraController) {
            this.cameraController.update(this.player, this.stats.deltaTime, this.inputManager);
        }
        
        // Обновляем UI
        this.updateUI();
    }
    
    /**
     * Обновление UI
     */
    updateUI() {
        const gameData = {
            fps: this.stats.fps,
            playerPosition: this.player ? this.player.getPosition() : null,
            cameraMode: this.cameraController ? this.cameraController.getCurrentMode() : 'unknown',
            performance: {
                drawCalls: this.scene.getScene().getActiveMeshes().length,
                triangles: this.scene.getScene().getTotalVertices()
            },
            physics: {
                enabled: this.configManager.get('physics.enabled'),
                bodies: this.scene.getScene().getPhysicsEngine() ? 
                    this.scene.getScene().getPhysicsEngine().getImpostors().length : 0
            }
        };
        
        this.uiManager.updateHUD(gameData);
    }
    
    /**
     * Рендеринг
     */
    render() {
        // Рендерим сцену
        if (this.scene && this.scene.getScene()) {
            this.scene.getScene().render();
            
            // Логируем только первые несколько кадров
            if (this.stats.frameCount < 5) {
                console.log(`🎨 Frame ${this.stats.frameCount + 1} rendered`);
            }
        } else {
            console.warn('⚠️ Scene not available for rendering');
        }
    }
    
    /**
     * Получение статистики игры
     */
    getStats() {
        return { ...this.stats };
    }
    
    /**
     * Получение состояния игры
     */
    getGameState() {
        return {
            isRunning: this.isRunning,
            isPaused: this.isPaused,
            flyMode: this.flyMode,
            playerPosition: this.player ? this.player.getPosition() : null,
            cameraMode: this.cameraController ? this.cameraController.getCurrentMode() : null
        };
    }
    
    /**
     * Сохранение игры
     */
    save() {
        const saveData = {
            playerPosition: this.player ? this.player.getPosition() : null,
            cameraMode: this.cameraController ? this.cameraController.getCurrentMode() : null,
            flyMode: this.flyMode,
            config: this.configManager.exportConfig(),
            timestamp: Date.now()
        };
        
        localStorage.setItem('game_save', JSON.stringify(saveData));
        this.uiManager.showNotification('Game Saved');
        
        console.log('💾 Game saved');
    }
    
    /**
     * Загрузка игры
     */
    load() {
        try {
            const saveData = JSON.parse(localStorage.getItem('game_save'));
            
            if (saveData) {
                // Восстанавливаем позицию игрока
                if (saveData.playerPosition && this.player) {
                    this.player.setPosition(new BABYLON.Vector3(
                        saveData.playerPosition.x,
                        saveData.playerPosition.y,
                        saveData.playerPosition.z
                    ));
                }
                
                // Восстанавливаем режим камеры
                if (saveData.cameraMode && this.cameraController) {
                    this.cameraController.setActiveCamera(saveData.cameraMode);
                }
                
                // Восстанавливаем настройки
                if (saveData.config && this.configManager) {
                    this.configManager.importConfig(saveData.config);
                    this.updateAllSystemsFromConfig();
                }
                
                // Восстанавливаем режим полета
                this.flyMode = saveData.flyMode || false;
                
                this.uiManager.showNotification('Game Loaded');
                console.log('📁 Game loaded');
            }
        } catch (error) {
            console.error('❌ Failed to load game:', error);
            this.uiManager.showNotification('Failed to load game');
        }
    }
    
    /**
     * Обновление всех систем из конфигурации
     */
    updateAllSystemsFromConfig() {
        if (this.player) this.player.updateFromConfig();
        if (this.cameraController) this.cameraController.updateFromConfig();
        if (this.inputManager) this.inputManager.updateFromConfig();
        if (this.uiManager) this.uiManager.updateFromConfig();
    }
    
    /**
     * Сброс игры к начальному состоянию
     */
    reset() {
        // Сбрасываем позицию игрока
        if (this.player && this.worldMeshes.length > 0) {
            this.player.placeOnGround(this.worldMeshes);
        }
        
        // Сбрасываем камеру
        if (this.cameraController) {
            this.cameraController.reset();
            this.cameraController.setTarget(this.player.getMesh());
        }
        
        // Сбрасываем настройки
        if (this.configManager) {
            this.configManager.reset();
            this.updateAllSystemsFromConfig();
        }
        
        this.flyMode = false;
        this.uiManager.showNotification('Game Reset');
        
        console.log('🔄 Game reset');
    }
    
    /**
     * Освобождение ресурсов
     */
    dispose() {
        console.log('🗑️ Disposing game...');
        
        this.stop();
        
        // Освобождаем все системы
        if (this.player) this.player.dispose();
        if (this.uiManager) this.uiManager.dispose();
        if (this.inputManager) this.inputManager.dispose();
        if (this.cameraController) this.cameraController.dispose();
        if (this.assetManager) this.assetManager.dispose();
        if (this.scene) this.scene.dispose();
        if (this.engine) this.engine.dispose();
        
        console.log('✅ Game disposed');
    }
}