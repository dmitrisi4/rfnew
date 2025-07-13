/**
 * Менеджер ресурсов для загрузки и управления ассетами
 * Обеспечивает кэширование и оптимизированную загрузку
 */
export class AssetManager {
    constructor(scene) {
        this.scene = scene;
        this.loadedAssets = new Map();
        this.loadingPromises = new Map();
        this.loadingProgress = new Map();
        
        console.log('📦 Asset Manager initialized');
    }
    
    /**
     * Загрузка 3D модели
     * @param {string} name - Имя ассета для кэширования
     * @param {string} path - Путь к файлу
     * @param {string} filename - Имя файла
     * @param {Object} options - Дополнительные опции
     */
    async loadModel(name, path, filename, options = {}) {
        // Проверяем кэш
        if (this.loadedAssets.has(name)) {
            console.log(`📋 Model '${name}' loaded from cache`);
            return this.loadedAssets.get(name);
        }
        
        // Проверяем, не загружается ли уже
        if (this.loadingPromises.has(name)) {
            console.log(`⏳ Model '${name}' is already loading, waiting...`);
            return await this.loadingPromises.get(name);
        }
        
        // Создаем промис загрузки
        const loadingPromise = this._loadModelInternal(name, path, filename, options);
        this.loadingPromises.set(name, loadingPromise);
        
        try {
            const result = await loadingPromise;
            this.loadedAssets.set(name, result);
            this.loadingPromises.delete(name);
            
            console.log(`✅ Model '${name}' loaded successfully`);
            return result;
        } catch (error) {
            this.loadingPromises.delete(name);
            console.error(`❌ Failed to load model '${name}':`, error);
            throw error;
        }
    }
    
    /**
     * Внутренний метод загрузки модели
     */
    async _loadModelInternal(name, path, filename, options) {
        const result = await BABYLON.SceneLoader.ImportMeshAsync(
            "", 
            path, 
            filename, 
            this.scene,
            (progress) => {
                const percentage = Math.round((progress.loaded / progress.total) * 100);
                this.loadingProgress.set(name, percentage);
                console.log(`📊 Loading '${name}': ${percentage}%`);
            }
        );
        
        // Применяем опции
        if (options.scale) {
            result.meshes.forEach(mesh => {
                mesh.scaling.scaleInPlace(options.scale);
            });
        }
        
        if (options.position) {
            result.meshes.forEach(mesh => {
                mesh.position.copyFrom(options.position);
            });
        }
        
        if (options.enableCollisions) {
            result.meshes.forEach(mesh => {
                mesh.checkCollisions = true;
            });
        }
        
        return result;
    }
    
    /**
     * Загрузка текстуры
     * @param {string} name - Имя текстуры
     * @param {string} url - URL текстуры
     * @param {Object} options - Опции текстуры
     */
    async loadTexture(name, url, options = {}) {
        if (this.loadedAssets.has(name)) {
            return this.loadedAssets.get(name);
        }
        
        try {
            const texture = new BABYLON.Texture(url, this.scene, options.noMipmap, options.invertY);
            
            // Ждем загрузки текстуры
            await new Promise((resolve, reject) => {
                texture.onLoadObservable.add(() => resolve());
                texture.onErrorObservable.add(() => reject(new Error(`Failed to load texture: ${url}`)));
            });
            
            this.loadedAssets.set(name, texture);
            console.log(`🖼️ Texture '${name}' loaded`);
            return texture;
        } catch (error) {
            console.error(`❌ Failed to load texture '${name}':`, error);
            throw error;
        }
    }
    
    /**
     * Загрузка звука
     * @param {string} name - Имя звука
     * @param {string} url - URL звукового файла
     * @param {Object} options - Опции звука
     */
    async loadSound(name, url, options = {}) {
        if (this.loadedAssets.has(name)) {
            return this.loadedAssets.get(name);
        }
        
        try {
            const sound = new BABYLON.Sound(name, url, this.scene, null, options);
            
            // Ждем загрузки звука
            await new Promise((resolve, reject) => {
                sound.onended = () => resolve();
                sound.onerror = () => reject(new Error(`Failed to load sound: ${url}`));
                
                // Таймаут для загрузки
                setTimeout(() => resolve(), 1000);
            });
            
            this.loadedAssets.set(name, sound);
            console.log(`🔊 Sound '${name}' loaded`);
            return sound;
        } catch (error) {
            console.error(`❌ Failed to load sound '${name}':`, error);
            throw error;
        }
    }
    
    /**
     * Получение загруженного ассета
     * @param {string} name - Имя ассета
     */
    getAsset(name) {
        return this.loadedAssets.get(name);
    }
    
    /**
     * Проверка, загружен ли ассет
     * @param {string} name - Имя ассета
     */
    isLoaded(name) {
        return this.loadedAssets.has(name);
    }
    
    /**
     * Получение прогресса загрузки
     * @param {string} name - Имя ассета
     */
    getLoadingProgress(name) {
        return this.loadingProgress.get(name) || 0;
    }
    
    /**
     * Предзагрузка списка ассетов
     * @param {Array} assetList - Список ассетов для загрузки
     */
    async preloadAssets(assetList) {
        console.log(`🚀 Starting preload of ${assetList.length} assets`);
        
        const promises = assetList.map(async (asset) => {
            try {
                switch (asset.type) {
                    case 'model':
                        return await this.loadModel(asset.name, asset.path, asset.filename, asset.options);
                    case 'texture':
                        return await this.loadTexture(asset.name, asset.url, asset.options);
                    case 'sound':
                        return await this.loadSound(asset.name, asset.url, asset.options);
                    default:
                        console.warn(`⚠️ Unknown asset type: ${asset.type}`);
                }
            } catch (error) {
                console.error(`❌ Failed to preload asset '${asset.name}':`, error);
            }
        });
        
        await Promise.allSettled(promises);
        console.log('✅ Asset preloading completed');
    }
    
    /**
     * Освобождение ассета из памяти
     * @param {string} name - Имя ассета
     */
    unloadAsset(name) {
        const asset = this.loadedAssets.get(name);
        if (asset) {
            if (asset.dispose) {
                asset.dispose();
            }
            this.loadedAssets.delete(name);
            console.log(`🗑️ Asset '${name}' unloaded`);
        }
    }
    
    /**
     * Получение статистики загруженных ассетов
     */
    getStats() {
        return {
            loadedCount: this.loadedAssets.size,
            loadingCount: this.loadingPromises.size,
            loadedAssets: Array.from(this.loadedAssets.keys())
        };
    }
    
    /**
     * Освобождение всех ресурсов
     */
    dispose() {
        this.loadedAssets.forEach((asset, name) => {
            this.unloadAsset(name);
        });
        
        this.loadedAssets.clear();
        this.loadingPromises.clear();
        this.loadingProgress.clear();
        
        console.log('🗑️ Asset Manager disposed');
    }
}