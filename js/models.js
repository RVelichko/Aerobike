/*!
 * \brief  Модуль игровых объектов игры "Летающий мотоцикл".
 * \author Rostislav Velichko. e: rostislav.vel@gmail.com
 * \date   11.20.2015
 */

var MODELS = {};

MODELS.Pilot = function() {};


MODELS.BikePelican = function() {
    THREE.Group.call(this);

    this.DGRAD = 5;
    this.FLOUTIN_DISTANCE_PERCENT = 0.5;
    this.MAX_SPEED = 40; ///< Метра в секунду.
    this.MIN_SPEED = 10; ///< Метра в секунду.
    this.SPEED_UP = 30; ///< Разгон до предельной скорости в секундах.
    this.SPEED_DOWN = 150; ///< Замедление в секундах.
    this.BREAKING = 20; ///< Торможение в секундах.
    this.HOVER_DISTANCE = 1.2; ///< Высота парения над поверхностью.
    this.HOVER_AMPLITUDE = 0.07; ///< Амплитуда парения над поверхностью.
    this.HOVER_FREQUENCE = 1.0; ///< Периодичность парения над поверхностью.
    
    this.timer = 0;
    this.cur_world_height = this.HOVER_DISTANCE;
    this.speed = 0;
    this.rotate_angle = 0;

    var _scope = this;
    var _animation;
    var _alpha = 0;

    var _animations = [];
    var _load_count = 0;

    /// Загрузка байка.
    loadModel("models/pelican.dae");
    /// Загрузка рокетного двигателя.
    //loadModel("mono_jet_01.dae");

    function loadModel(file_name_) {
        var loader = new UTILS.ModelLoader();
        loader.load(function(model_) {
            _scope.add(model_);
        }, file_name_);
    }

    this.update = function(dt_) {
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
    };
};
MODELS.Cloud.prototype = Object.create(THREE.Group.prototype);


/**
 * /brief  Генератор трассы
 * /param  width           - Ширина холмистого ландшафта
 * /param  height          - Длинна холмистого ландшафта
 * /param  segments_width  - Ширина сегмента сетки поверхности
 * /param  segments_height - длинна сегмента сетки поверхности
 */
