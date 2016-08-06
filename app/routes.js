// app/routes.js
var express = require('express');
var User       		= require('../app/models/user');
var Post = require('../app/models/post');
var Tag = require('../app/models/tag');
var Comment = require('../app/models/comment');
var Notice = require('../app/models/notice');
var bodyParser = require('body-parser');
var paginate = require('express-paginate');
var Advert = require('../app/models/advert');
var paginate = require('paginate')();
module.exports = function(app, passport) {
  //==Находим всю рекламу для рендера========
    var siteAdvert = {};
    var notReadedMsgs = 0;
    function findAdminMsg (req, res, next) {
        if(req.user.admin.msgs.length == notReadedMsgs){
            return next();
        }
        notReadedMsgs = 0;
        for (var i = req.user.admin.msgs.length - 1; i >= 0; i--) {
            if(req.user.admin.msgs[i].readed == false){
                notReadedMsgs++;
            }
        };
        next();
    }
    function findSmallAdvert(req, res, next) {
        Advert.find({'type': 'small'}, function (err, advert) {
            if(err)
                throw err;
            if(advert){
                siteAdvert.small = advert;
                return siteAdvert.small;
            }
        });
    }
    function findBigAdvert(req, res, next) {
        siteAdvert.big = {};
        Advert.find({'type': 'big', 'align': 'top'}, function (err, advert) {
            if(err)
                throw err;
            if(advert){
                siteAdvert.big.top = advert;
            }
            Advert.find({'type': 'big', 'align': 'bottom'}, function (err, advert) {
                if(err)
                    throw err;
                if(advert){
                    siteAdvert.big.bottom = advert;
                    return siteAdvert.big;
                }else{
                    return siteAdvert.big;
                }
            });
        });
    }
    findSmallAdvert();
    findBigAdvert();

	// =====================================
	// Main Routes ========
	// =====================================

// main search ================================
    // redirect wiht call
    app.post('/search', function (req, res) {
        if(req.body.call.toString().length < 2){
            res.redirect('/?warnmsg=Введите пожалуйста запрос по-больше')
        }else if(req.body.call.toString().length > 100){
            res.redirect('/?warnmsg=Зачем вам такой большой запрос?');
        } else{
            res.redirect('/search/' + req.body.call.toString());
        }
    });

    // find

    //     newNotice.href = '/ideas/'+postNum+'#comment'+newComment.num;
    //       newNotice.href = '/ideas/'+postNum+'#comment'+newComment.num;
    app.get('/readNotice', isLoggedIn, function (req, res) {
        var query = req.query;
        Notice.findOne({'num': query.nn}, function (err, notice) {
            if(err) throw err;
            if(!notice) throw err;
            notice.readed = true;
            notice.href = '/ideas/'+query.np+'#comment'+query.nc;
            notice.save(function (err) {
                if(err) throw err;
                res.redirect(notice.href);
            });
        });
    });
    app.get('/search/:q', function (req, res) {
        if(req.params.q.toString().length < 2){
            res.redirect('/?warnmsg=Введите пожалуйста запрос по-больше')
        }else if(req.params.q.toString().length > 70){
            res.redirect('/?warnmsg=Зачем вам такой большой запрос?');
        } else{
            var curPage = req.query.page || 1;
            var perPage = 30;
            var qr = '"' + req.params.q.toString() + '"';
            Post.search(
                //{query_string: {  query: req.params.q}},
                {
                    filtered:{
                        query:{
                            query_string:{
                                query: qr
                            }
                        },
                        filter:{
                            term:{
                                access: true
                            }
                        }
                    }
                },
                {
                    from: (curPage - 1) * perPage,
                    size: perPage,
                    sort: 'num:desc',
                },
                function(err, results) {
                if(err) throw err;
                if(!results){
                    res.redirect('/');
                }else{
                    var pagination = paginate.page(results.hits.total, perPage, curPage);
                    var html = pagination.render({ baseUrl: '/search/'+qr});
                    res.render('search', {
                        page: 'Поиск',
                        query: req.query,
                        q: qr,
                        body: req.body,
                        results: results.hits.hits,
                        total: results.hits.total,
                        paginator: html,
                        siteAdvert: siteAdvert,
                        user: req.user
                    });
                }
            });
        }
    });

//================================================
//====ideas=======================================

    app.get('/about', function (req, res) {
        res.render('about',{});
    });

    app.get('/rules', function (req, res) {
	res.render('rules', {
		page: 'Правила сайта',
		siteAdvert: siteAdvert,
		user: req.user,
		query: req.query
	});
    });
    app.get('/ideas', function (req, res) {
        var curPage = req.query.page || 1;
        var perPage = 30;
        Post.search(
            {
                filtered:{
                    query:{
                        query_string:{
                            query: 'access:true'
                        }
                    },
                    filter:{
                        term:{
                            access: true
                       }
                    }
                }
            },
            {from: (curPage - 1) * perPage,
            size: perPage,
            sort: 'num:desc'}
        ,function(err, results) {
            if(err) throw err;
            if(!results){
                res.redirect('/');
            }else{
                var pagination = paginate.page(results.hits.total, perPage, curPage);
                var html = pagination.render({ baseUrl: '/ideas' });
                res.render('posts', {
                    page: 'Все Идеи',
                    query: req.query,
                    body: req.body,
                    results: results.hits.hits,
                    paginator: html,
                    siteAdvert: siteAdvert,
                    user: req.user
                });
            }
        });
    });
    app.get('/', function (req, res) {
        var curPage = req.query.page || 1;
        var perPage = 30;
        Post.search(
            {
                filtered:{
                    query:{
                        query_string:{
                            query: 'access:true'
                        }
                    },
                    filter:{
                        term:{
                            access: true
                       }
                    }
                }
            },
            {from: (curPage - 1) * perPage,
            size: perPage,
            sort: 'num:desc'}
        ,function(err, results) {
            if(err) throw err;
            if(!results){
                res.redirect('/profile');
            }else{
                var pagination = paginate.page(results.hits.total, perPage, curPage);
                var html = pagination.render({ baseUrl: '/ideas' });
                res.render('posts', {
                    page: 'Все Идеи',
                    query: req.query,
                    body: req.body,
                    results: results.hits.hits,
                    paginator: html,
                    siteAdvert: siteAdvert,
                    user: req.user
                });
            }
        });
    });
//================================================
    app.get('/tracker', isLoggedIn, function (req, res) {
        var user = req.user;
        user.messages = [];
        user.save(function (err) {
            if(err) throw err;
            Notice.paginate({'recieverId': user.idNum}, {page: req.query.page, limit: 30},function(err, notices, pageCount, itemCount) {
                if (err) return next(err);
                res.format({
                    html: function() {
                        res.render('tracker', {
                            query: req.query,
                            page: 'Уведомления',
                            user: req.user,
                            notices: notices,
                            siteAdvert: siteAdvert,
                            pageCount: pageCount,
                            itemCount: itemCount
                        });
                    },
                    json: function() {
                      // inspired by Stripe's API response for list objects
                        res.json({
                            object: 'list',
                            has_more: paginate.hasNextPages(req)(pageCount),
                            data: users
                        });
                    }
                });
            }, { sortBy: { num:-1 } });
        });
    });
    app.get('/tracker/clean', isLoggedIn, function (req, res) {
        Notice.remove({'recieverId': req.user.idNum}, function (err) {
            if(err) throw err;
            res.redirect('/tracker');
        });
    });
	app.get('/users', function (req, res) {
		User.paginate({ }, {page: req.query.page, limit: 40} ,function(err, users, pageCount, itemCount) {
    		if (err) return next(err);
    		res.format({
				html: function() {
        			res.render('users', {
        				query: req.query,
        				page: 'Пользователи',
        				user: req.user,
        				users: users,
                        siteAdvert: siteAdvert,
        				pageCount: pageCount,
    				   	itemCount: itemCount,
    			    });
    	  		},
    	  		json: function() {
    	  		  // inspired by Stripe's API response for list objects
    				res.json({
	        			object: 'list',
    			    	has_more: paginate.hasNextPages(req)(pageCount),
        				data: users
      				});
     		 	}
	    	});
		}, { sortBy: { score:-1 } });
	});
    app.get('/users/id:id', function (req, res) {
        Post.paginate({ 'access' : true, 'author.idNum' : req.params.id}, {page: req.query.page, limit:req.query.limit}, function(err, posts, pageCount, itemCount) {

            if (err) return next(err);
            User.findOne({ 'idNum' : req.params.id }, function(err, author) {
                res.format({
                    html: function() {
                        if(req.user && req.user.idNum == author.idNum){
                            res.render('userposts', {
                                page: 'Мои идеи',
                                user: req.user,
                                posts: posts,
                                query: req.query,
                                author: author,
                                siteAdvert: siteAdvert,
                                pageCount: pageCount,
                                itemCount: itemCount,
                            });
                        } else{
                            res.render('userposts', {
                                page: 'Идеи - '+ author.name,
                                user: req.user,
                                query: req.query,
                                posts: posts,
                                author: author,
                                siteAdvert: siteAdvert,
                                pageCount: pageCount,
                                itemCount: itemCount,
                            });
                        }
                    },
                    json: function() {
                      // inspired by Stripe's API response for list objects
                        res.json({
                            object: 'list',
                            has_more: paginate.hasNextPages(req)(pageCount),
                            data: posts
                        });
                    }
                });
            });
        }, { sortBy: { num:-1 } });
    });
// =============================================================================
// Add information about user ==================================================
// =============================================================================
	app.post('/addInf',function (req, res) {
		var user = req.user;
		if(req.body.name.length > 4 && req.body.name.length < 20){
			user.name = req.body.name[0].toUpperCase() + req.body.name.substring(1);
		}
		if(req.body.about.length < 1000){
			user.about = req.body.about;
		}
		if(req.body.contacts.length < 1000){
			user.contacts = req.body.contacts;
		}
		user.save(function(err) {
			if(err)
				throw err;
	        res.redirect('/profile?sucmsg=Данные успешно добавленны');
        });
	});
// =============================================================================
// Add posts&comments ==========================================================
// =============================================================================
	app.get('/addIdea', isLoggedIn, function (req, res) {
		res.render('addpost',{
			page: 'Добавить идею',
			user: req.user,
            siteAdvert: siteAdvert,
            query: req.query,
		});
	});

	app.get('/ideas/:num', function (req, res) {
		var num = req.params.num;
        var q = req.query;
		Post.findOne({ 'access': true, 'num' : num }, function(err, post) {
			if(err)
				throw err;
			if(post){
                Comment.find({'postNum': num}).sort({ num: 1}).exec(function (err, comments) {
					comments.forEach(function (com, i , array) {
						User.findOne({'idNum': com.authorId}, function (err, commentAuthor) {
							if(err) throw err;
                            if(!commentAuthor) return true;
							com.authorName = commentAuthor.name;
                            com.authorImg = commentAuthor.photoMax;
							com.save(function (err) {
								if(err) throw err;
								return true;
							});
						});
					});
					post.reviews++;
					post.save(function(err) {
						if(err)
							throw err;
						User.findOne({'idNum': post.author.idNum},function(err, author) {
							if(err)
								throw err;
							res.render('post',{
								page: post.title,
                       			query: q,
								user: req.user,
								post: post,
                                siteAdvert: siteAdvert,
								comments: comments,
								author: author,
							});
						});
					});
				});
			} else{
				res.render('post',{
					user: req.user,
                    query: q,
                    siteAdvert: siteAdvert,
					page: 'Нет такого поста либо его не одобрила администрация.',
				});
			}
		});
	});

  app.post('/addPost',isLoggedIn, function (req, res) {
        if( (req.body.text.length > 10) && (req.body.text.length < 50000) && (req.body.title.length > 10) && (req.body.title.length < 100) && (req.body.tags.length > 1) && (req.body.tags.length < 200)){
            var newPost = new Post;
            Post.count({}, function(err,count) {
                if(err)
                    throw err;
                newPost.access = false;
                newPost.title = req.body.title;
                newPost.num = count + 1;
                newPost.tags = req.body.tags.split(',');
                newPost.text = req.body.text;
                newPost.author.idNum = req.user.idNum;
                newPost.readed = false;
                newPost.reviews = 0;
                newPost.comments = [];
                var date = new Date;
                var month = (date.getMonth() + 1);
                if(month<10){month = '0'+month}
                newPost.addtime = date.getDate() + '.' + month + '.' + date.getFullYear();

                newPost.save(function(err) {
                    if (err)
                        throw err;
                    //saved! But:
                    //indexing....
                    newPost.on('es-indexed', function (err, ok) {
                        if(err) throw err;
                        //already!
                        res.redirect('/ideas?sucmsg=Идея отправленна на проверку. После успешной проверки, модераторы добавят вашу идею.');
                    });
                });
            });
        } else{
            res.redirect('/addIdea?warnmsg=Пожалуйста, соблюдайте условия количества символов.');
        }
    });

	app.get('/tags', function (req, res) {
		Tag.paginate({ }, {page: req.query.page, limit: 50},function(err, tags, pageCount, itemCount) {
    		if (err) return next(err);
    		res.format({
				html: function() {
        			res.render('tags', {
        				query: req.query,
        				page: 'Теги',
        				user: req.user,
                        siteAdvert: siteAdvert,
        				tags: tags,
        				pageCount: pageCount,
    				   	itemCount: itemCount,
    			    });
    	  		},
    	  		json: function() {
    	  		  // inspired by Stripe's API response for list objects
    				res.json({
	        			object: 'list',
    			    	has_more: paginate.hasNextPages(req)(pageCount),
        				data: tags
      				});
     		 	}
	    	});
		},{ sortBy: { ideas:-1 }});
	});
	app.get('/tags/:name', function (req, res) {
		var name = req.params.name;
		Tag.findOne({'name' : name }, function(err, tag) {
			if(err)
				throw err;
			if(tag){
                var curPage = req.query.page || 1;
                var perPage = 30;
                Post.search(
                    {
                        filtered:{
                            query:{
                                match: {
                                    tags: name
                                }
                            },
                            filter:{
                                term:{
                                    access: true
                                }
                            }
                        }
                    },
                    {from: (curPage - 1) * perPage,
                    size: perPage,
                    sort: 'num:desc'}
                ,function(err, results) {
                    if(err) throw err;
                    if(results.length < 1){
                        res.render('tag', {
                            page: name,
                            query: req.query,
                            body: req.body,
                            paginator: html,
                            tag: tag,
                            siteAdvert: siteAdvert,
                            user: req.user
                        });
                    }else{
                        var pagination = paginate.page(results.hits.total, perPage, curPage);
                        var html = pagination.render({ baseUrl: '/ideas' });
                        res.render('tag', {
                            tag: tag,
                            page: name,
                            query: req.query,
                            body: req.body,
                            results: results.hits.hits,
                            paginator: html,
                            siteAdvert: siteAdvert,
                            user: req.user
                        });
                    }
                });
			} else{
				res.render('tag',{
                    user: req.user,
                    query: req.query,
                    siteAdvert: siteAdvert,
					page: 'Нет такого Тега либо его не одобрила администрация',
				});
			}
		});
	});
    app.get('/addTag/:name',isLoggedIn, function (req, res) {
        var user = req.user;
        var isIn = user.tags.indexOf(req.params.name);
        if(isIn>-1){
            res.redirect('/tags/'+req.params.name+'?warnmsg=Вы уже подписаны на этот тег');
        } else{
            user.tags.push(req.params.name);
            user.save(function (err) {
                if(err) throw err;
            	Tag.findOne({'name':req.params.name}, function (err, tag) {
            		if(err) throw err;
            		if(!tag){
            			res.redirect('/tags?warnmsg=Ошибка. Нет такого тега');
            		}
            		if(tag){
            			tag.listeners++;
            			tag.save(function (err) {
            				if(err) throw err;
				            res.redirect('/tags/'+req.params.name+'?sucmsg=Вы подписались на этот тег');
            			});
            		}
            	});
            });
        }
    });
    app.get('/delTag/:name',isLoggedIn, function (req, res) {
        var user = req.user;
        var isIn = user.tags.indexOf(req.params.name);
        if(isIn<0){
            res.redirect('/tags/'+req.params.name+'?sucmsg=Вы не были подписаны на этот тег');
        } else{
            user.tags.splice(isIn,1);
            user.save(function (err) {
                if(err) throw err;
            	Tag.findOne({'name':req.params.name}, function (err, tag) {
            		if(err) throw err;
            		if(!tag){
            			res.redirect('/?warnmsg=Ошибка. Нет такого тега');
            		} else{
            			tag.listeners--;
            			tag.save(function (err) {
            				if(err) throw err;
			                res.redirect('/ideas?sucmsg=Вы отписались от тега: ' + tag.name);
            			});
            		}
            	});
            });
        }
    });
    app.get('/feed',isLoggedIn, function (req, res) {
        var curPage = req.query.page || 1;
        var perPage = 30;
        var tagsNames;
        if(req.user.tags.length > 0){
            tagsNames = req.user.tags.join(' ');
        } else{
            tagsNames = '*';
        }
        Post.search(
            {
                filtered:{
                    query:{
                        match: {
                            tags: tagsNames
                        }
                    },
                    filter:{
                        term:{
                            access: true
                        }
                    }
                }
            },
            {from: (curPage - 1) * perPage,
            size: perPage,
            sort: 'num:desc'}
        ,function(err, results) {
            if(err) throw err;
            if(results.length < 1){
                res.render('posts', {
                    page: 'Моя лента',
                    query: req.query,
                    body: req.body,
                    paginator: html,
                    siteAdvert: siteAdvert,
                    user: req.user
                });
            }else{
                var pagination = paginate.page(results.hits.total, perPage, curPage);
                var html = pagination.render({ baseUrl: '/ideas' });
                res.render('posts', {
                    page: 'Моя лента',
                    query: req.query,
                    body: req.body,
                    results: results.hits.hits,
                    paginator: html,
                    siteAdvert: siteAdvert,
                    user: req.user
                });
            }
        });
    });
app.get('/startups',function (req, res) {
        var curPage = req.query.page || 1;
        var perPage = 30;
        var tagsNames = 'startup Startup Стартап стартап startups Startups Стартапы стартапы'
        Post.search(
            {
                filtered:{
                    query:{
                        match: {
                            tags: tagsNames
                        }
                    },
                    filter:{
                        term:{
                            access: true
                        }
                    }
                }
            },
            {from: (curPage - 1) * perPage,
            size: perPage,
            sort: 'num:desc'}
        ,function(err, results) {
            if(err) throw err;
            if(results.length < 1){
                res.render('posts', {
                    page: 'Стартапы',
                    query: req.query,
                    body: req.body,
                    paginator: html,
                    siteAdvert: siteAdvert,
                    user: req.user
                });
            }else{
                var pagination = paginate.page(results.hits.total, perPage, curPage);
                var html = pagination.render({ baseUrl: '/startups' });
                res.render('posts', {
                    page: 'Стартапы',
                    query: req.query,
                    body: req.body,
                    results: results.hits.hits,
                    paginator: html,
                    siteAdvert: siteAdvert,
                    user: req.user
                });
            }
        });
    });

    app.get('/users/id:id', function (req, res) {
        Post.paginate({ 'access' : true, 'author.idNum' : req.params.id}, {page: req.query.page, limit: 30}, function(err, posts, pageCount, itemCount) {

            if (err) return next(err);
            User.findOne({ 'idNum' : req.params.id }, function(err, author) {
                res.format({
                    html: function() {
                        if(req.user && req.user.idNum == author.idNum){
                            res.render('posts', {
                                page: 'Мои идеи',
                                user: req.user,
                                posts: posts,
                                query: req.query,
                                siteAdvert: siteAdvert,
                                author: author,
                                pageCount: pageCount,
                                itemCount: itemCount,
                            });
                        } else{
                            res.render('posts', {
                                page: 'Идеи - '+ author.name,
                                user: req.user,
                                query: req.query,
                                posts: posts,
                                siteAdvert: siteAdvert,
                                author: author,
                                pageCount: pageCount,
                                itemCount: itemCount,
                            });
                        }
                    },
                    json: function() {
                      // inspired by Stripe's API response for list objects
                        res.json({
                            object: 'list',
                            has_more: paginate.hasNextPages(req)(pageCount),
                            data: posts
                        });
                    }
                });
            });
        }, { sortBy: { num:-1 } });
    });









	app.get('/feedback', function (req, res) {
		res.render('feedback',{
			page: 'Обратная связь',
            query: req.query,
			user: req.user,
			siteAdvert: siteAdvert
		});
	});
	// =====================================
	// PROFILE SECTION =========================
	// =====================================
	// we will want this protected so you have to be logged in to visit
	// we will use route middleware to verify this (the isLoggedIn function)
	app.get('/profile', isLoggedIn, function(req, res) {
		res.render('profile', {
			query: req.query,
            siteAdvert: siteAdvert,
			page: 'Профиль',
			user : req.user
		});
	});

	// =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    // route for facebook authentication and login
    app.get('/auth/facebook', passport.authenticate('facebook', { scope : 'email' }));

    // handle the callback after facebook has authenticated the user
	app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect : '/profile',
            failureRedirect : '/profile?warnmsg=Что вы делаете? Вы уже вошли.'
    }));

	// handle the callback after vkontakte has authenticated the user
	app.get('/auth/vkontakte',passport.authenticate('vkontakte'));

	app.get('/auth/vkontakte/callback',
		passport.authenticate('vkontakte', {
            successRedirect : '/profile',
            failureRedirect : '/profile?warnmsg=Что вы делаете? Вы уже вошли.'
    }));


	// handle the callback after github has authenticated the user
	app.get('/auth/github',passport.authenticate('github'));
	app.get('/auth/github/callback',
		passport.authenticate('github', {
            successRedirect : '/profile',
            failureRedirect : '/profile?warnmsg=Что вы делаете? Вы уже вошли.'
    }));
