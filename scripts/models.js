/*!
 * \brief  Модуль игровых объектов игры "Летающий мотоцикл".
 * \author Rostislav Velichko. e: rostislav.vel@gmail.com
 * \date   11.20.2015
 */

var MODELS = {};

MODELS.Pilot = function() {};


MODELS.BikePelican = function() {
    THREE.Group.call(this);

    var DGRAD = 5;
    var FLOUTIN_DISTANCE_PERCENT = 0.001;

    var _scope = this;
    var _animation;
    var _alpha = 0;

    var _animations = [];
    var _load_count = 0;

    // Загрузка байка
    loadModel("collada/bike_01.dae");
    // Загрузка рокетного двигателя
    loadModel("collada/mono_jet_01.dae");

    function loadModel(model_file) {
        var loader = new THREE.ColladaLoader();
        loader.load(model_file, function (collada) {
            console.log('model file: ' + model_file);
            var dae = collada.scene;
            dae.traverse(function(child) {
                if (child instanceof THREE.SkinnedMesh) {
                    _animations[_load_count] = new THREE.Animation(child, child.geometry.animation);
                    ++_load_count;
                    if (_load_count == 2) {
                        for(var animation in _animations) {
                            _animations[animation].play();
                        }
                        console.log("play animations");
                    }
                }
            });
            dae.updateMatrix();
            _scope.add(dae);
        });
    }

    this.update = function(dclock) {
        if (_alpha > 360) {
            _alpha = 0;
        }
        _scope.position.y += Math.sin(_alpha * (Math.PI / 180.0)) * FLOUTIN_DISTANCE_PERCENT;
        _alpha += dclock * 200;
    };
};
MODELS.BikePelican.prototype = Object.create(THREE.Group.prototype);


MODELS.Cloud = function(min_x, min_y, min_z, max_x, max_y, max_z) {
    THREE.Group.call(this);
    var _scope = this;

    var MIN_RADIUS_PERC = 0.05;
    var MAX_RADIUS_PERC = 0.5;
    var MIN_NUM_FRACTIONS = 5;
    var MAX_NUM_FRACTIONS = 20;

    var _fractions = [];
    var _diagonal = diagonal();

    var _loader = new THREE.TextureLoader();
    _loader.load("textures/cloud256.png", function(texture) {
        var amount = getRandValue(MIN_NUM_FRACTIONS, MAX_NUM_FRACTIONS);
        for (var i = 0; i < amount; ++i) {
            var s = addFraction(new THREE.SpriteMaterial({
                map:texture, color:0xffffff, fog:true, rotation:(360.0 * Math.random()) * (Math.PI / 180.0)
            }));
            _fractions[i] = s;
            _scope.add(s);
        }
    });

    function addFraction(material) {
        var s = new THREE.Sprite(material);
        s.position.set(getCoordinate(max_x), getCoordinate(max_y), getCoordinate(max_z));
        s.position.normalize();
        var radius = (_diagonal - getRandValue(_diagonal * MIN_RADIUS_PERC, _diagonal * MAX_RADIUS_PERC));
        s.scale.set(radius, radius, radius);
        s.position.multiplyScalar(_diagonal);
        return s;
    }

    function getCoordinate(max) {
        var probs = [0.59, 0.55, 0.51, 0.5, 0.49, 0.45, 0.42, 0.41, 0.405, 0.4, 0.39, 0.35,
            0.32, 0.3, 0.29, 0.25, 0.2, 0.15, 0.1, 0.05, 0.02, 0.01];
        return max * 0.5 - max * Math.floor(probs.length * Math.random());
    }

    function diagonal() {
        var v = new THREE.Vector3(getRandValue(min_x, max_x), getRandValue(min_y, max_y), getRandValue(min_z, max_z));
        return v.length();
    }

    function getRandValue(min, max) {
        return min + ((max - min) * Math.random());
    }

    this.update = function() {
        for (var i = 0; i < _fractions.length; ++i) {
            var s = _fractions[i];
            var k = 0.001;
            s.position.x += (max_x * Math.random()) * (Math.random() < 0.5 ? -k:k);
            s.position.y += (max_y * Math.random()) * (Math.random() < 0.5 ? -k:k);
            //s.position.z += (max_z * 0.5 - max_z * Math.random()) * 0.005;
        }
    }
};
MODELS.Cloud.prototype = Object.create(THREE.Group.prototype);


