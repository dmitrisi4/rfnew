/**
 * Основной класс движка игры
 * Управляет инициализацией Babylon.js и основным циклом рендеринга
 */
export class GameEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.engine = null;
        this.scene = null;
        this.isRunning = false;
        
        this.init();
    }
    
    /**
     * Инициализация движка
     */
    init() {
        try {
            if (!this.canvas) {
                throw new Error('Canvas element not found');
            }
            
            this.engine = new BABYLON.Engine(this.canvas, true, {
                preserveDrawingBuffer: true,
                stencil: true,
                antialias: true
            });
            
            if (!this.engine) {
                throw new Error('Failed to create Babylon.js engine');
            }
            
            // Обработка изменения размера окна
            window.addEventListener('resize', () => {
                if (this.engine) {
                    this.engine.resize();
                }
            });
            
            console.log('✅ Game Engine initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Game Engine:', error);
            throw error;
        }
    }
    
    /**
     * Установка сцены
     * @param {BABYLON.Scene} scene - Сцена Babylon.js
     */
    setScene(scene) {
        this.scene = scene;
    }
    
    /**
     * Запуск основного цикла рендеринга
     */
    start() {
        if (!this.scene) {
            console.error('❌ Cannot start engine: No scene set');
            return;
        }
        
        this.isRunning = true;
        
        this.engine.runRenderLoop(() => {
            if (this.scene && this.isRunning) {
                this.scene.render();
            }
        });
        
        console.log('🚀 Game Engine started');
    }
    
    /**
     * Остановка движка
     */
    stop() {
        this.isRunning = false;
        console.log('⏹️ Game Engine stopped');
    }
    
    /**
     * Изменение размера движка
     */
    resize() {
        if (this.engine) {
            this.engine.resize();
        }
    }
    
    /**
     * Запуск цикла рендеринга
     */
    runRenderLoop(callback) {
        if (this.engine) {
            this.engine.runRenderLoop(callback);
        }
    }
    
    /**
     * Остановка цикла рендеринга
     */
    stopRenderLoop() {
        if (this.engine) {
            this.engine.stopRenderLoop();
        }
    }
    
    /**
     * Получение экземпляра Babylon.js движка
     */
    getEngine() {
        return this.engine;
    }
    
    /**
     * Получение информации о производительности
     */
    getPerformanceInfo() {
        if (!this.engine) return null;
        
        return {
            fps: this.engine.getFps(),
            deltaTime: this.engine.getDeltaTime(),
            drawCalls: this.scene ? this.scene.getActiveMeshes().length : 0
        };
    }
    
    /**
     * Освобождение ресурсов
     */
    dispose() {
        if (this.scene) {
            this.scene.dispose();
        }
        if (this.engine) {
            this.engine.dispose();
        }
        console.log('🗑️ Game Engine disposed');
    }
}