// =============================================================================
// AUTHORIZE (ALREADY LOGGED IN / CONNECTING OTHER SOCIAL ACCOUNT) =============
// =============================================================================



    // facebook -------------------------------

        // send to facebook to do the authentication
        app.get('/connect/facebook', passport.authorize('fbAuthz',{ failureRedirect: '/profile?warnmsg=При привязке провайдера произошла ошибка.' }));

        // handle the callback after facebook has authorized the user
        app.get('/connect/facebook/callback',
        	passport.authorize('fbAuthz', { failureRedirect: '/profile?msg=isAnotherUser' }),
        	function (req, res) {
        		return res.redirect('/profile?sucmsg=Аккаунт facebook успешно привязан');
        	}
        );

    // github --------------------------------

        // send to github to do the authentication
        app.get('/connect/github', passport.authorize('gitAuthz',{ failureRedirect: '/profile?warnmsg=При привязке провайдера произошла ошибка.' }));

        // handle the callback after github has authorized the user
        app.get('/connect/github/callback',
        	passport.authorize('gitAuthz', { failureRedirect: '/profile?msg=isAnotherUser' }),
        	function (req, res) {
        		return res.redirect('/profile?sucmsg=Аккаунт github успешно привязан');
        	}
        );

    // vk -------------------------------------
        app.get('/connect/vkontakte', passport.authorize('vkAuthz',{ failureRedirect: '/profile?warnmsg=При привязке провайдера произошла ошибка.' }));

        // handle the vkontakte after github has authorized the user
        app.get('/connect/vkontakte/callback',
        	passport.authorize('vkAuthz', { failureRedirect: '/profile?msg=isAnotherUser' }),
        	function (req, res) {
        		return res.redirect('/profile?sucmsg=Аккаунт vkontakte успешно привязан');
        	}
        );


