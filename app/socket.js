var express = require('express');
var User	   		= require('../app/models/user');
var Post = require('../app/models/post');
var Comment = require('../app/models/comment');
var Notice = require('../app/models/notice');
module.exports = function(http) {
	var io = require('socket.io')(http);
	io.on('connection', function (socket) {
		var room;
		socket.on('connectToRoom', function (postNum) {
			room = 'idea'+postNum;
			socket.join(room);
		});
		socket.on('sendComment', function (comment, postNum, authorId, answerToId) {
			Post.findOne({'access':true, 'num': postNum},function (err, post) {
				if(err) throw err;
				if(!post) res.redirect('/?warnmsg=Пост не найден');
				Comment.find().sort({num: -1}).limit(1).exec(function (err, lastComments) {
					var newComment = new Comment;
					newComment.text = comment;
					newComment.authorId = authorId;
					if(!lastComments[0]){
						newComment.num = 1;
					}else{
						newComment.num = lastComments[0].num + 1;
					}
					newComment.postNum = postNum;
					var date = new Date;
					newComment.rating = [];
					var month = (date.getMonth() + 1);
					if(month<10){month = '0'+month}
					newComment.addtime = date.getDate() + '.' + month + '.' + date.getFullYear();
					var minutes = date.getMinutes();
					if(minutes<10){ minutes = '0'+minutes;}
					newComment.htime = date.getHours() + ':'+ minutes;
					User.findOne({'idNum': authorId},function (err, commentAuthor) {
						newComment.authorName = commentAuthor.name;
						newComment.authorImg = commentAuthor.photoMax;
						newComment.save(function (err) {
							if(err) throw err;
							if(answerToId && answerToId != commentAuthor.idNum){
								User.findOne({'idNum': answerToId}, function (err, reciever) {
									var newNotice = new Notice;
									Notice.count({}, function (err, count) {
										if(err) throw err;
										newNotice.num = count+1;
										newNotice.type = 'answer';
										newNotice.recieverId = answerToId;
										newNotice.text = comment;
										newNotice.readed = false;
										newNotice.href = '/readNotice?np='+postNum+'&nn='+newNotice.num+'&nc='+newComment.num;
										newNotice.author.id = authorId;
										newNotice.author.name = commentAuthor.name;
										newNotice.addtime.date = newComment.addtime;
										newNotice.addtime.time =  newComment.htime;
										
										reciever.messages.push(newNotice);
										reciever.save(function (err) {
											if(err) throw err;
											post.comments.push(newComment.num);
											post.save(function (err) {
												if(err) throw err;
												newNotice.save(function (err) {
													if(err) throw err;
													commentAuthor.score++;
													commentAuthor.stats.answers++;
													commentAuthor.save(function (err) {
														if(err) throw err;
														// для того что бы дабл-трабл не был)) (и прокомментнил и ответил)
														if(post.author.idNum != reciever.idNum && commentAuthor.idNum != post.author.idNum){
															User.findOne({'idNum': post.author.idNum}, function (err, postAuthor) {
																if(err) throw err;
																if(!postAuthor) throw err;
																var newNot = new Notice;
																newNot.num = count+1;
																newNot.type = 'comment';
																newNot.recieverId = postAuthor.idNum;
																newNot.text = comment;
																newNot.readed = false;
																newNot.href = '/readNotice?np='+postNum+'&nn='+newNot.num+'&nc='+newComment.num;
																newNot.author.id = authorId;
																newNot.author.name = commentAuthor.name;
																newNot.addtime.date = newComment.addtime;
																newNot.addtime.time =  newComment.htime;
																newNot.save(function (err) {
																	if(err) throw err;
																	postAuthor.messages.push(newNot);
																	postAuthor.save(function (err) {
																		if(err) throw err;
																		io.sockets.in(room).emit('msgAdded', newComment);
																	});
																});
															});
														} else{
															io.sockets.in(room).emit('msgAdded', newComment);
														}
													});
												});
											});
										});
									});
								});
							} else{
								User.findOne({'idNum': authorId},function (err, commentAuthor) {
									if(err) throw err;
									commentAuthor.score++;
									commentAuthor.stats.answers++;
									commentAuthor.save(function (err) {
										if(err) throw err;
										post.comments.push(newComment.num);
										post.save(function (err) {
											if(err) throw err;
											User.findOne({'idNum': post.author.idNum}, function (err, postAuthor) {
												if(err) throw err;
												if(!postAuthor) throw err;
												if(commentAuthor.idNum == postAuthor.idNum){
													io.sockets.in(room).emit('msgAdded', newComment);
												} else{
													Notice.count({}, function (err, count) {
														if(err) throw err;
														var newNot = new Notice;
														newNot.num = count+1;
														newNot.type = 'comment';
														newNot.recieverId = postAuthor.idNum;
														newNot.text = comment;
														newNot.readed = false;
														newNot.href = '/readNotice?np='+postNum+'&nn='+newNot.num+'&nc='+newComment.num;
														newNot.author.id = authorId;
														newNot.author.name = commentAuthor.name;
														newNot.addtime.date = newComment.addtime;
														newNot.addtime.time =  newComment.htime;
														newNot.save(function (err) {
															if(err) throw err;
															postAuthor.messages.push(newNot);
															postAuthor.save(function (err) {
																if(err) throw err;
																io.sockets.in(room).emit('msgAdded', newComment);
															});
														});
													});
												}
											});
										});
									});
								});
							}
						});
					});
				});
			});
		});
		socket.on('deleteComment', function (authorId, comNum,postNum) {
			User.findOne({'idNum': authorId},function (err, author) {
				if(err) throw err;
				if(author.admin.isModer){
					Comment.remove({'postNum': postNum,'num':comNum}, function (err) {
						if(err) throw err;
						Post.findOne({'num': postNum}, function (err, post) {
							if(err) throw err;
							if(!post) throw err;
							var cm = post.comments.indexOf(comNum);
							post.comments.splice(cm, 1);
							post.save(function (err) {
								if(err) throw err;
								io.sockets.in(room).emit('msgDeleted', comNum);
							});
						});
					});
				} else{
					Comment.findOne({'postNum': postNum,'num': comNum}, function (err, comment) {
						if(err) throw err;
						if(comment && author.idNum == comment.authorId){
							comment.remove(function (err) {
								if(err) throw err;
								Post.findOne({'num': postNum}, function (err, post) {
									if(err) throw err;
									if(!post) throw err;
									var cm = post.comments.indexOf(comNum);
									post.comments.splice(cm, 1);
									post.save(function (err) {
										if(err) throw err;
										io.sockets.in(room).emit('msgDeleted', comNum);
									});
								});
							});
						}
					});
				}
			});
		});
		socket.on('apeal', function (authorId, comNum, postNum, apealText) {
			User.findOne({'idNum': authorId},function (err, author) {
				if(err) throw err;
				if(author.admin.isModer){
					Comment.remove({'postNum': postNum,'num':comNum}, function (err) {
						if(err) throw err;
						io.sockets.in(room).emit('msgDeleted', comNum);
					});
				} else{
					Comment.findOne({'postNum': postNum,'num': comNum}, function (err, comment) {
						if(err) throw err;
						if(comment && author.idNum == comment.authorId){
							comment.remove(function (err) {
								if(err) throw err;
								io.sockets.in(room).emit('msgDeleted', comNum);
							});
						} else if(comment && apealText.length > 4){
							var newApeal = {};
							newApeal.text = apealText;
							newApeal.author = {
								id : author.idNum,
								name : author.name
							};

							var date = new Date;
							var month = (date.getMonth() + 1);
							if(month<10){month = '0'+month}
							var nowDate = date.getDate() + '.' + month + '.' + date.getFullYear();
							var minutes = date.getMinutes();
							if(minutes<10){ minutes = '0'+minutes;}
							var time = date.getHours() + ':'+ minutes;
							newApeal.addtime = {};
							newApeal.addtime.date = nowDate;
							newApeal.addtime.time =  time;

							comment.appeals.push(newApeal);
							comment.haveAppeals = true;
							comment.save(function (err) {
								if(err) throw err;
								io.sockets.in(room).emit('msgDeleted', comNum);								
							});
						}
					});
				}
			});
		});

		socket.on('like', function (postNum, comNum, authorId) {
			Comment.findOne({'num': comNum},function (err, comment) {
				if(err) throw err;
				if(!comment) throw err;
				if(authorId == comment.authorId){
					io.sockets.in(room).emit('error');
				} else{
					comment.rating.push(authorId);
					comment.save(function (err) {
						if(err) throw err;
						// finding likeAuthor
						User.findOne({'idNum': authorId},function (err, likeAuthor) {
							if(err) throw err;
							if(!likeAuthor) throw err;
							//finding comment author
							User.findOne({'idNum': comment.authorId},function (err, comAuthor) {
								if(err) throw err;
								if(!comAuthor) throw err;
								//**********************
								var date = new Date;

								var month = (date.getMonth() + 1);
								if(month<10){month = '0'+month}
								var nowDate = date.getDate() + '.' + month + '.' + date.getFullYear();
								
								var minutes = date.getMinutes();
								if(minutes<10){ minutes = '0'+minutes;}
								var time = date.getHours() + ':'+ minutes;
								
								var newNotice = new Notice;
								newNotice.type = 'like';
								Notice.count({}, function (err, count) {
									if(err) throw err;
									newNotice.recieverId = comAuthor.idNum;
									newNotice.num = count+1;
									newNotice.text = undefined;
									newNotice.readed = false;
									newNotice.href = '/readNotice?np='+postNum+'&nn='+newNotice.num+'&nc='+comNum;
									newNotice.author.id = likeAuthor.idNum;
									newNotice.author.name = likeAuthor.name;
									newNotice.addtime.date = nowDate;
									newNotice.addtime.time =  time;
									
									comAuthor.messages.push(newNotice);
									comAuthor.save(function (err) {
										if(err) throw err;
										newNotice.save(function (err) {
											if(err) throw err;
											io.sockets.in(room).emit('liked',comNum,comment.rating.length);
											socket.emit('youLiked',comNum);
										});
									});
								});
							});
						});
					});
				}
			});
		});
	});
}
