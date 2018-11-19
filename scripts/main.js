/*!
 * \brief  Основной модуль игровой логики "Летающий мотоцикл".
 * \author Rostislav Velichko. e: rostislav.vel@gmail.com
 * \date   11.20.2015
 */

var AEROBIKE = {};


AEROBIKE.Screen = function(scene, camera) {
    this.scene = scene;
    this.camera = camera;

    this.hide = function() {};
    this.show = function() {};
    this.resize = function() {};
    this.update = function(dclock) {};
};


AEROBIKE.Start = function(on_garage, on_fast_game) {
    AEROBIKE.Screen.call(this,
        new THREE.Scene(),
        new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000));

    var X_SCENE_ROTATION = 0.0003;

    var _scope = this;
    var _display = new UTILS.Display(document.getElementById("start_screen"));
    var _group = new THREE.Group();

    var _window_half_x = window.innerWidth * 0.5;
    var _window_half_y = window.innerHeight * 0.5;

    document.getElementById("start_garage_img_bt").addEventListener("click", on_garage, false);
    document.getElementById("start_fast_game_img_bt").addEventListener("click", on_fast_game, false);

    _scope.camera.position.z = 400;
    _scope.scene.add(new THREE.AmbientLight(0xffffff));
    _scope.scene.add(_group);

    console.log("start");
    var _clouds = [
        new MODELS.Cloud(100, 20, 20, 200, 60, 50),
        new MODELS.Cloud(150, 50, 20, 220, 100, 50),
        new MODELS.Cloud(100, 20, 20, 200, 60, 50),
        new MODELS.Cloud(200, 10, 20, 200, 30, 50),
        new MODELS.Cloud(100, 20, 20, 200, 60, 50)
    ];
    _clouds[0].position.set(200, 300, 500);
    _clouds[1].position.set(-400, -100, 20);
    _clouds[2].position.set(500, -50, -200);
    _clouds[3].position.set(-300, 200, 70);
    _clouds[4].position.set(0, -100, -100);
    _group.add(_clouds[0]);
    _group.add(_clouds[1]);
    _group.add(_clouds[2]);
    _group.add(_clouds[3]);
    _group.add(_clouds[4]);

    this.hide = function() {
        _display.hide();
    };

    this.resize = function() {
        _scope.camera.aspect  = window.innerWidth / window.innerHeight;
        _scope.camera.updateProjectionMatrix();
    };

    this.update = function(dclock) {
        for (var i = 0; i < _clouds.length; ++i) {
            _clouds[i].update();
        }
        _group.rotation.y -= X_SCENE_ROTATION;
        _scope.camera.lookAt(_scope.scene.position);
    };
};
AEROBIKE.Start.prototype = Object.create(AEROBIKE.Screen.prototype);


