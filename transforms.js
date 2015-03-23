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

util.Builder = (function () {
    function isStringOrNumber(param) {
        return (typeof param=='string' || typeof param=='number');
    }

    function makeElement(name) {
        console.log('making ' + name);
        var element = document.createElement(name);

        if (arguments[1]) {
            if (isStringOrNumber(arguments[1]) || (arguments[1] instanceof Array)) {
                $(element).append(arguments[1]);
            } else {
                for (attr in arguments[1]) {
                    element[attr == 'class' ? 'className' : attr] = arguments[1][attr];
                }
            }
        }
            
        if (arguments[2]) {
            $(element).append(arguments[2]);
        }
    
        return element;
    }

    function initialize() {
        var elements = "div p a img h1 h2 h3 h4 h5 h6 iframe img input".split(" ");
        var m = {};
        elements.forEach(function(item) {
            m[item.toUpperCase()] = makeElement.curry(item);
        });
        return m;
    }

    return initialize();
})();

var DragTracker = function(params) {
    if (!params || !params.element || !params.startEvent) {
        console.log("DragTracker: invalid params");
        return;
    }
        
    var trackedElement = params.element;
    var eStart = params.startEvent;

    var start = {x:trackedElement.offsetLeft, y:trackedElement.offsetTop};
    var position = {x:trackedElement.offsetLeft, y:trackedElement.offsetTop};
    
    console.log("DragTracker: tracking element " + trackedElement );
    console.log("DragTracker constraints: " + JSON.stringify(params.constraints));

    function constrain(v,c) {
        if (c && c.min !== undefined)
            v = v < c.min ? c.min : v;
        if (c && c.max !== undefined)
            v = v > c.max ? c.max : v;
        return v;
    }
    
    function mouseMoveHandler(e) {
        var top = start.y + e.clientY - eStart.clientY;
        var left = start.x + e.clientX - eStart.clientX;

        left = constrain(left,params.constraints && params.constraints.x);
        top = constrain(top,params.constraints && params.constraints.y);
        
        trackedElement.style.top = top + "px";
        trackedElement.style.left = left + "px";

        if (typeof params.onComplete == "function" && (position.x != left || position.y != top))
            params.onProgress(left,top);

        position = {x:left,y:top};
            
        e.stopPropagation();
        return false;
    }
            
    function mouseUpHandler(e) {
        document.onmouseup = undefined;
        document.onmousemove = undefined;
        
        if (typeof params.onComplete == "function")
            params.onComplete(position.x,position.y);
            
        e.stopPropagation();
        return false;
    }

    document.onmousemove = mouseMoveHandler;
    document.onmouseup = mouseUpHandler;
}

