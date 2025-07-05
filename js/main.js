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
        const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 1, segments: 32}, scene);
        sphere.position = new BABYLON.Vector3(0, 50, 0);
        sphere.ellipsoid = new BABYLON.Vector3(0.5, 0.5, 0.5);

        // Камера, следующая за персонажем
        const camera = new BABYLON.FollowCamera("FollowCam", new BABYLON.Vector3(0, 10, -20), scene);
        camera.radius = 15; // расстояние от персонажа
        camera.heightOffset = 5; // высота над персонажем
        camera.rotationOffset = 0; // вращение
        camera.cameraAcceleration = 0.05;
        camera.maxCameraSpeed = 10;
        camera.lockedTarget = sphere; // привязываем к сфере
        scene.activeCamera = camera;
        camera.attachControl(canvas, true);


        // Управление
        const inputMap = {};
        scene.actionManager = new BABYLON.ActionManager(scene);
        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
            inputMap[evt.sourceEvent.key.toLowerCase()] = evt.sourceEvent.type == "keydown";
        }));
        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
            inputMap[evt.sourceEvent.key.toLowerCase()] = evt.sourceEvent.type == "keydown";
        }));

        // Конфигурация
        const playerSpeed = 0.3;
        const playerRotationSpeed = 0.05;
        const jumpForce = 0.2;
        const gravity = -0.015;
        let verticalVelocity = 0;

        scene.onBeforeRenderObservable.add(() => {
            // Вращение
            console.log(inputMap); // Не удалять
            if (inputMap["a"]) {
                sphere.rotation.y -= playerRotationSpeed;
            }
            if (inputMap["d"]) {
                sphere.rotation.y += playerRotationSpeed;
            }

            // Движение
            const forwardDirection = sphere.getDirection(new BABYLON.Vector3(0, 0, 1));
            if (inputMap["w"]) {
                sphere.moveWithCollisions(forwardDirection.scale(playerSpeed));
            }
            if (inputMap["s"]) {
                sphere.moveWithCollisions(forwardDirection.scale(-playerSpeed));
            }

            // Проверка земли с помощью луча
            const ray = new BABYLON.Ray(sphere.position, new BABYLON.Vector3(0, -1, 0), 0.6);
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
                sphere.position.y = hit.pickedPoint.y + 0.5;
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