// =============================================================================
// UNLINK ACCOUNTS =============================================================
// =============================================================================
// used to unlink accounts. for social accounts, just remove the token
// for local account, remove email and password
// user account will stay active in case they want to reconnect in the future

    // local -----------------------------------

    // facebook -------------------------------
    app.get('/unlink/facebook',isLoggedIn, function(req, res) {
    	if(req.user.facebook.token && (req.user.vkontakte.token || req.user.github.token)){
	        var user = req.user;
    	    user.facebook = undefined;
        	user.save(function(err) {
            	res.redirect('/profile?sucmsg=Аккаунт facebook успешно отвязан');
        	});
        } else{
        	res.redirect('/profile?sucmsg=Вы не можете этого сделать.');
        }
    });

    // github --------------------------------
    app.get('/unlink/github',isLoggedIn, function(req, res) {
    	if(req.user.github.token && (req.user.vkontakte.token || req.user.facebook.token)){
    	    var user = req.user;
        	user.github = undefined;
    	    user.save(function(err) {
        	   res.redirect('/profile?sucmsg=Аккаунт github успешно отвязан');
        	});
        } else{
        	res.redirect('/profile?sucmsg=Вы не можете этого сделать.');
        }
    });
    //vkontakte
    app.get('/unlink/vkontakte',isLoggedIn, function(req, res) {
    	if( req.user.vkontakte.token && (req.user.github.token || req.user.facebook.token)){
	        var user = req.user;
        	if(user.vkontakte.id == '135655165'){
        		user.admin.isAdmin = false;
        	}
            user.vkontakte = undefined;
        	user.save(function(err) {
        		res.redirect('/profile?sucmsg=Аккаунт vkontakte успешно отвязан.');
        	});
        } else{
        	res.redirect('/profile?sucmsg=Вы не можете этого сделать.');
        }
    });

