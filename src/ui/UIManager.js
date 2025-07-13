/**
 * Менеджер пользовательского интерфейса
 * Управляет всеми элементами UI с использованием Babylon.js GUI
 */
export class UIManager {
    constructor(scene, configManager) {
        this.scene = scene;
        this.config = configManager;
        
        this.advancedTexture = null;
        this.panels = {};
        this.controls = {};
        this.isVisible = true;
        
        // Состояние UI
        this.activePanel = null;
        this.gameState = 'playing'; // playing, paused, menu
        
        this.init();
    }
    
    /**
     * Инициализация UI системы
     */
    init() {
        // Создаем основную текстуру для GUI
        this.advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        
        this.createMainHUD();
        this.createSettingsPanel();
        this.createDebugPanel();
        this.createControlsHelp();
        this.createPositionPanel();
        
        console.log('🖥️ UI Manager initialized');
    }
    
    /**
     * Создание основного HUD
     */
    createMainHUD() {
        const hudPanel = new BABYLON.GUI.StackPanel();
        hudPanel.name = "hudPanel";
        hudPanel.widthInPixels = 300;
        hudPanel.heightInPixels = 200;
        hudPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        hudPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        hudPanel.paddingTopInPixels = 20;
        hudPanel.paddingLeftInPixels = 20;
        
        // Информация о FPS
        const fpsText = new BABYLON.GUI.TextBlock();
        fpsText.name = "fpsText";
        fpsText.text = "FPS: 60";
        fpsText.color = "white";
        fpsText.fontSize = 16;
        fpsText.heightInPixels = 30;
        fpsText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        
        // Информация о позиции
        const positionText = new BABYLON.GUI.TextBlock();
        positionText.name = "positionText";
        positionText.text = "Position: (0, 0, 0)";
        positionText.color = "white";
        positionText.fontSize = 14;
        positionText.heightInPixels = 25;
        positionText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        
        // Информация о камере
        const cameraText = new BABYLON.GUI.TextBlock();
        cameraText.name = "cameraText";
        cameraText.text = "Camera: ArcRotate";
        cameraText.color = "white";
        cameraText.fontSize = 14;
        cameraText.heightInPixels = 25;
        cameraText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        
        hudPanel.addControl(fpsText);
        hudPanel.addControl(positionText);
        hudPanel.addControl(cameraText);
        
        this.advancedTexture.addControl(hudPanel);
        this.panels.hud = hudPanel;
        this.controls.fpsText = fpsText;
        this.controls.positionText = positionText;
        this.controls.cameraText = cameraText;
    }
    
