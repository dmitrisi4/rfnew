/**
 * Менеджер конфигурации игры
 * Управляет настройками графики, управления и игровой механики
 */
export class ConfigManager {
    constructor() {
        this.config = this.getDefaultConfig();
        this.loadFromStorage();
        
        console.log('⚙️ Config Manager initialized');
    }
    
    /**
     * Получение конфигурации по умолчанию
     */
    getDefaultConfig() {
        return {
            // Настройки графики
            graphics: {
                quality: 'high', // low, medium, high, ultra
                antialias: true,
                shadows: true,
                postProcessing: true,
                particleCount: 1000,
                renderScale: 1.0,
                maxFPS: 60,
                vsync: true
            },
            
            // Настройки физики
            physics: {
                enabled: true,
                gravity: -9.81,
                timeStep: 1/60,
                iterations: 10,
                collisionMargin: 0.01
            },
            
            // Настройки игрока
            player: {
                speed: 0.3,
                jumpForce: 0.2,
                mouseSensitivity: 1.0,
                invertY: false,
                autoRun: false
            },
            
            // Настройки камеры
            camera: {
                fov: 75,
                nearPlane: 0.1,
                farPlane: 1000,
                smoothing: 0.1,
                zoomSpeed: 1.0,
                mouseSensitivity: 1.0,
                zoomSensitivity: 1.0,
                moveSpeed: 0.5
            },
            
            // Настройки звука
            audio: {
                masterVolume: 1.0,
                musicVolume: 0.8,
                sfxVolume: 1.0,
                enabled: true,
                spatialAudio: true
            },
            
            // Настройки управления
            controls: {
                keyBindings: {
                    forward: 'KeyW',
                    backward: 'KeyS',
                    left: 'KeyA',
                    right: 'KeyD',
                    jump: 'Space',
                    run: 'ShiftLeft',
                    crouch: 'ControlLeft',
                    interact: 'KeyE',
                    inventory: 'Tab',
                    menu: 'Escape'
                },
                mouseSensitivity: 1.0,
                invertY: false,
                teleportOnClick: false,
                gamepadEnabled: true,
                gamepadDeadzone: 0.1
            },
            
            // Настройки интерфейса
            ui: {
                scale: 1.0,
                showFPS: false,
                showDebugInfo: false,
                language: 'en',
                theme: 'dark'
            },
            
            // Настройки разработки
            debug: {
                enabled: false,
                showWireframe: false,
                showBoundingBoxes: false,
                showPhysicsImpostors: false,
                logLevel: 'info' // debug, info, warn, error
            }
        };
    }
    