SliderBuilder = (function() {
    var B = util.Builder;
    
    var onChange = function(x) {
        if (this.params.range !== undefined)
            this.value = this.params.range[0] + x/this.range * (this.params.range[1] - this.params.range[0]);
        else
            this.value = x/this.range;
        if (typeof this.params.onChange == "function") {
            if (this.params.range !== undefined)
                this.params.onChange(this.value);
        }
    } 
    
    var thumbClickHandler = function(e) {
        DragTracker({element: this.thumbDiv, 
                     startEvent: e, 
                     constraints: {x: {min: 0, max: this.width - this.thumbWidth}, y: {min: 0, max: 0}},
                     onComplete: bind(function(x,y) {
                         bind(onChange,this)(x);
                     },this),
                     onProgress: bind(function(x,y) {
                         bind(onChange,this)(x);
                     },this)
                    });
            
        e.stopPropagation();
        return false;
    }
    
    var transitionEndHandler = function(e) {
        console.log("Finished transition");
        console.dir(e);
        console.dir(this);
        e.target.style.webkitTransitionProperty = "none";
        e.target.style.webkitTransitionDuration = "0s";
    }

    var sliderClickHandler = function(e) {
        console.log("slider click hander: this = " + this + ", value = " + this.value);
        console.dir(e);
        console.log("mouse at (" + e.offsetX + "," + e.offsetY + ")");
        console.log("mouse client at (" + e.clientX + "," + e.clientY + ")");
        console.dir(this.sliderDiv);

        var x = e.offsetX - this.thumbWidth / 2;
        if (x < 0) x = 0;
        if (x > this.width - this.thumbWidth) x = this.width - this.thumbWidth;
        this.thumbDiv.style.left = x + "px";
        bind(onChange,this)(x);
        
        this.thumbDiv.style.webkitTransitionProperty = "left";
        this.thumbDiv.style.webkitTransitionDuration = ".4s";

        e.stopPropagation();
        return false;
    }

    var proto = {
        initialize: function(params) {
            var args = Array.prototype.slice.call(arguments);
            console.log("slider.initialize: args = " + JSON.stringify(args));
            console.log("slider.initialize: elementName = " + params.id);
            
            this.params = params;
            
            this.sliderDiv = $ID(params.id);
            this.thumbDiv = B.DIV({className:'thumb'});
            this.sliderDiv.appendChild(B.DIV({className:'slider-control'},[B.DIV({className:'slide'}),this.thumbDiv] ));

            this.thumbDiv.onmousedown   = bind(thumbClickHandler,this);
            this.thumbDiv.onclick       = function(e) {e.stopPropagation(); return false;};
            this.sliderDiv.onclick      = bind(sliderClickHandler,this);
            
            this.thumbDiv.addEventListener( 'webkitTransitionEnd', bind(transitionEndHandler,this), false );
            
            //console.log("slider width = " + this.sliderDiv.scrollWidth + " height = " + this.sliderDiv.scrollHeight);
            //console.log("thumb width = " + this.thumbDiv.scrollWidth + " height = " + this.thumbDiv.scrollHeight);

            this.width = this.sliderDiv.scrollWidth;
            this.thumbWidth = this.thumbDiv.scrollWidth;
            this.range = this.width - this.thumbWidth;
            
            if (params.hasOwnProperty('value'))
                this.setValue(params.value);
        },
        
        getValue: function() {
            console.log("get value");
            return this.value;
        },
        
        setValue: function(value) {
            console.log("set value to " + value);
            
            var x;
            if (this.params.range !== undefined)
                x = (value - this.params.range[0]) * this.range / (this.params.range[1] - this.params.range[0]);
            else
                x = value * this.range;
                
            this.thumbDiv.style.left = x + "px";

            this.value = value;
        }
    };

    return function() {
        var o = Object.create(proto);
        o.initialize.apply(o,arguments);
        return o;
    };
}());

window.addEventListener("DOMContentLoaded", function() {
    var x = 0;
    var y = 0;
    var rot = 0;
    var scale = 1.0
    var matrix = {
        a:1.0, b:0, c:0, d:1.0, e:0, f:0
    };
    
    function positionDiv() {
        var objectDiv = $ID("object1");
        objectDiv.style.webkitTransform = "translate(" + x + "px," + y + "px) rotate(" + rot + "deg) scale(" + scale + ") matrix(" + matrix.a + "," + matrix.b + "," + matrix.c + "," + matrix.d + "," + matrix.e + "," + matrix.f + ")";
        
        var transform = window.getComputedStyle(objectDiv).webkitTransform;
        console.log("transform = " + transform);
        
        var m = new WebKitCSSMatrix(transform);
        "a b c d e f".split(" ").forEach(function(val) {
            $ID(val).innerHTML = m[val];
        });
    }
    
    SliderBuilder({
        id:"translate-x-slider",
        value: x,
        range: [0,800],
        onChange: function(value) {
            $ID("translate-x-slider-value").innerHTML = Math.floor(value*10)/10;
            x = value;
            positionDiv();
        }
    });

    SliderBuilder({
        id:"translate-y-slider",
        value: y,
        range: [0,800],
        onChange: function(value) {
            $ID("translate-y-slider-value").innerHTML = Math.floor(value*10)/10;
            y = value;
            positionDiv();
        }
    });

    SliderBuilder({
        id:"rotate-slider",
        value: rot,
        range: [0,360],
        onChange: function(value) {
            $ID("rotate-slider-value").innerHTML = Math.floor(value*10)/10;
            rot = value;
            positionDiv();
        }
    });

    SliderBuilder({
        id:"scale-slider",
        value: scale,
        range: [0.5,3.0],
        onChange: function(value) {
            $ID("scale-slider-value").innerHTML = Math.floor(value*100)/100;
            scale = value;
            positionDiv();
        }
    });
    
    "a b c d".split(" ").forEach(function(val) {
        SliderBuilder({
            id: val + "-slider",
            value: matrix[val],
            range: [-5.0,5.0],
            onChange: function(value) {
                $ID(val + "-slider-value").innerHTML = Math.floor(value*100)/100;
                matrix[val] = value;
                positionDiv();
            }
        });
    });
    
    positionDiv();
});