    /**
     * Создание панели настроек
     */
    createSettingsPanel() {
        // Основная панель настроек
        const settingsPanel = new BABYLON.GUI.Rectangle();
        settingsPanel.name = "settingsPanel";
        settingsPanel.widthInPixels = 400;
        settingsPanel.heightInPixels = 500;
        settingsPanel.cornerRadius = 10;
        settingsPanel.color = "white";
        settingsPanel.thickness = 2;
        settingsPanel.background = "rgba(0, 0, 0, 0.8)";
        settingsPanel.isVisible = false;
        
        // Заголовок
        const title = new BABYLON.GUI.TextBlock();
        title.text = "Settings";
        title.color = "white";
        title.fontSize = 24;
        title.heightInPixels = 40;
        title.topInPixels = -220;
        
        // Контейнер для настроек
        const settingsStack = new BABYLON.GUI.StackPanel();
        settingsStack.widthInPixels = 350;
        settingsStack.heightInPixels = 400;
        
        // Настройка чувствительности мыши
        const mouseSensLabel = new BABYLON.GUI.TextBlock();
        mouseSensLabel.text = "Mouse Sensitivity";
        mouseSensLabel.color = "white";
        mouseSensLabel.fontSize = 16;
        mouseSensLabel.heightInPixels = 30;
        
        const mouseSensSlider = new BABYLON.GUI.Slider();
        mouseSensSlider.minimum = 0.1;
        mouseSensSlider.maximum = 2.0;
        mouseSensSlider.value = this.config.get('player.mouseSensitivity');
        mouseSensSlider.heightInPixels = 30;
        mouseSensSlider.widthInPixels = 300;
        mouseSensSlider.color = "#4CAF50";
        mouseSensSlider.background = "#333";
        
        // Настройка качества графики
        const qualityLabel = new BABYLON.GUI.TextBlock()
        qualityLabel.text = "Graphics Quality";
        qualityLabel.color = "white";
        qualityLabel.fontSize = 16;
        qualityLabel.heightInPixels = 30;
        
        // Создаем простую кнопку вместо несуществующего DropdownMenu
        const qualityButton = BABYLON.GUI.Button.CreateSimpleButton("qualityButton", "High");
        qualityButton.widthInPixels = 200;
        qualityButton.heightInPixels = 30;
        qualityButton.color = "white";
        qualityButton.background = "#333";
        
        // Кнопка закрытия
        const closeButton = BABYLON.GUI.Button.CreateSimpleButton("closeSettings", "Close");
        closeButton.widthInPixels = 100;
        closeButton.heightInPixels = 40;
        closeButton.color = "white";
        closeButton.background = "#f44336";
        closeButton.topInPixels = 200;
        
        // Добавляем элементы
        settingsStack.addControl(mouseSensLabel);
        settingsStack.addControl(mouseSensSlider);
        settingsStack.addControl(qualityLabel);
        settingsStack.addControl(qualityButton);
        
        settingsPanel.addControl(title);
        settingsPanel.addControl(settingsStack);
        settingsPanel.addControl(closeButton);
        
        // Обработчики событий
        mouseSensSlider.onValueChangedObservable.add((value) => {
            this.config.set('player.mouseSensitivity', value);
        });
        
        closeButton.onPointerUpObservable.add(() => {
            this.hideSettingsPanel();
        });
        
        this.advancedTexture.addControl(settingsPanel);
        this.panels.settings = settingsPanel;
        this.controls.mouseSensSlider = mouseSensSlider;
    }
    
    /**
     * Создание панели отладки
     */
    createDebugPanel() {
        const debugPanel = new BABYLON.GUI.StackPanel();
        debugPanel.name = "debugPanel";
        debugPanel.widthInPixels = 250;
        debugPanel.heightInPixels = 300;
        debugPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        debugPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        debugPanel.paddingTopInPixels = 20;
        debugPanel.paddingRightInPixels = 20;
        debugPanel.isVisible = false;
        
        // Заголовок
        const debugTitle = new BABYLON.GUI.TextBlock();
        debugTitle.text = "Debug Info";
        debugTitle.color = "yellow";
        debugTitle.fontSize = 18;
        debugTitle.heightInPixels = 30;
        
        // Информация о производительности
        const performanceText = new BABYLON.GUI.TextBlock();
        performanceText.name = "performanceText";
        performanceText.text = "Draw Calls: 0\nTriangles: 0";
        performanceText.color = "white";
        performanceText.fontSize = 12;
        performanceText.heightInPixels = 50;
        performanceText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        
        // Информация о физике
        const physicsText = new BABYLON.GUI.TextBlock();
        physicsText.name = "physicsText";
        physicsText.text = "Physics: Enabled\nBodies: 0";
        physicsText.color = "white";
        physicsText.fontSize = 12;
        physicsText.heightInPixels = 50;
        physicsText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        
        debugPanel.addControl(debugTitle);
        debugPanel.addControl(performanceText);
        debugPanel.addControl(physicsText);
        
        this.advancedTexture.addControl(debugPanel);
        this.panels.debug = debugPanel;
        this.controls.performanceText = performanceText;
        this.controls.physicsText = physicsText;
    }
    
