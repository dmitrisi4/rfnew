window.addEventListener('DOMContentLoaded', function(){
    const canvas = document.getElementById('renderCanvas');
    const engine = new BABYLON.Engine(canvas, true);

    const createScene = function () {
        const scene = new BABYLON.Scene(engine);

        // Камера
        const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 0, 0), scene);
        camera.attachControl(canvas, true);

        // Освещение
        const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), scene);

        // Плоскость земли
        const ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 10, height: 10}, scene);

        // Простой объект
        const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", {diameter: 2, segments: 32}, scene);
        sphere.position.y = 1;

        // Управление
        const inputMap = {};
        scene.actionManager = new BABYLON.ActionManager(scene);
        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, function (evt) {
            inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));
        scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
            inputMap[evt.sourceEvent.key] = evt.sourceEvent.type == "keydown";
        }));

        // Конфигурация
        const playerSpeed = 0.1;
        const jumpForce = 0.2;
        const gravity = -0.01;
        let verticalVelocity = 0;
        let isOnGround = true;

        scene.onBeforeRenderObservable.add(() => {
            // Движение
            // console.log(inputMap, 'gg');
            if (inputMap["w"]) {
                sphere.position.z += playerSpeed;
            }
            if (inputMap["s"]) {
                sphere.position.z -= playerSpeed;
            }
            if (inputMap["a"]) {
                sphere.position.x -= playerSpeed;
            }
            if (inputMap["d"]) {
                sphere.position.x += playerSpeed;
            }

            // Прыжок
            if (isOnGround && inputMap[" "]) {
                verticalVelocity = jumpForce;
                isOnGround = false;
            }

            // Гравитация
            verticalVelocity += gravity;
            sphere.position.y += verticalVelocity;

            // Проверка на столкновение с землей
            if (sphere.position.y < 1) {
                sphere.position.y = 1;
                verticalVelocity = 0;
                isOnGround = true;
            }
        });

        return scene;
    };

    const scene = createScene();

    engine.runRenderLoop(function () {
        scene.render();
    });

    window.addEventListener('resize', function () {
        engine.resize();
    });
});