//========================================================
// ADMIN =================================================
//========================================================
	app.get('/admin',isLoggedIn, isModer,findAdminMsg,function (req, res) {
        Post.count({'readed' : false},function (err, count) {
            if(err) throw err;
            User.paginate({'admin.isModer': true},{page: req.query.page, limit: 20} ,function(err, moders, pageCount, itemCount) {
                if (err) return next(err);
                res.format({
                    html: function() {
                        res.render('admin/admin', {
                            page: 'MainAdminPage',
                            query: req.query,
                            user: req.user,
                            moders: moders,
                            NotReadedPostsCount: count,
                            notReadedMsgs: notReadedMsgs,
                            siteAdvert: siteAdvert,
                            pageCount: pageCount,
                            itemCount: itemCount,
                        });
                    },
                    json: function() {
                      // inspired by Stripe's API response for list objects
                        res.json({
                            object: 'list',
                            has_more: paginate.hasNextPages(req)(pageCount),
                            data: users
                        });
                    }
                });
            }, { sortBy: { score:-1 } });
        });
	});

	app.get('/admin/ideas',isLoggedIn,isModer,findAdminMsg,function (req, res) {
		Post.paginate({ 'readed' : false }, {page: req.query.page, limit: req.query.limit}, function(err,posts, pageCount, itemCount) {
        if (err)
          return next(err);
    		res.format({
				html: function() {
                    Post.count({'readed' : false},function (err, count){
                        if(err) throw err;
                        res.render('admin/ideas',{
                            page: 'Новые идеи',
                            query: req.query,
                            user: req.user,
                            posts: posts,
                            pageCount: pageCount,
                            itemCount: itemCount,
                            NotReadedPostsCount: count,
                            notReadedMsgs: notReadedMsgs,
                            siteAdvert: siteAdvert
                        });
                    });
    	  		},
    	  		json: function() {
    	  		  // inspired by Stripe's API response for list objects
    				res.json({
	        			object: 'list',
    			    	has_more: paginate.hasNextPages(req)(pageCount),
        				data: posts
      				});
     		 	}
	    	});
		}, { sortBy: { num:1 } });
	});
	app.get('/admin/goodIdeas',isLoggedIn,isAdmin,findAdminMsg,function (req, res) {
		Post.paginate({ 'readed' : true, 'access': false }, {page: req.query.page, limit:req.query.limit}, function(err, posts, pageCount, itemCount) {
    		if (err) return next(err);
    		res.format({
				html: function() {
                    Post.count({'readed' : false},function (err, count) {
                        if(err)
                            throw err;
                        res.render('admin/ideas',{
                            page: 'Хорошие идеи',
                            query: req.query,
                            user: req.user,
                            posts: posts,
                            pageCount: pageCount,
                            itemCount: itemCount,
                            NotReadedPostsCount: count,
                            notReadedMsgs: notReadedMsgs,
                            siteAdvert: siteAdvert
                        });
                    });
    	  		},
    	  		json: function() {
    	  		  // inspired by Stripe's API response for list objects
    				res.json({
	        			object: 'list',
    			    	has_more: paginate.hasNextPages(req)(pageCount),
        				data: posts
      				});
     		 	}
	    	});
		}, { sortBy: { num: -1 } });
	});
    app.get('/admin/goodIdeas/:num',isLoggedIn,isAdmin,findAdminMsg,function (req, res) {
        var num = req.params.num;
        Post.findOne({ 'readed':true, 'access': false, 'num' : num }, function(err, post) {
            if(err)
                throw err;
            if(post){
                post.reviews++;
                post.save(function(err) {
                    if(err)
                        throw err;
                    Post.count({'readed' : false},function (err, count) {
                        if(err)
                            throw err;
                        User.findOne({'idNum': post.author.idNum},function(err, author) {
                            if(err)
                                throw err;
                            if(author){
                                    res.render('admin/post',{
                                        page: post.title,
                                        query: req.query,
                                        user: req.user,
                                        notReadedMsgs: notReadedMsgs,
                                        post: post,
                                        author: author,
                                        NotReadedPostsCount: count,
                                        siteAdvert: siteAdvert
                                    });
                            } else{
                                res.render('admin/post',{
                                    page: post.title,
                                    query: req.query,
                                    user: req.user,
                                    NotReadedPostsCount: count,
                                    notReadedMsgs: notReadedMsgs,
                                    post: post,
                                    siteAdvert: siteAdvert
                                });
                            }
                        });
                    });
                });
            } else{
                res.render('admin/post',{
                    user: req.user,
                    query: req.query,
                    page: 'Нет такого поста.',
                    notReadedMsgs: notReadedMsgs,
                    siteAdvert: siteAdvert
                });
            }
        });
    });



    app.get('/admin/ideas/:num',isLoggedIn,isAdmin,findAdminMsg, function (req, res) {
        var num = req.params.num;
        Post.findOne({ 'readed':false, 'access': false, 'num' : num }, function(err, post) {
            if(err)
                throw err;
			if(post){
				post.reviews++;
				post.save(function(err) {
					if(err)
						throw err;
                    Post.count({'readed' : false},function (err, count) {
                        if(err)
                            throw err;
    					User.findOne({'idNum': post.author.idNum},function(err, author) {
	       					if(err)
			      				throw err;
				    		if(author){
                        			res.render('admin/post',{
										page: post.title,
                    	        		query: req.query,
                        	    		user: req.user,
                                        notReadedMsgs: notReadedMsgs,
                            			post: post,
                            			author: author,
                            			NotReadedPostsCount: count,
                            			siteAdvert: siteAdvert
                        			});
							} else{
								res.render('admin/post',{
									page: post.title,
            	            		query: req.query,
									user: req.user,
                    	            NotReadedPostsCount: count,
                                    notReadedMsgs: notReadedMsgs,
									post: post,
									siteAdvert: siteAdvert
								});
							}
						});
					});
				});
			} else{
				res.render('admin/post',{
					user: req.user,
                    query: req.query,
					page: 'Нет такого поста.',
                    notReadedMsgs: notReadedMsgs,
					siteAdvert: siteAdvert
				});
			}
        });
    });

    app.get('/admin/show/post:postNum', isLoggedIn, isModer,function (req, res) {
        Post.findOne({ 'num' : req.params.postNum, 'access': false, 'readed':false }, function(err, post) {
            if(err)
                throw err;
            if(post){
                User.findOne({ 'idNum' : post.author.idNum },function (err, postAuthor) {
                    if(err)
                        throw err;
                    if(!postAuthor){
                        return res.redirect('/admin/ideas?warnmsg=Нет автора идеи');
                    }
                    Post.count({ 'access': true }, function(err,count) {
                        if(err)
                            throw err;
                        post.tags.forEach(function(tag, i, array){
							if(tag.trim().length > 0){
								return;
							} else{
								post.tags.splice(i,1);
							}
						});
                        post.access = true;
                        post.readed = true;
                        post.reviews = 0;
                        post.num = count + 1;
                        var date = new Date;
                        var month = (date.getMonth() + 1);
                        if(month<10){month = '0'+month}
                        post.addtime = date.getDate() + '.' + month + '.' + date.getFullYear();
                        post.save(function (err) {
                            if(err)
                                throw err;
                            post.on('es-indexed', function (err, ok) {
                                if(err) throw err;
                                addTag(post);
                                postAuthor.score = postAuthor.score + 2;
                                postAuthor.stats.posts++;
                                postAuthor.save(function (err) {
                                    if(err)
                                        throw err;
                                    res.redirect('/admin/ideas?sucmsg=Идея опубликована');
                                });
                            });
                        });
                    // end of Post count
                    });
                });
            } else{
                res.redirect('/admin/ideas?warnmsg=Идея не найдена');
            }
        });
    });
	app.get('/admin/hide/post:postNum', isLoggedIn, isModer,function (req, res) {
        Post.findOne({ 'num' : req.params.postNum, 'access': false, 'readed': false }, function(err, post) {
            if(err)
                throw err;
            if(post){
                post.readed = true;
                post.save(function (err) {
                    if(err)
                        throw err;
                    post.on('es-indexed', function (err, ok) {
                        if(err) throw err;
                        res.redirect('/admin/ideas?sucmsg=Идея добавлена в архив');
                    });
                });
            } else{
                res.redirect('/admin/ideas?warnmsg=Идея не найдена');
            }
        });
    });
    app.get('/admin/remove/post:postNum', isLoggedIn, isAdmin,function (req, res) {
        Post.remove({ 'num' : req.params.postNum, 'access': false}, function(err) {
            if(err){
                res.redirect('/admin?warnmsg=Не удалось удалить')
                throw err;
            } else{
                res.redirect('/admin/ideas?sucmsg=Идея успешно удалена');
            }
        });
    });
    app.get('/admin/deleteAppeals/:comNum', isLoggedIn, isModer, function (req, res) {
        Comment.findOne({'num': req.params.comNum},function (err, comment) {
            if(err) throw err;
            if(!comment){
                res.redirect('/admin/appeals?msg= No such comment')
            } else{
                comment.haveAppeals = false;
                comment.appeals = [];
                comment.save(function (err) {
                    if(err) throw err;
                    res.redirect('/admin/appeals?sucmsg= Жалоба удалена.');
                });
            }
        });
    });
    app.get('/admin/good/show/post:postNum', isLoggedIn, isAdmin,function (req, res) {
        Post.findOne({ 'num' : req.params.postNum, 'access': false, 'readed':true }, function(err, post) {
            if(err)
                throw err;
            if(post){
                User.findOne({ 'idNum' : post.author.idNum },function (err, postAuthor) {
                    if(err)
                        throw err;
                    if(!postAuthor){
                        return res.redirect('/admin/ideas?warnmsg=Нет автора идеи');
                    }
                    Post.count({ 'access': true }, function(err,count) {
                        if(err)
                            throw err;
                        post.tags.forEach(function(tag, i, array){
							if(tag.trim().length > 0){
								return;
							} else{
								post.tags.splice(i,1);
							}
						});
                        post.access = true;
                        post.readed = true;
                        post.reviews = 0;
                        post.num = count + 1;
                        var date = new Date;
                        post.addtime = date.getDate() + '.' + (date.getMonth() + 1) + '.' + date.getFullYear();
                        post.save(function (err) {
                            if(err)
                                throw err;
                            post.on('es-indexed', function (err, ok) {
                                if(err) throw err;
                                addTag(post);
                                postAuthor.score = postAuthor.score + 2;
                                postAuthor.stats.posts++;
                                postAuthor.save(function (err) {
                                    if(err)
                                        throw err;
                                    res.redirect('/admin/ideas?sucmsg=Идея опубликована');
                                });
                            });
                        });
                    // end of Post count
                    });
                });
            } else{
                res.redirect('/admin/ideas?warnmsg=Идея не найдена');
            }
        });
    });
    app.get('/admin/good/remove/post:postNum', isLoggedIn, isAdmin,function (req, res) {
        Post.remove({ 'num' : req.params.postNum, 'access': false, 'readed': true}, function(err) {
            if(err){
                res.redirect('/admin?warnmsg=Не удалось удалить')
                throw err;
            } else{
                res.redirect('/admin/ideas?sucmsg=Идея успешно удалена');
            }
        });
    });
    app.get('/admin/good/remove/all', isLoggedIn, isAdmin,function (req, res) {
        Post.remove({'access': false, 'readed': true}, function(err) {
            if(err){
                res.redirect('/admin?warnmsg=Не удалось удалить')
                throw err;
            } else{
                res.redirect('/admin/ideas?sucmsg=Идеи успешно удалены');
            }
        });
    });



    app.post('/admin/advert/add/big',isLoggedIn, isAdmin, function (req, res) {
        if(req.body.title.length > 2 && req.body.imglink.length > 2 && req.body.url.length > 2 && req.body.author.length > 2){
            Advert.count({'type': 'big'},function (err, count) {
                var newadv = new Advert;
                newadv.type = 'big';
                newadv.align = req.body.align;
                newadv.id = count+1;
                newadv.title = req.body.title;
                newadv.imglink = req.body.imglink;
                newadv.url = req.body.url;
                newadv.author = req.body.author;
                newadv.clicks = 0;
                newadv.showed = 0;
                newadv.dateDelete = req.body.dateDelete;
                newadv.save(function(err) {
                    if(err)
                        throw err;
                    findBigAdvert();
                    res.redirect('/admin/advert?sucmsg=Реклама успешно добавленна');
                });
            });
        } else{
            res.redirect('/admin/advert?warnmsg=Наглый что ли? по-больше напиши(минимум - 2 символа)');
        }
    });
    app.post('/admin/advert/add/small',isLoggedIn, isAdmin, function (req, res) {
        if( req.body.title.length > 2 && req.body.imglink.length > 2 && req.body.url.length > 2 && req.body.author.length > 2){
            Advert.count({'type': 'big'},function (err, count) {
                var newadv = new Advert;
                newadv.type = 'small';
                newadv.id = count+1;
                newadv.title = req.body.title;
                newadv.imglink = req.body.imglink;
                newadv.url = req.body.url;
                newadv.author = req.body.author;
                newadv.clicks = 0;
                newadv.showed = 0;
                newadv.dateDelete = req.body.dateDelete;
                newadv.save(function(err) {
                    if(err)
                        throw err;
                    findSmallAdvert();
                    res.redirect('/admin/advert?sucmsg=Реклама успешно добавленна');
                });
            });
        } else{
            res.redirect('/admin/advert?warnmsg=Наглый что ли? по-больше напиши(минимум - 2 символа)');
        }
    });
    app.get('/admin/advert/del/small/id:id/:title',isLoggedIn, isAdmin, function (req, res) {
        Advert.remove({ 'type': 'small', 'id': req.params.id , 'title': req.params.title}, function (err) {
            if(err) throw err;
            findSmallAdvert();
            res.redirect('/admin/advert?sucmsg=Маленькая реклама с id '+ req.params.id +' успешно удалена/ title = '+req.params.title);
        });
    });
    app.get('/admin/advert/del/big/id:id/:title',isLoggedIn, isAdmin, function (req, res) {
        Advert.remove({ 'type': 'big', 'id': req.params.id, 'title': req.params.title }, function (err) {
            if(err) throw err;
            findBigAdvert();
            res.redirect('/admin/advert?sucmsg=Большая реклама с id '+ req.params.id +' успешно удалена/ title = '+req.params.title);
        });
    });


    app.get('/admin/advert', isLoggedIn, isAdmin,findAdminMsg, function (req, res) {
    	Post.count({'readed' : false},function (err, count) {
        	res.render('admin/advert',{
            	user: req.user,
        	    query: req.query,
            	page: 'Реклама',
        	    NotReadedPostsCount: count,
                notReadedMsgs: notReadedMsgs,
            	siteAdvert: siteAdvert
        	});
        });
    });
    app.get('/admin/appeals', isLoggedIn, isModer, function (req, res) {
        Comment.find( { 'haveAppeals': true }, function(err, comments) {
            if (err) throw err;
            Post.count({'readed' : false},function (err, count) {
                if(err) throw err;
                res.render('admin/appeals', {
                    query: req.query,
                    page: 'Жалобы',
                    user: req.user,
                    comments: comments,
                    NotReadedPostsCount: count,
                    notReadedMsgs: notReadedMsgs,
                    siteAdvert: siteAdvert
                });
            });
        });
    });
    app.get('/admin/msgs',isLoggedIn,isAdmin,findAdminMsg,function (req, res) {
        Post.count({'readed' : false},function (err, count) {
            res.render('admin/msgs',{
                page: 'Сообщения',
                query: req.query,
                user: req.user,
                NotReadedPostsCount: count,
                notReadedMsgs: notReadedMsgs,
                siteAdvert: siteAdvert
            });
        });
    });
    app.get('/admin/del/:msgNum', isLoggedIn, isAdmin,function (req, res) {
        User.findOne({'admin.isAdmin':true},function (err, user) {
            user.admin.msgs.forEach(function (el, i , array) {
                if(el.num == req.params.msgNum && el.mail == req.query.mail){
                    user.admin.msgs.splice(i,1);
                    user.save(function (err) {
                        if(err) throw err;
                        res.redirect('/admin/msgs?sucmsg=Сообщение удалено');
                        return false;
                    });
                }
            });
        });
    });
    app.post('/feedback',function (req, res) {
        if(req.body.theme && req.body.mail && req.body.mtext && req.body.theme.length > 100 && req.body.mail.length > 200 && req.body.mtext.length > 8000){
            res.redirect('/feedback?warnmsg=Сообщение не отправленно. Зачем Вы пишите так много?');
        } else if(req.body.theme && req.body.mail && req.body.mtext && req.body.theme.length > 4 && req.body.mail.length > 5 && req.body.mtext.length > 5){
            User.findOne({'admin.isAdmin': true}, function (err, admin) {
                if(err) throw err;
                if(!admin) throw err;
                var newMsg = {};
                newMsg.theme = req.body.theme;
                newMsg.mail = req.body.mail;
                newMsg.text = req.body.mtext;
                newMsg.readed = false;
                newMsg.num = admin.admin.msgs.length + 1;
                var date = new Date;
                var month = (date.getMonth() + 1);
                if(month<10){month = '0'+month}

                var addtime = date.getDate() + '.' + month + '.' + date.getFullYear();

                var minutes = date.getMinutes();
                if(minutes<10){ minutes = '0'+minutes;}

                var htime = date.getHours() + ':'+ minutes;
                newMsg.addtime = addtime +' || '+ htime;
                admin.admin.msgs.push(newMsg);
                admin.save(function(err) {
                    if(err) throw err;
                    res.redirect('/?sucmsg=Сообщение успешно отправленно')
                });
            });
        } else{
            res.redirect('/feedback?warnmsg=Сообщение не отправленно. Попробуйте написать по-больше,чем 10 символов')
        }
    });
    app.post('/unban', isLoggedIn, isModer, function(req, res) {
        if(req.body.id){
                User.findOne({'idNum' : req.body.id}, function(err, user){
                        if(err) throw err;
                        if(!user) res.redirect('/feedback?warnmsg=Че ты творишь?');
                        user.access = true;
                        user.save(function(err){
                                if(err) throw err;
                                res.redirect('/admin?sucmsg=User with id '+ req.body.id+' is UN-banned now');
                        });
                });
        } else{
                res.redirect('/admin?warnmsg=WAT?');
        }
    });
    app.post('/ban', isLoggedIn, isModer, function(req, res) {
	if(req.body.id){
		User.findOne({'idNum' : req.body.id}, function(err, user){
			if(err) throw err;
			if(!user) res.redirect('/feedback?warnmsg=Че ты творишь?');
			user.access = false;
			user.save(function(err){
				if(err) throw err;
				res.redirect('/admin?sucmsg=User with id '+ req.body.id+' is banned now');
			});
		});
	} else{
		res.redirect('/admin?warnmsg=WAT?');
	}
    });
    app.post('/makeModer',isLoggedIn, isAdmin, function (req, res) {
        if(req.body.id){
            User.findOne({'idNum': req.body.id}, function (err, newModer) {
                if(err) throw err;
                if(!newModer) res.redirect('/admin?warnmsg=Нет такого юзера');
                newModer.admin.isModer = true;
                newModer.save(function(err) {
                    if(err) throw err;
                    res.redirect('/admin?sucmsg=User with id '+ req.body.id+' is moder now');
                });
            });
        } else{
            res.redirect('/admin?warnmsg=Че ты творишь?');
        }
    });
    app.post('/delModer',isLoggedIn, isAdmin, function (req, res) {
        if(req.body.id){
            User.findOne({'idNum': req.body.id}, function (err, newModer) {
                if(err) throw err;
                if(!newModer) res.redirect('/admin?warnmsg=Нет такого юзера');
                newModer.admin.isModer = false;
                newModer.save(function(err) {
                    if(err) throw err;
                    res.redirect('/admin?sucmsg=User with id '+ req.body.id+' is NOT moder now');
                });
            });
        } else{
            res.redirect('/admin?warnmsg=Че ты творишь?');
        }
    });
    //==========================
	// LOGOUT ==============================
	// =====================================
	app.get('/logout', function(req, res) {
		req.logout();
		res.redirect('/');
	});
	app.get('/login',function(req, res) {
		if( req.isAuthenticated() ){
			res.redirect('/profile');
		} else{
			res.render('login',{
				page: 'login',
                siteAdvert: siteAdvert,
                query: req.query,
				user: req.user
			});
		}
	});

};