// Garage screen
AEROBIKE.Garage = function(
    on_settings,
    on_rating,
    on_shop,
    on_chooce_partner,
    on_fast_game,
    on_about) {
    AEROBIKE.Screen.call(this,
        new THREE.Scene(),
        new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000));
    var _scope = this;

    var X_VIEW_PERCENT = 0.9;
    var Y_VIEW_PERCENT = 0.7;
    var X_SCENE_ROTATION = 0.001;
    var BASE_CAMERA_POS_PERCENT = 0.15;

    var _mouse_x = 0;
    var _mouse_x_on_mouse_down = 0;
    var _target_rotation = 0;
    var _target_rotation_on_mouse_down = 0;
    var _mouse_y = 0;
    var _base_y_cam_pos = window.innerHeight * BASE_CAMERA_POS_PERCENT;

    var _window_half_x = window.innerWidth * 0.5;
    var _window_half_y = window.innerHeight * 0.5;

    var _display = new UTILS.Display(document.getElementById("garage_screen"));
    var _group = new THREE.Group();

    document.getElementById("settings_btn").addEventListener("click", on_settings, false);
    document.getElementById("rating_btn").addEventListener("click", on_rating, false);
    document.getElementById("shop_btn").addEventListener("click", on_shop, false);
    document.getElementById("chooce_partner_btn").addEventListener("click", on_chooce_partner, false);
    document.getElementById("garage_fast_game_img_bt").addEventListener("click", on_fast_game, false);
    document.getElementById("about_btn").addEventListener("click", on_about, false);

    var _bike = new MODELS.BikePelican();
    _group.add(_bike);

    var ground_texture = new UTILS.TextureLoader();
    ground_texture.load("./images/lavatile.jpg", function(texture) {
        var ground_geometry = new THREE.PlaneBufferGeometry(100, 100);
        ground_geometry.rotateX(-Math.PI / 2);
        var ground_material = new THREE.MeshPhongMaterial({
            map:texture, bumpMap:texture, bumpScale:2, color:0x00ff00,
            specular:50, shininess:0x333333, shading:THREE.SmoothShading
        });
        var plane = new THREE.Mesh(ground_geometry, ground_material);
        _group.add(plane);
    });
    _group.position.y = -1.5;

    _scope.scene.add(new THREE.AmbientLight(0xffffff));
    var directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(0, 1, 0).normalize();
    _scope.scene.add(directionalLight);
    //var particle_light = new THREE.Mesh(new THREE.SphereBufferGeometry(1, 4, 4), new THREE.MeshBasicMaterial({color:0xffffff}));
    //particle_light.add(new THREE.PointLight(0xffffff, 2, 700));
    //particle_light.position.y = 200;

    //_scene.add(particle_light);
    _scope.scene.add(_group);

    _scope.camera.position.z = 4;

    document.getElementById("prev_bike_btn").addEventListener("click", function() {

    }, false);

    document.getElementById("next_bike_btn").addEventListener("click", function() {

    }, false);

    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('touchstart', onDocumentTouchStart, false);
    document.addEventListener('touchmove', onDocumentTouchMove, false);

    function onDocumentMouseDown(e) {
        e.preventDefault();
        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('mouseup', onDocumentMouseUp, false);
        document.addEventListener('mouseout', onDocumentMouseOut, false);
        _mouse_x_on_mouse_down = e.clientX - _window_half_x;
        _target_rotation_on_mouse_down = _target_rotation;
    }

    function onDocumentMouseMove(e) {
        _mouse_x = e.clientX - _window_half_x;
        _mouse_y = (e.clientY - _window_half_y - _base_y_cam_pos);
        _target_rotation = _target_rotation_on_mouse_down + (_mouse_x - _mouse_x_on_mouse_down) * 0.02;
    }

    function onDocumentMouseUp(e) {
        document.removeEventListener('mousemove', onDocumentMouseMove, false);
        document.removeEventListener('mouseup', onDocumentMouseUp, false);
        document.removeEventListener('mouseout', onDocumentMouseOut, false);
    }

    function onDocumentMouseOut(e) {
        document.removeEventListener('mousemove', onDocumentMouseMove, false);
        document.removeEventListener('mouseup', onDocumentMouseUp, false);
        document.removeEventListener('mouseout', onDocumentMouseOut, false);
    }

    function onDocumentTouchStart(e) {
        if (e.touches.length === 1) {
            e.preventDefault();
            _mouse_x_on_mouse_down = e.touches[0].pageX - _window_half_x;
            _target_rotation_on_mouse_down = _target_rotation;
        }
    }

    function onDocumentTouchMove(e) {
        if (e.touches.length === 1) {
            e.preventDefault();
            _mouse_x = e.touches[0].pageX - _window_half_x;
            _target_rotation = _target_rotation_on_mouse_down + (_mouse_x - _mouse_x_on_mouse_down) * 0.05;
        }
    }

    this.hide = function() {
        _display.hide();
    };

    this.show = function() {
        _display.show();
    };

    this.resize = function() {
        _mouse_y = 0;
        _window_half_y  = window.innerHeight * 0.5;
        _base_y_cam_pos = window.innerHeight * BASE_CAMERA_POS_PERCENT;
        _scope.camera.aspect = window.innerWidth / window.innerHeight;
        _scope.camera.updateProjectionMatrix();
    };

    this.update = function(dclock) {
        _group.rotation.y = _group.rotation.y += (_target_rotation - _group.rotation.y) * 0.05;
        _scope.camera.position.y += (-(_mouse_y * 0.01) * Y_VIEW_PERCENT - _scope.camera.position.y) * 0.1;
        _scope.camera.lookAt(_scope.scene.position);
        _bike.update(dclock);
    };
};
AEROBIKE.Garage.prototype = Object.create(AEROBIKE.Screen.prototype);


