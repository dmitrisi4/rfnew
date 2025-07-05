window.addEventListener('DOMContentLoaded', async function(){
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);

    const createScene = async function () {
        const scene = new BABYLON.Scene(engine);
        scene.collisionsEnabled = true; // Включаем коллизии для всей сцены

        const scaleFactor = 10; // Увеличиваем масштаб в 10 раз

        // Освещение
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

        // Скайбокс
        const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:1000.0 * scaleFactor}, scene);
        const skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
        skyboxMaterial.backFaceCulling = false;
        skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("https://www.babylonjs-playground.com/textures/skybox", scene);
        skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
        skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
        skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        skybox.material = skyboxMaterial;

        // Загрузка модели мира
        const result = await BABYLON.SceneLoader.ImportMeshAsync("", "assets/textures/core/", "hq_bellato.glb", scene);
        result.meshes.forEach((mesh) => {
            mesh.checkCollisions = true;
            mesh.scaling.scaleInPlace(scaleFactor); // Применяем масштабирование к каждой меши
        });

        // Персонаж
        const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 0.5 * scaleFactor, segments: 32}, scene);
        sphere.position = new BABYLON.Vector3(50 * scaleFactor, 1000 * scaleFactor, 20 * scaleFactor); // Увеличиваем начальную позицию по Y очень сильно
        // Делаем эллипсоид тоньше, чтобы он меньше застревал
        sphere.ellipsoid = new BABYLON.Vector3(0.1 * scaleFactor, 0.25 * scaleFactor, 0.1 * scaleFactor);

        // Камера в стиле "Dota" / MMORPG
        const camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", -Math.PI / 2, 1.2, 40 * scaleFactor, sphere.position, scene);
        camera.attachControl(canvas, true);

        // Ограничения для камеры
        camera.lowerRadiusLimit = 15 * scaleFactor;  // Минимальный зум
        camera.upperRadiusLimit = 60 * scaleFactor;  // Максимальный зум
        camera.lowerBetaLimit = 0.8;   // Минимальный угол (чтобы не смотреть ровно сверху)
        camera.upperBetaLimit = 1.4; // Максимальный угол (чтобы не смотреть ровно сбоку)

        // Включение коллизий для камеры, чтобы она не проходила сквозь объекты
        camera.checkCollisions = true;
        camera.collisionRadius = new BABYLON.Vector3(1 * scaleFactor, 1 * scaleFactor, 1 * scaleFactor);
        
        // Управление
        const inputMap = {};
        scene.actionManager = new BABYLON.ActionManager(scene);
        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
            inputMap[evt.sourceEvent.key.toLowerCase()] = true;
        }));
        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
            inputMap[evt.sourceEvent.key.toLowerCase()] = false;
        }));

        // Конфигурация
        const playerSpeed = 0.3 * scaleFactor;
        const jumpForce = 0.2 * scaleFactor;
        const gravity = -0.015 * scaleFactor;
        let verticalVelocity = 0;

        scene.onBeforeRenderObservable.add(() => {
            // Камера всегда смотрит на персонажа
            camera.target.copyFrom(sphere.position);

            // Camera-relative movement
            const cameraForward = camera.getDirection(new BABYLON.Vector3(0, 0, 1));
            const cameraRight = camera.getDirection(new BABYLON.Vector3(1, 0, 0));
            const forward = new BABYLON.Vector3(cameraForward.x, 0, cameraForward.z).normalize();
            const right = new BABYLON.Vector3(cameraRight.x, 0, cameraRight.z).normalize();

            let moveDirection = BABYLON.Vector3.Zero();
            if (inputMap["w"]) {
                moveDirection.addInPlace(forward);
            }
            if (inputMap["s"]) {
                moveDirection.subtractInPlace(forward);
            }
            if (inputMap["a"]) {
                moveDirection.subtractInPlace(right);
            }
            if (inputMap["d"]) {
                moveDirection.addInPlace(right);
            }

            if (moveDirection.lengthSquared() > 0) {
                moveDirection.normalize();
                sphere.moveWithCollisions(moveDirection.scale(playerSpeed));
                // Rotate sphere to face movement direction
                sphere.rotation.y = Math.atan2(moveDirection.x, moveDirection.z);
            }

            // Проверка земли с помощью луча
            console.log("Sphere Y before gravity/sticking: " + sphere.position.y);
            const ray = new BABYLON.Ray(sphere.position, new BABYLON.Vector3(0, -1, 0), 2000 * scaleFactor); // Увеличиваем длину луча для обнаружения земли
            const hit = scene.pickWithRay(ray, (mesh) => mesh.checkCollisions);

            if (hit.hit) {
                console.log("Ray hit! Picked Point Y: " + hit.pickedPoint.y);
            } else {
                console.log("Ray did not hit anything.");
            }

            // Прыжок
            if (hit.hit && inputMap[" "]) {
                verticalVelocity = jumpForce;
            }

            // Гравитация
            if (!hit.hit) {
                verticalVelocity += gravity;
            } else {
                verticalVelocity = 0;
            }
            
            sphere.position.y += verticalVelocity;

            // Прилипание к земле
            if (hit.hit && verticalVelocity <= 0) {
                sphere.position.y = hit.pickedPoint.y + sphere.ellipsoid.y;
            }
            console.log("Sphere Y after gravity/sticking: " + sphere.position.y);
        });

        return scene;
    };

    createScene().then(scene => {
        engine.runRenderLoop(function () {
            if (scene) {
                scene.render();
            }
        });
    });

    window.addEventListener('resize', function () {
        engine.resize();
    });
});