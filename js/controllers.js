/**
 * \brief  Модуль контроллеров для игры "Летающий мотоцикл".
 * \author Rostislav Velichko. e: rostislav.vel@gmail.com
 * \date   04.04.2017
 */

var CONTROLLERS = {};


/**
 * \brief  Контроллер движений мотоцикла.
 */
CONTROLLERS.BikeController = function(bike_, terrain_, dom_element_) {
    THREE.EventDispatcher.call(this);
    var _scope = this;

    var EPS = 0.000001;
    var PIXELS_PER_ROUND = 1800;
    var ROTATE_ANGLE = 2;
    var SPEED_UP = 1;
    var SPEED_DOWN = 1;
    var HEIGHT = 0;

    _scope.keys = {
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        BOTTOM: 40
    };

    _scope.object = bike_;
    _scope.domElement = (dom_element_ !== undefined) ? dom_element_ : document;

    _scope.center = new THREE.Vector3();

    _scope.minPolarAngle = 0; // radians
    _scope.maxPolarAngle = Math.PI; // radians
    _scope.minDistance = 0;
    _scope.maxDistance = Infinity;

    var _middle_dt = 0;
    var _mspeed = 0;
    var _is_up_speed = false;
    var _is_down_speed = false;

    var _is_rotate = false;
    var _to_route_distance = 0;
    var _easing_pos = 1;

    var _last_position = new THREE.Vector3();
    var _direction = new THREE.Vector3();
    var _route_direction = new THREE.Vector3(0, 0, -1);
    var _vertex_by_pos = terrain_.getVertexByPos(bike_.position);
    var _old_vertex_by_pos = _vertex_by_pos;
    var _route_sub_width = terrain_.route_width * (0.5 + terrain_.VERGES_WIDTH_PERCENT);

    function onDocumentKeyDown(event) {
        switch (event.keyCode) {
            case _scope.keys.LEFT:
                _is_rotate = true;
                bike_.rotate_angle = ROTATE_ANGLE; 
                break;
            case _scope.keys.RIGHT:
                _is_rotate = true;
                bike_.rotate_angle = -ROTATE_ANGLE; 
                break;
            case _scope.keys.UP:
                _is_up_speed = true;
                _is_down_speed = false;
                break;
            case _scope.keys.BOTTOM:
                _is_down_speed = true;
                _is_up_speed = false;
                break;
        }
    }

    function onDocumentKeyUp(event) {
        switch (event.keyCode) {
            case _scope.keys.LEFT:
                _is_rotate = false;
                break;
            case _scope.keys.RIGHT:
                _is_rotate = false;
                break;
            case _scope.keys.UP:
                _is_up_speed = false;
                break;
            case _scope.keys.BOTTOM:
                _is_down_speed = false;
                break;
        }
    }


    function updateSpeed(dt_) {
        /// Получить максиамльную скорость для промежутка времени с приведением к секунде.
        var max_speed = bike_.MAX_SPEED * dt_ * 1000;
        var min_speed = bike_.MIN_SPEED * dt_ * 1000;
        /// Коррекция максимальной скорости на промежутке времени.
        if (_mspeed < max_speed) {
            _mspeed = max_speed;   
        }
        /// Получить приращения скорости. 
        var us = _mspeed / bike_.SPEED_UP;
        var bs = _mspeed / bike_.BREAKING;
        var ds = _mspeed / bike_.SPEED_DOWN;
        if (_is_up_speed) {
            if ((bike_.speed + us) <= _mspeed) {
                bike_.speed += us;
            } else {
                bike_.speed = _mspeed;
            }
        } else if (_is_down_speed) {
            if (0 <= (bike_.speed - bs)) {
                bike_.speed -= bs;
            } else {
                bike_.speed = 0;
            }
        } else {
            if (0 <= (bike_.speed - ds)) {
                bike_.speed -= ds;
            } else {
                bike_.speed = 0;
            }
            _mspeed = 0;
        }
        /// Оработать процесс перемещения.
        if (0 < bike_.speed) {
            /// Получить вектор направления байка
            var bike_direction = bike_.getWorldDirection().clone();
            //bike_direction.normalize();
            bike_direction.multiplyScalar(bike_.speed);
            /// Плавно откорректировать позицию.
            var bike_new_pos = bike_.position.clone(); 
            bike_new_pos.x += bike_direction.x;
            bike_new_pos.z += bike_direction.z;
            /// Получить высоту тирейна и ближайшую точку трассы.
            _vertex_by_pos = terrain_.getVertexByPos(bike_new_pos);
            _easing_pos = 1 - UTILS.Easing.inQuint(_vertex_by_pos.d2r / (terrain_.route_width * 0.5));
            bike_.speed *= _easing_pos;
            if (bike_.speed < min_speed && _is_up_speed) {
                bike_.speed = min_speed;
            }
            bike_direction.normalize();
            bike_direction.multiplyScalar(bike_.speed);
            /// Контроль выхода за пределы внешнего края обочины.
            var lock_width = _old_vertex_by_pos.d2r - _route_sub_width;
            // if (0 <= lock_width) {
                // /// Получить вектор направления трассы.
                // if (_vertex_by_pos.r.x !== _old_vertex_by_pos.r.x && _vertex_by_pos.r.z !== _old_vertex_by_pos.r.z) {
                    // _route_direction.x = _vertex_by_pos.r.x - _old_vertex_by_pos.r.x; 
                    // _route_direction.z = _vertex_by_pos.r.z - _old_vertex_by_pos.r.z;
                    // _route_direction.normalize();
                // }
                // /// Получить проекцию вектора направления байка на вектор направления трассы.
                // bike_direction = bike_direction.projectOnVector(_route_direction);
                // /// Получить вектор в направления трассы.
                // var rd_cross = _route_direction.cross({ 
                    // x: 0, 
                    // y: bike_.rotate_angle, 
                    // z: 0 
                // });
                // rd_cross.normalize();
                // rd_cross.multiplyScalar(lock_width);
                // //console.log('> ' + JSON.stringify(_route_direction) + '; ' + JSON.stringify(bike_direction) + '; ' + JSON.stringify(rd_cross));
                // bike_direction.x += rd_cross.x;
                // bike_direction.z += rd_cross.z;
            // }
            /// Сместить байк на значение скорости
            bike_.position.x += bike_direction.x;
            bike_.position.z += bike_direction.z;
        }
    }

    function updateRotation(dt_) {
        /// Откорректировать угол поворота при достижении края трассы.
        // if (_vertex_by_pos.rwidth * 0.5 < _vertex_by_pos.d2r) {
//             
            // _old_vertex_by_pos
            // bike_.rotate_angle *= _easing_pos;
//             
        // }
        if (_is_rotate) {
            var rot_matrix = new THREE.Matrix4();
            var axis = new THREE.Vector3(0, 1, 0);
            var radians = bike_.rotate_angle * Math.PI / 180;
            rot_matrix.makeRotationAxis(axis.normalize(), radians);
            bike_.matrix.multiply(rot_matrix);
            bike_.rotation.setFromRotationMatrix(bike_.matrix);
        }
    }

    function updateHeigh(dt_) {
        bike_.timer += dt_;
        /// Получить высоту в позиции.
        if (_vertex_by_pos.v.y < 0) {
            bike_.cur_world_height = 0;
        } else if (_vertex_by_pos.v.y < _vertex_by_pos.r.y) {
            // var eh = Math.sqrt(_vertex_by_pos.v.y * _vertex_by_pos.v.y + 
                               // _old_vertex_by_pos.v.y * _old_vertex_by_pos.v.y);
            // bike_.cur_world_height = UTILS.Easing.inCubic(_vertex_by_pos.v.y / eh) * eh;
            bike_.cur_world_height = _vertex_by_pos.r.y; 
        } else {
            bike_.cur_world_height = _vertex_by_pos.v.y;
        }
        /// Плавно откорректировать высоту.
        var ehover = UTILS.Periodics.sinus(bike_.timer * 1000,  bike_.HOVER_FREQUENCE) * bike_.HOVER_AMPLITUDE + bike_.HOVER_DISTANCE;
        bike_.position.y = bike_.cur_world_height + ehover;
    } 
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    this.update = function(dt_) {
        _middle_dt = (_middle_dt + dt_) * 0.5;
        if (bike_ && terrain_) {
            /// Обновить скорость перемещения.
            updateSpeed(_middle_dt);
            /// Обновить направление байка.
            updateRotation(_middle_dt);
            /// Обновить положение байка над поверхностью.
            updateHeigh(_middle_dt);
            /// Сокранить праметры привязки к трассе для вычисления векторов привязки.
            _old_vertex_by_pos = _vertex_by_pos;
        };
    };
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    document.addEventListener("keyup", onDocumentKeyUp, false);
    document.addEventListener("keydown", onDocumentKeyDown, false);
};
CONTROLLERS.BikeController.prototype = Object.create(THREE.EventDispatcher.prototype);


