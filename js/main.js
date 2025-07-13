/**
 * Главный файл приложения
 * Инициализирует и запускает игру с новой модульной архитектурой
 */
import { Game } from '../src/Game.js';

// Глобальная переменная для игры
let game = null;

/**
 * Инициализация и запуск игры
 */
async function initGame() {
    try {
        console.log('🚀 Starting game initialization...');
        
        // Создаем экземпляр игры
        game = new Game('renderCanvas');
        
        // Инициализируем игру
        await game.init();
        
        // Запускаем игру
        game.start();
        
        // Настраиваем глобальные обработчики
        setupGlobalHandlers();
        
        console.log('✅ Game started successfully!');
        
    } catch (error) {
        console.error('❌ Failed to start game:', error);
        showErrorMessage('Failed to initialize game: ' + error.message);
    }
}

/**
 * Настройка глобальных обработчиков
 */
function setupGlobalHandlers() {
    // Обработчик закрытия страницы
    window.addEventListener('beforeunload', () => {
        if (game) {
            game.save(); // Автосохранение
            game.dispose();
        }
    });
    
    // Обработчик потери фокуса
    window.addEventListener('blur', () => {
        if (game && game.getGameState().isRunning) {
            game.togglePause();
        }
    });
    
    // Обработчик получения фокуса
    window.addEventListener('focus', () => {
        if (game && game.getGameState().isPaused) {
            // Не возобновляем автоматически, пользователь сам решит
        }
    });
    
    // Обработчик ошибок
    window.addEventListener('error', (event) => {
        console.error('💥 Global error:', event.error);
        const errorMessage = event.error && event.error.message ? event.error.message : 'Unknown error';
        showErrorMessage('An error occurred: ' + errorMessage);
    });
    
    // Обработчик необработанных промисов
    window.addEventListener('unhandledrejection', (event) => {
        console.error('💥 Unhandled promise rejection:', event.reason);
        showErrorMessage('Promise error: ' + event.reason);
    });
}

/**
 * Показать сообщение об ошибке
 * @param {string} message - Сообщение об ошибке
 */
function showErrorMessage(message) {
    // Создаем простое модальное окно для ошибок
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        z-index: 10000;
        max-width: 400px;
        text-align: center;
        font-family: Arial, sans-serif;
    `;
    
    errorDiv.innerHTML = `
        <h3>Error</h3>
        <p>${message}</p>
        <button onclick="this.parentElement.remove()" style="
            background: white;
            color: red;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            cursor: pointer;
            margin-top: 10px;
        ">Close</button>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Автоматическое удаление через 10 секунд
    setTimeout(() => {
        if (errorDiv.parentElement) {
            errorDiv.remove();
        }
    }, 10000);
}

/**
 * Показать экран загрузки
 */
function showLoadingScreen() {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loadingScreen';
    loadingDiv.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #1e3c72, #2a5298);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        color: white;
        font-family: Arial, sans-serif;
    `;
    
    loadingDiv.innerHTML = `
        <div style="text-align: center;">
            <h1 style="margin-bottom: 20px; font-size: 2.5em;">🎮 RF Game</h1>
            <div style="
                width: 50px;
                height: 50px;
                border: 3px solid rgba(255,255,255,0.3);
                border-top: 3px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 20px auto;
            "></div>
            <p style="font-size: 1.2em; margin-top: 20px;">Loading...</p>
            <p style="font-size: 0.9em; opacity: 0.8; margin-top: 10px;">Initializing game systems</p>
        </div>
        <style>
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        </style>
    `;
    
    document.body.appendChild(loadingDiv);
}

/**
 * Скрыть экран загрузки
 */
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.transition = 'opacity 0.5s ease-out';
        setTimeout(() => {
            loadingScreen.remove();
        }, 500);
    }
}

/**
 * Проверка поддержки WebGL
 */
function checkWebGLSupport() {
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        return !!gl;
    } catch (e) {
        return false;
    }
}

/**
 * Проверка системных требований
 */
function checkSystemRequirements() {
    const requirements = {
        webgl: checkWebGLSupport(),
        canvas: !!document.createElement('canvas').getContext,
        localStorage: typeof Storage !== 'undefined',
        es6: typeof Symbol !== 'undefined'
    };
    
    const unsupported = Object.entries(requirements)
        .filter(([key, supported]) => !supported)
        .map(([key]) => key);
    
    if (unsupported.length > 0) {
        throw new Error(`Unsupported features: ${unsupported.join(', ')}. Please update your browser.`);
    }
    
    return true;
}

/**
 * Основная функция запуска
 */
async function main() {
    try {
        // Показываем экран загрузки
        showLoadingScreen();
        
        // Проверяем системные требования
        checkSystemRequirements();
        
        // Ждем загрузки DOM
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        // Небольшая задержка для показа экрана загрузки
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Инициализируем игру
        await initGame();
        
        // Скрываем экран загрузки
        hideLoadingScreen();
        
    } catch (error) {
        hideLoadingScreen();
        console.error('💥 Failed to start application:', error);
        showErrorMessage('Failed to start application: ' + error.message);
    }
}

// Экспортируем функции для глобального доступа
window.gameAPI = {
    getGame: () => game,
    restart: async () => {
        if (game) {
            game.dispose();
        }
        await initGame();
    },
    save: () => {
        if (game) {
            game.save();
        }
    },
    load: () => {
        if (game) {
            game.load();
        }
    },
    reset: () => {
        if (game) {
            game.reset();
        }
    },
    togglePause: () => {
        if (game) {
            game.togglePause();
        }
    },
    getStats: () => {
        return game ? game.getStats() : null;
    },
    getGameState: () => {
        return game ? game.getGameState() : null;
    }
};

// Запускаем приложение
main();