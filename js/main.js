window.addEventListener('DOMContentLoaded', async function(){
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);

    const createScene = async function () {
        const scene = new BABYLON.Scene(engine);

        // Освещение
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

        // Скайбокс
        const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", {size:1000.0}, scene);
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
        });

        // Персонаж
        const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 0.5, segments: 32}, scene);
        sphere.position = new BABYLON.Vector3(50, 50, 20);
        // Делаем эллипсоид тоньше, чтобы он меньше застревал
        sphere.ellipsoid = new BABYLON.Vector3(0.1, 0.25, 0.1);

        // Камера в стиле "Dota" / MMORPG
        const camera = new BABYLON.ArcRotateCamera("ArcRotateCamera", -Math.PI / 2, 1.2, 40, sphere.position, scene);
        camera.attachControl(canvas, true);

        // Ограничения для камеры
        camera.lowerRadiusLimit = 15;  // Минимальный зум
        camera.upperRadiusLimit = 60;  // Максимальный зум
        camera.lowerBetaLimit = 0.8;   // Минимальный угол (чтобы не смотреть ровно сверху)
        camera.upperBetaLimit = 1.4; // Максимальный угол (чтобы не смотреть ровно сбоку)

        // Включение коллизий для камеры, чтобы она не проходила сквозь объекты
        camera.checkCollisions = true;
        camera.collisionRadius = new BABYLON.Vector3(1, 1, 1);
        
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
        const playerSpeed = 0.3;
        const jumpForce = 0.2;
        const gravity = -0.015;
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
            const ray = new BABYLON.Ray(sphere.position, new BABYLON.Vector3(0, -1, 0), 0.3);
            const hit = scene.pickWithRay(ray, (mesh) => mesh.checkCollisions);

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
                sphere.position.y = hit.pickedPoint.y + 0.25;
            }
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