    /**
     * Создание справки по управлению
     */
    createControlsHelp() {
        const helpPanel = new BABYLON.GUI.Rectangle();
        helpPanel.name = "helpPanel";
        helpPanel.widthInPixels = 300;
        helpPanel.heightInPixels = 400;
        helpPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        helpPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        helpPanel.cornerRadius = 10;
        helpPanel.color = "white";
        helpPanel.thickness = 2;
        helpPanel.background = "rgba(0, 0, 0, 0.9)";
        helpPanel.isVisible = false;
        
        const helpText = new BABYLON.GUI.TextBlock();
        helpText.text = `CONTROLS:

Movement:
W, A, S, D - Move
Space - Jump
Shift - Run
C - Crouch

Camera:
Mouse - Look around
F - Toggle camera mode
T - Toggle mouse control
Y - Toggle far zoom

Other:
Esc - Settings
F1 - Toggle debug
F2 - Toggle help
P - Set position
G - Fly mode
H - Hide UI`;
        helpText.color = "white";
        helpText.fontSize = 14;
        helpText.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_LEFT;
        helpText.textVerticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        helpText.paddingTopInPixels = 20;
        helpText.paddingLeftInPixels = 20;
        
        helpPanel.addControl(helpText);
        this.advancedTexture.addControl(helpPanel);
        this.panels.help = helpPanel;
    }
    
    /**
     * Создание кроссхейра
     */
    createCrosshair() {
        const crosshair = new BABYLON.GUI.Ellipse();
        crosshair.name = "crosshair";
        crosshair.widthInPixels = 4;
        crosshair.heightInPixels = 4;
        crosshair.color = "white";
        crosshair.thickness = 2;
        crosshair.background = "transparent";
        
        this.advancedTexture.addControl(crosshair);
        this.controls.crosshair = crosshair;
    }
    
    /**
     * Создание панели для ручной установки позиции
     */
    createPositionPanel() {
        console.log('🔧 Creating position panel...');
        const positionPanel = new BABYLON.GUI.Rectangle();
        positionPanel.name = "positionPanel";
        positionPanel.widthInPixels = 350;
        positionPanel.heightInPixels = 250;
        positionPanel.cornerRadius = 10;
        positionPanel.color = "white";
        positionPanel.thickness = 2;
        positionPanel.background = "rgba(0, 0, 0, 0.8)";
        positionPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
        positionPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        positionPanel.leftInPixels = 200;
        positionPanel.isVisible = false;
        console.log('📦 Position panel created:', positionPanel);
        
        // Заголовок
        const title = new BABYLON.GUI.TextBlock();
        title.text = "Set Position";
        title.color = "white";
        title.fontSize = 20;
        title.heightInPixels = 30;
        title.topInPixels = -100;
        
        // Контейнер для инпутов
        const inputStack = new BABYLON.GUI.StackPanel();
        inputStack.widthInPixels = 300;
        inputStack.heightInPixels = 150;
        inputStack.topInPixels = -20;
        
        // Инпут для X координаты
        const xLabel = new BABYLON.GUI.TextBlock();
        xLabel.text = "X:";
        xLabel.color = "white";
        xLabel.fontSize = 16;
        xLabel.heightInPixels = 25;
        
        const xInput = new BABYLON.GUI.InputText();
        xInput.widthInPixels = 200;
        xInput.heightInPixels = 30;
        xInput.color = "white";
        xInput.background = "#333";
        xInput.text = "-5";
        xInput.placeholderText = "X coordinate";
        
        // Инпут для Y координаты
        const yLabel = new BABYLON.GUI.TextBlock();
        yLabel.text = "Y:";
        yLabel.color = "white";
        yLabel.fontSize = 16;
        yLabel.heightInPixels = 25;
        
        const yInput = new BABYLON.GUI.InputText();
        yInput.widthInPixels = 200;
        yInput.heightInPixels = 30;
        yInput.color = "white";
        yInput.background = "#333";
        yInput.text = "2";
        yInput.placeholderText = "Y coordinate";
        
        // Инпут для Z координаты
        const zLabel = new BABYLON.GUI.TextBlock();
        zLabel.text = "Z:";
        zLabel.color = "white";
        zLabel.fontSize = 16;
        zLabel.heightInPixels = 25;
        
        const zInput = new BABYLON.GUI.InputText();
        zInput.widthInPixels = 200;
        zInput.heightInPixels = 30;
        zInput.color = "white";
        zInput.background = "#333";
        zInput.text = "0";
        zInput.placeholderText = "Z coordinate";
        
        // Кнопка применения
        const applyButton = BABYLON.GUI.Button.CreateSimpleButton("applyPosition", "Apply Position");
        applyButton.widthInPixels = 150;
        applyButton.heightInPixels = 35;
        applyButton.color = "white";
        applyButton.background = "#4CAF50";
        applyButton.topInPixels = 80;
        
        // Кнопка закрытия
        const closeButton = BABYLON.GUI.Button.CreateSimpleButton("closePosition", "Close");
        closeButton.widthInPixels = 100;
        closeButton.heightInPixels = 35;
        closeButton.color = "white";
        closeButton.background = "#f44336";
        closeButton.topInPixels = 80;
        closeButton.leftInPixels = 80;
        
        // Добавляем элементы в стек
        inputStack.addControl(xLabel);
        inputStack.addControl(xInput);
        inputStack.addControl(yLabel);
        inputStack.addControl(yInput);
        inputStack.addControl(zLabel);
        inputStack.addControl(zInput);
        
        // Добавляем все в панель
        positionPanel.addControl(title);
        positionPanel.addControl(inputStack);
        positionPanel.addControl(applyButton);
        positionPanel.addControl(closeButton);
        
        // Обработчики событий
        applyButton.onPointerUpObservable.add(() => {
            const x = parseFloat(xInput.text) || 0;
            const y = parseFloat(yInput.text) || 0;
            const z = parseFloat(zInput.text) || 0;
            
            // Вызываем событие установки позиции
            if (this.onSetPosition) {
                this.onSetPosition(new BABYLON.Vector3(x, y, z));
            }
            
            this.showNotification(`Position set to (${x}, ${y}, ${z})`);
        });
        
        closeButton.onPointerUpObservable.add(() => {
            this.hidePositionPanel();
        });
        
        this.advancedTexture.addControl(positionPanel);
        this.panels.position = positionPanel;
        this.controls.xInput = xInput;
        this.controls.yInput = yInput;
        this.controls.zInput = zInput;
        console.log('✅ Position panel added to panels object:', this.panels.position);
        console.log('🎮 All panels:', Object.keys(this.panels));
    }
    
