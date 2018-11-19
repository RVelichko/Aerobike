/*!
 * \brief  Набор утилит загрузки моделей, обработки элементов документа.
 * \author Rostislav Velichko. e: rostislav.vel@gmail.com
 * \date   11.20.2015
 */

var UTILS = {};


UTILS.CreateStyle = function(inner_html) {
    var style = document.createElement('style');
    style.innerHTML = inner_html;
    document.head.appendChild(style);
    return style;
};


UTILS.CreateContainer = function(container_name) {
    var container = document.createElement('div');
    container.id = container_name;
    document.body.appendChild(container);
    return container;
};


UTILS.Display = function(element) {
    var _element = element;

    getRealDisplay = function(elem) {
        var computedStyle;
        if (elem.currentStyle) {
            return elem.currentStyle.display;
        } else if (window.getComputedStyle) {
            computedStyle = window.getComputedStyle(elem, null);
            return computedStyle.getPropertyValue('display');
        }
    };

    this.hide = function() {
        _element.style.display = "none";
    };

    var _display_cache = {};

    this.show = function() {
        if (getRealDisplay(_element) !== 'none') {
            return;
        }

        var old = _element.getAttribute("displayOld");
        _element.style.display = old || "";

        if (getRealDisplay(_element) === "none") {
            var node_name = _element.nodeName;
            var body = document.body;
            var display = null;
            if (_display_cache[node_name]) {
                display = _display_cache[node_name];
            } else {
                var test_element = document.createElement(node_name);
                body.appendChild(test_element);
                display = getRealDisplay(test_element);
                if (display === "none") {
                    display = "block";
                }
                body.removeChild(test_element);
                _display_cache[node_name] = display;
            }
            _element.setAttribute('displayOld', display);
            _element.style.display = display;
        }
    };
};


UTILS.getGradientTexture = function(w, h) {
    //var end_r = (w < h) ? h/2 : w/2;
    //var gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, end_r);
    //gradient.addColorStop(0.5, 'rgba(10,15,50,0.9)');
    //gradient.addColorStop(1, 'rgba(60,60,80,0.6)');
    //return gradient;

    var canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;

    var context = canvas.getContext('2d');
    var gradient = context.createRadialGradient(w / 2,  h / 2,  0,  w / 2,  h / 2,  w / 2);
    gradient.addColorStop(0.5, 'rgba(15,15,50,1)');
    gradient.addColorStop(1, 'rgba(60,60,80,0)');

    context.fillStyle = gradient;
    context.fillRect(0, 0, w, h);
    var texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
};


UTILS.loadTexture = function(path, callback, texture_placeholder) {
    var texture = new THREE.Texture(texture_placeholder);
    var material = new THREE.MeshPhongMaterial({map:texture, overdraw:true});
    var image = new Image();
    image.onload = function() {
        texture.needsUpdate = true;
        material.map.image = this;
        callback();
    };
    image.src = path;
    return material;
};


UTILS.ProgressManager = function() {
    THREE.LoadingManager.call(this);
    var _scope = this;

    _scope.onProgress = function(item, loaded, total) {
        //console.log(item, loaded, total);
    };
};
UTILS.ProgressManager.prototype = Object.create(THREE.LoadingManager.prototype);



UTILS.ColladaLoader = function() {
    THREE.ColladaLoader.call(this);
    this.options.convertUpAxis = true;
    var _scope = this;
    var _on_load;

    function onLoad(collada) {
        var dae = collada.scene;
        dae.traverse(function(child) {
            if( child.material) {
                child.material.transparent = true;
                child.material.side = THREE.DoubleSide;
            }
            if (child instanceof THREE.SkinnedMesh) {
                animations[load_count] = new THREE.Animation(child, child.geometry.animation);
                camera.lookAt(child.position);
                for(var animation in animations) {
                    animations[animation].play();
                }
                console.log("play animations");
            }
        });
        dae.updateMatrix();
        if (_on_load) {
            _on_load(dae, animation);
        }
    }

    this.load = function(url, on_load) {
        _on_load = on_load;
        _scope.constructor.prototype.load.call(url, onLoad);
    };
};
UTILS.ColladaLoader.prototype = Object.create(THREE.ColladaLoader.prototype);


