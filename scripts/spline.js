/*!
 * \brief  Модуль вычисления сплайн кривых.
 * \author Rostislav Velichko. e: rostislav.vel@gmail.com
 * \date   13.06.2016
 */

Sline = function(pivots, points) {
    updateSplines();

    function Binom4(t, p0, p1, p2, p3) {
        var a = (1 - t);
        var aa = a * a;
        var aaa = aa * a;
        var tt = t * t;
        var ttt = tt * t;
        return aaa * p0 + 3 * aa * t * p1 + 3 * a * tt * p2 + ttt * p3;
    }

    function calcSpline(p0, p1, p2, p3) {
        while (py0) {
            Binom4(p0.z, p1.z, p2.z, p3.z);
            Binom4(p0.z, p1.z, p2.z, p3.z);
        }
        points
    }

    /*computes spline control points*/
    function updateSplines() {
        var cp = computeControlPoints(pivots);

        //segments
        for (i = 0; i < 6; ++i) {
            calcSpline(x[i],y[i],px.p1[i],py.p1[i],px.p2[i],py.p2[i],x[i+1],y[i+1]);
        }
    }

    /*creates formated path string for SVG cubic path element*/
    function path(x1, y1, px1, py1, px2, py2, x2, y2) {
        return "M "+x1+" "+y1+" C "+px1+" "+py1+" "+px2+" "+py2+" "+x2+" "+y2;
    }

    /*computes control points given knots K, this is the brain of the operation*/
    function computeControlPoints(K) {
        p1=new Array();
        p2=new Array();
        n = K.length-1;

        /*rhs vector*/
        a=new Array();
        b=new Array();
        c=new Array();
        r=new Array();

        /*left most segment*/
        a[0]=0;
        b[0]=2;
        c[0]=1;
        r[0] = K[0]+2*K[1];

        /*internal segments*/
        for (i = 1; i < n - 1; i++) {
            a[i]=1;
            b[i]=4;
            c[i]=1;
            r[i] = 4 * K[i] + 2 * K[i+1];
        }

        /*right segment*/
        a[n-1]=2;
        b[n-1]=7;
        c[n-1]=0;
        r[n-1] = 8*K[n-1]+K[n];

        /*solves Ax=b with the Thomas algorithm (from Wikipedia)*/
        for (i = 1; i < n; i++) {
            m = a[i]/b[i-1];
            b[i] = b[i] - m * c[i - 1];
            r[i] = r[i] - m*r[i-1];
        }

        p1[n-1] = r[n-1]/b[n-1];
        for (i = n - 2; i >= 0; --i) {
            p1[i] = (r[i] - c[i] * p1[i+1]) / b[i];
        }

        /*we have p1, now compute p2*/
        for (i=0;i<n-1;i++) {
            p2[i]=2*K[i+1]-p1[i+1];
        }
        p2[n-1]=0.5*(K[n]+p1[n-1]);
        return {p1:p1, p2:p2};
    }
};