    /**
     * Показать панель установки позиции
     */
    showPositionPanel() {
        if (this.panels.position) {
            this.panels.position.isVisible = true;
            this.activePanel = 'position';
        }
    }
    
    /**
     * Скрыть панель установки позиции
     */
    hidePositionPanel() {
        if (this.panels.position) {
            this.panels.position.isVisible = false;
            this.activePanel = null;
        }
    }
    
    /**
     * Переключить панель установки позиции
     */
    togglePositionPanel() {
        console.log('🎯 Toggle position panel called', this.panels.position);
        if (this.panels.position) {
            console.log('📍 Position panel exists, current visibility:', this.panels.position.isVisible);
            if (this.panels.position.isVisible) {
                this.hidePositionPanel();
            } else {
                this.showPositionPanel();
            }
        } else {
            console.error('❌ Position panel not found in panels object');
        }
    }
    
    /**
     * Установить обработчик события установки позиции
     * @param {Function} callback - Функция обратного вызова
     */
    setOnSetPosition(callback) {
        this.onSetPosition = callback;
    }
    
    /**
     * Обновление HUD информации
     * @param {Object} gameData - Данные игры
     */
    updateHUD(gameData) {
        if (!this.isVisible) return;
        
        // Обновляем FPS
        if (this.controls.fpsText && gameData.fps !== undefined) {
            this.controls.fpsText.text = `FPS: ${Math.round(gameData.fps)}`;
        }
        
        // Обновляем позицию игрока
        if (this.controls.positionText && gameData.playerPosition) {
            const pos = gameData.playerPosition;
            this.controls.positionText.text = `Position: (${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)})`;
        }
        
        // Обновляем информацию о камере
        if (this.controls.cameraText && gameData.cameraMode) {
            this.controls.cameraText.text = `Camera: ${gameData.cameraMode}`;
        }
        
        // Обновляем отладочную информацию
        if (this.controls.performanceText && gameData.performance) {
            const perf = gameData.performance;
            this.controls.performanceText.text = `Draw Calls: ${perf.drawCalls || 0}\nTriangles: ${perf.triangles || 0}`;
        }
        
        if (this.controls.physicsText && gameData.physics) {
            const physics = gameData.physics;
            this.controls.physicsText.text = `Physics: ${physics.enabled ? 'Enabled' : 'Disabled'}\nBodies: ${physics.bodies || 0}`;
        }
    }
    