MODELS.Terrain = function(width, height, segments_width, segments_height) {
    THREE.Group.call(this);
    var _scope = this;

    Grid = function (sw, sh, x, z, swidth, sheight) {
        var geometry = new THREE.Geometry();

        // Генерация первого ряда точек
        for (var i = 0; i <= swidth; i++) {
            geometry.vertices.push(new THREE.Vector3(x + i * sw, 0, z));
        }

        // Генерация верхних рядов точек и описание поверхностей их индексами по секторам
        var id_0 = 0;
        for (var j = 1; j <= sheight; j++) {
            // Генерация первой точки верхнего ряда
            geometry.vertices.push(new THREE.Vector3(x, 0, z + j * sh));
            // Генерация верхнего ряда точек
            for (var i = 1; i <= swidth; i++) {
                geometry.vertices.push(new THREE.Vector3(x + (i * sw - sw / 2.0), 0, z + (j * sh - sh / 2.0)));
                geometry.vertices.push(new THREE.Vector3(x + i * sw, 0, z + j * sh));

                // Вычисление индексов точек для поверхностей текущего сектора
                var id_1 = id_0 + ((j > 1) ? 2 : 1);
                var id_4 = geometry.vertices.length - 1;
                var id_3 = id_4 - 1;
                var id_2 = id_3 - 1;

                // Вычисление описания сектора
                geometry.faces.push(
                    new THREE.Face3(id_3, id_1, id_0),
                    new THREE.Face3(id_3, id_4, id_1),
                    new THREE.Face3(id_3, id_2, id_4),
                    new THREE.Face3(id_3, id_0, id_2));

                // Пересчёт индекса нижней левой точки сектора в ряду
                id_0 += (j > 1) ? 2 : 1;
            }
            // Пересчёт индекса нижней левой точки сектора в столбце
            id_0 += 1;
        }
        return geometry;
    };

    var HILL_RADIUS_PERCENT = 0.3;
    var HILL_HEIGHT_PERCENT = 0.3;

    function generateHill(faces, vertices, sw, sh) {
        // Генерация радиуса холма
        var radius = Math.min(sw*segments_width, sh*segments_height) * Math.random() * HILL_RADIUS_PERCENT;
        var segments_radius_w = Math.ceil(radius / sw);
        var segments_radius_h = Math.ceil(radius / sh);

        // Генерация высоты холма
        var height = Math.min(Math.min(sw*segments_width, sh*segments_height) * Math.random() * HILL_HEIGHT_PERCENT, radius);

        // Выбор произвольного сегмента
        var segment_x = Math.max(Math.floor(segments_width * Math.random() - 0.1), 0);
        var segment_y = Math.max(Math.floor(segments_height * Math.random() - 0.1), 0);

        // Получить параметры зоны холма
        var segments_radius_begin_x = Math.max(0, segment_x - segments_radius_w);
        var segments_radius_begin_y = Math.max(0, segment_y - segments_radius_h);
        var segments_radius_end_x = Math.min(segment_x + segments_radius_w + 1, segments_width);
        var segments_radius_end_y = Math.min(segment_y + segments_radius_h + 1, segments_height);

        // Получение точки вершины холма
        var segments_face_id = segment_x * 4 + segment_y * 4 * segments_width;
        var top_face = faces[segments_face_id];
        var top = vertices[top_face.a];

        // Вычисление положения точки холма
        var divider = Math.sqrt(2 * height * radius);
        function hill(v) {
            var y = height;
            var dividend = Math.pow((top.x - v.x), 2) + Math.pow((top.z - v.z), 2);
            if (dividend !== 0) {
                y = height - (dividend/divider);
            }
            if (y > 0) {
                v.y += y;
            }
        }

        // Обработка неполной диагонали точек сегмента
        function faceEdgePoints(face) {
            hill(vertices[face.a]);
            hill(vertices[face.c]);
        }

        // Обработка точек полигона в сегменте
        function segmentFacePoints(face) {
            hill(vertices[face.a]);
            hill(vertices[face.b]);
            hill(vertices[face.c]);
        }

        // Обработка диагонали точек сегмента
        function segmentDiagonalPoints(face_0, face_1) {
            hill(vertices[face_0.a]);
            hill(vertices[face_0.c]);
            hill(vertices[face_1.b]);
        }

        // Обработка первой точки холма
        hill(vertices[faces[segments_radius_begin_x * 4 + segments_radius_begin_y * 4 * segments_width].a]);

        // Посегментный проход по первому ряду точек зоны холма, исключая первый сегмент
        for (var x = segments_radius_begin_x + 1; x < segments_radius_end_x; ++x) {
            faceEdgePoints(faces[x * 4 + segments_radius_begin_y * 4 * segments_width]);
        }

        // Проход по центральным сегментам зоны холма
        for (var y = segments_radius_begin_y + 1; y < segments_radius_end_y - 1; ++y) {
            for (var x = segments_radius_begin_x; x < segments_radius_end_x - 1; ++x) {
                faceEdgePoints(faces[x * 4 + y * 4 * segments_width]);
            }
            segmentFacePoints(faces[x * 4 + y * 4*segments_width]);
        }

        // Посегментный проход по последнему ряду точек зоны холма, исключая последний сегмент
        for (var x = segments_radius_begin_x; x < segments_radius_end_x - 1; ++x) {
            var face_id = x * 4 + (segments_radius_end_y - 1) * 4 * segments_width;
            segmentDiagonalPoints(faces[face_id], faces[face_id + 1]);
        }
        segmentFacePoints(faces[x * 4 + (segments_radius_end_y - 1) * 4 * segments_width]);
    }

    var fx = [
        0, 20, -20, -20, 20, 0
    ];

    //// Построение кривой
    //function createCurve(pivots, points_num) {
    //    // Генерация кривой для количества точек меньше или равное количеству опорных - бессмысленно
    //    if (pivots.length <= points_num) {
    //        // Сплайн кривая на 5 точек
    //        function binom5(t, p0, s0, s1, s2, p1) {
    //            var a = (1 - t);
    //            return a * a * a * a * p0 +
    //                4 * a * a * a * t * s0 +
    //                6 * a * a * t * t * s1 +
    //                4 * a * t * t * t * s2 +
    //                t * t * t * t * p1;
    //        }
    //
    //        // Сплайн кривая на 4 точки
    //        function binom4(t, p0, s0, s1, p1) {
    //            var a = (1 - t);
    //            return a * a * a * p0 +
    //                3 * a * a * t * s0 +
    //                3 * a * t * t * s1 +
    //                t * t * t * p1;
    //        }
    //
    //        // Сплайн кривая на 3 точки
    //        function binom3(t, p0, s, p1) {
    //            var a = (1 - t);
    //            return a * a * p0 +
    //                2 * a * t * s +
    //                t * t * p1;
    //        }
    //
    //        var res = [];
    //        var point_shift = points_num / pivots.length;
    //
    //        if (3 == pivots.length) { // Генерация для 3 опорных точек
    //            var max = Math.floor(point_shift*3);
    //            for (var i = 0; i < max; ++i) {
    //                var t = i / (max - 1);
    //                res[i] = binom5(t, pivots[0], pivots[0], pivots[1], pivots[2], pivots[2]);
    //            }
    //        } else { // Генерация для опорных точек больше 3
    //            // Обработка первых 2 опорных точек
    //            var start = 0;
    //            var max = Math.floor(point_shift * 2);
    //            for (var i = start; i < max; ++i) {
    //                var t = i / (max - 1);
    //                res[i] = binom4(t, pivots[0], pivots[0], pivots[1], (pivots[1] + pivots[2]) / 2);
    //            }
    //            // Обработка центральных опорных точек
    //            for (var p = 2; p < (pivots.length - 2); ++p) {
    //                start = max;
    //                max = Math.floor(point_shift * (p + 1));
    //                for (var i = start; i < max; ++i) {
    //                    var t = (i - start) / (points_num - start);
    //                    res[i] = binom3(t, (pivots[p - 1] + pivots[p]) / 2, pivots[p], (pivots[p] + pivots[p + 1]) / 2);
    //                }
    //            }
    //            // Обработка последних 2 опорных точек
    //            start = max;
    //            var k = pivots.length - 1;
    //            for (var i = start; i < points_num; ++i) {
    //                var t = (i - start) / (points_num - start - 1);
    //                res[i] = binom4(t, (pivots[k - 2] + pivots[k - 1]) / 2, pivots[k - 1], pivots[k], pivots[k]);
    //            }
    //        }
    //    }
    //    return res;
    //}
    //
    //function setRoute(faces, vertices, route_sw, route_sh, route_arr) {
    //    // Обработка первого ряда точек не требуется
    //    var vc = route_sw + 1;
    //
    //    // Генерация верхних рядов точек и описание поверхностей их индексами по секторам
    //    var x = route_arr[1];
    //    for (var j = 1; j < route_sh; ++j) {
    //        // Обработка первой точки верхнего ряда
    //        vertices[vc++].x += x;
    //        // Обработка верхнего ряда точек
    //        for (var i = 1; i <= route_sw; ++i) {
    //            vertices[vc++].x += x;
    //            vertices[vc++].x += x;
    //        }
    //        x = route_arr[j + 1];
    //    }
    //    // Обработка предпоследнего ряда точек
    //    for (var i = 1; i <= route_sw; ++i) {
    //        vc++;
    //        vertices[vc++].x += x;
    //    }
    //}

    // Вычисление усреднённых вертикальных подъемов для ключевых точек горизонтальных изгибов трассы
    function getSplinePivots(faces, vertices, segments_w, segments_h,  sw, sh, route_arr) {
        var res = [];
        var delta_average = segments_h / (route_arr.length - 1); // смещение определятся количеством отрезков, а не точек
        var aver_sum = 0;
        var aver_radius = delta_average / 2;

        for (var riter in  route_arr) {
            // Получить точку изгиба трассы
            var sx = Math.floor(route_arr[riter] / sw + segments_w / 2);
            var sy = Math.floor(riter * delta_average);

            // Получить параметры зоны точки изгиба трассы
            var segments_radius_begin_x = Math.max(0, sx - aver_radius);
            var segments_radius_begin_y = Math.max(0, sy - aver_radius);
            var segments_radius_end_x = Math.min(sx + aver_radius + 1, segments_w);
            var segments_radius_end_y = Math.min(sy + aver_radius + 1, segments_h);

            // Получение средней высоты для данной позиции
            var max = 0;
            var summ = 0;
            for (var j = segments_radius_begin_y; j < segments_radius_end_y; ++j) {
                for (var i = segments_radius_begin_x; i < segments_radius_end_x; ++i) {
                    var face_id = i * 4 + j * 4 * segments_w;
                    var vert_id = faces[face_id].a;
                    max = Math.max(max, vertices[vert_id].y);
                    aver_sum += vertices[vert_id].y;
                    ++summ;
                }
            }
            // Получение координат ключевых точек трассы
            var x = sx * sw;
            var y = 0;
            if (aver_sum && summ) {
                y = aver_sum / summ;
            }
            var z = sy * sh;
            res[riter] = { x:x, y:y, z:z };
            //console.log('[' + max + '] ' + JSON.stringify(res[riter]));
        }
        return res;
    }

    // Итератор по рядам точек
    VerticesRowsForwardIterator = function(start, fw, fh, faces, vertices) {
        var _cur_row = 0;
        if (start < fh * 2) {
            _cur_row = start;
        } else {
            _cur_row = fh * 2;
        }
        var _cur_fi = 0;

        this.inc = function() {
            var row = [];
            var irow = 0;
            var face;
            if (!_cur_row) {
                // Получить 0 ряд точек
                for (irow = 0; irow < fw; ++irow) {
                    face = faces[irow * 4];
                    row[irow] = vertices[face.c];
                }
                row[irow] = vertices[face.b];
            } else if (_cur_row % 2) {
                // Получить не чётный ряд точек
                for (var i = _cur_fi; i < _cur_fi + fw; ++i) {
                    face = faces[i * 4];
                    row[irow++] = vertices[face.a];
                }
            } else {
                // Получить чётный ряд точек
                for (var i = _cur_fi; i < _cur_fi + fw; ++i) {
                    face = faces[(i * 4) + 2];
                    row[irow++] = vertices[face.b];
                }
                row[irow] = vertices[face.c];
                _cur_fi += fw;
            }
            ++_cur_row;
            return row;
        };

        this.curRow = function() {
            return _cur_row;
        }

        this.getRows = function() {
            return (fh * 2) + 1 - start;
        }
    };

    // Генерация трассы
    //var ROUTE_HKOEFF = 2;
    function setRoute(pivots, width_rou, swidth_rou, swidth_tir, sheight, tir_faces, tir_vertices, route_faces, route_vertices) {
        // Проход по опорным точкам
        if (pivots.length > 2) {
            var vrfi = new VerticesRowsForwardIterator(0, swidth_rou, sheight, route_faces, route_vertices);
            var row = vrfi.inc();
            // Присвоить первому ряду точек трассы значения опорных точек относительно ширины трассы
            var wshift = -width_rou / 2;
            for (var ir = 0; ir <= swidth_rou; ++ir) {
                row[ir].x = pivots[0].x + wshift;
                row[ir].y = pivots[0].y;
                row[ir].z = pivots[0].z;
                wshift += width_rou / swidth_rou; // сместиться на ширину сегмента
                //console.log(JSON.stringify(route_vertices[ir]));
            }

            // Получить дробное количество точек трассы в пределах отрезка опорных точек
            var hshift = vrfi.getRows() / (pivots.length - 1); // смещение определятся количеством отрезков, а не точек;
            var beg_pos = 0;
            for (var i = 0; i < pivots.length - 1; ++i) {
                var ra = pivots[i];     // стартовая точка отрезка кривой
                var rb = pivots[i + 1]; // завершающая точка отрезка кривой
                // Обработка точек трассы в пределах опорного отрезка
                var end_pos = Math.floor(hshift * (i + 1));
                console.log('# -> ' + beg_pos + ' <-> ' + end_pos);
                beg_pos = end_pos;
            }
        } else {
            console.log('Опорных точек должно быть больше 2');
        }
    }

    var sw = width / segments_width;
    var sh = height / segments_height;
    var _terrain_geometry = new Grid(sw, sh, -width / 2, -height / 2, segments_width, segments_height);
    for (var i = 0; i < 20; ++i) {
        generateHill(_terrain_geometry.faces, _terrain_geometry.vertices, sw, sh);
    }
    //_terrain_geometry.computeBoundingSphere();

    var spline_pivots = getSplinePivots(_terrain_geometry.faces, _terrain_geometry.vertices,
                                        segments_width, segments_height, sw, sh, fx);
    var tir_sh = segments_width; // Число сегментов тирейна в ширину.
    var route_w = 4; // Ширина трассы
    var route_h = height; // Длинна проекции трассы
    var route_sw = 4; // Число сегментов трассы в ширину
    //var route_sh = segments_height * ROUTE_HKOEFF; // Число сегментов в длинну больше числа сегментов тирейна в длинну.
    var route_sh = segments_height; // Число сегментов трассы в длинну.
    var _route_geometry = new Grid(route_w / route_sw, route_h / route_sh, -route_w / 2, -route_h / 2, route_sw, route_sh);
    //var route = createCurve(fx, route_sh);
    //setRoute(_route_geometry.faces, _route_geometry.vertices, route_sw, route_sh, route);
    setRoute(spline_pivots, route_w, route_sw, tir_sh, segments_height,
             _terrain_geometry.faces, _terrain_geometry.vertices,
             _route_geometry.faces, _route_geometry.vertices);

    //smootheRoute(_terrain_geometry.faces, _terrain_geometry.vertices, sw, sh,
    //             _route_geometry.faces, _route_geometry.vertices, route_sw, route_sh);

    // Создание итоговой сетки и применение к ней материала
    ////var _material = new THREE.MeshBasicMaterial({ color:0x00ff00 });
    //var _material = new THREE.MeshBasicMaterial({ color:0x00ff00, wireframe: true, transparent: true });
    //var _mesh = new THREE.Mesh(_terrain_geometry, _material);
    //_scope.add(_mesh);

    //var _material = new THREE.MeshBasicMaterial({ color:0x0000ff, wireframe: true, transparent: true });
    //var _mesh = new THREE.Mesh(_route_geometry, _material);
    //_scope.add(_mesh);
};
MODELS.Terrain.prototype = Object.create(THREE.Group.prototype);
