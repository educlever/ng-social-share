EduClever Angular 1.x social share buttons
==========================================

educ.ngSocialShare is a collection of directives which lets you share your pages. Currently Facebook, Google+ and Twitter.
These directives use alternatives to provide meta data to social networks.

You provide the look, we provide the sharing.

Licenced Under MIT Licence.

Getting Started
---------------
Install the library through bower.
```js
bower install educlever/ng-social-share.
```
Include the script in your html file.
```html
<script src="bower_components/ng-social-share/ng-social-share.min.js"></script>
```

Add it to your module's dependencies.
```js
angular.module('myapp',['educ.ngSocialShare'])
```

Configure the locale
```js
angular.module('myapp').config(['socialShareProvider', function(socialShareProvider) {
    // socialShareProvider.setLocale('fr_FR');
    socialShareProvider.setLocale('en_US');
});
```

These directive can use the same data object injected by the controller.
The examples bellow
```js
angular.module('myapp').controller('ctrl', ['$scope', function($scope) {
    $scope.share = {
        'url': 'http://www.mywebsite/blog/#/post/1234',
        'title': 'The title of the post',
        'description': 'A summary of the post...', // 160 length max fot Twitter !
        'image': 'http://www.mywebsite/uploads/2015/03/picture.png',
        'action': 'READ',
    };
});
```

Sharing with Facebook
---------------------
Facebook sharing uses the Facebook API with a Facebook AppId.
Register a Facebook app and configure the AppId in the config phase of your app.
```js
angular.module('myapp').config(["socialShareProvider", function(socialShareProvider) {
    socialShareProvider.register("facebook", "YOUAPPIDHERE");
}]);
```

Then use the facebook-share directive
```html
<span data-facebook-share
      class="btn btn-primary"
      data-scrape="false"
      data-url="{{share.url}}"
      data-title="{{share.title}}"
      data-image="{{share.image}}"
      data-description="{{share.description}}"><i class="fa fa-facebook"></i></span>
```

Google +
--------
Google + sharing uses the Google interactive post API with a Google AppId.
Register a Google app and configure the AppId in the config phase of your app.
```js
angular.module('myapp').config(["socialShareProvider", function(socialShareProvider) {
    socialShareProvider.register("googleplus", "YOUAPPIDHERE");
}]);
```

Then use the googleplus-share directive
```html
<span data-googleplus-share
      class="btn btn-danger"
      data-contenturl="{{share.url}}"
      data-calltoactionlabel="{{share.action}}"
      data-calltoactionurl="{{share.url}}"
      data-prefilltext="{{share.description}}"><i class="fa fa-google-plus"></i></span>
```

Twitter
-------
Add the twitter-share directive
```html
<span data-twitter-share
      class="btn btn-default"
      data-url="{{share.url}}"
      data-text="{{share.title}}"
      data-hashtags=""
      data-size="large"><i class="fa fa-twitter"></i></span>
```