MODELS.Terrain = function(conf) {
    THREE.Group.call(this);
    var _scope = this;

    this.VERGES_WIDTH_PERCENT = 0.5; ///< Процент от ширины тирейна для определения ширины обочины.
    this.route_width = conf.route_width;
    
    var NUM_HILLS = conf.hills_num;  ///< Количество генерируемых холмов.
    var ROUTE_HEGHT_PERCENT = 0.55;  ///< Процент от средней высоты в зоне ландшафта под опорной точкой перегиба трассы.
    var MIN_ROUTE_PIVOUT_COUNT = 5;  ///< Минимальное число поворотов трассы.
    var MAX_ROUTE_PIVOUT_COUNT = 20; ///< Максимальное число поворотов трассы.
    var ROUTE_Y_BASE = 0.02;
    var HEIGHT_SCALE = 55.0;
    var MAX_Y_BY_WIDTH_PERCENT = 0.33; ///< Процент от ширины тирейна для определения максимальной высоты.

    /**
     * /brief  Конвертор координаты <-> индекс на карте высот. Координаты и карта высот должны иметь единый центр координат
     * /param  width       - Координатная ширина
     * /param  height      - Координатная длинна
     * /param  segm_width  - Ширина в сегментах
     * /param  segm_height - Длинна в сегментах
     */
    Converter = function(conf) {
        conf.segments_width = conf.segments_width;
        conf.segments_height = conf.segments_height;

        conf.segm_w = conf.width / conf.segments_width; ///< ширина сермента в координатах
        conf.segm_h = conf.height / conf.segments_height; ///< длинна сермента в координатах

        this.width = function() {
            return conf.width;
        };

        this.height = function() {
            return conf.height;
        };

        this.segmentWidth = function() {
            return conf.segm_w;
        };

        this.segmentHeight = function() {
            return conf.segm_h;
        };

        this.widthInSegments = function() {
            return conf.segments_width;
        };

        this.heightInSegments = function() {
            return conf.segments_height;
        };

        this.pos = function(vec) {
            var sx = Math.min(Math.floor(Math.max(0, vec.x) / conf.segm_w + 0.5), conf.segments_width - 1);
            var sy = Math.min(Math.floor(Math.max(0, vec.z) / conf.segm_h + 0.5), conf.segments_height - 1);
            return {
                sx: sx,
                sy: sy,
                pos: sy * conf.segments_width + sx
            };
        };

        this.vecFromPos = function(pos) {
            return {
                x: (pos % conf.segments_width),
                y: 0,
                z: Math.floor(pos / conf.segments_width)
            };
        };

        this.vec = function(sx, sy) {
            return {
                x: (sx * conf.segm_w),
                y: 0,
                z: (sy * conf.segm_h)
            };
        };
    };


    /*
     * Генерация карты высот
     * hills - Необходимое число холмов
     * width - Ширина в сегментах
     * heigh - Длинна в сегментах
     */
    HegthMap = function(conf) {
        var width_in_segms = conf.conv.widthInSegments();
        var height_in_segms = conf.conv.heightInSegments();
        // Создать посегментную карту высот
        var max_y = 0;
        var d = [];
        var i;
        for (i = 0; i < width_in_segms * height_in_segms; ++i) {
            d[i] = 0;
        }
        // Генерация холмов в пределах сетки тирейна
        function hill() {
            var HILL_RADIUS_PERCENT = 0.45; ///< Процент от ширины ландшафта для вычисления радиуса холма
            var HILL_HEIGHT_PERCENT = 0.15; ///< Процент от ширины ландшафта для вычисления высоты холма
            // Генерация радиуса холма
            var min = Math.min(width_in_segms, height_in_segms);
            var r = Math.ceil(min * HILL_RADIUS_PERCENT * Math.random()); // Радиус в сегментах по ширине
            // Генерация высоты холма
            var hp = r * HILL_HEIGHT_PERCENT;
            var h = hp * Math.random() + hp * HILL_HEIGHT_PERCENT;
            // Выбор произвольного сегмента в пределах тирейна
            var theta = 6.28 * Math.random();
            var hw = width_in_segms * 0.5;
            var hh = height_in_segms * 0.5;
            var dw = (hw - r) * Math.random() + r * 0.5;
            var dh = (hh - r) * Math.random() + r * 0.5;
            var x = hw + Math.cos(theta) * dw;
            var z = hh + Math.sin(theta) * dh;
            //console.log(min + ' | ' + r + ' - ' + h + ' > ' + x + ',' + z);
            // Точку вершины холма
            var top = { x: x, y: 0, z: z };
            // Вычисление положения точки холма
            var divider = Math.sqrt(2 * h * r);
            function getHillHeight(v) {
                var y = h;
                var dividend = Math.pow((top.x - v.x), 2) + Math.pow((top.z - v.z), 2);
                if (dividend !== 0) {
                    y = h - (dividend/divider);
                }
                if (y < 0) {
                    y = 0;
                }
                return (v.y + y);
            }
            // Получить параметры зоны холма
            var beg_x = Math.max(0, Math.floor(x - r));
            var beg_z = Math.max(0, Math.floor(z - r));
            var end_x = Math.min(Math.floor(x + r), width_in_segms - 1);
            var end_z = Math.min(Math.floor(z + r), height_in_segms - 1);
            for (j = beg_z; j <= end_z; ++j) {
                for (i = beg_x; i <= end_x; ++i) {
                    var pos = j * width_in_segms + i;
                    var v = {
                        x: i,
                        y: d[pos],
                        z: j
                    };
                    if (max_y < v.y) {
                        max_y = v.y;
                    }
                    d[pos] = getHillHeight(v);
                    if (pos < 0) {
                        console.log('ERROR: HM!');
                    }
                }
            }
            //console.log(r + ',\t|' + x + ', ' + z + '| ' + dnz);
        }
        // Сгенерировать множество холмов
        for (var hs = 0; hs < conf.hills; ++hs) {
            hill();
        }
        // Нормализация карты высот
        for (i in d) {
            d[i] = (d[i] / max_y) * 0.5;
        }
        return d;
    };

    /*
     * Вычисление точек для направляющих векторов лежащих на касательной к кривой в заданной точке 
     * koords - Длинна сегмента
     */
    function computeControlPointsOfCurves(koords) {
        var p1 = [];
        var p2 = [];
        var n = koords.length - 1;
        // RHS вектор
        var a = [];
        var b = [];
        var c = [];
        var r = [];
        // Левый сегмент
        a[0] = 0;
        b[0] = 2;
        c[0] = 1;
        r[0] = koords[0] + 2 * koords[1];
        // Средние сегменты
        for (i = 1; i < n - 1; ++i) {
            a[i] = 1;
            b[i] = 4;
            c[i] = 1;
            r[i] = 4 * koords[i] + 2 * koords[i + 1];
        }
        // Правый сегмент
        a[n - 1] = 2;
        b[n - 1] = 7;
        c[n - 1] = 0;
        r[n - 1] = 8 * koords[n - 1] + koords[n];
        // Получить Ax=b по алгоритму Томаса
        for (i = 1; i < n; ++i) {
            m = a[i] / b[i - 1];
            b[i] = b[i] - m * c[i - 1];
            r[i] = r[i] - m * r[i - 1];
        }
        // Вычислить P1
        p1[n - 1] = r[n - 1] / b[n - 1];
        for (i = n - 2; i >= 0; --i) {
            p1[i] = (r[i] - c[i] * p1[i + 1]) / b[i];
        }
        // Вычислить P2
        for (i = 0; i < n - 1; ++i) {
            p2[i] = 2 * koords[i + 1] - p1[i + 1];
        }
        p2[n - 1] = 0.5 * (koords[n] + p1[n - 1]);
        var res = [];
        for (i = 0; i < n; ++i) {
            res[i] = {
                p0:koords[i], 
                p1:p1[i], 
                p2:p2[i], 
                p3:koords[i + 1] 
            };
        }
        return res;
    }

    /*
     * Вычисление значения координаты для 4 для 4- х точек, описывающих отрезок кривой 
     * t      - Прочент от общего отрезка кривой
     * p0     - Координата начала отрезка кривой
     * p1, p2 - Координаты, задающие изгиб кривой
     * p3     - Координата конца отрезкакривой
     */
    function binom4(conf) {
        var a   = (1 - conf.t);
        var at3 = a * conf.t * 3;
        return conf.p0 * a      * a      * a +
               conf.p1 * at3    * a + 
               conf.p2 * at3    * conf.t + 
               conf.p3 * conf.t * conf.t * conf.t;
    }

    /*
     * Генерация точек перегиба в горизонтальной плоскости
     * width       - ширина ландшафта
     * route_width - ширина трассы
     * min_points  - минимальное число изгобов
     * max_points  - максимальное число изгобов
     */
    function generatePivoutPoints(conf) {
        var fx = [];
        // Получить произвольное значение из [min_points; max_points]
        var count = Math.floor((conf.max_points - conf.min_points) * Math.random() + 0.5) + conf.min_points;
        fx[0] = conf.width * 0.5; ///< Первая точка всегда в центре
        // Получить значения перегибов в пределах ширины тирейна
        var w = conf.width - conf.route_width * 5.2;
        for (var i = 1; i < count; ++i) {
            fx[i] = w * Math.random() + conf.route_width * 2.4;
        }
        fx[count] = fx[0]; ///< Последняя точка всегда в центре
        return fx;
    }

    /*
     * Итератор по рядам точек
     * start,   - стартовый идентификатор ряда точек сетки
     * fw,      - количесво сегментов сетки в ширину
     * fh,      - количесво сегментов сетки в длинну
     * faces,   - массив полигонов ландшафта
     * vertices - массив вершин ландшафта
     */
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
            var i;
            if (!_cur_row) {
                // Получить 0 ряд точек
                for (irow = 0; irow < fw; ++irow) {
                    face = faces[irow * 4];
                    row[irow] = vertices[face.b];
                }
                row[irow] = vertices[face.c];
            } else if (_cur_row % 2) {
                // Получить не чётный ряд точек
                for (i = _cur_fi; i < _cur_fi + fw; ++i) {
                    face = faces[i * 4];
                    row[irow++] = vertices[face.a];
                }
            } else {
                // Получить чётный ряд точек
                for (i = _cur_fi; i < _cur_fi + fw; ++i) {
                    face = faces[(i * 4) + 2];
                    row[irow++] = vertices[face.c];
                }
                row[irow] = vertices[face.b];
                _cur_fi += fw;
            }
            ++_cur_row;
            return row;
        };

        this.curRow = function() {
            return _cur_row;
        };

        this.getRows = function() {
            return (fh * 2) + 1 - start;
        };
    };

    /*
     * Вычисление процента вертикальных подъемов от максимальной в пределах зоны, для ключевых точек горизонтальных изгибов трассы
     * height_map   - Карта высот тирейна,
     * route_width  - Ширина трассы в сегментах,
     * conv         - Конвертер координаты - индексы карты высот,
     * route_pivots - Массив опорных точек трассы
     */
    function getSplinePivots(conf) {
        var res = [];
        // смещение определятся количеством отрезков, а не точек
        var delta_average = conf.conv.height() / (conf.route_pivots.length - 1);
        // область для нахождения максимальной точки в радиусе 1/4 от длинны отрезка трасs
        var segm_aver_radius = delta_average / conf.conv.segmentHeight() * 0.33;
        // Коэффициент смещения центра координат трассы к центру координат карты высот
        // Проход по массиву X - составляющим опорных точек
        for (var riter = 0; riter < conf.route_pivots.length; ++riter) {
            // Получить координату точки трассы наиболее близкую к опорной
            var vec = {
                x: conf.route_pivots[riter],
                z: Math.floor(riter * delta_average + 0.5)
            };
            var pos = conf.conv.pos(vec);
            // Получить параметры зоны точки изгиба трассы
            var rbeg_x = Math.max(1, Math.floor(pos.sx - segm_aver_radius + 0.5));
            var rbeg_y = Math.max(1, Math.floor(pos.sy - segm_aver_radius + 0.5));
            var rend_x = Math.min(Math.floor(pos.sx + segm_aver_radius + 0.5), conf.conv.widthInSegments() - 1);
            var rend_y = Math.min(Math.floor(pos.sy + segm_aver_radius + 0.5), conf.conv.heightInSegments() - 1);
            // Получение максимальной высоты для данной позиции
            //console.log(JSON.stringify(pos) + '|' + segm_aver_radius + ' {' + rbeg_x + ',' + rbeg_y + ',' + rend_x + ',' + rend_y + '}');
            var max = 0;
            var segm_width = conf.conv.widthInSegments();
            for (var j = rbeg_y; j < rend_y; ++j) {
                for (var i = rbeg_x; i < rend_x; ++i) {
                    var map_id = j * segm_width + i;
                    max = Math.max(max, conf.height_map[map_id]);
                }
            }
            // Получение координат ключевых точек трассы
            var vertex = {
                x: vec.x,
                y: max * ROUTE_HEGHT_PERCENT,
                z: vec.z
            };
            res[riter] = vertex;
            //console.log(JSON.stringify(vertex));
        }
        // Первая и последние точки должны быть на нулевой высоте
        res[0].y = res[conf.route_pivots.length - 1].y = 0;
        return res;
    }

    /*
     * Получение кривой обочин трассы
     * height_map  - Карта высот тирейна,
     * conv        - Конвертер координаты - индексы карты высот,
     * route_width - Ширины трассы
     * route_centr - Центральная точка трассы на ряду точек тирейна
     * tir_id_beg  - Первый индекс ряда точек в карте высот
     */
    function generateVerges(conf) {
        var vec = {
            x: conf.route_centr.x,
            z: conf.route_centr.z
        };
        var pos = conf.conv.pos(vec);
        var sh = conf.conv.heightInSegments();
        var segm_verg_width = Math.floor(conf.route_width / conf.conv.segmentWidth() + 0.5);
        var hsvw = segm_verg_width;
        var beg = conf.tir_id_beg + pos.sx - segm_verg_width * (1 + _scope.VERGES_WIDTH_PERCENT);
        var beg_rou = conf.tir_id_beg + pos.sx - (segm_verg_width * _scope.VERGES_WIDTH_PERCENT);
        var end_rou = conf.tir_id_beg + pos.sx + (segm_verg_width * _scope.VERGES_WIDTH_PERCENT);
        var end = conf.tir_id_beg + pos.sx + segm_verg_width * (1 + _scope.VERGES_WIDTH_PERCENT);
        //console.log(JSON.stringify(vec) + '-> ' + beg + '|' + beg_rou + ' - ' + pos.sx + ' - ' + end_rou + '|' + end);

        if (beg < 0) {
            console.log('ERROR: HM!');
        }

        // Получение векторов касательных к крайним точкам сегментов
        var koords = [];
        koords[0] = conf.height_map[beg];
        koords[1] = conf.route_centr.y;
        koords[2] = conf.route_centr.y;
        koords[3] = conf.height_map[end];
        var cpc = computeControlPointsOfCurves(koords);
        //console.log(JSON.stringify(koords));
        // Получение лекой обочины
        var i;
        var binom_conf = {};
        var b;
        var t_div = 1 / (beg_rou - beg);
        var t;
        for (i = beg; i < beg_rou; ++i) {
            t = t_div * (i - beg);
            binom_conf = {
                t: t,
                p0: cpc[0].p0,
                p1: cpc[0].p1,
                p2: cpc[0].p2,
                p3: cpc[0].p3
            };
            b = binom4(binom_conf);
            conf.height_map[i] = b;
        }
        // Получение полотна трассы
        for (i = beg_rou; i < end_rou; ++i) {
            conf.height_map[i] = conf.route_centr.y;
        }
        // Получение правой обочины
        t_div = 1 / (end - end_rou);
        for (i = end_rou; i < end; ++i) {
            t = t_div * (i - end_rou);
            binom_conf = {
                t: t,
                p0: cpc[2].p0,
                p1: cpc[2].p1,
                p2: cpc[2].p2,
                p3: cpc[2].p3
            };
            b = binom4(binom_conf);
            conf.height_map[i] = b;
        }
        // Добавить пиксел текстуры трассы
        var a = pos.sx / conf.conv.widthInSegments();
        var b = pos.sy / conf.conv.heightInSegments();
        conf.route_map.push(a);
        conf.route_map.push(conf.route_centr.y);
        conf.route_map.push(b);
        //console.log(vec.z + '|' + pos.sy + ': ' + a + ', ' + conf.route_centr.y + ', ' + b);
    }

    /**
     * Генерация трассы
     * height_map   - Карта высот тирейна,
     * route_pivots - Массив опорных точек трассы,
     * conv         - Конвертер координаты - индексы карты высот,
     * route_pivots - Опорные точки трассы,
     * route_width  - Ширина трассы,
     */
    function generateRoute(conf) {
        /// Получить оптимизированные высоты для опорных точек трассы.
        var spiv_conf = {
            height_map: conf.height_map,
            route_width: conf.route_width,
            conv: conf.conv,
            route_pivots: conf.route_pivots
        };
        var pivot_verts = getSplinePivots(spiv_conf);

        // Подготовить данные для построения кривой в x и y плоскостях
        var x_koords = [];
        var y_koords = [];
        for (var i = 0; i < pivot_verts.length; ++i) {
            x_koords.push(pivot_verts[i].x);
            y_koords.push(pivot_verts[i].y);
        }
        // Послучить комплект горизонтальной кривизны трассы
        var x_cpc = computeControlPointsOfCurves(x_koords);

        // Послучить комплект вертикальной кривизны трассы
        var y_cpc = computeControlPointsOfCurves(y_koords);

        // Центральные точки трассы. 
        var route = [];

        if (x_cpc.length === y_cpc.length) {
            // Подготовка карты полотна трассы, представленном в виде массива 3d координат
            var route_map = [];
            var RGB = 3;
            for (var rmi in conf.conv.heightInSegments() * RGB) {
                route_map[rmi] = 0;
            }

            // Построение кривой трассы
            var sp_count = conf.conv.heightInSegments() / x_cpc.length; ///< Число точек трассы в карте высот
            var count_coef = 1 / conf.conv.heightInSegments(); ///< Поточечный корректирующий коэефициент смещения индексов
            var beg = 0;
            var segm_width = conf.conv.widthInSegments();
            var segm_height = conf.conv.heightInSegments();
            for (var s = 0; s < x_cpc.length; ++s) {
                // Построение сегмента
                var x_scpc = x_cpc[s];
                var y_scpc = y_cpc[s];
                var end = Math.floor((s + 1) * sp_count - count_coef + 0.5);
                // Коэффициент должен изменяться для обеспечения плавной стыковки частей кривой и при этом приходить в конечную точку
                var t_coef = 1 / (end - beg - s / (x_cpc.length - 1));
                for (var ti = 0; beg < end; ++beg, ++ti) {
                    var t = t_coef * ti;
                    var x_binom_conf = {
                        t: t,
                        p0: x_scpc.p0,
                        p1: x_scpc.p1,
                        p2: x_scpc.p2,
                        p3: x_scpc.p3
                    };
                    var y_binom_conf = {
                        t: t,
                        p0: y_scpc.p0,
                        p1: y_scpc.p1,
                        p2: y_scpc.p2,
                        p3: y_scpc.p3
                    };
                    var v = {
                        x: binom4(x_binom_conf),
                        y: binom4(y_binom_conf),
                        z: beg * conf.conv.segmentHeight()
                    };
                    route[beg] = v;
                }
                beg = end;
            }
            // Первая и последняя точки на нулевой высоте
            route[0].y = route[route.length - 1].y = 0;
            //console.log(route.length);

            // Пройти по карте высот
            var verges_conf = {};
            for (var j = 0; j < segm_height; ++j) {
                //console.log('> ' + route[j]);
                // Сгенерировать обочины для ряда точек трассы
                verges_conf = {
                    height_map: conf.height_map,
                    route_map: route_map,
                    conv: conf.conv,
                    route_width: conf.route_width,        // Ширины трассы
                    route_centr: route[j],                // Центральная точка трассы на ряду точек тирейна
                    tir_id_beg: j * segm_width
                };
                generateVerges(verges_conf);
            }
        }
        //route.reverse();
        return {
            pivot_verts: pivot_verts,
            route_map: route_map,
            center_verts: route 
        };
    }

    /**
     * Генератор сетки
     *  pos_x           - Смещение в начало координат: -width * 0.5,
     *  pos_z           - Смещение в начало координат: -height * 0.5,
     */
    Grid = function(conf) {
        var geometry = new THREE.Geometry();
        // Генерация первого ряда точек
        var swidth = conf.conv.width();
        var sheight = conf.conv.height();
        var i;
        var y = 0;
        for (i = 0; i <= swidth; i++) {
            geometry.vertices.push(new THREE.Vector3(conf.pos_x + i, 0, -conf.pos_z));
        }
        // Генерация верхних рядов точек и описание поверхностей их индексами по секторам
        var map_id = 0;
        var id_0 = 0;
        for (var j = 1; j <= sheight; j++) {
            // Генерация первой точки верхнего ряда
            geometry.vertices.push(new THREE.Vector3(conf.pos_x, 0, -(conf.pos_z + j)));
            // Генерация верхнего ряда точек c центральными точками
            for (i = 1; i <= swidth; i++) {
                // Центральная точка сегмента
                var vec = {
                    x: conf.pos_x + (i - 0.5),
                    z: -(conf.pos_z + (j - 0.5))
                };
                if (conf.height_map) {
                    map_id = conf.conv.pos({
                        x: vec.x - conf.pos_x,
                        z: -(vec.z + conf.pos_z)
                    }).pos;
                    y = conf.height_map[map_id] * conf.max_y;
                } else {
                    y = 0;
                }
                var mv = new THREE.Vector3(vec.x, y, vec.z);
                geometry.vertices.push(mv);

                // Верхняя правая точка сегмента
                vec.x = conf.pos_x + i;
                vec.z = -(conf.pos_z + j);
                if (conf.height_map) {
                    map_id = conf.conv.pos({
                        x: vec.x - conf.pos_x,
                        z: -(vec.z + conf.pos_z)
                    }).pos;
                    y = conf.height_map[map_id] * conf.max_y;
                } else {
                    y = 0;
                }
                var lv = new THREE.Vector3(vec.x, y, vec.z);
                geometry.vertices.push(lv);

                // Вычисление индексов точек для поверхностей текущего сектора
                var id_1 = id_0 + ((j > 1) ? 2 : 1);
                var id_4 = geometry.vertices.length - 1;
                var id_3 = id_4 - 1;
                var id_2 = id_3 - 1;
                // Вычисление описания сектора
                geometry.faces.push(
                    new THREE.Face3(id_3, id_0, id_1),  // face[a, b, c]
                    new THREE.Face3(id_3, id_1, id_4),  // face[a, b, c]
                    new THREE.Face3(id_3, id_4, id_2),  // face[a, b, c]
                    new THREE.Face3(id_3, id_2, id_0)); // face[a, b, c]
                // Пересчёт индекса нижней левой точки сектора в ряду
                id_0 += (j > 1) ? 2 : 1;
            }
            // Пересчёт индекса нижней левой точки сектора в столбце
            id_0 += 1;
        }
        return geometry;
    };

    /**
     * Функция генерации uv координат
     * conv      - Конвертер координат,
     * tir_geom: - Геометрия трассы
    */
    function generateTerrainUvs(conf) {
        var w = conf.conv.width();
        var h = conf.conv.height();
        var hw = w * 0.5;
        var hh = h * 0.5;
        var a;
        var b;
        var c;
        var uva;
        var uvb;
        var uvc;
        for (var fi in conf.tir_geom.faces) {
            a = conf.tir_geom.vertices[conf.tir_geom.faces[fi].a];
            b = conf.tir_geom.vertices[conf.tir_geom.faces[fi].b];
            c = conf.tir_geom.vertices[conf.tir_geom.faces[fi].c];
            uva = new THREE.Vector2((a.x + hw) / w, (a.z + hh) / h);
            uvb = new THREE.Vector2((b.x + hw) / w, (b.z + hh) / h);
            uvc = new THREE.Vector2((c.x + hw) / w, (c.z + hh) / h);
            conf.tir_geom.faceVertexUvs[0].push([uva, uvb, uvc]);
        }
    }

    /**
     * Функция генерации маски по высоте
     * conv     - Конвертер координат,
     * map:     - Геометрия трассы
     */
    function generateRouteTexture(conf) {
        var RGB = 3;
        var RGBA = 4;
        var pixelData = new Uint8Array(conf.conv.heightInSegments() * RGBA);
        var did = 0;
        var mid = conf.conv.heightInSegments() - 1;
        for (var i = conf.conv.heightInSegments() - 1; 0 <= i; --i) {
            mid = i * RGB;
            pixelData[did]     = Math.floor(255 * conf.map[mid]     + 0.5);
            pixelData[did + 1] = Math.floor(255 * conf.map[mid + 1] + 0.5);
            pixelData[did + 2] = Math.floor(255 * conf.map[mid + 2] + 0.5);
            pixelData[did + 3] = 255;
            did += RGBA;
        }
        const texture = new THREE.DataTexture(
            pixelData,
            1,
            conf.conv.heightInSegments(),
            THREE.RGBAFormat,
            THREE.UnsignedByteType,
            THREE.UVMapping);
        texture.needsUpdate = true;
        return texture;
    }

    /**
     * Функция генерации текстуры по карте высот
     * conv     - Конвертер координат,
     * map:     - Геометрия трассы
     */
    function generateTerrainTexture(conf) {
        var RGB = 3;
        var pixelData = new Uint8Array(conf.conv.widthInSegments() * conf.conv.heightInSegments() * RGB);
        var aid = 0;
        for (var y = conf.conv.heightInSegments() - 1; 0 <= y; --y) {
            for (var x = 0; x < conf.conv.widthInSegments(); ++x) {
                id = y * conf.conv.widthInSegments() + x;
                var ht = conf.map[id];
                var c = 255 * ht;
                pixelData[aid] = c;
                pixelData[aid + 1] = c;
                pixelData[aid + 2] = c;
                aid += RGB;
            }
        }
        const texture = new THREE.DataTexture(
            pixelData,
            conf.conv.widthInSegments(),
            conf.conv.heightInSegments(),
            THREE.RGBFormat,
            THREE.UnsignedByteType,
            THREE.UVMapping);
        texture.needsUpdate = true;
        return texture;
    }
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Конвертер координат в индекс карты высот и обратно
    var _conv = new Converter(conf);

    // Генерация Холмов
    var hm_conf = {
        hills: NUM_HILLS,
        conv: _conv
    };
    var _height_map = new HegthMap(hm_conf);

    // Генерация опорных точек трассы
    var rp_conf = {
        width: conf.width,
        route_width: conf.route_width,
        min_points: MIN_ROUTE_PIVOUT_COUNT,
        max_points: MAX_ROUTE_PIVOUT_COUNT
    };
    var _route_pivots = generatePivoutPoints(rp_conf);

    // Построение трассы
    var route_conf = {
        height_map: _height_map,
        conv: _conv,
        route_pivots: _route_pivots,
        route_width: conf.route_width
    };
    var _route = generateRoute(route_conf);

    var _max_y_koef = _conv.widthInSegments() * MAX_Y_BY_WIDTH_PERCENT;

    // // * Отрисовка опорных точек
    // var darkMaterial = new THREE.MeshBasicMaterial( { color: 0xff7733 } );
    // var wireframeMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00, wireframe: true, transparent: true } );
    // var multiMaterial = [ darkMaterial, wireframeMaterial ];
    // for(var sp in _route.pivot_verts) {
    //     var octagedron = new THREE.OctahedronGeometry(0.8, 0);
    //     var shape = THREE.SceneUtils.createMultiMaterialObject(octagedron, multiMaterial);
    //     var pos = _route.pivot_verts[sp];
    //     shape.position.set(pos.x - _conv.width() * 0.5, pos.y * _max_y_koef, -pos.z + conf.height * 0.5);
    //     _scope.add(shape);
    // }
    // // * __________________________________________________

    // Генерация сетки тирейна
    var grid_conf = {
        conv: _conv,
        pos_x: -conf.width * 0.5,
        pos_z: -conf.height * 0.5,
        height_map: _height_map,
        max_y: _max_y_koef
    };
    var _terrain_geometry = new Grid(grid_conf);
    _terrain_geometry.computeFaceNormals();
    _terrain_geometry.computeVertexNormals();
    _terrain_geometry.computeTangents();

    // Подготовка текстурных координат
    var uvs_conf = {
        conv: _conv,
        tir_geom: _terrain_geometry
    };
    generateTerrainUvs(uvs_conf);

    // Получить текстуру трассы
    var rtex_conf = {
        conv: _conv,
        map: _route.route_map
    };
    var route_curve = generateRouteTexture(rtex_conf);

    // Получить текстуру карты высот
    var tirhmtex_conf = {
        conv: _conv,
        map: _height_map
    };
    var tir_hm_tex = generateTerrainTexture(tirhmtex_conf);
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    // Загрузка шейдеров тирейна
    var terrain_vert_sh = '';
    var terrain_frag_sh = '';
    var sh_loading_manager = new THREE.LoadingManager(function() {
        // Загрузка текстур тирейна
        var ocean_texture = {};
        var sandy_texture = {};
        var grass_texture = {};
        var rocky_texture = {};
        var water_tex = {};
        var hmap_texture = {};

        var tex_loading_manager = new THREE.LoadingManager(function() {
            ocean_texture.wrapS = ocean_texture.wrapT = THREE.RepeatWrapping;
            sandy_texture.wrapS = sandy_texture.wrapT = THREE.RepeatWrapping;
            grass_texture.wrapS = grass_texture.wrapT = THREE.RepeatWrapping;
            rocky_texture.wrapS = rocky_texture.wrapT = THREE.RepeatWrapping;
            water_tex.wrapS = water_tex.wrapT = THREE.RepeatWrapping;

            var custom_uniforms = {
                height_texture: { type: "t", value: tir_hm_tex },
                height_scale:   { type: "f", value: HEIGHT_SCALE },
                route_width:    { type: "t", value: (conf.route_width * _conv.segmentWidth() / _conv.widthInSegments()) },
                route_curve:    { type: "t", value: route_curve },
                route_texture:  { type: "t", value: sandy_texture },
                ocean_texture:  { type: "t", value: ocean_texture },
                sandy_texture:  { type: "t", value: sandy_texture },
                grass_texture:  { type: "t", value: grass_texture },
                rocky_texture:  { type: "t", value: rocky_texture }
            };
            console.log('route_width: ' + custom_uniforms.route_width.value);

            // Загрузка шейдеров
            var terrain_material = new THREE.ShaderMaterial({
                //wireframe: true,
                uniforms: custom_uniforms,
                vertexShader: terrain_vert_sh,
                fragmentShader: terrain_frag_sh
            });
            terrain_material.transparent = true;

            // построение воды
            var water_geo = new THREE.PlaneGeometry(1000, 1000, 1, 1);
            water_tex.repeat.set(5, 5);
            var water_mat = new THREE.MeshBasicMaterial({ map:water_tex, transparent:true, opacity:0.40 });
            var water = new THREE.Mesh(water_geo, water_mat);
            water.rotation.x = -Math.PI * 0.5;
            _scope.add(water);

            var mesh_tir = new THREE.Mesh(_terrain_geometry, terrain_material);
            mesh_tir.receiveShadow  = true;
            _scope.add(mesh_tir);
        });
        var texture_loader = new THREE.TextureLoader(tex_loading_manager);
        ocean_texture = texture_loader.load('textures/dirt-512.jpg');
        sandy_texture = texture_loader.load('textures/sand-512.jpg');
        grass_texture = texture_loader.load('textures/grass-512.jpg');
        rocky_texture = texture_loader.load('textures/rock-512.jpg');
        water_tex = texture_loader.load('textures/water-512.jpg');
    });
    var file_loader = new THREE.FileLoader(sh_loading_manager);
    file_loader.load('shaders/Terrain.vert', function(data) {
        terrain_vert_sh = data;
    });
    file_loader.load('shaders/Terrain.frag', function(data) {
        terrain_frag_sh = data;
    });
    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    function testPoint() {
        var darkMaterial = new THREE.MeshBasicMaterial( { color: 0xff7733 } );
        var wireframeMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00, wireframe: true, transparent: true } );
        var multiMaterial = [ darkMaterial, wireframeMaterial ];
        var octagedron = new THREE.OctahedronGeometry(58, 0);
        var shape = THREE.SceneUtils.createMultiMaterialObject(octagedron, multiMaterial);
        return shape; 
    };
    var _test_pt = testPoint();
    _scope.add(_test_pt);

    // var _A = new THREE.Matrix3();
    // var _B = new THREE.Matrix3();
    // var _C = new THREE.Matrix3();
    // var _D = new THREE.Matrix3();
    // var _old_height_by_pos = 0;
    var _old_v = new THREE.Vector3();

	/**
	 * \brief  Метод выполняет поиск ближайшей точки сетки для переданного вектора.
	 * \param  vec_::{x, y, z} Произвольный вектор.
	 * \return  Возвращается вектор с установленной высотой для переданной позиции, нормаль и ближайшую точку от центра трассы. 
	 */
	this.getVertexByPos = function(vec_) {
        function convertToPosition(v_, subw_, subh_) {
            return { 
                x: (v_.x - subw_), 
                y: v_.y * _max_y_koef, 
                z: -(v_.z - subh_) 
            };
        };
		var v = {
			x: vec_.x, y: 0, z: -vec_.z
		};
        /// Получить смещение трассы относительно расположения точки.
        var sub_swidth = _conv.width() * 0.5;
        var sub_sheight = _conv.height() * 0.5;
        /// Получить флаги принадлежости точки тирейну в длинну.
        var is_bz = (-sub_sheight <= vec_.z);
        var is_ez = (vec_.z <= sub_sheight);
        var route_v = new THREE.Vector3();
        if (!is_bz) {
            /// Вернуть последнюю точку центра трассы.
            var rv = convertToPosition(_route.center_verts[_route.center_verts.length - 1], sub_swidth, sub_sheight);
            route_v.x = rv.x;
            route_v.z = rv.z;
        }
        if (!is_ez) {
            /// Вернуть первую точку центра трассы.
            var rv = convertToPosition(_route.center_verts[0], sub_swidth, sub_sheight);
            route_v.x = rv.x;
            route_v.z = rv.z;
        }
        // Проверить принадлежность точки площади трассы.
        if ((-sub_swidth <= vec_.x && vec_.x <= sub_swidth) && (is_bz && is_ez)) {
            /// Проекция мировой координаты в координаты карты высот.
            v.x += sub_swidth;
            v.z += sub_sheight;
            /// Получить индекс высоты на карте высот.
            var p = _conv.pos(v);
            /// Получить ближайщую точку на центральной линии трассы.
            var r_pos = p.sy;
            var rv = convertToPosition(_route.center_verts[r_pos], sub_swidth, sub_sheight);
            route_v.x = rv.x;
            route_v.y = rv.y;
            route_v.z = rv.z;
            //console.log('> [' + r_pos + ']' + JSON.stringify(vec_) + '|' + JSON.stringify(route_v));
            /// Найти проекцию заданной точки на полигон, поиск производиться в горизонтальной плоскости XZ.
            var hv = _conv.vec(p.sx, p.sy);
            // var hv_pos = (hv.x + hv.z * _conv.width()) * 4;
            // for (var fi = hv_pos; fi < hv_pos + 4; ++fi) {
                // console.log('>' + hv_pos + '; ' + JSON.stringify(p));
                // var face = _terrain_geometry.faces[fi];
                // var va = _terrain_geometry.vertices[face.a];
                // var vb = _terrain_geometry.vertices[face.b];
                // var vc = _terrain_geometry.vertices[face.c];
                // var arr = [
                    // { x:va.x, y:va.z },
                    // { x:vb.x, y:vb.z },
                    // { x:vc.x, y:vc.z }
                // ];
                // var point = { x:v.x, y:v.z };
                // /// Если точка в зоне полигона, найти проекцию точки на плоскость полигона и нормаль.
                // if (UTILS.Polygon.isBelong(arr, point)) {
                    // var vba = new THREE.Vector3((vb.x - va.x), (vb.y - va.y), (vb.z - va.z));
                    // var vcb = new THREE.Vector3((vc.x - vb.x), (vc.y - vb.y), (vc.z - vb.z));
                    // /// Получение нормали к плоскости полигона.
                    // cross.crossVectors(vba, vcb);
                    // cross.normalize();
                    // /// Получение проекции вектора позиции на плоскость.
                    // // var vp = new THREE.Vector3((vec_.x - va.x), (vec_.y - va.y), (vec_.z - va.z));
                    // // vp.projectionOnPlane(cross);
                    // /// Получить расстояние от точки на нулевой высоте до пересечения с плоскостью полигона.
                    // /// d = (Ax + By + Cz + D) / sqrt(sqr(A) + sqr(B) + sqr(C)) | A = Nx; B = Ny; C = Nz
                    // // _A.set(
                        // // va.y, va.z, 1,
                        // // vb.y, vb.z, 1,
                        // // vc.y, vc.z, 1
                    // // );           
                    // // _B.set(
                        // // va.z, va.x, 1,
                        // // vb.z, vb.x, 1,
                        // // vc.z, vc.x, 1
                    // // );           
                    // // _C.set(
                        // // va.x, va.y, 1,
                        // // vb.x, vb.y, 1,
                        // // vc.x, vc.y, 1
                    // // );           
                    // // _D.set(
                        // // va.z, va.x, va.y,
                        // // vb.z, vb.x, vb.y,
                        // // vc.z, vc.x, vc.y
                    // // );       
                    // // var A = _A.determinant(); 
                    // // var B = _C.determinant();
                    // // var C = _B.determinant();
                    // // var D = _D.determinant();   
                    // // v.y = (A * vec_.x + C * vec_.z + D) / B;
                    // // var height_by_pos = Math.sqrt(va.y * va.y + vb.y * vb.y + vc.y * vc.y);
                    // // if (_old_height_by_pos !== height_by_pos) {
// //                         
                    // // } 
                    // /// Получить среднюю высоту точек полигона.
                    // //v.y = Math.sqrt(va.y * va.y + vb.y * vb.y + vc.y * vc.y);
                    // // v.y = vp.y + va.y;
                // }
            // }
            /// Сохранить высоту.
            var y = _height_map[p.pos] * (_conv.widthInSegments() * MAX_Y_BY_WIDTH_PERCENT);
            var pa = new THREE.Vector3((hv.x - _old_v.x), _old_v.y, (hv.z - _old_v.z));
            var pb = new THREE.Vector3((vec_.x - _old_v.x), y, (vec_.z - _old_v.z));
            pa.projectOnVector(pb);
            v.y = pa.y;
            _old_v.x = pa.x + _old_v.x; 
            _old_v.y = pa.y; 
            _old_v.z = pa.z + _old_v.z;
        }
        _test_pt.position.set(v.x, v.y, v.z);
        console.log('>' + JSON.stringify(v));
        return { 
            v:v, 
            r:route_v, 
            d2r: route_v.distanceTo({ x: vec_.x, y: route_v.y, z: vec_.z })  
        };
    };

    /// Методы "гетеры"
    this.getHeightMap = function() {
        return _height_map;
    };

    this.getRouteMap = function() {
        return _route.route_map;
    };

    this.getWidth = function() {
        return conf.segments_width;
    };

    this.getHeight = function() {
        return conf.segments_height;
    };
};
MODELS.Terrain.prototype = Object.create(THREE.Group.prototype);