// route middleware to make sure
function isLoggedIn(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.isAuthenticated())
		return next();

	// if they aren't redirect them to the login page
	res.redirect('/?warnmsg=Для использования всех функций сайта, вам необходимо войти либо зарегистрироваться.');
}
function isAdmin(req, res, next) {
	// if user is authenticated in the session, carry on
	if (req.user.admin.isAdmin){
		return next();
    }else{
        res.render('404');
    }
}
function isModer(req, res, next) {
    // if user is authenticated in the session, carry on
    if (req.user.admin.isModer || req.user.admin.isAdmin){
        return next();
    }else{
        res.render('404');
    }
}
function addTag(post) {
	post.tags.forEach(function(tag, i, array){
		if(tag.trim().length > 0){
			Tag.findOne({ 'name': tag }, function (err, foundtag) {
				if(err)
					throw err;
				if(foundtag != null){
					foundtag.ideas++;
					foundtag.save(function(err) {
						if(err)
							throw err;
						return;
					});
				} else{
					var newTag = new Tag;
    	            newTag.name = tag;
        	        newTag.ideas = 1;
        	        newTag.listeners = 0;
            	    newTag.save(function (err) {
                	    if(err)
                    	    throw err;
    	                return;
    				});

				}
			});
		} else{
			return;
		}
	});
}
