function extend(o,h) {
    Object.keys(h).forEach(function(i) {
        o[i] = h[i];
    });
}

function bind(f,that) {
    return function() {
        return f.apply(that,arguments);
    }
}

extend( Function.prototype, {
    curry: function () {
        var args = Array.prototype.slice.apply(arguments),
            that = this;
        return function () {
            return that.apply(null,args.concat(Array.prototype.slice.apply(arguments)));
        }
    }
});

function $ID(x) {
    return document.getElementById(x);
}

function $CLASS(x) {
    return document.getElementsByClass(x);
}

window.util = {};

var Renderer = (function() {
    var canvas;

    var viewportTransform; 
    
    function setViewportTransform() {
        viewportTransform = [
            1, 0, canvas.width/2,
            0, -1, canvas.height/2,
            0, 0, 1
        ];
    }
    
    function mult3v3m(v,m) {
        return [ v[0] * m[0] + v[1] * m[1] + v[2] * m[2],
                 v[0] * m[3] + v[1] * m[4] + v[2] * m[5],
                 v[0] * m[6] + v[1] * m[7] + v[2] * m[8] ];
    }

    function mult4v4m(v,m) {
        return [ v[0] * m[ 0] + v[1] * m[ 1] + v[2] * m[ 2] + v[3] * m[ 3],
                 v[0] * m[ 4] + v[1] * m[ 5] + v[2] * m[ 6] + v[3] * m[ 7],
                 v[0] * m[ 8] + v[1] * m[ 9] + v[2] * m[10] + v[3] * m[11],
                 v[0] * m[12] + v[1] * m[13] + v[2] * m[14] + v[3] * m[15] ];
    }

    function mult4m4m(m,n) {
        console.log("multipying: ");
        print4m(m);
        console.log("by: ")
        print4m(n);
        
        return [ 
            m[ 0]*n[ 0] + m[ 4]*n[ 1] + m[ 8]*n[ 2] + m[12]*n[ 3],
            m[ 1]*n[ 0] + m[ 5]*n[ 1] + m[ 9]*n[ 2] + m[13]*n[ 3],
            m[ 2]*n[ 0] + m[ 6]*n[ 1] + m[10]*n[ 2] + m[14]*n[ 3],
            m[ 3]*n[ 0] + m[ 7]*n[ 1] + m[11]*n[ 2] + m[15]*n[ 3],
            
            m[ 0]*n[ 4] + m[ 4]*n[ 5] + m[ 8]*n[ 6] + m[12]*n[ 7],
            m[ 1]*n[ 4] + m[ 5]*n[ 5] + m[ 9]*n[ 6] + m[13]*n[ 7],
            m[ 2]*n[ 4] + m[ 6]*n[ 5] + m[10]*n[ 6] + m[14]*n[ 7],
            m[ 3]*n[ 4] + m[ 7]*n[ 5] + m[11]*n[ 6] + m[15]*n[ 7],
            
            m[ 0]*n[ 8] + m[ 4]*n[ 9] + m[ 8]*n[10] + m[12]*n[11],
            m[ 1]*n[ 8] + m[ 5]*n[ 9] + m[ 9]*n[10] + m[13]*n[11],
            m[ 2]*n[ 8] + m[ 6]*n[ 9] + m[10]*n[10] + m[14]*n[11],
            m[ 3]*n[ 8] + m[ 7]*n[ 9] + m[11]*n[10] + m[15]*n[11],
            
            m[ 0]*n[12] + m[ 4]*n[13] + m[ 8]*n[14] + m[12]*n[15],
            m[ 1]*n[12] + m[ 5]*n[13] + m[ 9]*n[14] + m[13]*n[15],
            m[ 2]*n[12] + m[ 6]*n[13] + m[10]*n[14] + m[14]*n[15],
            m[ 3]*n[12] + m[ 7]*n[13] + m[11]*n[14] + m[15]*n[15]
         ];
    }
    
    function print4m(m) {
        var maxlen = 0;
        for (var i = 0; i < 16; i++) {
            if (String(m[i]).length > maxlen)
                maxlen = String(m[i]).length;
        }
        
        function spaces(x) {
            var len = String(x).length;
            var s = " ";
            for (var i = 0; i < maxlen - len; i++) {
                s = s + " ";
            }
            return s;
        }
        
        function print(x) {
            return spaces(x) + x;
        }
        
        console.log(print(m[ 0]) + print(m[ 1]) + print(m[ 2]) + print(m[ 3]));
        console.log(print(m[ 4]) + print(m[ 5]) + print(m[ 6]) + print(m[ 7]));
        console.log(print(m[ 8]) + print(m[ 9]) + print(m[10]) + print(m[11]));
        console.log(print(m[12]) + print(m[13]) + print(m[14]) + print(m[15]));
    }
    
    var modelMatrix;
    var perspectiveMatrix;
    
    function degreesToRadians(a) {
        return a / 180.0 * Math.PI;
    }
    
    function scale(sx,sy,sz) {
        return [
           sx,   0,   0,   0,
            0,  sy,   0,   0,
            0,   0,  sz,   0,
            0,   0,   0,   1
        ];
    }

    function rotateX(theta) {
        var ct = Math.cos(theta);
        var st = Math.sin(theta);
        return [
            1,   0,   0,   0,
            0,  ct, -st,   0,
            0,  st,  ct,   0,
            0,   0,   0,   1
        ];
    }

    function rotateY(theta) {
        var ct = Math.cos(theta);
        var st = Math.sin(theta);
        return [
           ct,   0,  st,   0,
            0,   1,   0,   0,
          -st,   0,  ct,   0,
            0,   0,   0,   1
        ];
    }

    function rotateZ(theta) {
        var ct = Math.cos(theta);
        var st = Math.sin(theta);
        return [
           ct, -st,   0,   0,
           st,  ct,   0,   0,
            0,   0,   1,   0,
            0,   0,   0,   1
        ];
    }

    function translate(tx,ty,tz) {
        return [
            1,   0,   0,  tx,
            0,   1,   0,  ty,
            0,   0,   1,  tz,
            0,   0,   0,   1
        ];
    }
    
    function frustum(l,r,b,t,n,f) {
        console.log("n = " + n);
        console.log("f = " + f);
        var a = (r + l) / (r - l),
            b = (t + b) / (t - b),
            c = - (f + n) / (f - n),
            d = - (2 * f * n) / (f - n);
        
        return [
          2*n/(r-l),     0,    a,   0,
            0,      2*n/(t-b), b,   0,
            0,           0,    c,   d,
            0,           0,   -1,   0
        ];
    }
    
    function applyModelTransform(m) {
        modelMatrix = mult4m4m(modelMatrix,m);
    }

    function applyPerspectiveTransform(m) {
        perspectiveMatrix = mult4m4m(perspectiveMatrix,m);
    }

    
    function resize(event) {
        console.log("handling resize");
        canvas.height = document.documentElement.clientHeight;
        canvas.width = document.documentElement.clientWidth;
        setViewportTransform();
        drawCanvas();
    }
    
    function initialize() {
        console.log("initializing renderer");
        canvas = $ID('scene');
        window.onresize = resize;
        resize(null);
        
    }

    function drawAxis(ctx) {
        var w = canvas.width;
        var h = canvas.height;
        
        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = "#888";
        ctx.moveTo(w/2,0);
        ctx.lineTo(w/2,h);
        ctx.moveTo(0,h/2);
        ctx.lineTo(w,h/2);
        ctx.stroke();
        ctx.closePath();
        ctx.restore();
    }
    
    function drawRect(ctx,pt,h,w) {
        ctx.fillRect(pt[0]-w/2, pt[1]-h/2, h, w);  
    }
    
    function drawCanvas() {
        console.log("drawing canvas: canvas size = " + canvas.width + "x" + canvas.height);
        var ctx = canvas.getContext('2d')    

        setViewportTransform();
        
        var w = canvas.width;
        var h = canvas.height;
        
        /*
        ctx.fillStyle = "#fff";  
        ctx.fillRect(0,0,w,h);
        */
        
        var mpts = [ 
            [ 0, 0, 0, 1],
            [10, 0, 0, 1],
            [10,10, 0, 1],
            [ 0,10, 0, 1],
            [ 0, 0,10, 1],
            [10, 0,10, 1],
            [10,10,10, 1],
            [ 0,10,10, 1]
        ];
        
        modelMatrix = [
            1,   0,   0,   0,
            0,   1,   0,   0,
            0,   0,   1,   0,
            0,   0,   0,   1
        ];
        
        perspectiveMatrix = [
            1,   0,   0,   0,
            0,   1,   0,   0,
            0,   0,   1,   0,
            0,   0,   0,   1
        ];
        
        var zNear = 100.0, 
    	    zFar = 600.0, 
    	    fieldOfView = 45.0,
    	    size = zNear * Math.tan(degreesToRadians(fieldOfView) / 2.0); 
        
        applyPerspectiveTransform(frustum(-size, size, -size / (w / h), size / (w / h), zNear, zFar));
                
//        applyModelTransform(rotateY(.36));
//        applyModelTransform(rotateX(.36));
//        applyModelTransform(translate(100,0,0));
//        applyModelTransform(translate(0,100,0));
        applyModelTransform(translate(0,0,300));
        
        console.log("Model Matrix: ");
        print4m(modelMatrix);

        console.log("Perspective Matrix: ");
        print4m(perspectiveMatrix);

        console.log("mpts: " + JSON.stringify(mpts));

        // apply the model transform(s)
        // vertex data * Model Matrix = transformed eye coordinates
        // [ x0 y0 z0 w0 ] * M = [ xe ye ze we ]
        var epts = mpts.map(function(mpt) {
            return mult4v4m(mpt,modelMatrix);
        });

        console.log("epts: " + JSON.stringify(epts));

        // apply the perspective transforms
        // transformed eye coordinates * Perspective Matrix = clip coordinates
        // [ xe ye ze we ] * P = [ xc yc zc wc ]

        var cpts = epts.map(function(pt) {
            return mult4v4m(pt,perspectiveMatrix);
        });

        console.log("cpts: " + JSON.stringify(cpts));
         
        // apply perspective division
        // clip coordinates / wc = normalized device coordinates
        // [ xc yc zc wc ] / wc = [ xc/wc yc/wc zc/wc 1 ]

        var dpts = cpts.map(function(pt) {
            return [pt[0] / pt[3], pt[1] / pt[3], pt[2] / pt[3], 1 ];
        });
         
        console.log("dpts: " + JSON.stringify(dpts));
        
        // apply the viewport transform
        var vpts = dpts.map(function(mpt) {
            var pt = [ mpt[0], mpt[1], 1 ];
            return mult3v3m(pt,viewportTransform);
        });
        
        console.log("vpts: " + JSON.stringify(vpts));


        drawAxis(ctx);

        ctx.fillStyle = "rgba(200,0,0,0.5)";  
        vpts.forEach(function(pt) {
            ctx.beginPath();
            ctx.arc(pt[0], pt[1], 3, 0, Math.PI*2, false);
            ctx.fill();
            ctx.closePath();
            ctx.restore();
        });
    }

    window.addEventListener("DOMContentLoaded", initialize);
   
    return {
        drawCanvas: drawCanvas
    };
}());