// Settings screen
AEROBIKE.Settings = function(garage, on_return_settings) {
    AEROBIKE.Screen.call(this, garage.scene, garage.camera);

    var _display = new UTILS.Display(document.getElementById("settings_screen"));

    document.getElementById("return_settings_btn").addEventListener("click", on_return_settings, false);

    this.resize = function() {
        garage.resize();
    };

    this.update = function(dclock) {
        garage.update(dclock);
    };

    this.hide = function() {
        _display.hide();
    };

    this.show = function() {
        _display.show();
    };
};
AEROBIKE.Settings.prototype = Object.create(AEROBIKE.Screen.prototype);


// Rating screen
AEROBIKE.Rating = function(garage, on_return_rating) {
    AEROBIKE.Screen.call(this, garage.scene, garage.camera);

    var _display = new UTILS.Display(document.getElementById("rating_screen"));

    document.getElementById("return_rating_btn").addEventListener("click", on_return_rating, false);

    this.resize = function() {
        garage.resize();
    };

    this.update = function(dclock) {
        garage.update(dclock);
    };

    this.hide = function() {
        _display.hide();
    };

    this.show = function() {
        _display.show();
    };
};
AEROBIKE.Rating.prototype = Object.create(AEROBIKE.Screen.prototype);


// Shop screen
AEROBIKE.Shop = function(garage, on_return_shop) {
    AEROBIKE.Screen.call(this, garage.scene, garage.camera);

    var _display = new UTILS.Display(document.getElementById("shop_screen"));

    document.getElementById("return_shop_btn").addEventListener("click", on_return_shop, false);

    this.resize = function() {
        garage.resize();
    };

    this.update = function(dclock) {
        garage.update(dclock);
    };

    this.hide = function() {
        _display.hide();
    };

    this.show = function() {
        _display.show();
    };
};
AEROBIKE.Shop.prototype = Object.create(AEROBIKE.Screen.prototype);


// About screen
AEROBIKE.About = function(garage, on_return_about) {
    AEROBIKE.Screen.call(this, garage.scene, garage.camera);

    var _display = new UTILS.Display(document.getElementById("about_screen"));

    document.getElementById("return_about_btn").addEventListener("click", on_return_about, false);

    this.resize = function() {
        garage.resize();
    };

    this.update = function(dclock) {
        garage.update(dclock);
    };

    this.hide = function() {
        _display.hide();
    };

    this.show = function() {
        _display.show();
    };
};
AEROBIKE.About.prototype = Object.create(AEROBIKE.Screen.prototype);


// ChoocePartner screen
AEROBIKE.ChoocePartner = function(garage, on_return_chooce_partner) {
    AEROBIKE.Screen.call(this, garage.scene, garage.camera);

    var _display = new UTILS.Display(document.getElementById("chooce_partner_screen"));

    document.getElementById("return_chooce_partner_btn").addEventListener("click", on_return_chooce_partner, false);

    this.resize = function() {
        garage.resize();
    };

    this.update = function(dclock) {
        garage.update(dclock);
    };

    this.hide = function() {
        _display.hide();
    };

    this.show = function() {
        _display.show();
    };
};
AEROBIKE.ChoocePartner.prototype = Object.create(AEROBIKE.Screen.prototype);


