'use strict';

(function (angular) {

    var module = angular.module('educ.ngSocialShare', []);

    var appIdByNetwork = {};
    var locale = 'en_US';
    var needShares = true;

    /**
     * RANDOM STRING GENERATOR
     *
     * Info:      http://stackoverflow.com/a/27872144/383904
     * Use:       randomString(length [,"A"] [,"N"] );
     * Default:   return a random alpha-numeric string
     * Arguments: If you use the optional "A", "N" flags:
     *            "A" (Alpha flag)   return random a-Z string
     *            "N" (Numeric flag) return random 0-9 string
     */
    function randomString(len, an) {
        an = an && an.toLowerCase();
        var str = "",
            i = 0,
            min = an == "a" ? 10 : 0,
            max = an == "n" ? 10 : 62;
        for (; i++ < len;) {
            var r = Math.random() * (max - min) + min << 0;
            str += String.fromCharCode(r += r > 9 ? r < 36 ? 55 : 61 : 48);
        }
        return str;
    }

    function injectScript(url, id, onLoad) {
        var el = document.getElementById(id);
        if (!!id && !!el) {
            if (!!onLoad) {
                onLoad();
            }
            return el;
        }
        console.log(url);
        el = document.createElement('script');
        el.id = id;
        el.type = 'text/javascript';
        el.async = true;
        el.src = url;
        el.onload = onLoad;
        document.body.appendChild(el);
        return el;
    }

    var sdkLoaderByNetwork = {
        facebook: function (appId, locale, onLoad) {
            injectScript("https://connect.facebook.net/" + locale + "/all.js", "facebook-sdk", function () {
                if (!window['fbAsyncInit']) {
                    window.fbAsyncInit = function () {
                        window['FB'].init({
                            appId: appId,
                            channelUrl: 'app/channel.html',
                            status: true,
                            xfbml: true
                        });
                    };
                }
                if (!!onLoad) {
                    onLoad();
                }
            });
        },
        googleplus: function (appId, locale, onLoad) {
            if (!window['___gcfg']) {
                window.___gcfg = {
                    lang: locale.replace('_', '-').toLocaleLowerCase()
                };
            }
            injectScript("https://apis.google.com/js/platform.js", "googleplus-sdk", onLoad);
        },
        twitter: function (appId, locale, onLoad) {
            if (!!onLoad) {
                onLoad();
            }
        }
    };

    var socialGetter;

    module.provider('socialShare', function socialShareProvider() {
        this.$get = [function () {
        }];

        this.setLocale = function (x) {
            locale = x;
            return this;
        };
        this.setNeedShares = function (x) {
            needShares = !!x;
            return this;
        };
        this.register = function (network, appId) {
            appIdByNetwork[network] = appId;
            return this;
        };

    });

    module.run(["$http", function ($http) {
        socialGetter = (function () {
            return {
                getFacebookCount: function (url, callbackName) {
                    injectScript('https://graph.facebook.com/?id=' + encodeURIComponent(url) + '&callback=' + encodeURIComponent(callbackName), callbackName);
                },
                getTwitterCount: function (url, callbackName) {
                    injectScript('http://urls.api.twitter.com/1/urls/count.json?url=' + encodeURIComponent(url) + '&callback=' + encodeURIComponent(callbackName), callbackName);
                },
                getGooglePlusCount: function (url, callbackName) {
                    $http.post("https://clients6.google.com/rpc?key=" + encodeURIComponent(appIdByNetwork.googleplus), {
                        data: {
                            "method": "pos.plusones.get",
                            "id": "p",
                            "params": {
                                "nolog": true,
                                "id": url,
                                "source": "widget",
                                "userId": "@viewer",
                                "groupId": "@self"
                            },
                            "jsonrpc": "2.0",
                            "key": "p",
                            "apiVersion": "v1"
                        }
                    }).success(function (response) {
                        if (!!response.data) {
                            if (!!response.data.result) {
                                console.error(callbackName, response.data.result);
                                window[callbackName](response.data.result, null);
                            } else if (!!response.data.error) {
                                console.error(callbackName, response.data.error);
                                window[callbackName](null, response.data.error);
                            }
                        } else {
                            console.error(callbackName, response);
                        }
                    }).error(function (error) {
                        console.error(callbackName, error);
                        window[callbackName](null, error);
                    });
                }
            };
        })();
    }]);

    module.directive('facebookShare', ['$timeout', function ($timeout) {
        return {
            scope: true,
            link: function (scope, element, attr) {
                sdkLoaderByNetwork.facebook(appIdByNetwork.facebook, locale);

                if (needShares) {
                    attr.$observe("url", function () {
                        if (!!attr.url) {
                            var callbackname = "facebook_jsonp_" + randomString(10, "a");
                            window[callbackname] = (function (scope, element, attr, callbackname) {
                                return function (response) {
                                    $timeout(function () {
                                        scope.facebook = response;
                                        scope.facebook.shares = scope.facebook.shares || 0;
                                        delete window[callbackname];
                                        document.getElementById(callbackname).remove();
                                    });
                                }
                            })(scope, element, attr, callbackname);
                            socialGetter.getFacebookCount(attr.url, callbackname);
                        }
                    });
                }

                element.off();
                element.on('click', function (e) {
                    if (!!attr.url && !!window['FB']) {
                        window['FB'].ui({
                            method: 'share_open_graph',
                            action_type: 'share',
                            action_properties: JSON.stringify({
                                object: {
                                    scrape: angular.isDefined(attr.scrape) ? (attr.scrape !== "false") : true,
                                    url: attr.url,
                                    title: attr.title || attr.url,
                                    image: attr.image || "",
                                    description: attr.description || ""
                                }
                            })
                        }, function (response) {
                            if (!!response && response.error) {
                                console.error("Facebook error : " + response.error.message);
                            }
                        });
                    }
                    e.stopPropagation();
                    e.preventDefault();
                });
            }
        };
    }]);

    module.directive('twitterShare', ["$timeout", function ($timeout) {
        return {
            scope: true,
            link: function (scope, element, attr) {
                var lang = 'en';
                switch (locale) {
                    case 'fr_FR':
                        lang = 'fr';
                        break;
                    case 'en_US':
                        lang = 'en';
                        break;
                }

                function qs(obj, prefix) {
                    var str = [];
                    for (var p in obj) {
                        if (obj.hasOwnProperty(p)) {
                            var k = prefix ? prefix + "[" + p + "]" : p,
                                v = obj[p];
                            str.push(angular.isObject(v) ? qs(v, k) : encodeURIComponent(k) + "=" + encodeURIComponent(v));
                        }
                    }
                    return str.join("&");
                }

                function open_center_window(url, name, width, height, param) {
                    var x = 0, y = 0, w = 0, h = 0;
                    if (!!window['screenX']) {
                        x = parseInt(window.screenX);
                        y = parseInt(window.screenY);
                        w = parseInt(window.outerWidth);
                        h = parseInt(window.outerHeight);
                    } else if (!!window['screen']) {
                        x = 0;
                        y = 0;
                        w = parseInt(window.screen.width);
                        h = parseInt(window.screen.height);
                    }
                    if (!width) {
                        width = Math.round(w / 2);
                    } else {
                        width = parseInt(width);
                    }
                    if (!height) {
                        height = Math.round(h / 2);
                    } else {
                        height = parseInt(height);
                    }
                    param = param || "";
                    var cx = x;
                    if (w > width) {
                        cx += Math.round((w - width) / 2);
                    }
                    var cy = y;
                    if (h > height) {
                        cy += Math.round((h - height) / 2);
                    }
                    return window.open(url, name, 'left=' + cx + 'px,top=' + cy + 'px,width=' + width + 'px,height=' + height + 'px' + param);
                }

                if (needShares) {
                    attr.$observe("url", function () {
                        if (!!attr.url) {
                            var callbackname = "twitter_jsonp_" + randomString(10, "a");
                            window[callbackname] = (function (scope, element, attr, callbackname) {
                                return function (response) {
                                    $timeout(function () {
                                        scope.twitter = response;
                                        scope.twitter.count = scope.twitter.count || 0;
                                        delete window[callbackname];
                                        document.getElementById(callbackname).remove();
                                    });
                                }
                            })(scope, element, attr, callbackname);
                            socialGetter.getTwitterCount(attr.url, callbackname);
                        }
                    });
                }

                element.off();
                element.on('click', function (e) {
                    if (!!attr.url) {
                        var params = {
                            lang: lang,
                            url: attr.url || "",
                            text: attr.text || ""
                        };
                        if (!!attr.via) {
                            params.via = attr.via;
                        }
                        if (!!attr.hashtags) {
                            params.hashtags = attr.hashtags;
                        }
                        var url = "http://twitter.com/share?" + qs(params);
                        open_center_window(url, 'twitter', 640, 400);
                    }
                    e.preventDefault();
                    e.stopPropagation();
                });
            }
        };
    }]);

    module.directive('googleplusShare', [function () {
        return {
            scope: true,
            link: function (scope, element, attr) {

                if (needShares) {
                    attr.$observe("contenturl", function () {
                        if (!!attr.contenturl) {
                            var callbackName = "googleplus_jsonp_" + randomString(10, "a");
                            window[callbackName] = (function (scope, element, attr, callbackName) {
                                return function (data, error) {
                                    scope.googleplus = data;
                                    delete window[callbackName];
                                };
                            })(scope, element, attr, callbackName);
                            socialGetter.getGooglePlusCount(attr.url, callbackName);
                        }
                    });
                }

                var x = (function (scope, element, attr) {
                    return function () {
                        if (!!window['gapi']) {
                            var params = {};
                            params.clientid = appIdByNetwork.googleplus;
                            params.contenturl = attr.contenturl || "";
                            params.calltoactionlabel = attr.calltoactionlabel || "";
                            params.calltoactionurl = attr.calltoactionurl || "";
                            params.prefilltext = attr.prefilltext || "";
                            params.cookiepolicy = attr.cookiepolicy || "single_host_origin";
                            params.onshare = function (response) {
                                console.log("onshare", response);
                            };
                            window['gapi'].interactivepost.render(element.get(0), params);
                        }
                    }
                }(scope, element, attr));
                sdkLoaderByNetwork.googleplus(appIdByNetwork.googleplus, locale, x);
                attr.$observe('contenturl', x);
                attr.$observe('calltoactionurl', x);
                attr.$observe('calltoactionlabel', x);
                attr.$observe('prefilltext', x);
            }
        };
    }]);

})(angular);