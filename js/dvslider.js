/*
 v: 16.08.20
 */
(function($) {
    $.extend($.easing, {
        easeInOutQuint: function(x, t, b, c, d) {
            if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
            return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
        }
    });
    dvslider = function(el, options) {
        var base = this,
            
            
            /* DEFAULTS */
            defaults = {
                firstSlide: 1,                      // # of first slide
                animationWait: 5000,                // time between autoplay
                animationSpeed: 800,                // transition speed
                animationEasing: 'easeInOutQuint',  // transition easing
                animationEasingCss: 'ease-in-out',  // transition easing (using css transitions)
                autoChange: false,                  // autoplay enabled
                pager: true,                        // show pagination
                nav: false,                         // show navigation using < and >
                count: false,                       // show count (ex.: 1 slide of 12 )
                swiping: true,                      // enable swiping for touch devices
                pagerClass: '',                     // extra pagination class
                width:                              // width of slide
                    function(sliderElement, slide) { 
                        return sliderElement.outerWidth();
                    },
                onChange:                           // event on slide change
                    function(sliderElement, activeSlide, previousSlide) {}
            },
            
            id,                     // unique id
            
            $base,
            $slider,              // slider element
            $pager,               // pagination element
            $pager_slider,        // pagination slider
            $nav,
            $next,                // nav next element
            $prev,                // nav prev element
            $count,               // count container
            $count_total,         // count total
            $count_current,
            
            count = 0,              // count of slides
            pages = 0,              // count of pages
            mousein = false,        // is cursor inside
            busy = true,            // is slider busy (animating or something else)
            swiping = false,        // touchscreen swiping enabled
            swipeXstart = 0,    
            swipeXend = 0,
            swipeTime = 0,
            show = false,       
            timer,
            timerAnimation,
            loaded = false,
            active = 0,             // active page
            settings,               // settings
            csstransforms = false,
            csstransforms3d = false,
            csstransitions = false,
        
        init = function() {
            if (typeof Modernizr == 'object') {
                csstransforms = !!Modernizr.csstransforms;
                csstransforms3d = !!Modernizr.csstransforms3d;
                csstransitions = !!Modernizr.csstransitions;
            } 
            
            settings = $.extend(defaults, options);
            
            id = parseInt(Math.random() * new Date().getTime());
            
            $base = $(el);
            $slider = $('.dvslider-slider', $base);
            $base.on('mouseenter.dvslider', mouseenter).on('mouseleave.dvslider', mouseleave);
            $base.on('click', '[data-dvslider-change]', attributeChange);
            
            count = $('.dvslider-slide', $base).size();

            $('.dvslider-slide-bg', $base).each(function(){
                $(this).closest('.dvslider-slide').css('backgroundImage', 'url("'+$(this).attr('src')+'")');
                $(this).hide();
            });

            
            if (count > 1) {

                if (settings.firstSlide > 0 && settings.firstSlide < count)
                    active = settings.firstSlide - 1;

                $('.dvslider-slide', $base).removeClass('active').eq(active).addClass('active');

                if (settings.pager) {
                    $pager = $('<div/>', {
                        'class': 'dvslider-pager disabled '+settings.pagerClass
                    });
                    $pager_slider = $('<div/>', {
                        'class': 'dvslider-pager-slider'
                    }).appendTo($pager);
                    
                    $pager_slider.on('click', 'a', function() {
                        change($(this).index());
                    });
                    $base.append($pager);
                }
                
                if (settings.nav) {
                    $nav = $('<div/>', {
                        'class': 'dvslider-nav disabled'
                    }).appendTo($base);
                    $next = $('<a/>', {
                        'class': 'dvslider-next disabled'
                    }).on('click', function() {
                        next();
                    }).appendTo($nav);

                    $prev = $('<a/>', {
                        'class': 'dvslider-prev disabled'
                    }).on('click', function() {
                        prev();
                    }).appendTo($nav);
                }
                if (settings.count) {
                    $count = $('<div/>', {
                        'class': 'dvslider-count'
                    }).append(
                        $count_current = $('<span/>', { 'class': 'dvslider-count-current', 'html': active + 1 }),
                        '/',
                        $count_total = $('<span/>', { 'class': 'dvslider-count-total', 'html': pages })
                        ).appendTo($base);
                }
            }
            
            resize();
            $(window).on('resize.dvslider', function() {
                resize();
            });
            
            if (document.readyState == 'complete') {
                onload();
            } else {
                $(window).on('load', function() {
                    onload();
                });
            }
            
            settings.onChange($base, $('.dvslider-slide', $base).eq(active));
        },
         
        resize = function() {
            
            var width = 0;
            $('.dvslider-slide', $base).each(function(i, e){
                $(e).removeAttr('style');
                var w = settings.width($base, $(e));
                if (w)
                    $(e).width( settings.width($base, $(e)) );
                width += $(e).outerWidth();
                if (i)
                    width += parseInt($(e).css('marginLeft'));
            });
            $slider.stop().css({
                width: width
            });
            
            if (count > 1) {
                pages = 1;
                var w = 0;
                $('.dvslider-slide', $base).each(function(i, e){
                    w += $(e).outerWidth();
                    pages++;
                    if (i)
                        w += parseInt($(e).css('marginLeft'));
//                    console.log((width - w - parseInt($(e).css('marginLeft'))), width, w, $base.width(), pages);
                    if (width - w - parseInt($(e).css('marginLeft')) <= $base.width())
                        return false;
                });
                
                if (active > pages - 1)
                    active = pages - 1;
                
                if (settings.pager) {
                    $pager_slider.empty();
                    for (i = 1; i <= pages; i++) {
                        var $slide = $('.dvslider-slide', $base).eq(i-1);
                        var html = $slide.data('dvslider-pagerImage') ? '<img src="'+ $slide.data('pagerImage') +'" alt="'+ $slide.attr('title') +'"/>' : i;
                        $('<a/>', {
                            'title' : $slide.attr('title'),
                            'html': html,
                            'data-index': i
                        }).appendTo($pager_slider);
                    }
				    pagerChange(active);
                }
                if (settings.nav) {
                    if (active > 0) $prev.removeClass('disabled');
                    else $prev.addClass('disabled');
                    if (active + 1 < pages) $next.removeClass('disabled');
                    else $next.addClass('disabled');
                }
                if (settings.count) {
                    $count_current.html(active + 1),
                    $count_total.html(pages);
                }
            }
            
            
            var $activeSlide = $('.dvslider-slide', $base).eq(active);
            var left = $activeSlide.position().left + parseInt($activeSlide.css('marginLeft'));
            if (width - left < $base.width())
                left = width - $base.width();
            move(-left);
            

            
            if (timer)
                clearTimeout(timer);
            if (settings.autoChange) {
                timer = setTimeout(function() {
                    changeAuto();
                }, settings.animationWait);
            }
            pagerChange(active);
        },
         
        onload = function() {
            if (settings.swiping) {
                $slider.on('touchstart.dvslider touchmove.dvslider touchend.dvslider touchcancel.dvslider', function(e) {
                    if (e.type == 'touchstart') {
                        swipestart(e);
                    } else if (e.type == 'touchmove') {
                        swipemove(e);
                    } else {
                        swipeend(e);
                    }
                });
            }
            if (count > 1) {
                if (settings.pager) {
                    $pager.removeClass('disabled');
                }
                if (settings.nav) {
                    $nav.removeClass('disabled');
                }
            }
            if (settings.autoChange) {
                timer = setTimeout(function() {
                    changeAuto();
                }, settings.animationWait);
            }
            loaded = true;
            resize(); //test
            busy = false;
        },
            
        next = function() {
            change(active + 1);
        },
            
        prev = function() {
            change(active - 1);
        },
            
        change = function(next, duration) {
            if (!busy && next >= 0 && next + 1 <= pages && next != active) {
                busy = true;
                settings.onChange($base, $('.dvslider-slide', $base).eq(next), $('.dvslider-slide', $base).eq(active));
                $('.dvslider-slide', $base).removeClass('active').eq(next).addClass('active');
                clearTimeout(timer);
				pagerChange(next);
                if (settings.nav) {
                    if (next > 0) $prev.removeClass('disabled');
                    else $prev.addClass('disabled');
                    if (next + 1 < pages) $next.removeClass('disabled');
                    else $next.addClass('disabled');
                }
                if (settings.count) {
                    $count_current.html(next+1);   
                }
                
                var $activeSlide = $('.dvslider-slide', $base).eq(next);
                var left = $activeSlide.position().left + parseInt($activeSlide.css('marginLeft'));
                if ($slider.width() - left < $base.width())
                    left = $slider.width() - $base.width();
                animate(-left, duration, function() {
                    active = next;
                    swiping = false;
                    busy = false;
                    if (settings.autoChange) {
                        timer = setTimeout(function() {
                            changeAuto();
                        }, settings.animationWait);
                    }
                });
            }
        },
            
        pagerChange = function(index) {
        	if (settings.pager && pages > 1) {
            	$pager_slider.find('a.active').removeClass('active');
                $pager_slider.children().eq(index).addClass('active');
	            var w_slider = $pager_slider.outerWidth();
	            var w = $pager.outerWidth();
	            if (w_slider > w) {
	            	var el_w = parseInt($pager_slider.children().eq(index).outerWidth()) + parseInt($pager_slider.children().eq(index).css('marginLeft')) + parseInt($pager_slider.children().eq(index).css('marginRight'));
	            	var el_pos = $pager_slider.children().eq(index).position().left;
	            	var pos = w/2 - el_pos - el_w/2;
	            	if (pos > 0) 
	            		pos = 0;
	            	if (pos < w - w_slider)
	            		pos = w - w_slider;
	            	pagerMove(pos);
	            }
	            else {
	            	pagerMove(0);
	            }
            }
        },
            
        mouseenter = function() {
            mousein = true;
        },
            
        mouseleave = function() {
            mousein = false;
            if (show && !busy) {
                show = false;
                if (settings.autoChange) {
                    timer = setTimeout(function() {
                        changeAuto();
                    }, settings.animationWait / 2);
                }
            }
        },
        
        changeAuto = function() {
            if (!swiping && !mousein) {
                if (active + 1 < pages)
                    change(active + 1);
                else
                    change(0);
            } else {
                show = true;
            }
        },
            
        swipestart = function(event) {
            if (!busy) {
                swiping = true;
                swipeTime = Number(new Date());
                swipeXstart = swipeXend = event.originalEvent.touches[0].pageX;
            }
        },
        
        swipemove = function(event) {
            if (swiping) {
                swipeXend = event.originalEvent.touches[0].pageX;
                var diff = swipeXstart - swipeXend;
                var w = settings.width($base);
                var left = 0 - active * w - diff;
                move(left);
            }
        },
            
        swipeend = function(event) {
            if (swiping) {
                var w = settings.width($base);
                var diff = swipeXstart - swipeXend;
                if (active + 1 < pages && (diff > w * 0.5 || (diff > w * 0.1 && (Number(new Date()) - swipeTime < 250)))) {
                    change(active + 1);
                } else if (active - 1 >= 0 && (diff < w * -0.5 || (diff < w * -0.1 && (Number(new Date()) - swipeTime < 250)))) {
                    change(active - 1);
                } else {
                    animate(0 - active * w, settings.animationSpeed / 2, function() {
                        swiping = false;
                        if (show && !busy) {
                            show = false;
                            if (settings.autoChange) {
                                timer = setTimeout(function() {
                                    changeAuto();
                                }, settings.animationWait / 2);
                            }
                        }
                    });
                }
            }
            //kartais touchstart nesuveikia (kai keli pirstai swipina ar pan)
            else {
                var w = settings.width($base);
            	animate(0 - active * w, settings.animationSpeed / 2, function() {
                    if (show && !busy) {
                        show = false;
                        if (settings.autoChange) {
                            timer = setTimeout(function() {
                                changeAuto();
                            }, settings.animationWait / 2);
                        }
                    }
                });
            }
        },

        //judinti slaideri animuotai
        animate = function(x, duration, completed) {
            var easing = swiping ? 'linear' : settings.animationEasing;
            var css_easing = swiping ? 'linear' : settings.animationEasingCss;
            if (typeof(duration) == 'undefined')
                duration = settings.animationSpeed;
            if (csstransforms3d) {
                if (csstransitions) {
                    $slider.css({
                        transition: 'all 0.' + duration + 's ' + css_easing + ' 0s',
                        transform: 'translate3d(' + x + 'px,0,0)'
                    });
                } else {
                    $slider.stop().animate({
                        dvvalue: x
                    }, {
                        step: function(now, tween) {
                            $slider.css('transform', 'translate3d(' + now + 'px,0,0)');
                        },
                        duration: duration,
                        easing: easing,
                        always: completed
                    });
                }
            } else if (csstransforms) {
                if (csstransitions) {
                    $slider.css({
                        transition: 'all 0.' + duration + 's ' + settings.animationEasingCss + ' 0s',
                        transform: 'translateX(' + x + 'px)'
                    });
                } else {
                    $slider.stop().animate({
                        dvvalue: x
                    }, {
                        step: function(now, tween) {
                            $slider.css({
                                transform: 'translateX(' + now + 'px)',
                            });
                        },
                        duration: duration,
                        easing: easing,
                        always: completed
                    });
                }
            } else {
                if (csstransitions) {
                    $slider.css({
                        transition: 'all 0.' + duration + 's ' + settings.animationEasingCss + ' 0s',
                        marginLeft: x
                    });
                } else {
                    $slider.stop().animate({
                        marginLeft: x
                    }, {
                        duration: duration,
                        easing: easing,
                        always: completed
                    });
                }
            }
            if (csstransitions) {
                timerAnimation = setTimeout(completed, duration);
            }
        },
        
        //judinti slaideri (be animacijos)
        move = function(x) {
            if (csstransforms3d) {
                $slider.stop().css({
                    transition: 'all 0s linear 0s',
                    transform: 'translate3d(' + x + 'px,0,0)'
                })[0].dvvalue = x;
            } else if (csstransforms) {
                $slider.stop().css({
                    transition: 'all 0s linear 0s',
                    transform: 'translateX(' + x + 'px)'
                })[0].dvvalue = x;
            } else {
                $slider.stop().css({
                    transition: 'all 0s linear 0s',
                    marginLeft: x
                });
            }
        },
        
            
        pagerMove = function(x) {
            var easing = 'linear';
            var css_easing = 'linear';
            var duration = settings.animationSpeed / 2;
            if (csstransforms3d) {
                if (csstransitions) {
                    $pager_slider.css({
                        transition: 'all 0.' + duration + 's ' + css_easing + ' 0s',
                        transform: 'translate3d(' + x + 'px,0,0)'
                    });
                } else {
                    $pager_slider.stop().animate({
                        dvvalue: x
                    }, {
                        step: function(now, tween) {
                            $pager_slider.css('transform', 'translate3d(' + now + 'px,0,0)');
                        },
                        duration: duration,
                        easing: easing
                    });
                }
            } else if (csstransforms) {
                if (csstransitions) {
                    $pager_slider.css({
                        transition: 'all 0.' + duration + 's ' + settings.animationEasingCss + ' 0s',
                        transform: 'translateX(' + x + 'px)'
                    });
                } else {
                    $pager_slider.stop().animate({
                        dvvalue: x
                    }, {
                        step: function(now, tween) {
                            $pager_slider.css({
                                transform: 'translateX(' + now + 'px)',
                            });
                        },
                        duration: duration,
                        easing: easing
                    });
                }
            } else {
                if (csstransitions) {
                    $pager_slider.css({
                        transition: 'all 0.' + duration + 's ' + settings.animationEasingCss + ' 0s',
                        marginLeft: x
                    });
                } else {
                    $pager_slider.stop().animate({
                        marginLeft: x
                    }, {
                        duration: duration,
                        easing: easing
                    });
                }
            }
        },
        
        attributeChange = function(e) {
            e.preventDefault();
            var value = $(this).data('dvslider-change');
            if (value == 'next') 
                next();
            else if (value == 'prev')
                prev();
            else if (value == parseInt(value)) 
                change(parseInt(value) - 1);
            else if ($base.find(value).hasClass('dvslider-slide')) {
                change($base.find(value).index());
            }
        };
        
        base.next = function() {
            next();  
        };
        base.prev = function() {
            prev();  
        };
        base.change = function(no) {
            change(no - 1);  
        };
        base.resize = function() {
            resize();  
        };
        base.destroy = function() {
            if (timer)
                clearTimeout(timer);
            if (timerAnimation)
                clearTimeout(timerAnimation);
            $('.dvslider-slide', $base).last().remove();
            $base.off('.dvslider');
        };
        init();
    };
    $.fn.dvslider = function(options, args) {
        return this.each(function() {
            if (typeof(this.dvslider) != 'undefined') {
                if (typeof(options) != 'undefined' && typeof(this.dvslider[options]) == 'function') {
                    this.dvslider[options](args);
                }
            } else {
                this.dvslider = new dvslider(this, options);
            }
        });
    };

    //manual call
    $.dvslider = function(options) {
        if (typeof this != 'function') return this;
        return new dvslider(null, options);
    };

})(jQuery);