// Game screen
AEROBIKE.Game = function(on_return_game) {
    AEROBIKE.Screen.call(this,
        new THREE.Scene(),
        new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000));
    var _scope = this;
    var _display = new UTILS.Display(document.getElementById("game_screen"));

    document.getElementById("game_garage_img_bt").addEventListener("click", on_return_game, false);

    document.getElementById("up_game_btn").addEventListener("click", function() {}, false);
    document.getElementById("down_game_btn").addEventListener("click", function() {}, false);
    document.getElementById("left_game_btn").addEventListener("click", function() {}, false);
    document.getElementById("right_game_btn").addEventListener("click", function() {}, false);

    // Загрузка ландшафта

    var _group = new THREE.Group();

    _group.add(new MODELS.Terrain(10, 50, 25, 300));
    _group.position.y = -5;
    _scope.scene.add(_group);

    _scope.scene.add(new THREE.AmbientLight(0xffffff));
    var directionalLight = new THREE.DirectionalLight(0xffffff, 10);
    directionalLight.position.set(0, 1, 0).normalize();
    _scope.scene.add(directionalLight);

    //_scope.scene.add(new THREE.AmbientLight(0xffffff));
    //_scope.scene.add(new THREE.SpotLight(0xffffff));

    //_scope.camera.position.y = 1;
    _scope.camera.position.z = 30;

    var X_VIEW_PERCENT = 0.9;
    var Y_VIEW_PERCENT = 0.7;
    var X_SCENE_ROTATION = 0.001;
    var BASE_CAMERA_POS_PERCENT = 0.15;

    var _mouse_x = 0;
    var _mouse_x_on_mouse_down = 0;
    var _target_rotation = 0;
    var _target_rotation_on_mouse_down = 0;
    var _mouse_y = 0;
    var _base_y_cam_pos = window.innerHeight * BASE_CAMERA_POS_PERCENT;

    var _window_half_x = window.innerWidth * 0.5;
    var _window_half_y = window.innerHeight * 0.5;

    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('touchstart', onDocumentTouchStart, false);
    document.addEventListener('touchmove', onDocumentTouchMove, false);

    function onDocumentMouseDown(e) {
        e.preventDefault();
        document.addEventListener('mousemove', onDocumentMouseMove, false);
        document.addEventListener('mouseup', onDocumentMouseUp, false);
        document.addEventListener('mouseout', onDocumentMouseOut, false);
        _mouse_x_on_mouse_down = e.clientX - _window_half_x;
        _target_rotation_on_mouse_down = _target_rotation;
    }

    function onDocumentMouseMove(e) {
        _mouse_x = e.clientX - _window_half_x;
        _mouse_y = (e.clientY - _window_half_y - _base_y_cam_pos);
        _target_rotation = _target_rotation_on_mouse_down + (_mouse_x - _mouse_x_on_mouse_down) * 0.02;
    }

    function onDocumentMouseUp(e) {
        document.removeEventListener('mousemove', onDocumentMouseMove, false);
        document.removeEventListener('mouseup', onDocumentMouseUp, false);
        document.removeEventListener('mouseout', onDocumentMouseOut, false);
    }

    function onDocumentMouseOut(e) {
        document.removeEventListener('mousemove', onDocumentMouseMove, false);
        document.removeEventListener('mouseup', onDocumentMouseUp, false);
        document.removeEventListener('mouseout', onDocumentMouseOut, false);
    }

    function onDocumentTouchStart(e) {
        if (e.touches.length === 1) {
            e.preventDefault();
            _mouse_x_on_mouse_down = e.touches[0].pageX - _window_half_x;
            _target_rotation_on_mouse_down = _target_rotation;
        }
    }

    function onDocumentTouchMove(e) {
        if (e.touches.length === 1) {
            e.preventDefault();
            _mouse_x = e.touches[0].pageX - _window_half_x;
            _target_rotation = _target_rotation_on_mouse_down + (_mouse_x - _mouse_x_on_mouse_down) * 0.05;
        }
    }

    this.resize = function() {
        _mouse_y = 0;
        _window_half_y  = window.innerHeight * 0.5;
        _base_y_cam_pos = window.innerHeight * BASE_CAMERA_POS_PERCENT;
        _scope.camera.aspect = window.innerWidth / window.innerHeight;
        _scope.camera.updateProjectionMatrix();
    };

    this.update = function(dclock) {
        _group.rotation.y = _group.rotation.y += (_target_rotation - _group.rotation.y) * 0.05;
        _scope.camera.position.y += (-(_mouse_y * 0.01) * Y_VIEW_PERCENT - _scope.camera.position.y) * 0.1;
        _scope.camera.lookAt(_scope.scene.position);
    };

    this.hide = function() {
        _display.hide();
    };

    this.show = function() {
        _display.show();
    };
};
AEROBIKE.Game.prototype = Object.create(AEROBIKE.Screen.prototype);


