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
    var _scope = this;
    var _on_load;

    this.load = function(url, on_load) {
        _on_load = on_load;
        _scope.constructor.prototype.load.call(url, onLoad);
    }

    function onLoad(collada) {
        var dae = collada.scene;
        var animation;
        dae.traverse(function (child) {
            if (child instanceof THREE.SkinnedMesh) {
                animation = new THREE.Animation(child, child.geometry.animation);
            }
        });
        dae.updateMatrix();
        if (_on_load) {
            _on_load(dae, animation);
        }
    }
};
UTILS.ColladaLoader.prototype = Object.create(THREE.ColladaLoader.prototype);

//var callbackProgress = function( progress, result ) {
//
//    var bar = 250,
//        total = progress.totalModels + progress.totalTextures,
//        loaded = progress.loadedModels + progress.loadedTextures;
//
//    if ( total )
//        bar = Math.floor( bar * loaded / total );
//
//    $( "bar" ).style.width = bar + "px";
//
//};


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