    /**
     * Показать панель настроек
     */
    showSettingsPanel() {
        if (this.panels.settings) {
            this.panels.settings.isVisible = true;
            this.activePanel = 'settings';
            this.gameState = 'paused';
        }
    }
    
    /**
     * Скрыть панель настроек
     */
    hideSettingsPanel() {
        if (this.panels.settings) {
            this.panels.settings.isVisible = false;
            this.activePanel = null;
            this.gameState = 'playing';
        }
    }
    
    /**
     * Переключить панель отладки
     */
    toggleDebugPanel() {
        if (this.panels.debug) {
            this.panels.debug.isVisible = !this.panels.debug.isVisible;
        }
    }
    
    /**
     * Переключить справку по управлению
     */
    toggleHelpPanel() {
        if (this.panels.help) {
            this.panels.help.isVisible = !this.panels.help.isVisible;
        }
    }
    
    /**
     * Показать/скрыть весь UI
     * @param {boolean} visible - Видимость UI
     */
    setVisible(visible) {
        this.isVisible = visible;
        if (this.advancedTexture) {
            this.advancedTexture.rootContainer.isVisible = visible;
        }
    }
    
    /**
     * Переключить видимость UI
     */
    toggleVisibility() {
        this.setVisible(!this.isVisible);
    }
    
    /**
     * Показать уведомление
     * @param {string} message - Текст уведомления
     * @param {number} duration - Длительность показа в миллисекундах
     */
    showNotification(message, duration = 3000) {
        const notification = new BABYLON.GUI.Rectangle();
        notification.widthInPixels = 300;
        notification.heightInPixels = 60;
        notification.cornerRadius = 5;
        notification.color = "white";
        notification.thickness = 1;
        notification.background = "rgba(0, 0, 0, 0.8)";
        notification.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        notification.topInPixels = 100;
        
        const notificationText = new BABYLON.GUI.TextBlock();
        notificationText.text = message;
        notificationText.color = "white";
        notificationText.fontSize = 14;
        
        notification.addControl(notificationText);
        this.advancedTexture.addControl(notification);
        
        // Автоматическое удаление
        setTimeout(() => {
            this.advancedTexture.removeControl(notification);
        }, duration);
    }
    
    /**
     * Получение состояния игры
     */
    getGameState() {
        return this.gameState;
    }
    
    /**
     * Установка состояния игры
     * @param {string} state - Новое состояние
     */
    setGameState(state) {
        this.gameState = state;
    }
    
    /**
     * Проверка, открыта ли какая-либо панель
     */
    isAnyPanelOpen() {
        return this.activePanel !== null || 
               (this.panels.position && this.panels.position.isVisible) ||
               (this.panels.debug && this.panels.debug.isVisible) ||
               (this.panels.help && this.panels.help.isVisible);
    }
    
    /**
     * Закрыть все панели
     */
    closeAllPanels() {
        Object.values(this.panels).forEach(panel => {
            if (panel.name !== 'hudPanel') {
                panel.isVisible = false;
            }
        });
        this.activePanel = null;
        this.gameState = 'playing';
    }
    
    /**
     * Обновление настроек из конфигурации
     */
    updateFromConfig() {
        if (this.controls.mouseSensSlider) {
            this.controls.mouseSensSlider.value = this.config.get('controls.mouseSensitivity');
        }
    }
    
    /**
     * Освобождение ресурсов
     */
    dispose() {
        if (this.advancedTexture) {
            this.advancedTexture.dispose();
        }
        console.log('🗑️ UI Manager disposed');
    }
}