UTILS.ModelLoader = function() {
    var _model;
    var _loader = new THREE.ColladaLoader();

    this.load = function(callback, file_name) {
        _loader.options.convertUpAxis = true;
        var url = file_name;
        _loader.load(url, function(collada) {
            var dae = collada.scene;
            dae.traverse(function(child) {
                if( child.material) {
                    child.material.transparent = true;
                    child.material.side = THREE.DoubleSide;
                }
                if (child instanceof THREE.SkinnedMesh) {
                    animations[load_count] = new THREE.Animation(child, child.geometry.animation);
                    camera.lookAt(child.position);
                    for(var animation in animations) {
                        animations[animation].play();
                    }
                    console.log("play animations");
                }
            });
            dae.updateMatrix();
            _model = dae;
            if (callback) {
                callback(dae);
            }
        }, function(xhr) {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        });
    };

    this.getModel = function() {
        return _model;
    };
};


UTILS.Easing = {
    // no easing, no acceleration
    linear: function(t) {
        return t;
    },
    // accelerating from zero velocity
    inQuad: function(t) {
        return t * t;
    },
    // decelerating to zero velocity
    outQuad: function(t) {
        return t * (2 - t);
    },
    // acceleration until halfway, then deceleration
    inOutQuad: function(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    },
    // accelerating from zero velocity
    inCubic: function(t) {
        return t * t * t;
    },
    // decelerating to zero velocity
    outCubic: function(t) {
        return (--t) * t * t + 1;
    },
    // acceleration until halfway, then deceleration
    inOutCubic: function(t) {
        return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    },
    // accelerating from zero velocity
    inQuart: function(t) {
        return t * t * t * t;
    },
    // decelerating to zero velocity
    outQuart: function(t) {
        return 1 - (--t) * t * t * t;
    },
    // acceleration until halfway, then deceleration
    inOutQuart: function(t) {
        return t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t;
    },
    // accelerating from zero velocity
    inQuint: function(t) {
        return t * t * t * t * t;
    },
    // decelerating to zero velocity
    outQuint: function(t) {
        return 1 + (--t) * t * t * t * t;
    },
    // acceleration until halfway, then deceleration
    inOutQuint: function(t) {
        return t < 0.5 ? 16 * t * t * t * t * t : 1 + 16 * (--t) * t * t * t * t;
    }
};



UTILS.Periodics = {
    /**
     * \brief Синусоидальная периодическая функция.
     * \param t Значения от 0 до 1. 
     * \param f Частота перидических повторений для t. 
     * \return Вычисленные значения в диапазоне - 1 до 1. 
     */ 
    sinus: function(t, f) {
        var rad360 = Math.PI * 2;
        return Math.sin(rad360 * t * f);
    } 
};


UTILS.Polygon = {
    isBelong: function(poly_vertices_, point_) {
        if (poly_vertices.constructor === Array) {
            var c = 0;
            var p = point_;
            var len = poly_vertices_.length;
            for (var i = 0, j = len - 1; i < len; j = i++) {
                var va = poly_vertices[i];
                var vb = poly_vertices[j];
                if (((va.y < vb.y) && (va.y <= y) && (y <= vb.y) &&
                     ((vb.y - va.y) * (x - va.x) > (vb.x - va.x) * (y - va.y))) || (
                     (va.y > vb.y) && (vb.y <= y) && (y <= va.y) &&
                     ((vb.y - va.y) * (x - va.x) < (vb.x - va.x) * (y - va.y)))) {
                    c = !c;
                }
            }
        }
        return c;
    }
};


UTILS.Line = function(color_, from_, to_) {
    THREE.Group.call(this);
    var material = new THREE.LineBasicMaterial({ 
        color: color_ 
    });
    var geometry = new THREE.Geometry();
    geometry.vertices.push(
        new THREE.Vector3(from_.x, from_.y, from_.z),
        new THREE.Vector3(to_.x, to_.y, to_.z)
    );
    this.add(new THREE.Line(geometry, material));
};
UTILS.Line.prototype = Object.create(THREE.Group.prototype);


UTILS.TextureLoader = function() {
    THREE.ImageLoader.call(this);
    var _scope = this;
    var _texture;
    var _on_load;

    this.load = function(texture_path, on_load) {
        _on_load = on_load;
        _scope.constructor.prototype.load.call(_scope, texture_path, onLoad);
    };

    function onLoad(image) {
        _texture = new THREE.Texture();
        _texture.image = image;
        _texture.needsUpdate = true;
        _texture.wrapS = _texture.wrapT = THREE.RepeatWrapping;
        _texture.anisotropy = 16;
        if (_on_load) {
            _on_load(_texture);
        }
    }
};
UTILS.TextureLoader.prototype = Object.create(THREE.ImageLoader.prototype);


