// config/auth.js
var mainDomain = 'http://localhost:3000'; //'http://tavle.ru';
// expose our config directly to our application using module.exports
module.exports = {

    'facebookAuth' : {
        'clientID'      : '1585596811682494', // your App ID
        'clientSecret'  : 'fdea5389e3f4266b4b80a975b6849da3', // your App Secret
        'callbackURL'   : mainDomain+'/auth/facebook/callback'
    },
    'fbAuthz' : {
        'clientID'      : '1585596811682494', // your App ID
        'clientSecret'  : 'fdea5389e3f4266b4b80a975b6849da3', // your App Secret
        'callbackURL'   : mainDomain+'/connect/facebook/callback'
    },
    'githubAuth' : {
        'clientID'       : 'c61cf3fb56de4660df60',
        'clientSecret'   : '303a43b57670177b3d2ce1d1b08198320406ddae',
        'callbackURL'    : mainDomain+'/auth/github/callback'
    },
    'gitAuthz' : {
        'clientID'       : 'c61cf3fb56de4660df60',
        'clientSecret'   : '303a43b57670177b3d2ce1d1b08198320406ddae',
        'callbackURL'    : '/'
    },

    'vkAuth' : {
        'clientID'      : '4720042',
        'clientSecret'  : 'i1rFMpf2cC2HB9f9HXFx',
        'callbackURL'   : mainDomain+'/auth/vkontakte/callback'
    },
    'vkAuthz' : {
        'clientID'      : '4720042',
        'clientSecret'  : 'i1rFMpf2cC2HB9f9HXFx',
        'callbackURL'   : mainDomain+'/connect/vkontakte/callback'
    },

};
