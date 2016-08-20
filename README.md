# DVslider
Just another jQuery slider

Options
-------
```js
firstSlide: 1,                      // # of first slide
animationWait: 6000,                // time between autoplay
animationSpeed: 800,                // transition speed
animationEasing: 'easeInOutQuint',  // transition easing
animationEasingCss: 'ease-in-out',  // transition easing (using css transitions)
autoChange: false,                  // autoplay enabled
pager: true,                        // show pagination
nav: false,                         // show navigation using < and >
count: false,                       // show count (ex.: 1 slide of 12 )
swiping: true,                      // enable swiping for touch devices
gap: 0,								// gap between slider
pagerClass: '',                     // extra pagination class
width:                              // width of slider
	function(el) { 
		return el.outerWidth();
	},
onChange:                           // event on slide change
	function(el, activeSlide, previousSlide) {}
```

Mthods
------
```js
// change to next slide
$('.dvslider').dvslider('next'); 	

// change to previous slide
$('.dvslider').dvslider('prev'); 	

// change to # slide
$('.dvslider').dvslider('change', 3); 				
```

Special attributes
------------------
```html
// change to next slide
<a data-dvslider-change="next">...</a>

// change to previous slide
<span data-dvslider-change="prev">...</span>

// change to # slide
<button data-dvslider-change="3">...</button>

// change to .selector slide
<a data-dvslider-change="#mySlide">...</a>
```
usage:
```html
<div class="dvslider">
  <div class="dvslider-slider">
    <div class="dvslider-slide" id="slide1">
      <a data-dvslider-change="next">next slide</a>
    </div>
    <div class="dvslider-slide" id="slide2">
      <a data-dvslider-change="prev">previous slide</a>
    </div>
    <div class="dvslider-slide" id="slide3">
      <a data-dvslider-change="5">change to #5 slide</a>
    </div>
    <div class="dvslider-slide" id="slide4">
      <a data-dvslider-change="#slide2">change to #slide2</a>
    </div>
    <div class="dvslider-slide" id="slide5">
      <a data-dvslider-change="1">first slide</a><br/>
      <a data-dvslider-change="#slide2">second slide</a>
    </div>
  </div>
</div>
```