    /**
     * Получение значения конфигурации
     * @param {string} path - Путь к настройке (например, 'graphics.quality')
     */
    get(path) {
        const keys = path.split('.');
        let value = this.config;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                console.warn(`⚠️ Config path not found: ${path}`);
                return undefined;
            }
        }
        
        return value;
    }
    
    /**
     * Установка значения конфигурации
     * @param {string} path - Путь к настройке
     * @param {*} value - Новое значение
     */
    set(path, value) {
        const keys = path.split('.');
        let current = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!(key in current) || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        const lastKey = keys[keys.length - 1];
        const oldValue = current[lastKey];
        current[lastKey] = value;
        
        console.log(`⚙️ Config updated: ${path} = ${value} (was: ${oldValue})`);
        
        // Сохраняем в localStorage
        this.saveToStorage();
        
        // Уведомляем о изменении
        this.notifyChange(path, value, oldValue);
    }
    
    /**
     * Получение всей конфигурации
     */
    getAll() {
        return JSON.parse(JSON.stringify(this.config));
    }
    
    /**
     * Установка качества графики
     * @param {string} quality - Уровень качества (low, medium, high, ultra)
     */
    setGraphicsQuality(quality) {
        const qualitySettings = {
            low: {
                antialias: false,
                shadows: false,
                postProcessing: false,
                particleCount: 100,
                renderScale: 0.75
            },
            medium: {
                antialias: true,
                shadows: false,
                postProcessing: false,
                particleCount: 500,
                renderScale: 0.9
            },
            high: {
                antialias: true,
                shadows: true,
                postProcessing: true,
                particleCount: 1000,
                renderScale: 1.0
            },
            ultra: {
                antialias: true,
                shadows: true,
                postProcessing: true,
                particleCount: 2000,
                renderScale: 1.2
            }
        };
        
        if (quality in qualitySettings) {
            const settings = qualitySettings[quality];
            this.set('graphics.quality', quality);
            
            Object.keys(settings).forEach(key => {
                this.set(`graphics.${key}`, settings[key]);
            });
            
            console.log(`🎮 Graphics quality set to: ${quality}`);
        } else {
            console.warn(`⚠️ Unknown graphics quality: ${quality}`);
        }
    }
    
    /**
     * Сброс настроек к значениям по умолчанию
     */
    resetToDefaults() {
        this.config = this.getDefaultConfig();
        this.saveToStorage();
        console.log('🔄 Config reset to defaults');
    }
    
    /**
     * Загрузка конфигурации из localStorage
     */
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('gameConfig');
            if (stored) {
                const parsedConfig = JSON.parse(stored);
                this.config = this.mergeConfigs(this.config, parsedConfig);
                console.log('📥 Config loaded from storage');
            }
        } catch (error) {
            console.warn('⚠️ Failed to load config from storage:', error);
        }
    }
    
    /**
     * Сохранение конфигурации в localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem('gameConfig', JSON.stringify(this.config));
            console.log('💾 Config saved to storage');
        } catch (error) {
            console.warn('⚠️ Failed to save config to storage:', error);
        }
    }
    
    /**
     * Слияние конфигураций
     */
    mergeConfigs(defaultConfig, userConfig) {
        const merged = JSON.parse(JSON.stringify(defaultConfig));
        
        function merge(target, source) {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {};
                    merge(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        }
        
        merge(merged, userConfig);
        return merged;
    }
    
    /**
     * Подписка на изменения конфигурации
     */
    onChange(callback) {
        if (!this.changeListeners) {
            this.changeListeners = [];
        }
        this.changeListeners.push(callback);
    }
    
    /**
     * Уведомление об изменении конфигурации
     */
    notifyChange(path, newValue, oldValue) {
        if (this.changeListeners) {
            this.changeListeners.forEach(callback => {
                try {
                    callback(path, newValue, oldValue);
                } catch (error) {
                    console.error('❌ Error in config change listener:', error);
                }
            });
        }
    }
    
    /**
     * Валидация конфигурации
     */
    validate() {
        const errors = [];
        
        // Проверка качества графики
        const quality = this.get('graphics.quality');
        if (!['low', 'medium', 'high', 'ultra'].includes(quality)) {
            errors.push(`Invalid graphics quality: ${quality}`);
        }
        
        // Проверка FPS
        const maxFPS = this.get('graphics.maxFPS');
        if (typeof maxFPS !== 'number' || maxFPS < 30 || maxFPS > 240) {
            errors.push(`Invalid maxFPS: ${maxFPS}`);
        }
        
        // Проверка громкости
        const volumes = ['audio.masterVolume', 'audio.musicVolume', 'audio.sfxVolume'];
        volumes.forEach(path => {
            const volume = this.get(path);
            if (typeof volume !== 'number' || volume < 0 || volume > 1) {
                errors.push(`Invalid volume ${path}: ${volume}`);
            }
        });
        
        if (errors.length > 0) {
            console.warn('⚠️ Config validation errors:', errors);
            return false;
        }
        
        return true;
    }
    
    /**
     * Экспорт конфигурации в файл
     */
    exportConfig() {
        const configString = JSON.stringify(this.config, null, 2);
        const blob = new Blob([configString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'game-config.json';
        a.click();
        
        URL.revokeObjectURL(url);
        console.log('📤 Config exported');
    }
    
    /**
     * Импорт конфигурации из файла
     */
    async importConfig(file) {
        try {
            const text = await file.text();
            const importedConfig = JSON.parse(text);
            
            this.config = this.mergeConfigs(this.getDefaultConfig(), importedConfig);
            this.saveToStorage();
            
            console.log('📥 Config imported successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to import config:', error);
            return false;
        }
    }
}