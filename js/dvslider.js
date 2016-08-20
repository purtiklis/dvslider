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
                animationWait: 6000,                // time between autoplay
                animationSpeed: 800,                // transition speed
                animationEasing: 'easeInOutQuint',  // transition easing
                animationEasingCss: 'ease-in-out',  // transition easing (using css transitions)
                autoChange: false,                  // autoplay enabled
                pager: true,                        // show pagination
                nav: false,                         // show navigation using < and >
                count: false,                       // show count (ex.: 1 slide of 12 )
                swiping: true,                      // enable swiping for touch devices
                pagerClass: '',                     // extra pagination class
                gap: 0,                             // gap between slides (need to set margin-left in css)
                width:                              // width of slider
                    function(el) { 
                        return el.outerWidth();
                    },
                onChange:                           // event on slide change
                    function(el, activeSlide, previousSlide) {}
            },
            
            id,                     // unique id
            
            el_slider,              // slider element
            el_pager,               // pagination element
            el_pager_slider,        // pagination slider
            el_next,                // nav next element
            el_prev,                // nav prev element
            el_count,               // count container
            el_count_total,         // count total
            el_count_current,
            
            count = 0,              // count of slider
            mousein = false,        // is cursor inside
            busy = true,            // is slider busy (animating or something else)
            swiping = false,        // touchscreen swiping enabled
            swipeXstart = 0,    
            swipeXend = 0,
            swipeTime = 0,
            show = false,       
            timer,
            timerAnimation,
            active = 0,             // active slide #
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
            
            el = $(el);
            el_slider = $('.dvslider-slider', el);
            el.on('mouseenter.dvslider', mouseenter).on('mouseleave.dvslider', mouseleave);
            el.on('click', '[data-dvslider-change]', attributeChange);
            
            count = $('.dvslider-slide', el).size();

            $('.dvslider-slide-bg', el).each(function(){
                $(this).closest('.dvslider-slide').css('backgroundImage', 'url("'+$(this).attr('src')+'")');
                $(this).hide();
            });

            
            if (count > 1) {

                if (settings.firstSlide > 0 && settings.firstSlide < count)
                    active = settings.firstSlide - 1;

                $('.dvslider-slide', el).removeClass('active').eq(active).addClass('active');

                if (settings.pager) {
                    el_pager = $('<div/>', {
                        'class': 'dvslider-pager disabled '+settings.pagerClass
                    });
                    el_pager_slider = $('<div/>', {
                        'class': 'dvslider-pager-slider'
                    }).appendTo(el_pager);
                    for (i = 1; i <= count; i++) {
                        var $slide = $('.dvslider-slide', el).eq(i-1);
                        var html = $slide.data('pager') ? '<img src="'+ $slide.data('pager') +'" alt="'+ $slide.attr('title') +'"/>' : i;
                        $('<a/>', {
                            'title' : $slide.attr('title'),
                            'html': html,
                            'data-index': i
                        }).appendTo(el_pager_slider);
                    }

                    el_pager_slider.on('click', 'a', function() {
                        change($(this).index());
                    }).children().eq(active).addClass('active');
                    pagerChange(active);

                    el.append(el_pager);
                }
                
                resize();
                $(window).on('resize.dvslider orientationchange.dvslider', function() {
                    resize();
                });
                
                if (settings.nav) {
                    el_next = $('<a/>', {
                        'class': 'dvslider-next disabled'
                    }).on('click', function() {
                        next();
                    }).appendTo(el);

                    el_prev = $('<a/>', {
                        'class': 'dvslider-prev disabled'
                    }).on('click', function() {
                        prev();
                    }).appendTo(el);
                }
                if (settings.count) {
                    el_count = $('<div/>', {
                        'class': 'dvslider-count'
                    }).append(
                        el_count_current = $('<span/>', { 'class': 'dvslider-count-current', 'html': active + 1 }),
                        '/',
                        el_count_total = $('<span/>', { 'class': 'dvslider-count-total', 'html': count })
                        ).appendTo(el);
                }
                if (document.readyState == 'complete') {
                    onload();
                } else {
                    $(window).on('load', function() {
                        onload();
                    });
                }
            }
            else {
                resize();

                $(window).on('resize.dvslider orientationchange.dvslider', function() {
                    resize();
                });
            }
            settings.onChange(el, $('.dvslider-slide', el).eq(active));
        },
         
        resize = function() {
            var w = settings.width(el);
            el_slider.stop().css({
                width: count * w + (count - 1) * settings.gap
            });
            move(0 - active * w - active * settings.gap);

            $('.dvslider-slide', el).css('width', w);
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
                el_slider.on('touchstart.dvslider touchmove.dvslider touchend.dvslider touchcancel.dvslider', function(e) {
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
                    el_pager.removeClass('disabled');
                }
                if (settings.nav) {
                    if (active > 0) el_prev.removeClass('disabled');
                    if (active + 1 < count) el_next.removeClass('disabled');
                }
            }
            if (settings.autoChange) {
                timer = setTimeout(function() {
                    changeAuto();
                }, settings.animationWait);
            }
            busy = false;
        },
            
        next = function() {
            change(active + 1);
        },
            
        prev = function() {
            change(active - 1);
        },
            
        change = function(next, duration) {
            if (!busy && next >= 0 && next + 1 <= count) {
                busy = true;
                settings.onChange(el, $('.dvslider-slide', el).eq(next), $('.dvslider-slide', el).eq(active));
                $('.dvslider-slide', el).removeClass('active').eq(next).addClass('active');
                clearTimeout(timer);
				pagerChange(next);
                if (settings.nav) {
                    if (next > 0) el_prev.removeClass('disabled');
                    else el_prev.addClass('disabled');
                    if (next + 1 < count) el_next.removeClass('disabled');
                    else el_next.addClass('disabled');
                }
                if (settings.count) {
                    el_count_current.html(next+1);   
                }
                var w = settings.width(el);
                var left = next * w + next * settings.gap;
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
        	if (settings.pager && count > 1) {
            	el_pager_slider.find('a.active').removeClass('active');
                el_pager_slider.children().eq(index).addClass('active');
	            var w_slider = el_pager_slider.outerWidth();
	            var w = el_pager.outerWidth();
	            if (w_slider > w) {
	            	var el_w = parseInt(el_pager_slider.children().eq(index).outerWidth()) + parseInt(el_pager_slider.children().eq(index).css('marginLeft')) + parseInt(el_pager_slider.children().eq(index).css('marginRight'));
	            	var el_pos = el_pager_slider.children().eq(index).position().left;
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
                if (active + 1 < count)
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
                var w = settings.width(el);
                var left = 0 - active * w - diff;
                move(left);
            }
        },
            
        swipeend = function(event) {
            if (swiping) {
                var w = settings.width(el);
                var diff = swipeXstart - swipeXend;
                if (active + 1 < count && (diff > w * 0.5 || (diff > w * 0.1 && (Number(new Date()) - swipeTime < 250)))) {
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
                var w = settings.width(el);
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
                    el_slider.css({
                        transition: 'all 0.' + duration + 's ' + css_easing + ' 0s',
                        transform: 'translate3d(' + x + 'px,0,0)'
                    });
                } else {
                    el_slider.stop().animate({
                        dvvalue: x
                    }, {
                        step: function(now, tween) {
                            el_slider.css('transform', 'translate3d(' + now + 'px,0,0)');
                        },
                        duration: duration,
                        easing: easing,
                        always: completed
                    });
                }
            } else if (csstransforms) {
                if (csstransitions) {
                    el_slider.css({
                        transition: 'all 0.' + duration + 's ' + settings.animationEasingCss + ' 0s',
                        transform: 'translateX(' + x + 'px)'
                    });
                } else {
                    el_slider.stop().animate({
                        dvvalue: x
                    }, {
                        step: function(now, tween) {
                            el_slider.css({
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
                    el_slider.css({
                        transition: 'all 0.' + duration + 's ' + settings.animationEasingCss + ' 0s',
                        marginLeft: x
                    });
                } else {
                    el_slider.stop().animate({
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
                el_slider.stop().css({
                    transition: 'all 0s linear 0s',
                    transform: 'translate3d(' + x + 'px,0,0)'
                })[0].dvvalue = x;
            } else if (csstransforms) {
                el_slider.stop().css({
                    transition: 'all 0s linear 0s',
                    transform: 'translateX(' + x + 'px)'
                })[0].dvvalue = x;
            } else {
                el_slider.stop().css({
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
                    el_pager_slider.css({
                        transition: 'all 0.' + duration + 's ' + css_easing + ' 0s',
                        transform: 'translate3d(' + x + 'px,0,0)'
                    });
                } else {
                    el_pager_slider.stop().animate({
                        dvvalue: x
                    }, {
                        step: function(now, tween) {
                            el_pager_slider.css('transform', 'translate3d(' + now + 'px,0,0)');
                        },
                        duration: duration,
                        easing: easing
                    });
                }
            } else if (csstransforms) {
                if (csstransitions) {
                    el_pager_slider.css({
                        transition: 'all 0.' + duration + 's ' + settings.animationEasingCss + ' 0s',
                        transform: 'translateX(' + x + 'px)'
                    });
                } else {
                    el_pager_slider.stop().animate({
                        dvvalue: x
                    }, {
                        step: function(now, tween) {
                            el_pager_slider.css({
                                transform: 'translateX(' + now + 'px)',
                            });
                        },
                        duration: duration,
                        easing: easing
                    });
                }
            } else {
                if (csstransitions) {
                    el_pager_slider.css({
                        transition: 'all 0.' + duration + 's ' + settings.animationEasingCss + ' 0s',
                        marginLeft: x
                    });
                } else {
                    el_pager_slider.stop().animate({
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
            else if (el.find(value).hasClass('dvslider-slide')) {
                change(el.find(value).index());
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
            $('.dvslider-slide', el).last().remove();
            el.off('.dvslider');
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