/**
 * \brief  Контроллер камеры, относительно мотоцикла.
 */
CONTROLLERS.BikeCameraController = function(camera_, bike_, terrain_, dom_element_) {
    var MIN_LOOK_DISTANCE = 30; ///< Константа - минимальная дистанция до байка от камеры.
    var MAX_LOOK_DISTANCE = 50; ///< Константа - максимальная дистанция до байка от камеры.
    var HEIGHT_DISTANCE = 1; ///< Константа - высота камеры над байком.
    var ZOOM_SPEED = 1.0; ///< Константа - скорость зума.
    var LOOK_DISTANCE = 9; ///< Константа - дистанция от камеры до байка.
    
    var _scope = this;
    var _angle = Math.PI * -0.5;

    var _old_bike_pos = new THREE.Vector3(bike_.position.x, bike_.cur_world_height, bike_.position.z);
    var _old_bike_direction = new THREE.Vector3();
    var _subv = new THREE.Vector3();

    /// Установка положения камеры за мотоциклом.
    var to_bike_direction = bike_.getWorldDirection();
    _old_bike_direction = to_bike_direction.clone();
    to_bike_direction.negate().multiplyScalar(LOOK_DISTANCE);
    to_bike_direction.y = HEIGHT_DISTANCE;
    var _bike_position = new THREE.Vector3(bike_.position.x, bike_.cur_world_height, bike_.position.z);
    camera_.position.addVectors(_bike_position, to_bike_direction);
    camera_.lookAt(_bike_position);

    function lookToBike(dt_) {
        /// Вращение камеры за байкаом.
        var bike_direction = bike_.getWorldDirection().clone();
        bike_direction.y = 0;
        var cam_direction = camera_.getWorldDirection().clone();
        cam_direction.y = 0;
        /// Обработка позиции камеры.
        _bike_position.x = bike_.position.x;
        _bike_position.y = bike_.position.y;
        _bike_position.z = bike_.position.z;
        var angle = cam_direction.angleTo(bike_direction) / Math.PI;
        if (0.001 < angle) {
            _subv.subVectors(_bike_position, camera_.position);
            var eas = UTILS.Easing.inOutCubic(angle);
            if (bike_.rotate_angle !== 0) {
                _angle += (bike_.rotate_angle < 0) ? eas : -eas;
                _subv.x += Math.cos(_angle) * LOOK_DISTANCE;
                _subv.z += Math.sin(_angle) * LOOK_DISTANCE;
                camera_.position.add(_subv);
                _old_bike_direction = bike_direction.clone();
            }
        }
        /// Смещение камеры вместе с байком.
        if (!_bike_position.equals(_old_bike_pos) || 0.001 < angle) {
            /// Добавить вектор смещения байка к текущей позиции камеры.
            _subv.subVectors(_bike_position, _old_bike_pos);
            camera_.position.add(_subv);
            camera_.lookAt(_bike_position);
            /// Запомнить текущее положение байка.
            _old_bike_pos = _bike_position.clone();
        }
    }

    function onMouseWheel(event) {
        var d = getDirection(camera_.position, _bike_position);
        var cam_dist = d.length();
        var scale = 1;
        if (event.deltaY < 0) {
            scale *= Math.pow(0.95, ZOOM_SPEED);
        } else if (event.deltaY > 0) {
            scale /= Math.pow(0.95, ZOOM_SPEED);
        }
        d.normalize();
        cam_dist = Math.max(MIN_LOOK_DISTANCE, Math.min(MAX_LOOK_DISTANCE, cam_dist));
        d.multiplyScalar(cam_dist + scale);
        camera_.position.add(d);
    }
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    this.update = function(dt_) {
        if (camera_ && bike_ && terrain_) {
            lookToBike(dt_);
        }
    };
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // this.domElement.addEventListener('wheel', onMouseWheel, false);
};