AEROBIKE.Main = function() {
    var _scope = this;
    var _renderer;

    var _clock = new THREE.Clock();

    _renderer = new THREE.WebGLRenderer({antialias:true, alpha:false});
    _renderer.setClearColor(0xb3ccf9);
    _renderer.setPixelRatio(window.devicePixelRatio);
    _renderer.setSize(window.innerWidth, window.innerHeight);
    _renderer.gammaInput = true;
    _renderer.gammaOutput = true;

    var scene_container = document.getElementById("scene_container");
    scene_container.appendChild(_renderer.domElement);

    var _screen;
    var _start = new AEROBIKE.Start(toSimpleGarageScreen);
    var _garage = new AEROBIKE.Garage(
        onSettings,
        onRating,
        onShop,
        onChoocePartner,
        onFastGame,
        onAbout);
    var _settings = new AEROBIKE.Settings(_garage, onReturnSettings);
    var _rating = new AEROBIKE.Rating(_garage, onReturnRating);
    var _shop = new AEROBIKE.Shop(_garage, onReturnShop);
    var _chooce_partner = new AEROBIKE.ChoocePartner(_garage, onReturnChoocePartner);
    var _about = new AEROBIKE.About(_garage, onReturnAbout);
    var _game = new AEROBIKE.Game(onReturnGame);
    _screen = _start;

// TODO: временное решение
    _start.hide();
    onFastGame();

    window.addEventListener('resize', function() {
        _screen.resize();
        _renderer.setSize(window.innerWidth, window.innerHeight);
        render();
    }, false);

    function toSimpleGarageScreen(e) {
        _start.hide();
        _garage.show();
        _screen = _garage;
    }

    // Garage methods
    function onSettings() {
        _garage.hide();
        _settings.show();
        _screen = _settings;
    }

    function onRating() {
        _garage.hide();
        _rating.show();
        _screen = _rating;
    }

    function onShop() {
        _garage.hide();
        _shop.show();
        _screen = _shop;
    }

    function onChoocePartner() {
        _garage.hide();
        _chooce_partner.show();
        _screen = _chooce_partner;
    }

    function onAbout() {
        _garage.hide();
        _about.show();
        _screen = _about;
    }

    function onFastGame() {
        _garage.hide();
        _game.show();
        _screen = _game;
    }

    // Main methods
    function onReturnSettings() {
        _settings.hide();
        _garage.show();
        _screen = _garage;
    }

    // Rating methods
    function onReturnRating() {
        _rating.hide();
        _garage.show();
        _screen = _garage;
    }

    // Shop methods
    function onReturnShop() {
        _shop.hide();
        _garage.show();
        _screen = _garage;
    }

    // Choose Partner methods
    function onReturnChoocePartner() {
        _chooce_partner.hide();
        _garage.show();
        _screen = _garage;
    }

    // About methods
    function onReturnAbout() {
        _about.hide();
        _garage.show();
        _screen = _garage;
    }

    // Game methods
    function onReturnGame() {
        _game.hide();
        _garage.show();
        _screen = _garage;
    }

    // Main methods
    function render() {
        _screen.update(_clock.getDelta());
        _renderer.render(_screen.scene, _screen.camera);
    }

    function animate() {
        requestAnimationFrame(animate);
        render();
    } animate();
};
new AEROBIKE.Main();
