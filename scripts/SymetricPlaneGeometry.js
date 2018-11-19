MODELS.SymetricPlaneGeometry = function(width, height, widthSegments, heightSegments) {
    THREE.Geometry.call(this);
    //this.type = 'SymetricPlaneGeometry';
    var _scope = this;

    this.parameters = {
        width: width,
        height: height,
        widthSegments: widthSegments,
        heightSegments: heightSegments
    };

    if (!width) {
        width = width * -1;
    }

    if (!height) {
        height = height * -1;
    }

    // Получить размеры сторон ячейки
    var sw = width / widthSegments;
    var sh = height / heightSegments;
    // Получить стартовые позиции сетки
    var xn = -(width / 2.0);
    var zn = -(height / 2.0);
    console.log("> " + sw +", " + sh + ", " + xn + ", " + zn);

    _scope.vertices.push(
        new THREE.Vector3(-10, 0, -10),
        new THREE.Vector3(0,   0, 0),
        new THREE.Vector3(10,  0, -10),
        new THREE.Vector3(-10, 0, 10),
        new THREE.Vector3(10,  0, 10));

    //var n = new THREE.Vector3(0, 1, 0);
    //
    //var uv1 = new THREE.Vector2(0, 0);
    //var uv2 = new THREE.Vector2(0.5, 0.5);
    //var uv3 = new THREE.Vector2(1, 0);
    //var uv4 = new THREE.Vector2(0, 1);
    //var uv5 = new THREE.Vector2(1, 1);

    //_scope.faces.push(new THREE.Face3(0, 1, 2, [n, n, n], undefined, 0));
    //_scope.faces.push(new THREE.Face3(2, 1, 4, [n, n, n], undefined, 0));
    //_scope.faces.push(new THREE.Face3(4, 1, 3, [n, n, n], undefined, 0));
    //_scope.faces.push(new THREE.Face3(3, 1, 0, [n, n, n], undefined, 0));
    _scope.faces.push(new THREE.Face3(0, 1, 2));
    //_scope.faces.push(new THREE.Face3(2, 1, 4));
    //_scope.faces.push(new THREE.Face3(4, 1, 3));
    //_scope.faces.push(new THREE.Face3(3, 1, 0));

    THREE.Geometry.prototype.computeBoundingSphere();
    //_scope.computeBoundingSphere();

    //_scope.faceVertexUvs[0].push([uv1, uv2, uv3, uv4, uv5]);

    //this.computeFaceNormals();
    //_scope.verticesNeedUpdate = true;
    //this.computeVertexNormals();

    ////var vertices = new Float32Array(((widthSegments + 1) * (heightSegments + 1) + (widthSegments * heightSegments)) * 3);
    ////var normals = new Float32Array( gridX1 * gridY1 * 3 );
    ////var uvs = new Float32Array( gridX1 * gridY1 * 2 );
    //
    //var offset = 0;
    //var fuvc = 0;
    //var fc = 0;
    //for (var j = 0; j < heightSegments; ++j) {
    //    var xni = xn;
    //    for (var i = 0; i < widthSegments; ++i) {
    //        // Добавить уникальные вершины текущей ячейки
    //        //vertices[offset++] = xni;          vertices[offset++] = 0; vertices[offset++] = zn;
    //        //vertices[offset++] = xni + sw/2.0; vertices[offset++] = 0; vertices[offset++] = zn + sh/2.0;
    //        _scope.vertices.push(new THREE.Vector3(xni, 0, zn));
    //        _scope.vertices.push(new THREE.Vector3((xni + sw/2.0), 0, (zn + sh/2.0)));
    //
    //        // Добавить UV координаты
    //        xni += sw; // Переместить координаты по ряду
    //
    //        // Добавить идентификаторы точек для треугольников сетки
    //        var fi = i * 2 + fc; // существующие вершины
    //        var k = (j == heightSegments - 1) ? 1 : 2;
    //        var ff = fi + widthSegments * 2 + 1; // Будут добавлены при формировании следующего ряда
    //        _scope.faces.push(new THREE.Face3(fi,     fi + 1, fi + 2));
    //        _scope.faces.push(new THREE.Face3(fi + 2, fi + 1, ff + k));
    //        _scope.faces.push(new THREE.Face3(ff + k, fi + 1, ff));
    //        _scope.faces.push(new THREE.Face3(ff,     fi + 1, fi));
    //
    //        //_scope.face.vertexNormals.push(
    //
    //        console.log(
    //            "[" + fi + "," + (fi + 1) + ","  + (fi + 2) + "] " +
    //            "[" + (fi + 2) + "," + (fi + 1) + "," + (ff + k) + "] " +
    //            "[" + (ff + k) + "," + (fi + 1) + "," + ff + "] " +
    //            "[" + ff + "," + (fi + 1) + "," + fi + "]"
    //        );
    //    }
    //    _scope.vertices.push(new THREE.Vector3(xn + sw, 0, zn)); // последняя вершина в ряду сетки
    //    zn += sh; // Переместить координаты на следующий ряд
    //    fc += widthSegments * 2 + 1;
    //}
    //// Добавить последний ряд вершин
    //for (var i = 0; i <= widthSegments; ++i) {
    //    //vertices[offset++] = xni; vertices[offset++] = 0; vertices[offset++] = zn;
    //    _scope.vertices.push(new THREE.Vector3(xn, 0, zn));
    //    xn += sw;
    //}
    //
    //// Сгенерировать UV координаты
    //for (var f in _scope.faces) {
    //    var a = _scope.vertices[_scope.faces[f].a];
    //    var b = _scope.vertices[_scope.faces[f].b];
    //    var c = _scope.vertices[_scope.faces[f].c];
    //    var uva = new THREE.Vector2((a.x + width/2.0)/width, (a.z + height/2.0)/height);
    //    var uvb = new THREE.Vector2((b.x + width/2.0)/width, (b.z + height/2.0)/height);
    //    var uvc = new THREE.Vector2((c.x + width/2.0)/width, (c.z + height/2.0)/height);
    //    _scope.faceVertexUvs[0].push(uva);
    //    _scope.faceVertexUvs[0].push(uvb);
    //    _scope.faceVertexUvs[0].push(uvc);
    //    //_scope.faceVertexUvs[fuvc++].push(new THREE.Vector2(), new THREE.Vector2(), new THREE.Vector2());
    //    //_scope.faceVertexUvs[fuvc++].push(new THREE.Vector2());
    //    //_scope.faceVertexUvs[fuvc++].push(new THREE.Vector2());
    //    //_scope.faceVertexUvs[fuvc++].push(new THREE.Vector2());
    //    //console.log("{" + v.x + "," + v.z + "}");
    //    //var vv = _scope.vertices[v];
    //    //console.log("> " + v +" {" + vv.x + ";" + vv.z + "}");
    //}
    //
    //////for (var v in _scope.vertices) {
    //////    console.log("{" + v.x + "," + v.z + "}");
    //////}
};


MODELS.SymetricPlaneGeometry.prototype = Object.create(THREE.Geometry.prototype);
MODELS.SymetricPlaneGeometry.prototype.constructor = MODELS.SymetricPlaneGeometry;
MODELS.SymetricPlaneGeometry.prototype.clone = function() {
    var parameters = this.parameters;
    return new MODELS.SymetricPlaneGeometry(
        parameters.width,
        parameters.height,
        parameters.widthSegments,
        parameters.heightSegments
    );
};